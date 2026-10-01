import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../../shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { mayServeStorefront } from "../services/storeScope";
import type { StoreMembershipRole } from "../../shared/storeMembershipRole";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

function rejectSupportMutation(ctx: TrpcContext, type: string, path: string, allowSessionExit = false) {
  if (ctx.supportImpersonation && type === "mutation" && !(allowSessionExit && path === "admin.studio.endStoreSupportImpersonation")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cette session support est en lecture seule. Terminez-la avant toute modification.",
    });
  }
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Support impersonation is intentionally observation-only. The sole allowed
  // mutation is the explicit session exit, so an operator cannot change a
  // password, team, catalogue, payment, access or storefront by accident.
  rejectSupportMutation(ctx, opts.type, opts.path, true);

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

type StaffRole = "catalog_editor" | "support_agent" | "order_operator" | "admin";
type StoreStaffRole = "catalog_editor" | "support_agent" | "order_operator";

function requireOpenStoreForPanels(ctx: TrpcContext) {
  const allowsVerifiedSetupOwnerPanel = ctx.store?.status === "setup" && ctx.setupOwnerPanel === true;
  const allowsScopedSupportRepair = Boolean(ctx.supportImpersonation && ctx.store && ctx.supportImpersonation.storeId === ctx.store.id);
  if (!ctx.store || (!ctx.store.isPlatformStore && !mayServeStorefront(ctx.store.status) && !allowsVerifiedSetupOwnerPanel && !allowsScopedSupportRepair)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation et son espace d’administration n’est pas encore ouvert." });
  }
}

async function getActiveClientStoreMembership(ctx: TrpcContext) {
  if (!ctx.store || ctx.store.isPlatformStore || !ctx.user) return null;
  const { getStoreMembershipForUser } = await import("../db");
  const membership = await getStoreMembershipForUser(ctx.store.id, ctx.user.id);
  return membership?.status === "active" ? membership : null;
}

function storeMembershipProcedureFor(...allowedRoles: StoreMembershipRole[]) {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      rejectSupportMutation(ctx, opts.type, opts.path);
      requireOpenStoreForPanels(ctx);
      if (!ctx.store || ctx.store.isPlatformStore) throw new TRPCError({ code: "FORBIDDEN", message: "Cet espace est réservé aux membres actifs de leur boutique." });
      const membership = await getActiveClientStoreMembership(ctx);
      if (!membership || !allowedRoles.includes(membership.role as StoreMembershipRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Votre rôle actif ne permet pas cette action dans cette boutique." });
      }
      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );
}

function staffProcedureFor(...allowedRoles: StaffRole[]) {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }
      rejectSupportMutation(ctx, opts.type, opts.path);
      requireOpenStoreForPanels(ctx);
      if (!ctx.store) throw new TRPCError({ code: "FORBIDDEN", message: "Aucune boutique n’est associée à cet accès." });

      if (ctx.store.isPlatformStore) {
        if (!allowedRoles.includes(ctx.user.role as StaffRole)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé à cette mission." });
        }
        return next({ ctx: { ...ctx, user: ctx.user } });
      }

      const missionRole = allowedRoles.find(role => role !== "admin") as StoreStaffRole | undefined;
      const membership = await getActiveClientStoreMembership(ctx);
      const allowedStoreRoles: StoreMembershipRole[] = missionRole ? ["owner", "manager", missionRole] : ["owner", "manager"];
      if (!membership || !allowedStoreRoles.includes(membership.role as StoreMembershipRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Votre rôle actif ne permet pas cette mission dans cette boutique." });
      }
      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );
}

export const catalogEditorProcedure = staffProcedureFor("admin", "catalog_editor");
export const supportAgentProcedure = staffProcedureFor("admin", "support_agent");
export const orderOperatorProcedure = staffProcedureFor("admin", "order_operator");

export const storeOwnerProcedure = storeMembershipProcedureFor("owner");
// Managers administer their assigned boutique only. They never inherit the
// platform role and cannot access MAZIGHO Studio or another boutique.
export const storeManagementProcedure = storeMembershipProcedureFor("owner", "manager");

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    rejectSupportMutation(ctx, opts.type, opts.path);

    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    requireOpenStoreForPanels(ctx);

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Platform-level controls may only run from the platform storefront. Future
// boutique owners remain administrators of their own data, but cannot inspect
// shared credentials, infrastructure status or upstream integrations.
export const platformProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    rejectSupportMutation(ctx, opts.type, opts.path);
    if (ctx.user.role !== "admin" || !ctx.store?.isPlatformStore) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé à MAZIGHO Studio." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
