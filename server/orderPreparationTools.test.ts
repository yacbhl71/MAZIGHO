import { describe, expect, it } from "vitest";
import { renderOwnerPackingSlipHtml } from "../shared/orderPackingSlip";
import { getOwnerOrderPreparationFilterCount, matchesOwnerOrderPreparationFilter } from "../shared/orderPreparationQueue";

describe("owner order preparation queue", () => {
  const rows = [
    { id: 1, paymentStatus: "paid", status: "pending" },
    { id: 2, paymentStatus: "paid", status: "processing" },
    { id: 3, paymentStatus: "paid", status: "shipped" },
    { id: 4, paymentStatus: "unpaid", status: "pending" },
    { id: 5, paymentStatus: "paid", status: "delivered" },
  ];

  it("separates paid actions from unpaid and closed orders", () => {
    expect(getOwnerOrderPreparationFilterCount(rows, "to_accept")).toBe(1);
    expect(getOwnerOrderPreparationFilterCount(rows, "to_prepare")).toBe(1);
    expect(getOwnerOrderPreparationFilterCount(rows, "shipped")).toBe(1);
    expect(getOwnerOrderPreparationFilterCount(rows, "closed")).toBe(1);
    expect(matchesOwnerOrderPreparationFilter(rows[3], "to_accept")).toBe(false);
  });
});

describe("owner packing slip renderer", () => {
  it("renders only fulfillment essentials and safely escapes customer-controlled text", () => {
    const html = renderOwnerPackingSlipHtml({
      storeName: "Boutique test",
      preparedAt: "28 sept. 2026, 01:00",
      delivery: {
        orderId: 71,
        recipientName: "Cliente <test>",
        addressLines: ["Rue & Exemple 4"],
        postalCode: "1000",
        city: "Lausanne",
        state: null,
        countryCode: "CH",
        phone: null,
        email: "cliente@example.test",
        trackingNumber: null,
      },
      items: [{ productName: "Kit <violet>", quantity: 2, selectedOptions: [{ name: "Couleur", value: "Violet & fuchsia" }] }],
    });

    expect(html).toContain("Bon de préparation");
    expect(html).toContain("Cliente &lt;test&gt;");
    expect(html).toContain("Kit &lt;violet&gt;");
    expect(html).toContain("Violet &amp; fuchsia");
    expect(html).not.toContain("TVA");
    expect(html).not.toContain("Carte bancaire");
  });
});
