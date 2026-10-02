import { describe, expect, it } from "vitest";
import { isConfirmedExpiredCheckout, type StaleStripeCheckoutCandidate } from "./stripeStaleCheckout";

const candidate: StaleStripeCheckoutCandidate = {
  orderId: 42,
  storeId: 7,
  sessionId: "cs_test_example",
  stripeAccountId: "acct_example",
  mode: "test",
};
const expired = {
  id: "cs_test_example",
  status: "expired" as const,
  payment_status: "unpaid" as const,
  mode: "payment" as const,
  livemode: false,
  metadata: { store_id: "7", order_id: "42", stripe_connect_mode: "test" },
};

describe("stock recovery after a Stripe Checkout interruption", () => {
  it("accepts only a confirmed expired unpaid session bound to this boutique and order", () => {
    expect(isConfirmedExpiredCheckout(expired, candidate)).toBe(true);
    expect(isConfirmedExpiredCheckout({ ...expired, status: "open" }, candidate)).toBe(false);
    expect(isConfirmedExpiredCheckout({ ...expired, status: "complete", payment_status: "paid" }, candidate)).toBe(false);
    expect(isConfirmedExpiredCheckout({ ...expired, payment_status: "paid" }, candidate)).toBe(false);
    expect(isConfirmedExpiredCheckout({ ...expired, metadata: null }, candidate)).toBe(false);
    expect(isConfirmedExpiredCheckout({ ...expired, livemode: true }, candidate)).toBe(false);
    expect(isConfirmedExpiredCheckout(expired, { ...candidate, storeId: 8 })).toBe(false);
    expect(isConfirmedExpiredCheckout(expired, { ...candidate, orderId: 43 })).toBe(false);
    expect(isConfirmedExpiredCheckout(expired, { ...candidate, sessionId: "cs_test_other" })).toBe(false);
    expect(isConfirmedExpiredCheckout(expired, { ...candidate, mode: "live" })).toBe(false);
  });
});
