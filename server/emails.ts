import { escapeHtml, getPublicUrl, isTransactionalEmailConfigured, sendTransactionalEmail } from "./transactionalEmail";
import { getEmailTemplate, getOrderForStripeSession, type EmailTemplate, type EmailTemplateType } from "./db";

type DeliveryOutcome =
  | { delivered: true; id: string }
  | { delivered: false; reason: string };

function firstName(name?: string | null): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] || "";
}

function money(cents: number): string {
  return `${(cents / 100).toFixed(2)} CHF`;
}

// Renders a template body: replaces {{var}} tokens then converts newlines to <br>.
function renderBody(body: string, vars: Record<string, string>): { html: string; text: string } {
  let text = body;
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`{{${key}}}`).join(value);
  }
  const htmlEscaped = text
    .split("\n")
    .map(line => escapeHtml(line))
    .join("<br/>")
    // allow the pre-rendered list blocks (already HTML) to pass through
    .replace(/&lt;LIST&gt;([\s\S]*?)&lt;\/LIST&gt;/g, (_, inner) => inner);
  return { html: htmlEscaped, text: text.replace(/<LIST>|<\/LIST>/g, "") };
}

function layout(heading: string, innerHtml: string, buttonLabel: string, buttonUrl: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <div style="background:#f97316;color:#ffffff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:20px">MAZIGHO</h1>
    </div>
    <div style="border:1px solid #eadfd2;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="margin-top:0;font-size:18px">${escapeHtml(heading)}</h2>
      <div style="font-size:14px;line-height:22px;color:#334155">${innerHtml}</div>
      ${buttonLabel && buttonUrl ? `<p style="margin-top:24px"><a href="${buttonUrl}" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(buttonLabel)}</a></p>` : ""}
    </div>
  </div>`;
}

function itemsBlock(items: Array<{ name?: string | null; quantity: number; price?: number | null; priceAtPurchase?: number | null }>): string {
  const rows = items.map(item => {
    const unit = Number(item.priceAtPurchase ?? item.price ?? 0);
    return `<LIST>&bull; ${escapeHtml(item.name || "Article")} × ${item.quantity} — ${money(unit * item.quantity)}</LIST>`;
  });
  return rows.join("\n");
}

async function deliver(type: EmailTemplateType, to: string, vars: Record<string, string>, buttonUrl: string, idempotencyKey: string): Promise<DeliveryOutcome> {
  if (!isTransactionalEmailConfigured()) return { delivered: false, reason: "EMAIL_NOT_CONFIGURED" };
  const template: EmailTemplate = await getEmailTemplate(type);
  if (!template.enabled) return { delivered: false, reason: "TEMPLATE_DISABLED" };
  const subject = Object.entries(vars).reduce((acc, [key, value]) => acc.split(`{{${key}}}`).join(value), template.subject);
  const { html, text } = renderBody(template.body, vars);
  try {
    const result = await sendTransactionalEmail({
      to,
      subject,
      html: layout(template.heading, html, template.buttonLabel, buttonUrl),
      text,
      idempotencyKey,
    });
    return result.delivered ? { delivered: true, id: result.id } : { delivered: false, reason: result.reason };
  } catch (error) {
    return { delivered: false, reason: error instanceof Error ? error.message : "EMAIL_DELIVERY_FAILED" };
  }
}

export async function sendOrderConfirmationForStripeSession(sessionId: string): Promise<DeliveryOutcome> {
  const snapshot = await getOrderForStripeSession(sessionId);
  const recipient = snapshot?.order?.userEmail;
  if (!recipient) return { delivered: false, reason: "NO_RECIPIENT" };
  const { order, items } = snapshot;
  const url = `${getPublicUrl()}/commandes`;
  return deliver("order_confirmation", recipient, {
    prenom: firstName(order.userName),
    commande: String(order.id),
    total: money(order.totalAmount),
    lignes: itemsBlock(items),
  }, url, `order-confirmation/${order.id}`);
}

export async function sendOrderShippedEmail(input: { email: string; name?: string | null; orderId: number; trackingNumber?: string | null }): Promise<DeliveryOutcome> {
  const url = `${getPublicUrl()}/commandes`;
  return deliver("order_shipped", input.email, {
    prenom: firstName(input.name),
    commande: String(input.orderId),
    suivi: input.trackingNumber || "communiqué prochainement",
  }, url, `order-shipped/${input.orderId}`);
}

export async function sendAbandonedCartEmail(input: {
  email: string;
  name?: string | null;
  cartId: number;
  total: number;
  items: Array<{ name?: string | null; quantity: number; price?: number | null }>;
}): Promise<DeliveryOutcome> {
  const url = `${getPublicUrl()}/panier`;
  return deliver("abandoned_cart", input.email, {
    prenom: firstName(input.name),
    total: money(input.total),
    panier: itemsBlock(input.items),
  }, url, `abandoned-cart/${input.cartId}/${Date.now()}`);
}
