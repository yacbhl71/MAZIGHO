import { describe, expect, it } from "vitest";
import { getReturnRequestActionLabel, getReturnRequestNextStatus, getReturnRequestStatusLabel } from "./returnRequestWorkflow";

describe("controlled return request workflow", () => {
  it("permits only the manual return lifecycle", () => {
    expect(getReturnRequestNextStatus("requested", "approve")).toBe("approved");
    expect(getReturnRequestNextStatus("requested", "reject")).toBe("rejected");
    expect(getReturnRequestNextStatus("approved", "mark_received")).toBe("return_received");
    expect(getReturnRequestNextStatus("return_received", "close")).toBe("closed");
  });

  it("rejects skipped, repeated and legacy refund transitions", () => {
    expect(getReturnRequestNextStatus("requested", "close")).toBeNull();
    expect(getReturnRequestNextStatus("approved", "approve")).toBeNull();
    expect(getReturnRequestNextStatus("closed", "close")).toBeNull();
    expect(getReturnRequestNextStatus("refunded", "close")).toBeNull();
  });

  it("uses customer-facing labels without promising a payment refund", () => {
    expect(getReturnRequestActionLabel("approve")).toContain("instructions");
    expect(getReturnRequestStatusLabel("closed")).toBe("Dossier clôturé");
    expect(getReturnRequestStatusLabel("refunded")).not.toContain("Stripe");
  });
});
