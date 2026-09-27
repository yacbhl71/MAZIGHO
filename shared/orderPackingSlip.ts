export type OwnerPackingSlipItem = {
  productName: string;
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
};

export type OwnerPackingSlipDelivery = {
  orderId: number;
  recipientName: string | null;
  addressLines: string[];
  postalCode: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
  phone: string | null;
  email: string | null;
  trackingNumber: string | null;
};

export type OwnerPackingSlipInput = {
  storeName: string;
  preparedAt: string;
  delivery: OwnerPackingSlipDelivery;
  items: OwnerPackingSlipItem[];
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addressLines(delivery: OwnerPackingSlipDelivery) {
  return [
    ...delivery.addressLines,
    [delivery.postalCode, delivery.city].filter(Boolean).join(" "),
    delivery.state,
    delivery.countryCode,
  ].filter(Boolean).map(line => escapeHtml(line));
}

/**
 * A preparation document, not an invoice or transport label. It deliberately
 * excludes prices, payment values, card data and customer history.
 */
export function renderOwnerPackingSlipHtml(input: OwnerPackingSlipInput) {
  const recipientLines = addressLines(input.delivery);
  const items = input.items.map(item => {
    const options = item.selectedOptions.length
      ? `<p class="options">${item.selectedOptions.map(option => `${escapeHtml(option.name)} : ${escapeHtml(option.value)}`).join(" · ")}</p>`
      : "";
    return `<li><div><strong>${escapeHtml(item.productName)}</strong>${options}</div><span class="quantity">× ${Math.max(1, Number(item.quantity) || 1)}</span></li>`;
  }).join("") || "<li><div><strong>Articles indisponibles</strong><p class=\"options\">Vérifiez la commande depuis le panneau.</p></div></li>";
  const contact = [input.delivery.phone ? `Tél. ${escapeHtml(input.delivery.phone)}` : "", input.delivery.email ? escapeHtml(input.delivery.email) : ""].filter(Boolean).join("<br />");
  const tracking = input.delivery.trackingNumber ? escapeHtml(input.delivery.trackingNumber) : "À renseigner avant dépôt";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bon de préparation · commande #${escapeHtml(input.delivery.orderId)}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #0f172a; font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.45; }
  .sheet { max-width: 760px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 2px solid #0f766e; }
  .eyebrow { margin: 0; color: #0f766e; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 5px 0 0; font-size: 25px; line-height: 1.15; }
  .order { min-width: 145px; border: 1px solid #99f6e4; border-radius: 12px; background: #f0fdfa; padding: 12px; text-align: right; }
  .order strong { display: block; font-size: 18px; }
  .meta { color: #475569; font-size: 11px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 22px 0; }
  section { border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; }
  h2 { margin: 0 0 9px; color: #0f766e; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  p { margin: 0; }
  .recipient { font-size: 14px; font-weight: 700; }
  .address { margin-top: 5px; white-space: pre-line; }
  .contact { margin-top: 10px; color: #475569; }
  ul { margin: 0; padding: 0; list-style: none; }
  li { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
  li:last-child { border-bottom: 0; }
  .options { margin-top: 3px; color: #475569; font-size: 11px; }
  .quantity { min-width: 50px; color: #0f766e; font-size: 15px; font-weight: 800; text-align: right; }
  .checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 18px; }
  .check { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; color: #334155; }
  .box { display: inline-block; width: 13px; height: 13px; margin-right: 8px; border: 1px solid #64748b; vertical-align: -2px; }
  footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 12px; color: #64748b; font-size: 10px; }
  @media print { .sheet { max-width: none; } }
</style>
</head>
<body>
<main class="sheet">
  <header>
    <div><p class="eyebrow">${escapeHtml(input.storeName)}</p><h1>Bon de préparation</h1><p class="meta">Document interne · sans facture, sans étiquette transporteur</p></div>
    <div class="order"><span class="meta">Commande</span><strong>#${escapeHtml(input.delivery.orderId)}</strong><span class="meta">Préparé le ${escapeHtml(input.preparedAt)}</span></div>
  </header>
  <div class="grid">
    <section><h2>Livraison</h2><p class="recipient">${escapeHtml(input.delivery.recipientName || "Destinataire non renseigné")}</p><p class="address">${recipientLines.join("<br />")}</p>${contact ? `<p class="contact">${contact}</p>` : ""}</section>
    <section><h2>Suivi manuel</h2><p><strong>${tracking}</strong></p><p class="contact">Vérifiez le numéro avant de remettre le colis. Aucun envoi transporteur n’est créé par ce document.</p></section>
  </div>
  <section><h2>Articles à préparer</h2><ul>${items}</ul></section>
  <div class="checklist">
    <div class="check"><span class="box"></span>Articles vérifiés et emballés</div>
    <div class="check"><span class="box"></span>Adresse vérifiée avant remise</div>
    <div class="check"><span class="box"></span>Numéro de suivi enregistré si disponible</div>
    <div class="check"><span class="box"></span>Commande marquée expédiée après dépôt</div>
  </div>
  <footer>Ce bon sert uniquement à préparer une commande payée de ${escapeHtml(input.storeName)}. Il n’affiche aucun prix, aucune carte, aucun détail de paiement ni historique client.</footer>
</main>
</body>
</html>`;
}
