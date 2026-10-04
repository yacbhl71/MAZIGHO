import type { OwnerPackingSlipDelivery, OwnerPackingSlipItem } from "./orderPackingSlip";

export type OwnerDeliveryHandoverInput = {
  storeName: string;
  handedOverAt: string;
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
 * Owner-only handover sheet, available only after an order was manually marked
 * shipped. It is deliberately not a carrier label, invoice, proof of delivery,
 * payment receipt or automated dispatch instruction.
 */
export function renderOwnerDeliveryHandoverHtml(input: OwnerDeliveryHandoverInput) {
  const recipientLines = addressLines(input.delivery);
  const items = input.items.map(item => {
    const options = item.selectedOptions.length
      ? `<p class="options">${item.selectedOptions.map(option => `${escapeHtml(option.name)} : ${escapeHtml(option.value)}`).join(" · ")}</p>`
      : "";
    return `<li><div><strong>${escapeHtml(item.productName)}</strong>${options}</div><span class="quantity">× ${Math.max(1, Number(item.quantity) || 1)}</span></li>`;
  }).join("") || "<li><div><strong>Articles indisponibles</strong><p class=\"options\">Vérifiez la commande depuis le panneau.</p></div></li>";
  const phone = input.delivery.phone ? `<p class="contact"><strong>Contact livraison :</strong> ${escapeHtml(input.delivery.phone)}</p>` : "";
  const tracking = input.delivery.trackingNumber ? escapeHtml(input.delivery.trackingNumber) : "Aucun numéro de suivi enregistré";
  const trackingCarrier = input.delivery.trackingCarrier ? `${escapeHtml(input.delivery.trackingCarrier)} · ` : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bordereau de remise · commande #${escapeHtml(input.delivery.orderId)}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #0f172a; font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.45; }
  .sheet { max-width: 760px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 2px solid #4338ca; }
  .eyebrow { margin: 0; color: #4338ca; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 5px 0 0; font-size: 25px; line-height: 1.15; }
  .order { min-width: 145px; border: 1px solid #c7d2fe; border-radius: 12px; background: #eef2ff; padding: 12px; text-align: right; }
  .order strong { display: block; font-size: 18px; }
  .meta { color: #475569; font-size: 11px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 22px 0; }
  section { border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; }
  h2 { margin: 0 0 9px; color: #4338ca; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  p { margin: 0; }
  .recipient { font-size: 14px; font-weight: 700; }
  .address { margin-top: 5px; white-space: pre-line; }
  .contact { margin-top: 10px; color: #475569; }
  ul { margin: 0; padding: 0; list-style: none; }
  li { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
  li:last-child { border-bottom: 0; }
  .options { margin-top: 3px; color: #475569; font-size: 11px; }
  .quantity { min-width: 50px; color: #4338ca; font-size: 15px; font-weight: 800; text-align: right; }
  .checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 18px; }
  .check { min-height: 48px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; color: #334155; }
  .box { display: inline-block; width: 13px; height: 13px; margin-right: 8px; border: 1px solid #64748b; vertical-align: -2px; }
  .line { display: inline-block; min-width: 145px; border-bottom: 1px solid #64748b; vertical-align: middle; }
  footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 12px; color: #64748b; font-size: 10px; }
  @media print { .sheet { max-width: none; } }
</style>
</head>
<body>
<main class="sheet">
  <header>
    <div><p class="eyebrow">${escapeHtml(input.storeName)}</p><h1>Bordereau de remise</h1><p class="meta">Commande marquée expédiée · document manuel interne</p></div>
    <div class="order"><span class="meta">Commande</span><strong>#${escapeHtml(input.delivery.orderId)}</strong><span class="meta">Édité le ${escapeHtml(input.handedOverAt)}</span></div>
  </header>
  <div class="grid">
    <section><h2>Destinataire</h2><p class="recipient">${escapeHtml(input.delivery.recipientName || "Destinataire non renseigné")}</p><p class="address">${recipientLines.join("<br />")}</p>${phone}</section>
    <section><h2>Suivi manuel</h2><p><strong>${trackingCarrier}${tracking}</strong></p><p class="contact">Ce bordereau ne crée ni étiquette, ni dépôt, ni suivi transporteur. Complétez la remise réellement effectuée ci-dessous.</p></section>
  </div>
  <section><h2>Contenu du colis</h2><ul>${items}</ul></section>
  <div class="checklist">
    <div class="check"><span class="box"></span>Colis fermé et adresse vérifiée</div>
    <div class="check"><span class="box"></span>Remis au transporteur ou au point de dépôt</div>
    <div class="check">Date / heure de remise : <span class="line"></span></div>
    <div class="check">Référence ou paraphe de remise : <span class="line"></span></div>
  </div>
  <footer>Ce bordereau sert uniquement à tracer manuellement la remise d’une commande expédiée de ${escapeHtml(input.storeName)}. Il exclut les prix, taxes, montants, données de paiement, e-mail et historique client. Il ne constitue pas une preuve de livraison du transporteur.</footer>
</main>
</body>
</html>`;
}
