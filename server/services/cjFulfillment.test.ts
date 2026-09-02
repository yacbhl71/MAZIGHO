import { describe, expect, it } from "vitest";
import { getCjFulfillmentSafetyStatus } from "./cjFulfillment";

describe("CJ fulfillment safety boundary", () => {
  it("remains sandbox-only and cannot debit a supplier balance", () => {
    const status = getCjFulfillmentSafetyStatus();
    expect(status.sandboxOnly).toBe(true);
    expect(status.supplierPaymentEnabled).toBe(false);
    expect(status.balanceDebitEnabled).toBe(false);
  });
});
