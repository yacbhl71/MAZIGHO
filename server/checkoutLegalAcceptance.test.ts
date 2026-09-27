import { describe, expect, it } from "vitest";
import { CHECKOUT_LEGAL_VERSION, buildCheckoutLegalAcceptanceSnapshot, parseCheckoutLegalAcceptanceSnapshot } from "../shared/checkoutLegalAcceptance";

describe("checkout legal acceptance", () => {
  const input = {
    acceptedAt: new Date("2026-09-28T00:00:00.000Z"),
    store: { id: 17, name: "Boutique Exemple", domain: "boutique.exemple.ch" },
    paymentMode: "live" as const,
    merchant: {
      operatorName: "Exemple Sàrl",
      country: "Suisse",
      contactEmail: "contact@exemple.ch",
      businessStatus: "Sàrl",
      ideVatNumber: "CHE-123.456.789",
    },
    delivery: {
      countryCode: "ch",
      mode: "flat_rate" as const,
      flatShippingRateCents: 590,
      freeShippingThresholdCents: 8_000,
      deliveryLeadTime: "2 à 4 jours ouvrés",
      returnsSummary: "Retour selon les conditions affichées.",
    },
    taxNotice: "TVA incluse selon le paramétrage de la boutique.",
  };

  it("binds shop-owned documents, payment mode and delivery policy", () => {
    const snapshot = buildCheckoutLegalAcceptanceSnapshot({
      ...input,
      returnsPage: { title: "Retours boutique", body: "Retour sous 14 jours selon les conditions affichées." },
    });
    expect(snapshot).toMatchObject({
      version: CHECKOUT_LEGAL_VERSION,
      acceptedAt: "2026-09-28T00:00:00.000Z",
      store: { id: 17, domain: "boutique.exemple.ch" },
      payment: { mode: "live" },
      delivery: { countryCode: "CH", flatShippingRateCents: 590 },
      returnsPage: { title: "Retours boutique", body: "Retour sous 14 jours selon les conditions affichées." },
    });
    expect(snapshot.documentUrls.terms).toBe("https://boutique.exemple.ch/conditions-generales");
    expect(snapshot.documentUrls.shippingReturns).toBe("https://boutique.exemple.ch/livraison-retours");
  });

  it("rejects malformed or unrecognised stored snapshots", () => {
    expect(parseCheckoutLegalAcceptanceSnapshot("not-json")).toBeNull();
    expect(parseCheckoutLegalAcceptanceSnapshot(JSON.stringify({ version: "legacy" }))).toBeNull();
  });

  it("parses its own persisted snapshot safely", () => {
    const snapshot = buildCheckoutLegalAcceptanceSnapshot(input);
    expect(parseCheckoutLegalAcceptanceSnapshot(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it("keeps a structurally valid historical version readable for an existing order", () => {
    const snapshot = buildCheckoutLegalAcceptanceSnapshot(input);
    const historical = { ...snapshot, version: "2026-01-15" };
    expect(parseCheckoutLegalAcceptanceSnapshot(JSON.stringify(historical))).toEqual(historical);
  });
});
