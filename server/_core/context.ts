import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSetupStoreForOwnerPanel, getStudioSupportImpersonationTarget, getUserByOpenId, resolveStoreForHost, type StoreScope } from "../db";
import { parseSetupStoreId, setupStoreAccessHeader } from "../../shared/setupStoreOwnerAccess";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Storefront scope resolved from the request host. Optional during the compatibility migration. */
  store?: StoreScope | null;
  /** True only for a setup store resolved from the platform host and an explicit routing hint. */
  setupOwnerPanel?: boolean;
  /** Present only during a short, Studio-issued, audited support session. */
  supportImpersonation?: {
    operatorUserId: number;
    operatorName: string;
    storeId: number;
    expiresAt: string;
  } | null;
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

  const supportSession = await sdk.getSupportImpersonationSession(opts.req);
  let supportImpersonation: TrpcContext["supportImpersonation"] = null;
  let supportStore: StoreScope | null = null;
  if (supportSession) {
    const [operator, target, supportTarget] = await Promise.all([
      getUserByOpenId(supportSession.supportImpersonation.operatorOpenId),
      getUserByOpenId(supportSession.openId),
      getStudioSupportImpersonationTarget(supportSession.supportImpersonation.storeId).catch(() => null),
    ]);
    if (operator?.role === "admin" && operator.accountStatus === "active" && target?.accountStatus === "active" && supportTarget?.target.openId === supportSession.openId) {
      user = target;
      supportStore = { ...supportTarget.store, isPlatformStore: 0 };
      supportImpersonation = {
        operatorUserId: operator.id,
        operatorName: operator.name || operator.email || "Opérateur MAZIGHO",
        storeId: supportTarget.store.id,
        expiresAt: supportSession.supportImpersonation.expiresAt,
      };
    }
  }

  const hostStore = await resolveStoreForHost(opts.req.headers.host);
  const requestedSetupStoreId = !supportStore && hostStore?.isPlatformStore
    ? parseSetupStoreId(opts.req.headers[setupStoreAccessHeader])
    : null;
  // A setup boutique can be managed through the platform host before its
  // customer domain exists. A caller cannot use this to escape membership
  // checks: the store is setup-only and every owner procedure checks the
  // active membership against this resolved store.
  const setupStore = requestedSetupStoreId
    ? await getSetupStoreForOwnerPanel(requestedSetupStoreId)
    : null;
  const store = supportStore ?? setupStore ?? hostStore;

  return {
    req: opts.req,
    res: opts.res,
    user,
    store,
    setupOwnerPanel: Boolean(setupStore) || Boolean(supportStore?.status === "setup"),
    supportImpersonation,
  };
}
