import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSetupStoreForOwnerPanel, resolveStoreForHost, type StoreScope } from "../db";
import { parseSetupStoreId, setupStoreAccessHeader } from "../../shared/setupStoreOwnerAccess";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Storefront scope resolved from the request host. Optional during the compatibility migration. */
  store?: StoreScope | null;
  /** True only for a setup store resolved from the platform host and an explicit routing hint. */
  setupOwnerPanel?: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const hostStore = await resolveStoreForHost(opts.req.headers.host);
  const requestedSetupStoreId = hostStore?.isPlatformStore
    ? parseSetupStoreId(opts.req.headers[setupStoreAccessHeader])
    : null;
  // A setup boutique can be managed through the platform host before its
  // customer domain exists. A caller cannot use this to escape membership
  // checks: the store is setup-only and every owner procedure checks the
  // active membership against this resolved store.
  const setupStore = requestedSetupStoreId
    ? await getSetupStoreForOwnerPanel(requestedSetupStoreId)
    : null;
  const store = setupStore ?? hostStore;

  return {
    req: opts.req,
    res: opts.res,
    user,
    store,
    setupOwnerPanel: Boolean(setupStore),
  };
}
