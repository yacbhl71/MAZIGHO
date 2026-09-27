import { describe, expect, it } from "vitest";
import { buildCheckoutLegalAcceptanceSnapshot } from "../shared/checkoutLegalAcceptance";
import { renderCustomerOrderReceiptHtml } from "../shared/customerOrderReceipt";

describe("customer order receipt", () => {
  it("renders a non-fiscal order confirmation and escapes product text", () => {
    const legalSnapshot = buildCheckoutLegalAcceptanceSnapshot({
      acceptedAt: new Date("2026-09-28T00:00:00.000Z"),
      store: { id: 3, name: "Atelier & Co", domain: "atelier.example.ch" },
      paymentMode: "live",
      merchant: { operatorName: "Atelier SA", country: "Suisse", contactEmail: "bonjour@atelier.example.ch", businessStatus: "SA", ideVatNumber: "CHE-1" },
      delivery: { countryCode: "CH", mode: "included", flatShippingRateCents: 0, freeShippingThresholdCents: 0, deliveryLeadTime: "2 jours", returnsSummary: "Retour sous conditions." },
    });
    const html = renderCustomerOrderReceiptHtml({
      id: 52,
      createdAt: "2026-09-28T00:00:00.000Z",
      status: "processing",
      paymentStatus: "paid",
      totalAmount: 4_990,
      currencyCode: "CHF",
      items: [{ name: "<script>alert(1)</script>", quantity: 1, priceAtPurchase: 4_990 }],
      legalSnapshot,
    });

    expect(html).toContain("Confirmation de commande");
    expect(html).toContain("ne remplace pas une facture fiscale");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("https://atelier.example.ch/conditions-generales");
  });
});
