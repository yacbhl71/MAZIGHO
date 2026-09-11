import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(input: { role: "admin" | "user"; isPlatformStore: number }): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "platform-procedure-test",
    email: "owner@example.test",
    name: "Owner test",
    loginMethod: "manus",
    role: input.role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    store: {
      id: input.isPlatformStore ? 1 : 2,
      slug: input.isPlatformStore ? "primary-store" : "client-store",
      displayName: input.isPlatformStore ? "MAZIGHO" : "Boutique cliente",
      primaryDomain: input.isPlatformStore ? "mazigho.test" : "client.test",
      status: "active",
      isPlatformStore: input.isPlatformStore,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("MAZIGHO Studio platform guard", () => {
  it("refuses platform controls and the Studio inventory from a client storefront administrator", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin", isPlatformStore: 0 }));
    await expect(caller.admin.system.health()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getInventory()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.createProvisioningDraft({
      displayName: "Boutique cliente",
      requestedDomain: "client.test",
      ownerName: "Client Test",
      ownerEmail: "client@example.test",
      businessType: "autre",
      customBusinessTheme: "Décoration artisanale",
      preferredCurrency: "CHF",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.updateProvisioningDraft({
      id: 1,
      displayName: "Boutique cliente",
      requestedDomain: "client.test",
      ownerName: "Client Test",
      ownerEmail: "client@example.test",
      businessType: "autre",
      customBusinessTheme: "Décoration artisanale",
      preferredCurrency: "CHF",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.deleteProvisioningDraft({ id: 1, confirmationName: "Boutique cliente" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getLaunchPreflight({ draftId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.provisionGiftStore({ draftId: 1, confirmationName: "Boutique cliente" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStoreOwnerHandoff({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStoreActivationPreflight({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getPrivateStorefrontPreview({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerBuilderConfiguration({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.saveOwnerBuilderConfiguration({ storeId: 1, brandName: "Boutique cliente", brandMessage: "Une boutique de démonstration.", niche: "Décoration artisanale", model: "commerce", pages: ["about", "faq"], paletteId: "terracotta", typographyId: "editorial" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerCollectionDrafts({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.saveOwnerCollectionDrafts({ storeId: 1, collections: [{ id: "collection-1", title: "Collection privée", description: "Une collection préparée sans produit ni prix.", featured: true }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerProductDrafts({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.saveOwnerProductDrafts({ storeId: 1, products: [{ id: "product-1", name: "Produit privé", description: "Une fiche privée de préparation sans vente ni stock.", collectionId: "collection-1", priceCents: 1990, featured: true }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerProductOperationDrafts({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.saveOwnerProductOperationDrafts({ storeId: 1, operations: [{ productId: "product-1", stockState: "to_confirm", stockQuantity: 0, supplierName: "", supplierReference: "" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerPrivateCartSimulation({ storeId: 1, lines: [{ productId: "product-1", quantity: 1 }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerCommercialPublicationPreflight({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerSetupIsolationReview({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerFullPagePreview({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerNavigationDraft({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.saveOwnerNavigationDraft({ storeId: 1, items: [{ pageId: "home", label: "Accueil", visible: true }, { pageId: "about", label: "À propos", visible: true }, { pageId: "faq", label: "FAQ", visible: true }, { pageId: "contact", label: "Contact", visible: true }, { pageId: "lookbook", label: "Inspiration", visible: false }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getOwnerPageDrafts({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.uploadOwnerPageImage({ storeId: 1, dataUrl: "data:image/png;base64,aGVsbG8=", fileName: "couverture.png" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.saveOwnerPageDraft({ storeId: 1, pageId: "about", enabled: true, coverImageUrl: "", blocks: [{ id: "intro", visible: true, title: "Bienvenue", body: "Un brouillon de page privé." }, { id: "detail", visible: true, title: "Notre histoire", body: "Un contenu préparatoire." }, { id: "reassurance", visible: true, title: "Notre promesse", body: "Une promesse préparatoire." }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStoreSetupReadiness({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStoreLaunchCenter({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStorePreparationChecklist({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStoreActivityTimeline({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.updateGiftStorePrimaryDomain({ storeId: 1, confirmationName: "Boutique cliente", primaryDomain: "animalerie.exemple.ch", acknowledged: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftRetailDemoSetupCandidates()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.installGiftRetailDemoSetup({ storeId: 1, confirmationName: "Boutique cliente", acknowledged: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.installGiftPetDemoSetup({ storeId: 1, confirmationName: "Boutique cliente", acknowledged: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.copyPlatformLegalProfileToGiftStore({ storeId: 1, confirmationName: "Boutique cliente", acknowledged: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.activateGiftAnimalStore({ storeId: 1, confirmationName: "Boutique cliente", confirmationOwnerEmail: "client@example.test", domainVerified: true, activationAcknowledged: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.prepareGiftStoreOwnerInvitation({ storeId: 1, confirmationEmail: "client@example.test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.reissueGiftStoreOwnerInvitation({ storeId: 1, confirmationEmail: "client@example.test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses technical platform controls from a non-administrator", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user", isPlatformStore: 1 }));
    await expect(caller.admin.system.health()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
