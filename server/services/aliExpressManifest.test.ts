import { describe, expect, it } from "vitest";
import { buildAliExpressPreparationManifest } from "./aliExpressManifest";

const shippingAddress = JSON.stringify({
  name: "Client de test",
  line1: "Rue Exemple 1",
  city: "Lausanne",
  postalCode: "1000",
  countryCode: "CH",
  phone: "+41790000000",
});

const aliexpressSnapshot = JSON.stringify({
  version: 1,
  provider: "aliexpress",
  supplierProductId: "1005001234567890",
  supplierVariantId: "sku-blue-m",
  supplierUrl: "https://www.aliexpress.com/item/1005001234567890.html",
  countryCode: "CH",
});

function order(overrides: Partial<{ status: string; paymentStatus: string; shippingAddress: string }> = {}) {
  return {
    id: 61234,
    status: "processing",
    paymentStatus: "paid",
    totalAmount: 5490,
    shippingAddress,
    ...overrides,
  };
}

function item(overrides: Partial<{ selectedOptions: string | null; supplierSnapshot: string | null; supplierUrl: string | null; supplier: string | null }> = {}) {
  return {
    id: 1,
    quantity: 2,
    priceAtPurchase: 2745,
    productNameSnapshot: "Veste MAZIGHO",
    selectedOptions: JSON.stringify({ Couleur: "Bleu", Taille: "M" }),
    supplierSnapshot: aliexpressSnapshot,
    productName: "Veste MAZIGHO",
    supplier: "aliexpress",
    supplierUrl: "https://www.aliexpress.com/item/1005001234567890.html",
    ...overrides,
  };
}

describe("buildAliExpressPreparationManifest", () => {
  it("prépare uniquement un manifeste local pour une commande payée et acceptée", () => {
    const manifest = buildAliExpressPreparationManifest(order(), [item()]);

    expect(manifest.state).toBe("ready_for_human_review");
    expect(manifest.paymentPolicy).toBe("human_checkout_only");
    expect(manifest.lines).toHaveLength(1);
    expect(manifest.lines[0]).toMatchObject({
      supplierProductId: "1005001234567890",
      optionStatus: "mapped",
      intendedCountryCode: "CH",
      urlSource: "order_snapshot",
    });
    expect(manifest.warnings).toEqual([]);
  });

  it("bloque toute préparation quand le paiement MAZIGHO n’est pas confirmé", () => {
    const manifest = buildAliExpressPreparationManifest(order({ paymentStatus: "unpaid" }), [item()]);

    expect(manifest.state).toBe("blocked");
    expect(manifest.reason).toBe("ORDER_NOT_PAID");
    expect(manifest.warnings.join(" ")).toContain("n’est pas confirmé");
  });

  it("bloque une destination qui ne correspond plus au profil validé et exige la revue humaine des options non mappées", () => {
    const manifest = buildAliExpressPreparationManifest(
      order({ shippingAddress: JSON.stringify({ name: "Client de test", line1: "Rue Exemple 1", city: "Paris", postalCode: "75001", countryCode: "FR" }) }),
      [item({ selectedOptions: JSON.stringify({ Couleur: "Bleu" }), supplierSnapshot: JSON.stringify({ version: 1, provider: "aliexpress", supplierProductId: "1005001234567890", countryCode: "CH" }) })],
    );

    expect(manifest.state).toBe("blocked");
    expect(manifest.reason).toBe("DELIVERY_COUNTRY_CHANGED");
    expect(manifest.warnings.join(" ")).toContain("destination enregistrée");
    expect(manifest.warnings.join(" ")).toContain("non reliées");
  });

  it("n’utilise l’URL actuelle du catalogue qu’en secours explicite", () => {
    const manifest = buildAliExpressPreparationManifest(
      order(),
      [item({ supplierSnapshot: JSON.stringify({ version: 1, provider: "aliexpress", supplierProductId: "1005001234567890", countryCode: "CH" }) })],
    );

    expect(manifest.state).toBe("ready_for_human_review");
    expect(manifest.lines[0]?.urlSource).toBe("current_catalog");
    expect(manifest.warnings.join(" ")).toContain("catalogue actuel");
  });
});
