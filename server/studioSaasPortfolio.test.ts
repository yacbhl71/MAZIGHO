import { describe, expect, it } from "vitest";
import { paginateStudioSaasPortfolio, summarizeStudioSaasPlanCoverage, suggestStudioSaasBillingDraft } from "../shared/studioSaasPortfolio";

const stores = Array.from({ length: 205 }, (_, index) => ({
  id: index + 1,
  displayName: `Boutique ${index}`,
  slug: `boutique-${index}`,
  primaryDomain: `boutique-${index}.mazigho.ch`,
  status: "active" as const,
  isPlatformStore: false,
  commercialOfferMode: "rental" as const,
  planAssignment: index % 5 === 0 ? null : { planId: ["free", "basic", "pro", "lifetime"][index % 4] },
}));

describe("portefeuille de plans SaaS Studio", () => {
  it("calcule les comptes globaux indépendamment des pages affichées", () => {
    const counts = summarizeStudioSaasPlanCoverage(stores);
    expect(Object.values(counts).reduce((total, value) => total + value, 0)).toBe(stores.length);
    expect(counts.unassigned).toBe(41);
  });
  it("cherche seulement les boutiques sans attribution officielle avant pagination", () => {
    const result = paginateStudioSaasPortfolio(stores, { planId: "unassigned", page: 2, pageSize: 20 });
    expect(result.pagination).toMatchObject({ page: 2, total: 41, totalPages: 3 });
    expect(result.stores).toHaveLength(20);
    expect(result.stores.every(store => store.planAssignment === null)).toBe(true);
  });
  it("respecte la recherche et les autres filtres, et exclut les offres personnalisées", () => {
    const withCustom = [{ ...stores[0], planAssignment: { planId: "premium-personnalise" } }, ...stores.slice(1)];
    expect(summarizeStudioSaasPlanCoverage(withCustom).unassigned).toBe(41);
    const result = paginateStudioSaasPortfolio(withCustom, { planId: "pro", query: "Boutique 12", pageSize: 20 });
    expect(result.stores.every(store => store.planAssignment?.planId === "pro" && store.displayName.includes("12"))).toBe(true);
    expect(paginateStudioSaasPortfolio(stores, { planId: "basic", page: 999 }).pagination.page).toBeLessThan(999);
  });
  it("suggère uniquement les prix officiels compatibles avec le mode commercial", () => {
    expect(suggestStudioSaasBillingDraft("basic", "rental")).toEqual({ kind: "rental", label: "MAZIGHO BASIC", amountCents: 790, currency: "CHF", interval: "monthly" });
    expect(suggestStudioSaasBillingDraft("pro", "rental")?.amountCents).toBe(1290);
    expect(suggestStudioSaasBillingDraft("lifetime", "perpetual_sale")).toEqual({ kind: "perpetual_sale", label: "MAZIGHO LIFETIME", amountCents: 30000, currency: "CHF", interval: "one_time" });
    expect(suggestStudioSaasBillingDraft("free", "rental")).toBeNull();
    expect(suggestStudioSaasBillingDraft("pro", "perpetual_sale")).toBeNull();
    expect(suggestStudioSaasBillingDraft("custom", "rental")).toBeNull();
  });
});
