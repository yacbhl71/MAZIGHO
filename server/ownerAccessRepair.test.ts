import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ repair: vi.fn(async () => ({ storeId: 300004, userId: 7 })) }));
vi.mock("./db", () => ({ ensureActiveStoreOwnerByDomain: state.repair }));

import { configuredOwnerAccessRepair } from "./ownerAccessRepair";

describe("configured owner access repair", () => {
  const originalDomain = process.env.MAZIGHO_OWNER_ACCESS_REPAIR_STORE_DOMAIN;
  const originalEmail = process.env.MAZIGHO_OWNER_ACCESS_REPAIR_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MAZIGHO_OWNER_ACCESS_REPAIR_STORE_DOMAIN;
    delete process.env.MAZIGHO_OWNER_ACCESS_REPAIR_EMAIL;
  });

  afterEach(() => {
    if (originalDomain === undefined) delete process.env.MAZIGHO_OWNER_ACCESS_REPAIR_STORE_DOMAIN;
    else process.env.MAZIGHO_OWNER_ACCESS_REPAIR_STORE_DOMAIN = originalDomain;
    if (originalEmail === undefined) delete process.env.MAZIGHO_OWNER_ACCESS_REPAIR_EMAIL;
    else process.env.MAZIGHO_OWNER_ACCESS_REPAIR_EMAIL = originalEmail;
  });

  it("does nothing without both explicitly configured repair values", async () => {
    const next = vi.fn();
    await configuredOwnerAccessRepair({} as any, {} as any, next);
    expect(state.repair).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("uses the configured domain and email only when both are present", async () => {
    process.env.MAZIGHO_OWNER_ACCESS_REPAIR_STORE_DOMAIN = "animalerie.example.test";
    process.env.MAZIGHO_OWNER_ACCESS_REPAIR_EMAIL = "owner@example.test";
    const next = vi.fn();
    await configuredOwnerAccessRepair({} as any, {} as any, next);
    expect(state.repair).toHaveBeenCalledWith({ domain: "animalerie.example.test", email: "owner@example.test" });
    expect(next).toHaveBeenCalledOnce();
  });
});
