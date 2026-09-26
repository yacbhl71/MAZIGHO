import { describe, expect, it } from "vitest";
import { STUDIO_SUPPORT_ATTENTION_AFTER_MS, needsStudioSupportAttention } from "./studioSupportAttention";

const now = new Date("2026-09-26T12:00:00.000Z");

describe("Studio support attention policy", () => {
  it("flags active tickets without an operator reply", () => {
    expect(needsStudioSupportAttention({ status: "open", operatorReply: "", updatedAt: "2026-09-26T11:00:00.000Z" }, now)).toBe(true);
  });

  it("flags stale active tickets but never resolved tickets", () => {
    const stale = new Date(now.getTime() - STUDIO_SUPPORT_ATTENTION_AFTER_MS).toISOString();
    expect(needsStudioSupportAttention({ status: "reviewing", operatorReply: "Nous regardons.", updatedAt: stale }, now)).toBe(true);
    expect(needsStudioSupportAttention({ status: "resolved", operatorReply: "Terminé.", updatedAt: stale }, now)).toBe(false);
  });

  it("keeps recently answered active tickets outside the attention queue", () => {
    expect(needsStudioSupportAttention({ status: "reviewing", operatorReply: "Réponse envoyée.", updatedAt: "2026-09-25T12:01:00.000Z" }, now)).toBe(false);
  });
});
