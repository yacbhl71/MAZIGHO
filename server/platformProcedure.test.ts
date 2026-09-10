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
  it("refuses technical platform controls from a client storefront administrator", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin", isPlatformStore: 0 }));
    await expect(caller.admin.system.health()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses technical platform controls from a non-administrator", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user", isPlatformStore: 1 }));
    await expect(caller.admin.system.health()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
