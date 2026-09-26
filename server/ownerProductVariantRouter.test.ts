import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "manager", status: "active" } as { role: string; status: string } | null,
  variants: [{ id: 5, label: "Bleu · M", sku: "BLEU-M", priceAdjustmentCents: 250, stock: 3, status: "active", displayOrder: 0 }],
  team: [{ membershipId: 9, role: "manager", status: "active", name: "Manager test", email: "manager@example.test", accountStatus: "active" }],
  markets: { primaryLanguage: "fr", activeLanguages: ["fr", "en"], showLanguageSelector: true, primaryCountry: "CH", activeCountries: ["CH", "FR"], showCountrySelector: true },
  commercialReadiness: { store: { displayName: "Boutique test", status: "active", primaryDomain: "boutique.test" }, summary: { completed: 9, total: 9, baseCommerciallyPrepared: true, paymentStatus: "not_activated" as const }, inventory: { totalProducts: 2, activeProducts: 2, sellableProducts: 2, productsWithoutImages: 0, productsWithoutStock: 0, activeVariants: 2, outOfStockVariants: 0, productsWithVariants: 1 }, items: [] },
  profile: { paletteId: "terracotta", customColorsEnabled: false, customPrimary: "#C2410C", customAccent: "#0F766E", customSoft: "#FFF7ED" } as Record<string, unknown>,
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getStoreTeamMembers: vi.fn(async () => state.team),
  getStoreMarketSettings: vi.fn(async () => state.markets),
  saveStoreMarketSettings: vi.fn(async (_storeId, input) => input),
  getOwnerCustomDomainRequest: vi.fn(async () => ({ currentDomain: "boutique.test", supported: true, request: null })),
  saveOwnerCustomDomainRequest: vi.fn(async (_storeId, domain) => ({ domain, requestedAt: "2026-09-25T10:00:00.000Z", guide: null })),
  acknowledgeOwnerCustomDomainGuide: vi.fn(async () => ({ domain: "atelier-client.ch", requestedAt: "2026-09-25T10:00:00.000Z", guide: { providerLabel: "", records: [{ type: "A", host: "@", value: "76.76.21.21" }], note: "", preparedAt: "2026-09-25T11:00:00.000Z", clientAcknowledgedAt: "2026-09-25T12:00:00.000Z" } })),
  getOwnerIntegrationRequests: vi.fn(async () => ({ requests: [{ id: "google_analytics", requestedAt: "2026-09-26T00:00:00.000Z" }] })),
  saveOwnerIntegrationRequests: vi.fn(async (_storeId, ids) => ({ requests: ids.map((id: string) => ({ id, requestedAt: "2026-09-26T00:00:00.000Z" })) })),
  getStoreTaxPolicies: vi.fn(async () => [{ countryCode: "CH", displayMode: "included", notice: "Prix affichés taxes comprises." }]),
  saveStoreTaxPolicies: vi.fn(async (_storeId, input) => input),
  getCheckoutTaxDisclosure: vi.fn(async (storeId, countryCode) => ({ configured: true, storeId, countryCode, displayMode: "included", notice: "Prix affichés taxes comprises." })),
  getOwnerShippingReturnsSettings: vi.fn(async () => ({ mode: "included", freeShippingThresholdCents: 0, flatShippingRateCents: 0, servedCountries: ["CH"], deliveryLeadTime: "2 à 4 jours", returnsSummary: "Retours sous 14 jours." })),
  saveOwnerShippingReturnsSettings: vi.fn(async (_storeId, input) => input),
  getOwnerCommercialReadiness: vi.fn(async () => state.commercialReadiness),
  getOwnerPrivateCartSimulation: vi.fn(async (input) => ({ ...input, privateCartSimulation: true, persistedCart: false, paymentAvailable: false, orderCreated: false })),
  getDesignProfile: vi.fn(async () => state.profile),
  updateDesignProfile: vi.fn(async (input) => input),
  importOwnerCatalogueProducts: vi.fn(async () => ({ imported: 2, updated: 1 })),
  getOwnerOrderItemSummaries: vi.fn(async () => [{ id: 15, quantity: 2, productName: "Kit créatif", selectedOptions: [{ name: "Couleur", value: "Violet" }] }]),
  recordOrderDecision: vi.fn(async (input) => ({ ...input, success: true, supplierOrderCreated: false, paymentRefunded: false })),
  updateOperationalOrderTracking: vi.fn(async (input) => ({ ...input, success: true })),
  prepareStoreTeamInvitation: vi.fn(async () => ({
    userId: 15,
    name: "Éditeur test",
    email: "editeur@example.test",
    role: "catalog_editor",
    activation: { token: "one-time-token", expiresAt: new Date("2026-12-01T00:00:00.000Z") },
  })),
  setStoreTeamMemberStatus: vi.fn(async ({ membershipId, status }) => ({ membershipId, status })),
  reissueStoreTeamInvitation: vi.fn(async ({ membershipId }) => ({
    membershipId,
    userId: 15,
    name: "Éditeur test",
    email: "editeur@example.test",
    activation: { token: "replacement-token", expiresAt: new Date("2026-12-02T00:00:00.000Z") },
  })),
  getOwnerProductVariants: vi.fn(async () => state.variants),
  getOwnerVariantStockOverview: vi.fn(async () => [{ productId: 41, productName: "T-shirt atelier", productStatus: "active", id: 5, label: "Bleu · M", sku: "BLEU-M", priceAdjustmentCents: 250, stock: 3, status: "active", displayOrder: 0 }]),
  createOwnerProductVariant: vi.fn(async () => ({ id: 6 })),
  createOwnerProductVariantMatrix: vi.fn(async () => ({ created: 2, skipped: 0 })),
  updateOwnerProductVariant: vi.fn(async () => ({ success: true })),
  deleteOwnerProductVariant: vi.fn(async () => ({ success: true })),
  createCategory: vi.fn(async () => ({ id: 41 })),
  updateCategory: vi.fn(async () => ({ success: true })),
  deleteCategory: vi.fn(async () => ({ success: true })),
  getAllBanners: vi.fn(async () => [{ id: 12, title: "Atelier", subtitle: "Une sélection créative", imageUrl: "/assets/banner.webp", linkUrl: "/boutique", active: 1, displayOrder: 0 }]),
  createBanner: vi.fn(async () => ({ success: true, id: 13 })),
  updateBanner: vi.fn(async () => ({ success: true })),
  deleteBanner: vi.fn(async () => ({ success: true })),
  markPublicContentTranslationsStale: vi.fn(async () => undefined),
}));

import * as db from "./db";
import { appRouter } from "./routers";

function callerFor(role: string = "user") {
  return appRouter.createCaller({
    user: { id: 7, role, name: "Manager test", email: "manager@example.test" },
    store: { id: 77, slug: "boutique-test", displayName: "Boutique test", primaryDomain: "boutique.test", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("owner product variant routes", () => {
  beforeEach(() => {
    state.membership = { role: "manager", status: "active" };
    state.profile = { paletteId: "terracotta", customColorsEnabled: false, customPrimary: "#C2410C", customAccent: "#0F766E", customSoft: "#FFF7ED" };
    vi.clearAllMocks();
  });

  it("reads and writes variants only through the current resolved store", async () => {
    const caller = callerFor();
    await expect(caller.owner.getProductVariants({ productId: 41 })).resolves.toEqual(state.variants);
    expect(db.getOwnerProductVariants).toHaveBeenCalledWith(41, 77);

    await expect(caller.owner.createProductVariant({
      productId: 41,
      variant: { label: "Sauge · L", sku: "SAUGE-L", priceAdjustmentCents: 0, stock: 4, status: "active" },
    })).resolves.toEqual({ id: 6 });
    expect(db.createOwnerProductVariant).toHaveBeenCalledWith(41, expect.objectContaining({ label: "Sauge · L", stock: 4 }), 77);
  });

  it("reads the variant stock overview only through the current resolved store", async () => {
    await expect(callerFor().owner.getVariantStockOverview()).resolves.toEqual([
      { productId: 41, productName: "T-shirt atelier", productStatus: "active", id: 5, label: "Bleu · M", sku: "BLEU-M", priceAdjustmentCents: 250, stock: 3, status: "active", displayOrder: 0 },
    ]);
    expect(db.getOwnerVariantStockOverview).toHaveBeenCalledWith(77);

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.getVariantStockOverview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps custom-domain requests scoped to the store owner", async () => {
    state.membership = { role: "owner", status: "active" };
    const caller = callerFor();
    await expect(caller.owner.getCustomDomainRequest()).resolves.toEqual({ currentDomain: "boutique.test", supported: true, request: null });
    expect(db.getOwnerCustomDomainRequest).toHaveBeenCalledWith(77);

    await expect(caller.owner.saveCustomDomainRequest({ domain: "atelier-client.ch" })).resolves.toEqual({ domain: "atelier-client.ch", requestedAt: "2026-09-25T10:00:00.000Z", guide: null });
    expect(db.saveOwnerCustomDomainRequest).toHaveBeenCalledWith(77, "atelier-client.ch");

    await expect(caller.owner.acknowledgeCustomDomainGuide()).resolves.toMatchObject({ domain: "atelier-client.ch", guide: { clientAcknowledgedAt: "2026-09-25T12:00:00.000Z" } });
    expect(db.acknowledgeOwnerCustomDomainGuide).toHaveBeenCalledWith(77);

    state.membership = { role: "manager", status: "active" };
    await expect(callerFor().owner.saveCustomDomainRequest({ domain: "other-client.ch" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor().owner.acknowledgeCustomDomainGuide()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps integration requests visible to managers but writable only by the current store owner", async () => {
    await expect(callerFor().owner.getIntegrationRequests()).resolves.toEqual({ requests: [{ id: "google_analytics", requestedAt: "2026-09-26T00:00:00.000Z" }] });
    expect(db.getOwnerIntegrationRequests).toHaveBeenCalledWith(77);

    await expect(callerFor().owner.saveIntegrationRequests({ integrationIds: ["stripe"] })).rejects.toMatchObject({ code: "FORBIDDEN" });

    state.membership = { role: "owner", status: "active" };
    await expect(callerFor().owner.saveIntegrationRequests({ integrationIds: ["stripe", "transactional_email"] })).resolves.toEqual({
      requests: [
        { id: "stripe", requestedAt: "2026-09-26T00:00:00.000Z" },
        { id: "transactional_email", requestedAt: "2026-09-26T00:00:00.000Z" },
      ],
    });
    expect(db.saveOwnerIntegrationRequests).toHaveBeenCalledWith(77, ["stripe", "transactional_email"]);
  });

  it("creates a bounded variant matrix only through the current resolved store", async () => {
    const variants = [
      { label: "Couleur : Violet · Taille : S", sku: "TSHIRT-VIOLET-S", priceAdjustmentCents: 0, stock: 2, status: "active" as const },
      { label: "Couleur : Violet · Taille : M", sku: "TSHIRT-VIOLET-M", priceAdjustmentCents: 150, stock: 7, status: "active" as const },
    ];
    await expect(callerFor().owner.createProductVariantMatrix({ productId: 41, variants })).resolves.toEqual({ created: 2, skipped: 0 });
    expect(db.createOwnerProductVariantMatrix).toHaveBeenCalledWith(41, variants, 77);

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.createProductVariantMatrix({ productId: 41, variants })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("manages categories only through the current resolved store", async () => {
    const caller = callerFor();
    const input = { name: "Laine et crochet", slug: "laine-crochet", description: "Pelotes et accessoires.", imageUrl: "/media/laine.webp", displayOrder: 30, catalogSection: "creations" as const };

    await expect(caller.owner.createCategory(input)).resolves.toEqual({ id: 41 });
    expect(db.createCategory).toHaveBeenCalledWith(input, 77);

    await expect(caller.owner.updateCategory({ id: 41, name: "Laine & crochet", displayOrder: 40, catalogSection: "creations" })).resolves.toEqual({ success: true });
    expect(db.updateCategory).toHaveBeenCalledWith(41, { name: "Laine & crochet", displayOrder: 40, catalogSection: "creations" }, 77);

    await expect(caller.owner.deleteCategory({ id: 41 })).resolves.toEqual({ success: true });
    expect(db.deleteCategory).toHaveBeenCalledWith(41, 77);
  });

  it("imports catalogue rows only through the current resolved store", async () => {
    const rows = [{
      category: "Laine et crochet",
      name: "Pelote lavande",
      shortDescription: "Une pelote douce.",
      longDescription: "Une pelote de laine pour vos créations.",
      priceCents: 890,
      stock: 12,
      dimensions: ["50 g"],
      imageUrl: "https://images.example.test/pelote.webp",
      featured: false,
    }];
    await expect(callerFor().owner.importCatalogueProducts({ rows, acknowledged: true })).resolves.toEqual({ imported: 2, updated: 1 });
    expect(db.importOwnerCatalogueProducts).toHaveBeenCalledWith({ storeId: 77, rows });
  });

  it("refuses a catalog-only membership from the variant management procedures", async () => {
    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.getProductVariants({ productId: 41 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor().owner.deleteProductVariant({ productId: 41, variantId: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lists only the team attached to the current resolved store", async () => {
    await expect(callerFor().owner.getTeam()).resolves.toEqual(state.team);
    expect(db.getStoreTeamMembers).toHaveBeenCalledWith(77);

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.getTeam()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reads and saves market visibility through the current resolved store only", async () => {
    const caller = callerFor();
    await expect(caller.owner.getMarketSettings()).resolves.toEqual(state.markets);
    expect(db.getStoreMarketSettings).toHaveBeenCalledWith(77);

    const input = { primaryLanguage: "ar" as const, activeLanguages: ["ar", "fr", "en"], showLanguageSelector: true, primaryCountry: "DZ" as const, activeCountries: ["DZ", "FR"], showCountrySelector: true };
    await expect(caller.owner.saveMarketSettings(input)).resolves.toEqual(input);
    expect(db.saveStoreMarketSettings).toHaveBeenCalledWith(77, input);
  });

  it("keeps tax disclosures scoped to the current store and market", async () => {
    await expect(callerFor().owner.getTaxPolicies()).resolves.toEqual([
      { countryCode: "CH", displayMode: "included", notice: "Prix affichés taxes comprises." },
    ]);
    expect(db.getStoreTaxPolicies).toHaveBeenCalledWith(77);

    const policies = [{ countryCode: "CH" as const, displayMode: "included" as const, notice: "Prix affichés taxes comprises." }];
    await expect(callerFor().owner.saveTaxPolicies(policies)).resolves.toEqual(policies);
    expect(db.saveStoreTaxPolicies).toHaveBeenCalledWith(77, policies);

    await expect(callerFor().content.getCheckoutTaxDisclosure({ countryCode: "CH" })).resolves.toMatchObject({ configured: true, storeId: 77, countryCode: "CH" });
    expect(db.getCheckoutTaxDisclosure).toHaveBeenCalledWith(77, "CH");

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.saveTaxPolicies(policies)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("saves delivery rules only through the current resolved store", async () => {
    const input = {
      mode: "flat_rate" as const,
      freeShippingThresholdCents: 7_500,
      flatShippingRateCents: 650,
      servedCountries: ["ch", "fr"],
      deliveryLeadTime: "2 à 4 jours ouvrés",
      returnsSummary: "Retours sous 14 jours après réception.",
    };

    await expect(callerFor().owner.saveShippingReturnsSettings(input)).resolves.toMatchObject({
      mode: "flat_rate",
      servedCountries: ["CH", "FR"],
    });
    expect(db.saveOwnerShippingReturnsSettings).toHaveBeenCalledWith(77, expect.objectContaining({
      servedCountries: ["CH", "FR"],
      flatShippingRateCents: 650,
    }));
  });

  it("reads commercial readiness only for the current resolved store", async () => {
    await expect(callerFor().owner.getCommercialReadiness()).resolves.toEqual(state.commercialReadiness);
    expect(db.getOwnerCommercialReadiness).toHaveBeenCalledWith(77);
  });

  it("runs cart rehearsal only for the current resolved store", async () => {
    await expect(callerFor().owner.getPrivateCartSimulation({ countryCode: "CH", lines: [{ productId: 12, quantity: 2 }] })).resolves.toMatchObject({
      storeId: 77,
      privateCartSimulation: true,
      persistedCart: false,
      paymentAvailable: false,
      orderCreated: false,
    });
    expect(db.getOwnerPrivateCartSimulation).toHaveBeenCalledWith(expect.objectContaining({
      storeId: 77,
      countryCode: "CH",
      lines: [{ productId: 12, quantity: 2 }],
    }));
  });

  it("reads order item summaries only through the current resolved store", async () => {
    await expect(callerFor().owner.getOrderItemSummaries({ orderId: 481 })).resolves.toEqual([
      { id: 15, quantity: 2, productName: "Kit créatif", selectedOptions: [{ name: "Couleur", value: "Violet" }] },
    ]);
    expect(db.getOwnerOrderItemSummaries).toHaveBeenCalledWith(481, 77);

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.getOrderItemSummaries({ orderId: 481 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("records a manual order decision only for the current resolved store", async () => {
    await expect(callerFor().owner.recordOrderDecision({ orderId: 481, action: "accepted" })).resolves.toMatchObject({
      success: true,
      storeId: 77,
      actorUserId: 7,
      action: "accepted",
    });
    expect(db.recordOrderDecision).toHaveBeenCalledWith({
      orderId: 481,
      action: "accepted",
      actorUserId: 7,
      storeId: 77,
    });

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.recordOrderDecision({ orderId: 481, action: "rejected" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("records manual shipment status only for the current resolved store", async () => {
    await expect(callerFor().owner.updateOrderTracking({ orderId: 481, status: "shipped", trackingNumber: " CH123456 " })).resolves.toMatchObject({
      success: true,
      id: 481,
      status: "shipped",
      trackingNumber: "CH123456",
      storeId: 77,
    });
    expect(db.updateOperationalOrderTracking).toHaveBeenCalledWith({
      id: 481,
      status: "shipped",
      trackingNumber: "CH123456",
      storeId: 77,
    });

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.updateOrderTracking({ orderId: 481, status: "delivered" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("applies a storefront palette only to the current resolved store", async () => {
    await expect(callerFor().owner.saveStorefrontPalette({ paletteId: "violet" })).resolves.toMatchObject({
      paletteId: "violet",
      customColorsEnabled: true,
      customPrimary: "#6D28D9",
      customAccent: "#A855F7",
      customSoft: "#F7F3FF",
    });
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining({ paletteId: "violet", customColorsEnabled: true }), 77);
  });

  it("saves custom storefront colors only to the current resolved store", async () => {
    await expect(callerFor().owner.saveStorefrontCustomColors({
      primary: "#6d28d9",
      accent: "#c80aff",
      soft: "#f7f3ff",
    })).resolves.toMatchObject({
      customColorsEnabled: true,
      customPrimary: "#6D28D9",
      customAccent: "#C80AFF",
      customSoft: "#F7F3FF",
    });
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining({
      customColorsEnabled: true,
      customPrimary: "#6D28D9",
      customAccent: "#C80AFF",
      customSoft: "#F7F3FF",
    }), 77);
  });

  it("saves the header layout only through the current resolved store", async () => {
    await expect(callerFor().owner.saveStorefrontHeaderLayout({ headerLayout: "searchFirst" })).resolves.toMatchObject({
      headerLayout: "searchFirst",
    });
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining({ headerLayout: "searchFirst" }), 77);
  });

  it("saves footer settings only through the current resolved store", async () => {
    const input = {
      footerDescription: "Une boutique créative à votre image.",
      footerNavigationTitle: "Explorer",
      footerCategoriesTitle: "Univers",
      footerHelpTitle: "Nous contacter",
      footerContactText: "Écrivez à l’atelier",
      footerContactUrl: "/contact",
      footerDeliveryTitle: "Livraison",
      footerDeliveryText: "Les conditions sont affichées avant validation.",
      footerSecureTitle: "Paiement sécurisé",
      footerSecureText: "Navigation chiffrée par HTTPS.",
      footerServiceTitle: "Conseil",
      footerServiceText: "Une question ? Notre équipe vous répond.",
      footerCopyrightText: "Tous droits réservés.",
      footerShowNavigation: true,
      footerShowCategories: true,
      footerShowHelp: true,
      footerShowReassurance: false,
      footerSocialLinks: [
        { id: "instagram" as const, url: "https://instagram.example.test/atelier" },
        { id: "facebook" as const, url: "" },
        { id: "tiktok" as const, url: "" },
        { id: "youtube" as const, url: "" },
        { id: "pinterest" as const, url: "" },
        { id: "linkedin" as const, url: "" },
      ],
    };
    await expect(callerFor().owner.saveFooter(input)).resolves.toMatchObject({ footerDescription: input.footerDescription });
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining({ footerDescription: input.footerDescription, footerSocialLinks: input.footerSocialLinks }), 77);
  });

  it("saves homepage content only through the current resolved store", async () => {
    const input = {
      showReassurance: true,
      reassuranceItems: [
        { icon: "sparkles" as const, title: "Créations choisies", text: "Du matériel sélectionné avec soin." },
        { icon: "check" as const, title: "Atelier préparé", text: "Une boutique claire pour vos projets." },
        { icon: "arrow" as const, title: "À votre rythme", text: "Explorez les catégories de la boutique." },
      ],
      showDiscovery: true,
      discoveryEyebrow: "Explorer l’atelier",
      discoveryTitle: "Nos catégories créatives",
      discoveryText: "Choisissez votre prochain projet parmi les catégories de la boutique.",
      discoveryAllShopLabel: "Voir la boutique",
      discoveryAllShopUrl: "/boutique",
      discoveryBrowseShopLabel: "Découvrir les créations",
      discoveryBrowseShopUrl: "/boutique",
      showStory: false,
      showTestimonials: true,
      testimonialsEyebrow: "Votre message",
      testimonialsTitle: "Un atelier à votre image",
      testimonialsText: "Les avis vérifiés seront publiés uniquement quand ils existeront.",
      testimonialsCtaLabel: "Voir les créations",
      testimonialsCtaUrl: "/boutique",
      showEditorial: false,
      showFeatured: true,
      showClosing: true,
      closingEyebrow: "Créer à votre rythme",
      closingTitle: "Préparez votre prochain projet.",
      closingText: "Une sélection pensée par cette boutique, sans contenu imposé.",
      closingShopCtaLabel: "Voir le catalogue",
      closingShopCtaUrl: "/boutique",
      closingContactCtaLabel: "Nous contacter",
      closingContactCtaUrl: "/contact",
      closingVisualValue: "",
      closingVisualText: "Une boutique créative, à votre image.",
      closingImageUrl: "",
    };
    await expect(callerFor().owner.saveHomepageSections(input)).resolves.toMatchObject({ showClosing: true, discoveryTitle: "Nos catégories créatives" });
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining({ showReassurance: true, closingTitle: "Préparez votre prochain projet." }), 77);
    expect(db.markPublicContentTranslationsStale).toHaveBeenCalledWith("design", 1, 77);
  });

  it("saves catalogue page copy only through the current resolved store", async () => {
    const input = {
      promosTitle: "Offres de l’atelier",
      promosLead: "Des créations choisies pour {country}.",
      promosBannerTitle: "Une sélection en ce moment",
      promosBannerText: "Les prix affichés sont déjà ajustés.",
      promosEmptyText: "Aucune offre n’est actuellement disponible pour {country}.",
      promosAllProductsLabel: "Voir les créations",
      newArrivalsTitle: "Nouvelles créations",
      newArrivalsLead: "Les dernières arrivées pour {country}.",
      newArrivalsEmptyText: "Aucune nouveauté n’est disponible pour {country}.",
      bestSellersTitle: "Les favoris de l’atelier",
      bestSellersLead: "Les créations les plus appréciées pour {country}.",
      bestSellersTopLabel: "Coup de cœur n°{rank}",
      bestSellersEmptyText: "Aucun favori n’est encore disponible pour {country}.",
    };
    await expect(callerFor().owner.saveCataloguePageCopy(input)).resolves.toMatchObject({
      promosTitle: input.promosTitle,
      cataloguePageCopyCustomized: true,
    });
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining({
      promosTitle: input.promosTitle,
      bestSellersTopLabel: input.bestSellersTopLabel,
      cataloguePageCopyCustomized: true,
    }), 77);
  });

  it("saves the announcement bar only through the current resolved store", async () => {
    const input = {
      showAnnouncement: true,
      announcementItems: ["Créations choisies avec soin", "Retrait à l’atelier sur rendez-vous", "Une question ? Contactez-nous"],
    };
    await expect(callerFor().owner.saveAnnouncementBar(input)).resolves.toMatchObject(input);
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining(input), 77);
  });

  it("saves shop page content only through the current resolved store", async () => {
    const input = {
      shopEyebrow: "L’atelier Sylvie",
      shopTitle: "Tout pour créer à votre rythme",
      shopIntro: "Une sélection disponible pour {country}.",
      shopProductsEyebrow: "À découvrir",
      shopProductsTitle: "Les créations de l’atelier",
      showShopEditorial: true,
      shopEditorialEyebrow: "À votre rythme",
      shopEditorialTitle: "Un projet créatif commence par une belle idée.",
      shopEditorialImageUrl: "/media/atelier.webp",
      showShopReassurance: false,
    };
    await expect(callerFor().owner.saveShopPageContent(input)).resolves.toMatchObject({
      shopTitle: input.shopTitle,
      shopPageCopyCustomized: true,
    });
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining({
      shopTitle: input.shopTitle,
      shopEditorialImageUrl: input.shopEditorialImageUrl,
      shopPageCopyCustomized: true,
    }), 77);
  });

  it("saves product reassurance only through the current resolved store", async () => {
    const input = {
      showProductReassurance: true,
      productReassuranceItems: [
        { icon: "shield" as const, title: "Paiement à confirmer", text: "Les modalités sont affichées avant validation." },
        { icon: "truck" as const, title: "Livraison atelier", text: "Les délais sont précisés sur la boutique." },
      ],
    };
    await expect(callerFor().owner.saveProductReassurance(input)).resolves.toMatchObject(input);
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining(input), 77);
  });

  it("saves cart and checkout copy only through the current resolved store", async () => {
    const input = {
      cartEyebrow: "Votre sélection créative",
      cartTitle: "Votre panier atelier",
      cartIntro: "Relisez vos créations avant la demande pour {country}.",
      checkoutEyebrow: "Avant de finaliser",
      checkoutTitle: "Vérifiez votre commande",
      checkoutIntro: "Les conditions de l’atelier restent visibles avant toute demande.",
      checkoutPaymentNotice: "Les moyens de paiement de l’atelier seront précisés avant validation.",
    };
    await expect(callerFor().owner.saveCheckoutPageCopy(input)).resolves.toMatchObject(input);
    expect(db.getDesignProfile).toHaveBeenCalledWith(77);
    expect(db.updateDesignProfile).toHaveBeenCalledWith(expect.objectContaining(input), 77);
  });

  it("edits carousel slides only inside the current resolved store", async () => {
    const caller = callerFor();
    await expect(caller.owner.getCarouselBanners()).resolves.toHaveLength(1);
    expect(db.getAllBanners).toHaveBeenCalledWith(77);

    const input = { title: "Créations Dyama", subtitle: "Diamond Painting et broderie", imageUrl: "/assets/dyama.webp", linkUrl: "/categorie/diamond-painting", active: true, displayOrder: 2 };
    await expect(caller.owner.createCarouselBanner(input)).resolves.toEqual({ success: true, id: 13 });
    expect(db.createBanner).toHaveBeenCalledWith(expect.objectContaining({ title: "Créations Dyama", active: 1 }), 77);

    await expect(caller.owner.updateCarouselBanner({ id: 12, ...input, active: false })).resolves.toEqual({ success: true });
    expect(db.updateBanner).toHaveBeenCalledWith(12, expect.objectContaining({ active: 0 }), 77);
    expect(db.markPublicContentTranslationsStale).toHaveBeenCalledWith("banner", 12, 77);
  });

  it("uses only the resolved store for public market visibility", async () => {
    await expect(callerFor().storefront.getMarketSettings()).resolves.toEqual(state.markets);
    expect(db.getStoreMarketSettings).toHaveBeenCalledWith(77);
  });

  it("allows only the owner to prepare a scoped team invitation", async () => {
    state.membership = { role: "owner", status: "active" };
    const input = { name: "Éditeur test", email: "editeur@example.test", role: "catalog_editor" as const, confirmationEmail: "editeur@example.test" };
    await expect(callerFor().owner.prepareTeamInvitation(input)).resolves.toMatchObject({
      userId: 15,
      activationLink: expect.stringContaining("token=one-time-token"),
      emailSent: false,
    });
    expect(db.prepareStoreTeamInvitation).toHaveBeenCalledWith(expect.objectContaining({ storeId: 77, role: "catalog_editor" }));

    state.membership = { role: "manager", status: "active" };
    await expect(callerFor().owner.prepareTeamInvitation(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows only the owner to block or restore a delegated membership in the resolved store", async () => {
    state.membership = { role: "owner", status: "active" };
    await expect(callerFor().owner.setTeamMemberStatus({ membershipId: 9, status: "blocked" })).resolves.toEqual({ membershipId: 9, status: "blocked" });
    expect(db.setStoreTeamMemberStatus).toHaveBeenCalledWith({ membershipId: 9, status: "blocked", storeId: 77 });

    state.membership = { role: "manager", status: "active" };
    await expect(callerFor().owner.setTeamMemberStatus({ membershipId: 9, status: "active" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lets only the owner reissue a pending invitation inside the resolved store", async () => {
    state.membership = { role: "owner", status: "active" };
    await expect(callerFor().owner.reissueTeamInvitation({ membershipId: 9 })).resolves.toMatchObject({
      membershipId: 9,
      email: "editeur@example.test",
      activationLink: expect.stringContaining("token=replacement-token"),
      emailSent: false,
    });
    // The client has no store id field to tamper with; the router takes it
    // exclusively from the resolved host scope.
    expect(db.reissueStoreTeamInvitation).toHaveBeenCalledWith({ membershipId: 9, storeId: 77 });

    state.membership = { role: "manager", status: "active" };
    await expect(callerFor().owner.reissueTeamInvitation({ membershipId: 9 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
