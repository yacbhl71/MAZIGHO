import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import {
  createPasswordUser,
  getUserByEmail,
  markUserSignedIn,
  updatePasswordUser,
} from "./db";
import { hashPassword, verifyPassword } from "./localAuth";

const emailSchema = z.string().trim().email("Adresse e-mail invalide").max(320);
const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit comporter au moins 8 caractères")
  .max(128, "Le mot de passe est trop long");
const currentPasswordSchema = z
  .string()
  .min(1, "Le mot de passe est requis")
  .max(128, "Le mot de passe est trop long");

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
  me: publicProcedure.query(opts =>
    opts.ctx.user ? safeUser(opts.ctx.user) : null
  ),

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

      const user = await createPasswordUser({
        openId: `local_${randomUUID()}`,
        email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
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

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: currentPasswordSchema,
        newPassword: passwordSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordMatches = await verifyPassword(
        input.currentPassword,
        ctx.user.passwordHash
      );
      if (!passwordMatches) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Le mot de passe actuel est incorrect.",
        });
      }

      const user = await updatePasswordUser({
        openId: ctx.user.openId,
        passwordHash: await hashPassword(input.newPassword),
      });
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de modifier le mot de passe.",
        });
      }

      return { user: safeUser(user) };
    }),

  login: publicProcedure
    .input(z.object({ email: emailSchema, password: currentPasswordSchema }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const user = await getUserByEmail(email);
      const passwordMatches = await verifyPassword(
        input.password,
        user?.passwordHash
      );

      // Perform equivalent work for an unknown email to limit timing-based
      // account enumeration.
      if (!user) {
        await hashPassword(input.password);
      }

      if (!user || !passwordMatches) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Adresse e-mail ou mot de passe incorrect.",
        });
      }
      if (user.accountStatus === "blocked") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce compte est bloqué. Contactez le support MAZIGHO.",
        });
      }

      await markUserSignedIn(user.openId);
      await createSession(ctx, user);
      return { user: safeUser(user) };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
