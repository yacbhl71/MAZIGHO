import { describe, expect, it } from "vitest";
import { getSetupOwnerPanelPath, getSetupStoreIdFromSearch, isPrivateSetupOwnerPanelPath, parseSetupStoreId } from "../shared/setupStoreOwnerAccess";

describe("setup store owner access", () => {
  it("accepts one bounded positive store identifier", () => {
    expect(parseSetupStoreId("3150005")).toBe(3150005);
    expect(parseSetupStoreId(3150005)).toBe(3150005);
    expect(getSetupStoreIdFromSearch("?preparation=3150005")).toBe(3150005);
  });

  it("rejects malformed, unsafe and non-positive routing identifiers", () => {
    expect(parseSetupStoreId("0")).toBeNull();
    expect(parseSetupStoreId("-7")).toBeNull();
    expect(parseSetupStoreId("3150005x")).toBeNull();
    expect(parseSetupStoreId("2147483648")).toBeNull();
    expect(getSetupStoreIdFromSearch("?preparation=abc")).toBeNull();
  });

  it("builds an explicit owner panel path for a setup boutique", () => {
    expect(getSetupOwnerPanelPath(3150005)).toBe("/gestion-boutique?preparation=3150005");
    expect(getSetupOwnerPanelPath(0)).toBe("/gestion-boutique");
  });

  it("recognizes only the explicit private owner panel route", () => {
    expect(isPrivateSetupOwnerPanelPath("/gestion-boutique", "?preparation=3150005")).toBe(true);
    expect(isPrivateSetupOwnerPanelPath("/gestion-boutique", "?preparation=abc")).toBe(false);
    expect(isPrivateSetupOwnerPanelPath("/boutique", "?preparation=3150005")).toBe(false);
  });
});
