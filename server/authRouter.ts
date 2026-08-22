import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import {
  claimInitialAdmin,
  createPasswordUser,
  getUserByEmail,
  markUserSignedIn,
  recoverExistingOwnerAccount,
  repairOwnerAccount,
} from "./db";
import { hashPassword, verifyPassword } from "./localAuth";

const emailSchema = z.string().trim().email("Adresse e-mail invalide").max(320);
const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit comporter au moins 10 caractères")
  .max(128, "Le mot de passe est trop long");

// The value below is a SHA-256 digest of a high-entropy, one-time bootstrap
// code. The plaintext code is never committed and the claim is persisted in
// the database, so this path can only succeed once.
const ADMIN_BOOTSTRAP_CODE_HASH =
  "7431b250cf743d757d87eca3269e140e3d70121bade81f9266bd37196f578d2f";
const OWNER_REPAIR_CODE_HASH =
  "0da4f28ae1f7a135dffd44a9b4183094d900d11726685451ce1750c7d26aecd4";
const OWNER_EMAIL_HASH =
  "9c9e5e992d6011c6daf2f4ec1a0fe82845cb41725c767766a3986787e443e723";
const OWNER_REPAIR_V3_CODE_HASH =
  "3db0a76e4d7fa6eeabd238a8b3779893a5728ce8f24bcf7971a9d270e6824d9c";

function matchesHash(value: string, expectedHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = createHash("sha256").update(value).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function matchesBootstrapCode(code: string) {
  return matchesHash(code, ADMIN_BOOTSTRAP_CODE_HASH);
}

function matchesOwnerRepair(input: { email: string; code: string }) {
  return (
    matchesHash(input.code, OWNER_REPAIR_CODE_HASH) &&
    matchesHash(input.email.trim().toLowerCase(), OWNER_EMAIL_HASH)
  );
}

function matchesOwnerRepairV3(input: { email: string; code: string }) {
  return (
    matchesHash(input.code, OWNER_REPAIR_V3_CODE_HASH) &&
    matchesHash(input.email.trim().toLowerCase(), OWNER_EMAIL_HASH)
  );
}

function safeUser<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

async function createSession(
  ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: any },
  user: { openId: string; name: string | null; email: string | null }
) {
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name || user.email || "Client MAZIGHO",
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);

  ctx.res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

export const authRouter = router({
  me: publicProcedure.query(opts => (opts.ctx.user ? safeUser(opts.ctx.user) : null)),

  repairOwnerV3: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        code: z.string().trim().length(48),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!matchesOwnerRepairV3(input)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Code ou adresse de récupération invalide.",
        });
      }

      try {
        const user = await repairOwnerAccount({
          email: input.email,
          passwordHash: await hashPassword(input.password),
          repairKey: "security.owner_repair_v3_used",
          description: "Reprise sécurisée version 3 du compte propriétaire",
        });
        if (!user) throw new Error("OWNER_ACCOUNT_NOT_FOUND");
        await createSession(ctx, user);
        return { user: safeUser(user) };
      } catch (error) {
        if (String(error).includes("OWNER_REPAIR_ALREADY_USED")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cette reprise de sécurité a déjà été utilisée.",
          });
        }
        if (String(error).includes("OWNER_ACCOUNT_NOT_FOUND")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Le compte propriétaire est introuvable.",
          });
        }
        throw error;
      }
    }),

  repairOwner: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        code: z.string().trim().length(48),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!matchesOwnerRepair(input)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Code ou adresse de récupération invalide.",
        });
      }

      try {
        const user = await repairOwnerAccount({
          email: input.email,
          passwordHash: await hashPassword(input.password),
          repairKey: "security.owner_repair_v2_used",
          description: "Reprise sécurisée version 2 du compte propriétaire",
        });
        if (!user) throw new Error("OWNER_ACCOUNT_NOT_FOUND");
        await createSession(ctx, user);
        return { user: safeUser(user) };
      } catch (error) {
        if (String(error).includes("OWNER_REPAIR_ALREADY_USED")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cette reprise de sécurité a déjà été utilisée.",
          });
        }
        if (String(error).includes("OWNER_ACCOUNT_NOT_FOUND")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Le compte propriétaire est introuvable.",
          });
        }
        throw error;
      }
    }),

  recoverOwner: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        code: z.string().trim().length(48),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!matchesBootstrapCode(input.code)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Code de récupération invalide.",
        });
      }

      try {
        const user = await recoverExistingOwnerAccount({
          email: input.email,
          passwordHash: await hashPassword(input.password),
        });
        if (!user) throw new Error("OWNER_ACCOUNT_NOT_FOUND");
        await createSession(ctx, user);
        return { user: safeUser(user) };
      } catch (error) {
        if (String(error).includes("ADMIN_BOOTSTRAP_ALREADY_CLAIMED")) {
          // A duplicate request can arrive after the first one has already
          // completed. Treat the operation as idempotent only when the same
          // account is now an admin and the freshly supplied password proves
          // possession of that recovered account.
          const existing = await getUserByEmail(input.email);
          const passwordMatches = await verifyPassword(
            input.password,
            existing?.passwordHash
          );

          if (existing?.role === "admin" && passwordMatches) {
            await createSession(ctx, existing);
            return { user: safeUser(existing) };
          }

          throw new TRPCError({
            code: "CONFLICT",
            message: "La récupération propriétaire a déjà été utilisée.",
          });
        }
        if (String(error).includes("OWNER_ACCOUNT_NOT_FOUND")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aucun ancien compte ne correspond à cette adresse e-mail.",
          });
        }
        throw error;
      }
    }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Indiquez votre nom").max(120),
        email: emailSchema,
        password: passwordSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const existingUser = await getUserByEmail(email);

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un compte existe déjà avec cette adresse e-mail.",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await createPasswordUser({
        openId: `local_${randomUUID()}`,
        email,
        name: input.name,
        passwordHash,
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de créer le compte pour le moment.",
        });
      }

      await createSession(ctx, user);
      return { user: safeUser(user) };
    }),

  login: publicProcedure
    .input(z.object({ email: emailSchema, password: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const user = await getUserByEmail(email);
      const passwordMatches = await verifyPassword(
        input.password,
        user?.passwordHash
      );

      // Burn equivalent CPU work when no account exists to reduce account
      // enumeration through response-time differences.
      if (!user) {
        await hashPassword(input.password);
      }

      if (!user || !passwordMatches) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Adresse e-mail ou mot de passe incorrect.",
        });
      }

      await markUserSignedIn(user.openId);
      await createSession(ctx, user);
      return { user: safeUser(user) };
    }),

  claimInitialAdmin: protectedProcedure
    .input(z.object({ code: z.string().trim().length(48) }))
    .mutation(async ({ ctx, input }) => {
      if (!matchesBootstrapCode(input.code)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Code d’activation invalide.",
        });
      }

      try {
        const user = await claimInitialAdmin(ctx.user.openId);
        if (!user) throw new Error("USER_NOT_FOUND");
        return { user: safeUser(user) };
      } catch (error) {
        if (String(error).includes("ADMIN_BOOTSTRAP_ALREADY_CLAIMED")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "L’activation administrateur a déjà été utilisée.",
          });
        }
        throw error;
      }
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
