import { describe, expect, it } from "vitest";
import {
  createAlgeriaWilayaReferenceSettings,
  getAlgeriaWilayaDeliveryQuote,
  isAlgeriaWilayaDeliveryConfigured,
  normalizeAlgeriaWilayaDeliverySettings,
  parseAlgeriaWilayaDeliverySettings,
} from "../../shared/algeriaWilayaDelivery";

describe("Algeria wilaya delivery policy", () => {
  it("creates an inactive, tenant-copyable 2023 reference with all current wilayas", () => {
    const settings = createAlgeriaWilayaReferenceSettings();
    const alger = settings.rates.find(rate => rate.code === "16");
    const aflou = settings.rates.find(rate => rate.code === "59");

    expect(settings.source).toBe("letshop_public_2023_02_07");
    expect(settings.rates).toHaveLength(69);
    expect(alger).toMatchObject({ name: "Alger", homeDeliveryDzd: 250, relayDeliveryDzd: 100, deliveryLeadTime: "24 h", enabled: false });
    expect(aflou).toMatchObject({ name: "Aflou", homeDeliveryDzd: null, relayDeliveryDzd: null, enabled: false });
    expect(isAlgeriaWilayaDeliveryConfigured(settings)).toBe(false);
  });

  it("accepts only complete owner-enabled wilayas and resolves one selected mode", () => {
    const reference = createAlgeriaWilayaReferenceSettings();
    const settings = normalizeAlgeriaWilayaDeliverySettings({
      ...reference,
      rates: reference.rates.map(rate => rate.code === "16" ? { ...rate, enabled: true } : rate),
    });

    expect(isAlgeriaWilayaDeliveryConfigured(settings)).toBe(true);
    expect(getAlgeriaWilayaDeliveryQuote(settings, { wilayaCode: "16", mode: "relay" })).toEqual({
      wilayaCode: "16",
      wilayaName: "Alger",
      mode: "relay",
      amountDzd: 100,
      deliveryLeadTime: "24 h",
    });
    expect(() => getAlgeriaWilayaDeliveryQuote(settings, { wilayaCode: "33", mode: "home" })).toThrow("ALGERIA_WILAYA_DELIVERY_UNAVAILABLE");
  });

  it("fails closed for malformed or incomplete saved settings", () => {
    const parsed = parseAlgeriaWilayaDeliverySettings(JSON.stringify({
      source: "custom",
      rates: [{ code: "16", name: "Alger", homeDeliveryDzd: 250, relayDeliveryDzd: null, deliveryLeadTime: "", enabled: true }],
    }));
    const alger = parsed.rates.find(rate => rate.code === "16");

    expect(alger).toMatchObject({ enabled: false, homeDeliveryDzd: 250, relayDeliveryDzd: null, deliveryLeadTime: "" });
    expect(isAlgeriaWilayaDeliveryConfigured(parsed)).toBe(false);
  });
});
