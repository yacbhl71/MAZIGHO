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
      preferredCurrency: "CHF",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getLaunchPreflight({ draftId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.provisionGiftStore({ draftId: 1, confirmationName: "Boutique cliente" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStoreOwnerHandoff({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.studio.getGiftStoreActivationPreflight({ storeId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
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
