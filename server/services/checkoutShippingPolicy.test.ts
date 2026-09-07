import { describe, expect, it } from "vitest";
import {
  calculateCheckoutShipping,
  DEFAULT_CHECKOUT_SHIPPING_POLICY,
  parseCheckoutShippingPolicy,
} from "./checkoutShippingPolicy";

describe("checkout shipping policy", () => {
  it("keeps delivery included by default when no policy has been configured", () => {
    const policy = parseCheckoutShippingPolicy([]);
    expect(policy).toEqual(DEFAULT_CHECKOUT_SHIPPING_POLICY);
    expect(calculateCheckoutShipping(4_990, policy)).toMatchObject({
      mode: "included",
      shippingAmountCents: 0,
      freeShippingApplied: true,
    });
  });

  it("charges one fixed shipping amount below the configured free-delivery threshold", () => {
    const policy = parseCheckoutShippingPolicy([
      { key: "shipping_policy", value: "flat_rate" },
      { key: "free_shipping_threshold", value: "5000" },
      { key: "flat_shipping_rate", value: "490" },
    ]);

    expect(calculateCheckoutShipping(4_999, policy)).toMatchObject({
      mode: "flat_rate",
      shippingAmountCents: 490,
      freeShippingApplied: false,
    });
  });

  it("removes the fixed shipping amount once the configured threshold is reached", () => {
    const policy = parseCheckoutShippingPolicy([
      { key: "shipping_policy", value: "flat_rate" },
      { key: "free_shipping_threshold", value: "5000" },
      { key: "flat_shipping_rate", value: "490" },
    ]);

    expect(calculateCheckoutShipping(5_000, policy)).toMatchObject({
      shippingAmountCents: 0,
      freeShippingApplied: true,
    });
  });

  it("allows a flat rate without a free-delivery threshold", () => {
    const policy = parseCheckoutShippingPolicy([
      { key: "shipping_policy", value: "flat_rate" },
      { key: "free_shipping_threshold", value: "0" },
      { key: "flat_shipping_rate", value: "490" },
    ]);

    expect(calculateCheckoutShipping(50_000, policy)).toMatchObject({
      shippingAmountCents: 490,
      freeShippingApplied: false,
    });
  });
});
