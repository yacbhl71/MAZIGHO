import type { CheckoutLegalAcceptanceSnapshot } from "./checkoutLegalAcceptance";

export type CustomerOrderReceiptData = {
  id: number;
  createdAt: Date | string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currencyCode: string;
  customerShippingAmount?: number | null;
  items: Array<{
    name: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  legalSnapshot: CheckoutLegalAcceptanceSnapshot | null;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(cents: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: currencyCode || "CHF",
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((Number(cents) || 0) / 100);
  } catch {
    return `${((Number(cents) || 0) / 100).toFixed(2)} ${currencyCode || "CHF"}`;
  }
}

function formatDate(value: Date | string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date indisponible" : date.toLocaleString("fr-CH", { dateStyle: "long", timeStyle: "short" });
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

/**
 * A print-only confirmation of an order. This is deliberately not labelled an
 * invoice or a tax document: the seller remains responsible for their own
 * fiscal and accounting obligations.
 */
export function renderCustomerOrderReceiptHtml(order: CustomerOrderReceiptData): string {
  const snapshot = order.legalSnapshot;
  const storeName = snapshot?.store.name || "La boutique";
  const lines = order.items.map(item => {
    const total = Number(item.priceAtPurchase || 0) * Number(item.quantity || 0);
    return `<tr><td>${escapeHtml(item.name)}</td><td class="numeric">${escapeHtml(item.quantity)}</td><td class="numeric">${escapeHtml(formatMoney(total, order.currencyCode))}</td></tr>`;
  }).join("") || "<tr><td colspan=\"3\">Articles indisponibles</td></tr>";
  const legal = snapshot ? `
    <section><h2>Informations acceptées lors de la commande</h2>
      <p><strong>Exploitant :</strong> ${escapeHtml(snapshot.merchant.operatorName)} · ${escapeHtml(snapshot.merchant.businessStatus || "Statut déclaré")}</p>
      <p><strong>Contact :</strong> ${escapeHtml(snapshot.merchant.contactEmail)} · ${escapeHtml(snapshot.merchant.country)}</p>
      ${snapshot.merchant.ideVatNumber ? `<p>${escapeHtml(snapshot.merchant.ideVatNumber)}</p>` : ""}
      <p><strong>Livraison :</strong> ${escapeHtml(snapshot.delivery.deliveryLeadTime || "Délai communiqué par la boutique")}</p>
      <p><strong>Retours :</strong> ${escapeHtml(snapshot.delivery.returnsSummary || "Conditions disponibles sur la boutique")}</p>
      ${snapshot.returnsPage?.body ? `<p><strong>${escapeHtml(snapshot.returnsPage.title || "Détails retours")} :</strong> ${escapeHtml(snapshot.returnsPage.body)}</p>` : ""}
      ${snapshot.taxNotice ? `<p><strong>Fiscalité :</strong> ${escapeHtml(snapshot.taxNotice)}</p>` : ""}
      <p class="small">Conditions version ${escapeHtml(snapshot.version)} acceptées le ${escapeHtml(formatDate(snapshot.acceptedAt))}. Documents : <a href="${escapeHtml(snapshot.documentUrls.terms)}">conditions</a> · <a href="${escapeHtml(snapshot.documentUrls.shippingReturns)}">livraison et retours</a> · <a href="${escapeHtml(snapshot.documentUrls.legalNotice)}">mentions légales</a>.</p>
    </section>` : "<section><h2>Informations de commande</h2><p>Cette commande est antérieure à l’enregistrement du récapitulatif contractuel. Les documents actuels restent accessibles depuis le pied de page de la boutique.</p></section>";

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Commande #${escapeHtml(order.id)} — ${escapeHtml(storeName)}</title><style>
    @page { margin: 18mm; } body{font-family:Arial,Helvetica,sans-serif;color:#172033;max-width:760px;margin:0 auto;line-height:1.5} h1{font-size:25px;margin:0} h2{font-size:16px;margin:28px 0 8px} .muted,.small{color:#5e6879;font-size:12px}.header{border-bottom:3px solid #64748b;padding-bottom:18px}.summary{display:grid;grid-template-columns:1fr auto;gap:12px;margin-top:20px;padding:16px;background:#f8fafc;border-radius:10px}.numeric{text-align:right;white-space:nowrap}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:10px 8px;border-bottom:1px solid #dce3ec;text-align:left}th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475569}section{margin-top:24px;padding-top:2px}a{color:#1d4ed8} .notice{margin-top:28px;padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#713f12}@media print{.no-print{display:none}}
  </style></head><body><header class="header"><h1>${escapeHtml(storeName)}</h1><p class="muted">Confirmation de commande · document client</p></header><div class="summary"><div><strong>Commande #${escapeHtml(order.id)}</strong><br/><span class="muted">Passée le ${escapeHtml(formatDate(order.createdAt))}</span></div><div class="numeric"><strong>${escapeHtml(formatMoney(order.totalAmount, order.currencyCode))}</strong><br/><span class="muted">${escapeHtml(statusLabels[order.status] || order.status)} · ${escapeHtml(order.paymentStatus === "paid" ? "Payée" : "Paiement en attente")}</span></div></div><table><thead><tr><th>Article</th><th class="numeric">Qté</th><th class="numeric">Montant</th></tr></thead><tbody>${lines}</tbody></table>${legal}<p class="notice">Ce document récapitule une commande. Il ne remplace pas une facture fiscale si celle-ci est exigée par l’activité, le pays de l’exploitant ou le droit applicable.</p><p class="small no-print">Vous pouvez imprimer ou enregistrer ce document en PDF depuis votre navigateur.</p></body></html>`;
}
