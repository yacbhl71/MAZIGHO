import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import {
  createPasswordUser,
  getUserByEmail,
  markUserSignedIn,
} from "./db";
import { hashPassword, verifyPassword } from "./localAuth";

const emailSchema = z.string().trim().email("Adresse e-mail invalide").max(320);
const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit comporter au moins 10 caractères")
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
  me: publicProcedure.query(opts => (opts.ctx.user ? safeUser(opts.ctx.user) : null)),

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

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
