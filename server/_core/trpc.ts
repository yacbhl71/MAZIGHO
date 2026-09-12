import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../../shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { mayServeStorefront } from "../services/storeScope";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

type StaffRole = "catalog_editor" | "support_agent" | "order_operator" | "admin";

function requireOpenStoreForPanels(ctx: TrpcContext) {
  if (!ctx.store || (!ctx.store.isPlatformStore && !mayServeStorefront(ctx.store.status))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation et son espace d’administration n’est pas encore ouvert." });
  }
}

function staffProcedureFor(...allowedRoles: StaffRole[]) {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }
      if (!allowedRoles.includes(ctx.user.role as StaffRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé à cette mission." });
      }
      requireOpenStoreForPanels(ctx);
      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );
}

export const catalogEditorProcedure = staffProcedureFor("admin", "catalog_editor");
export const supportAgentProcedure = staffProcedureFor("admin", "support_agent");
export const orderOperatorProcedure = staffProcedureFor("admin", "order_operator");

export const storeOwnerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    requireOpenStoreForPanels(ctx);
    if (!ctx.store || ctx.store.isPlatformStore) throw new TRPCError({ code: "FORBIDDEN", message: "Cet espace est réservé au propriétaire de sa boutique." });
    const { getStoreMembershipForUser } = await import("../db");
    const membership = await getStoreMembershipForUser(ctx.store.id, ctx.user.id);
    if (!membership || membership.status !== "active" || membership.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé au propriétaire actif de cette boutique." });
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

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
    if (ctx.user.role !== "admin" || !ctx.store?.isPlatformStore) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé à MAZIGHO Studio." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
