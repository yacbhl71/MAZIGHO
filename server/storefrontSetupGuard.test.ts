import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function setupStoreContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "setup-store-test",
      email: "owner@example.test",
      name: "Owner",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    store: {
      id: 99,
      slug: "cadeau-test",
      displayName: "Boutique cadeau",
      primaryDomain: "cadeau.example.test",
      status: "setup",
      isPlatformStore: 0,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("setup storefront guard", () => {
  it("keeps the platform storefront available even if its legacy status is setup", async () => {
    const context = setupStoreContext();
    const caller = appRouter.createCaller({
      ...context,
      store: { ...context.store!, id: 1, slug: "primary-store", displayName: "MAZIGHO", primaryDomain: "mazigho.ch", isPlatformStore: 1 },
    });
    await expect(caller.storefront.getAvailability()).resolves.toEqual({ publicStorefront: true, hasResolvedStore: true });
  });

  it("signals the storefront as closed and refuses public catalogue reads and transactional actions before activation", async () => {
    const caller = appRouter.createCaller(setupStoreContext());
    await expect(caller.storefront.getAvailability()).resolves.toEqual({ publicStorefront: false, hasResolvedStore: true });
    await expect(caller.products.getAll("fr")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.shop.cart.get()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.checkout.createSession({ countryCode: "CH", items: [{ productId: 1, quantity: 1 }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const setupAdminCaller = appRouter.createCaller({ ...setupStoreContext(), user: { ...setupStoreContext().user!, role: "admin" } });
    await expect(setupAdminCaller.admin.getStats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
