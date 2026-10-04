import { describe, expect, it } from "vitest";
import { buildOwnerDeliveryHandoverDetails } from "./ownerDeliveryHandover";

describe("owner delivery handover policy", () => {
  const base = {
    id: 71,
    paymentStatus: "paid",
    paymentMethod: "stripe_connect_test",
    shippingAddress: JSON.stringify({ name: "Cliente test", line1: "Rue Exemple 4", postalCode: "1000", city: "Lausanne", countryCode: "CH" }),
    trackingNumber: "CH-71",
  };

  it("releases the minimal record only once the order is marked shipped", () => {
    expect(buildOwnerDeliveryHandoverDetails({ ...base, status: "processing" })).toEqual({ available: false, reason: "ORDER_NOT_SHIPPED" });
    expect(buildOwnerDeliveryHandoverDetails({ ...base, status: "shipped" })).toMatchObject({
      available: true,
      orderId: 71,
      trackingNumber: "CH-71",
      email: null,
    });
  });

  it("keeps the existing payment and address guards before the shipment guard", () => {
    expect(buildOwnerDeliveryHandoverDetails({ ...base, paymentStatus: "unpaid", status: "shipped" })).toEqual({ available: false, reason: "PAYMENT_NOT_CONFIRMED" });
    expect(buildOwnerDeliveryHandoverDetails({ ...base, shippingAddress: null, status: "shipped" })).toEqual({ available: false, reason: "DELIVERY_ADDRESS_MISSING" });
    expect(buildOwnerDeliveryHandoverDetails({ ...base, status: "delivered" })).toEqual({ available: false, reason: "ORDER_NOT_SHIPPED" });
  });
});
