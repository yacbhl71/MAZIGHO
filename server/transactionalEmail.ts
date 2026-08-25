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

const defaultPublicUrl = "https://www.mazigho.ch";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getMailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAZIGHO_EMAIL_FROM?.trim();
  const publicUrl = (process.env.MAZIGHO_PUBLIC_URL?.trim() || defaultPublicUrl).replace(/\/$/, "");

  return { apiKey, from, publicUrl };
}

export function isTransactionalEmailConfigured(): boolean {
  const { apiKey, from } = getMailConfiguration();
  return Boolean(apiKey && from);
}

export function getAccountInvitationLink(token: string): string {
  const { publicUrl } = getMailConfiguration();
  return `${publicUrl}/activer-compte?token=${encodeURIComponent(token)}`;
}

export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<DeliveryResult> {
  const { apiKey, from } = getMailConfiguration();
  if (!apiKey || !from) {
    return { delivered: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok || !payload?.id) {
    console.error("[Email] Transactional email delivery failed", {
      status: response.status,
      message: payload?.message ?? "Unknown provider error",
    });
    throw new Error("EMAIL_DELIVERY_FAILED");
  }

  return { delivered: true, id: payload.id };
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
