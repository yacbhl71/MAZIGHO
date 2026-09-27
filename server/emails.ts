import { escapeHtml, getPublicUrl, isTransactionalEmailConfigured, sendTransactionalEmail } from "./transactionalEmail";
import { getEmailTemplate, getOrderForStripeSession, type EmailTemplate, type EmailTemplateType } from "./db";

type DeliveryOutcome =
  | { delivered: true; id: string }
  | { delivered: false; reason: string };

function firstName(name?: string | null): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] || "";
}

function money(cents: number, currencyCode = "CHF"): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
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

function layout(brandName: string, heading: string, innerHtml: string, buttonLabel: string, buttonUrl: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <div style="background:#f97316;color:#ffffff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:20px">${escapeHtml(brandName)}</h1>
    </div>
    <div style="border:1px solid #eadfd2;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="margin-top:0;font-size:18px">${escapeHtml(heading)}</h2>
      <div style="font-size:14px;line-height:22px;color:#334155">${innerHtml}</div>
      ${buttonLabel && buttonUrl ? `<p style="margin-top:24px"><a href="${buttonUrl}" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(buttonLabel)}</a></p>` : ""}
    </div>
  </div>`;
}

function itemsBlock(items: Array<{ name?: string | null; quantity: number; price?: number | null; priceAtPurchase?: number | null }>, currencyCode = "CHF"): string {
  const rows = items.map(item => {
    const unit = Number(item.priceAtPurchase ?? item.price ?? 0);
    return `<LIST>&bull; ${escapeHtml(item.name || "Article")} × ${item.quantity} — ${money(unit * item.quantity, currencyCode)}</LIST>`;
  });
  return rows.join("\n");
}

function withTransactionalShopBrand(template: EmailTemplate, type: EmailTemplateType, brandName: string): EmailTemplate {
  if (brandName === "MAZIGHO" || (type !== "order_confirmation" && type !== "order_shipped")) return template;
  // Existing templates created before storefront branding used the platform
  // name literally. Preserve a tenant's wording while replacing only that
  // legacy identifier for customer-facing order messages.
  return {
    ...template,
    subject: template.subject.replaceAll("MAZIGHO", brandName),
    heading: template.heading.replaceAll("MAZIGHO", brandName),
    body: template.body.replaceAll("MAZIGHO", brandName),
    buttonLabel: template.buttonLabel.replaceAll("MAZIGHO", brandName),
  };
}

async function deliver(type: EmailTemplateType, to: string, vars: Record<string, string>, buttonUrl: string, idempotencyKey: string, brandName = "MAZIGHO", storeId?: number): Promise<DeliveryOutcome> {
  if (!isTransactionalEmailConfigured()) return { delivered: false, reason: "EMAIL_NOT_CONFIGURED" };
  const template = withTransactionalShopBrand(await getEmailTemplate(type, storeId), type, brandName);
  if (!template.enabled) return { delivered: false, reason: "TEMPLATE_DISABLED" };
  const subject = Object.entries(vars).reduce((acc, [key, value]) => acc.split(`{{${key}}}`).join(value), template.subject);
  const { html, text } = renderBody(template.body, vars);
  try {
    const result = await sendTransactionalEmail({
      to,
      subject,
      html: layout(brandName, template.heading, html, template.buttonLabel, buttonUrl),
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
    boutique: order.storeDisplayName || "MAZIGHO",
    commande: String(order.id),
    total: money(order.totalAmount, order.currencyCode || "CHF"),
    lignes: itemsBlock(items, order.currencyCode || "CHF"),
  }, url, `order-confirmation/${order.id}`, order.storeDisplayName || "MAZIGHO", order.storeIsPlatform ? undefined : order.storeId);
}

export async function sendOrderShippedEmail(input: { email: string; name?: string | null; orderId: number; trackingNumber?: string | null; storeName?: string | null; storeId?: number }): Promise<DeliveryOutcome> {
  const url = `${getPublicUrl()}/commandes`;
  return deliver("order_shipped", input.email, {
    prenom: firstName(input.name),
    boutique: input.storeName?.trim() || "MAZIGHO",
    commande: String(input.orderId),
    suivi: input.trackingNumber || "communiqué prochainement",
  }, url, `order-shipped/${input.orderId}`, input.storeName?.trim() || "MAZIGHO", input.storeId);
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
