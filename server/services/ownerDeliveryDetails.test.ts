import { describe, expect, it } from "vitest";
import { buildOwnerDeliveryDetails } from "./ownerDeliveryDetails";

const paidProcessingOrder = {
  id: 71,
  paymentStatus: "paid",
  status: "processing",
  trackingNumber: null,
  shippingAddress: JSON.stringify({
    source: "stripe_checkout",
    name: "Cliente test",
    line1: "Rue Exemple 4",
    line2: "Bâtiment B",
    postalCode: "1000",
    city: "Lausanne",
    countryCode: "ch",
    phone: "+41 79 000 00 00",
    email: "CLIENTE@EXAMPLE.TEST",
  }),
};

describe("owner delivery details", () => {
  it("releases only the minimum shipping record for a paid order in fulfillment", () => {
    expect(buildOwnerDeliveryDetails(paidProcessingOrder)).toEqual({
      available: true,
      orderId: 71,
      recipientName: "Cliente test",
      addressLines: ["Rue Exemple 4", "Bâtiment B"],
      postalCode: "1000",
      city: "Lausanne",
      state: null,
      countryCode: "CH",
      phone: "+41 79 000 00 00",
      email: "cliente@example.test",
      trackingNumber: null,
      addressIncomplete: false,
    });
  });

  it("does not release an address before confirmed payment and owner fulfillment", () => {
    expect(buildOwnerDeliveryDetails({ ...paidProcessingOrder, paymentStatus: "unpaid" })).toEqual({ available: false, reason: "PAYMENT_NOT_CONFIRMED" });
    expect(buildOwnerDeliveryDetails({ ...paidProcessingOrder, status: "pending" })).toEqual({ available: false, reason: "ORDER_NOT_READY" });
  });

  it("does not infer or enrich incomplete legacy records", () => {
    expect(buildOwnerDeliveryDetails({ ...paidProcessingOrder, shippingAddress: "" })).toEqual({ available: false, reason: "DELIVERY_ADDRESS_MISSING" });
    expect(buildOwnerDeliveryDetails({ ...paidProcessingOrder, shippingAddress: "Rue historique 8\n1200 Genève" })).toMatchObject({
      available: true,
      addressLines: ["Rue historique 8 1200 Genève"],
      recipientName: null,
      countryCode: null,
      addressIncomplete: true,
    });
  });
});
