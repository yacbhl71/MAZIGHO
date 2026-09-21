type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

type DeliveryResult =
  | { delivered: true; id: string }
  | { delivered: false; reason: "EMAIL_NOT_CONFIGURED" };

type TransactionalSender = {
  email: string;
  name: string;
};

const defaultPublicUrl = "https://www.mazigho.ch";
const defaultSenderName = "MAZIGHO";
export const BREVO_REQUEST_TIMEOUT_MS = 10_000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseSender(value: string | undefined, configuredName: string | undefined): TransactionalSender | null {
  const raw = value?.trim();
  if (!raw) return null;

  const formattedSender = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/.exec(raw);
  const email = (formattedSender?.[2] || raw).trim();
  const name = (configuredName?.trim() || formattedSender?.[1]?.trim() || defaultSenderName).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, name: name || defaultSenderName };
}

export { escapeHtml };

function getMailConfiguration() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  // MAZIGHO_EMAIL_FROM remains accepted to make the provider switch safe for an
  // existing deployment. Prefer the explicit Brevo variables for new installs.
  const sender = parseSender(
    process.env.BREVO_SENDER_EMAIL || process.env.MAZIGHO_EMAIL_FROM,
    process.env.BREVO_SENDER_NAME
  );
  const publicUrl = (process.env.MAZIGHO_PUBLIC_URL?.trim() || defaultPublicUrl).replace(/\/$/, "");

  return { apiKey, sender, publicUrl };
}

export function getPublicUrl(): string {
  return getMailConfiguration().publicUrl;
}

export function isTransactionalEmailConfigured(): boolean {
  const { apiKey, sender } = getMailConfiguration();
  return Boolean(apiKey && sender);
}

export function getAccountInvitationLink(token: string): string {
  const { publicUrl } = getMailConfiguration();
  return `${publicUrl}/activer-compte?token=${encodeURIComponent(token)}`;
}

export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<DeliveryResult> {
  const { apiKey, sender } = getMailConfiguration();
  if (!apiKey || !sender) {
    return { delivered: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  let response: Response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      signal: AbortSignal.timeout(BREVO_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        sender,
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        // This tag keeps account-security emails easy to identify in Brevo without
        // turning them into a marketing campaign or storing application secrets.
        tags: ["mazigho-account-security"],
      }),
    });
  } catch (error) {
    console.error("[Email] Brevo transactional request did not complete", {
      reason: error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "REQUEST_FAILED",
    });
    throw new Error("EMAIL_DELIVERY_FAILED");
  }

  const payload = (await response.json().catch(() => null)) as { messageId?: string; code?: string; message?: string } | null;
  if (!response.ok || !payload?.messageId) {
    console.error("[Email] Brevo transactional delivery failed", {
      status: response.status,
      code: payload?.code ?? "UNKNOWN_PROVIDER_ERROR",
    });
    throw new Error("EMAIL_DELIVERY_FAILED");
  }

  return { delivered: true, id: payload.messageId };
}

export async function sendAccountInvitationEmail(input: {
  email: string;
  name: string;
  token: string;
  tokenId: number;
}): Promise<DeliveryResult> {
  const link = getAccountInvitationLink(input.token);
  const displayName = escapeHtml(input.name || "Bonjour");

  return sendTransactionalEmail({
    to: input.email,
    subject: "Activez votre compte MAZIGHO",
    idempotencyKey: `account-invitation/${input.tokenId}`,
    text: `Bonjour ${input.name || ""},\n\nVotre compte MAZIGHO est prêt. Choisissez votre mot de passe ici : ${link}\n\nCe lien est personnel et expire prochainement. Si vous n’attendiez pas cette invitation, ignorez cet e-mail.`,
    html: `<p>Bonjour ${displayName},</p><p>Votre compte <strong>MAZIGHO</strong> est prêt. Cliquez sur le bouton ci-dessous pour choisir votre mot de passe.</p><p><a href="${link}" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600">Activer mon compte</a></p><p>Ou copiez cette adresse dans votre navigateur :</p><p><a href="${link}">${link}</a></p><p>Ce lien est personnel et expire prochainement. Si vous n’attendiez pas cette invitation, ignorez cet e-mail.</p>`,
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string | null;
  token: string;
  tokenId: number;
}): Promise<DeliveryResult> {
  const { publicUrl } = getMailConfiguration();
  const link = `${publicUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(input.token)}`;
  const displayName = escapeHtml(input.name || "Bonjour");

  return sendTransactionalEmail({
    to: input.email,
    subject: "Réinitialisez votre mot de passe MAZIGHO",
    idempotencyKey: `password-reset/${input.tokenId}`,
    text: `Bonjour ${input.name || ""},\n\nUne demande de réinitialisation de mot de passe a été reçue. Choisissez un nouveau mot de passe ici : ${link}\n\nCe lien est personnel et expire prochainement. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.`,
    html: `<p>Bonjour ${displayName},</p><p>Une demande de réinitialisation de votre mot de passe <strong>MAZIGHO</strong> a été reçue.</p><p><a href="${link}" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600">Choisir un nouveau mot de passe</a></p><p>Ou copiez cette adresse dans votre navigateur :</p><p><a href="${link}">${link}</a></p><p>Ce lien est personnel et expire prochainement. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>`,
  });
}
