type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  tags?: string[];
};

type DeliveryResult =
  | { delivered: true; id: string }
  | { delivered: false; reason: "EMAIL_NOT_CONFIGURED" };

type TransactionalSender = {
  email: string;
  name: string;
};

export type TransactionalEmailHealth = {
  configured: boolean;
  authenticated: boolean;
  senderReady: boolean | null;
  message: string;
};

/**
 * Deliberately minimal response for the Studio self-test. It contains no
 * provider identifier, recipient address, sender address, account data, or
 * message body.
 */
export type TransactionalEmailTestResult = {
  sent: boolean;
  sentAt: string | null;
  message: string;
};

const defaultPublicUrl = "https://www.mazigho.ch";
const defaultSenderName = "MAZIGHO";
const studioSupportUrl = "https://studio.mazigho.ch/admin/studio/assistance";
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

/**
 * Verifies the Brevo API key and the configured sender without sending an
 * email. The browser receives only a small readiness result: never an API key,
 * account profile, plan, recipient, or sender address.
 */
export async function getTransactionalEmailHealth(): Promise<TransactionalEmailHealth> {
  const { apiKey, sender } = getMailConfiguration();
  if (!apiKey || !sender) {
    return {
      configured: false,
      authenticated: false,
      senderReady: null,
      message: "Ajoutez une clé Brevo et une adresse expéditrice valide dans le déploiement.",
    };
  }

  const headers = { Accept: "application/json", "api-key": apiKey };
  let accountResponse: Response;
  let sendersResponse: Response;
  try {
    [accountResponse, sendersResponse] = await Promise.all([
      fetch("https://api.brevo.com/v3/account", { headers, signal: AbortSignal.timeout(BREVO_REQUEST_TIMEOUT_MS) }),
      fetch("https://api.brevo.com/v3/senders", { headers, signal: AbortSignal.timeout(BREVO_REQUEST_TIMEOUT_MS) }),
    ]);
  } catch (error) {
    console.error("[Email] Brevo health check did not complete", {
      reason: error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "REQUEST_FAILED",
    });
    return {
      configured: true,
      authenticated: false,
      senderReady: null,
      message: "Brevo n’a pas répondu. Vérifiez la connexion et réessayez.",
    };
  }

  if (!accountResponse.ok) {
    console.error("[Email] Brevo health authentication failed", { status: accountResponse.status });
    return {
      configured: true,
      authenticated: false,
      senderReady: null,
      message: "La clé Brevo a été refusée ou n’est plus valide.",
    };
  }

  if (!sendersResponse.ok) {
    console.error("[Email] Brevo sender health lookup failed", { status: sendersResponse.status });
    return {
      configured: true,
      authenticated: true,
      senderReady: null,
      message: "La clé Brevo est valide, mais la liste des expéditeurs est indisponible.",
    };
  }

  const payload = (await sendersResponse.json().catch(() => null)) as {
    senders?: Array<{ email?: string; active?: boolean }>;
  } | null;
  const matchingSender = payload?.senders?.find(candidate => candidate.email?.trim().toLowerCase() === sender.email.toLowerCase());
  const senderReady = Boolean(matchingSender?.active);

  return {
    configured: true,
    authenticated: true,
    senderReady,
    message: senderReady
      ? "Brevo accepte la clé et l’expéditeur transactionnel est actif. Aucun e-mail n’a été envoyé."
      : "La clé Brevo est valide, mais l’expéditeur configuré n’est pas actif dans Brevo.",
  };
}

/**
 * Sends a fixed, internal-only delivery test to the verified professional
 * sender mailbox. There is intentionally no recipient parameter: Studio
 * operators cannot use this control to send mail to customers or personal
 * addresses.
 */
export async function sendTransactionalEmailTest(): Promise<TransactionalEmailTestResult> {
  const health = await getTransactionalEmailHealth();
  if (!health.configured || !health.authenticated || !health.senderReady) {
    return {
      sent: false,
      sentAt: null,
      message: "Test non envoyé : vérifiez d’abord la clé Brevo et l’expéditeur transactionnel.",
    };
  }

  const { sender } = getMailConfiguration();
  if (!sender) {
    return {
      sent: false,
      sentAt: null,
      message: "Test non envoyé : l’expéditeur transactionnel n’est pas disponible.",
    };
  }

  try {
    const outcome = await sendTransactionalEmail({
      to: sender.email,
      subject: "Test technique MAZIGHO — e-mail transactionnel",
      idempotencyKey: "studio-transactional-email-self-test",
      tags: ["mazigho-studio-email-test"],
      text: "Test technique MAZIGHO\n\nBrevo a accepté un test interne de l’e-mail transactionnel. Ce message ne contient aucune donnée client, commande, mot de passe ou information de paiement.",
      html: "<p><strong>Test technique MAZIGHO</strong></p><p>Brevo a accepté un test interne de l’e-mail transactionnel.</p><p style=\"color:#64748b;font-size:12px\">Ce message ne contient aucune donnée client, commande, mot de passe ou information de paiement.</p>",
    });

    if (!outcome.delivered) {
      return {
        sent: false,
        sentAt: null,
        message: "Test non envoyé : l’e-mail transactionnel n’est pas configuré.",
      };
    }

    return {
      sent: true,
      sentAt: new Date().toISOString(),
      message: "Brevo a accepté le test pour la boîte professionnelle configurée. Vérifiez maintenant sa réception : l’acceptation ne confirme pas encore sa lecture.",
    };
  } catch {
    return {
      sent: false,
      sentAt: null,
      message: "Brevo n’a pas accepté le test. Réessayez après avoir vérifié la configuration.",
    };
  }
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
        // Tags keep transactional categories distinguishable in Brevo. They do
        // not create a campaign, mailing list, marketing automation or profile.
        tags: input.tags?.length ? input.tags : ["mazigho-account-security"],
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

/**
 * Alerts MAZIGHO operators about a new owner support ticket. The alert contains
 * only the ticket reference and boutique metadata: never a password, API key,
 * payment record, customer data, or the owner's free-text support message.
 */
export async function sendStudioSupportTicketAlert(input: {
  ticketId: string;
  storeName: string;
  primaryDomain: string;
  topic: string;
  subject: string;
}): Promise<DeliveryResult> {
  const { sender } = getMailConfiguration();
  const recipient = process.env.MAZIGHO_SUPPORT_ALERT_EMAIL?.trim() || sender?.email;
  if (!recipient) return { delivered: false, reason: "EMAIL_NOT_CONFIGURED" };

  const storeName = escapeHtml(input.storeName.trim().slice(0, 160));
  const primaryDomain = escapeHtml(input.primaryDomain.trim().slice(0, 253));
  const subject = escapeHtml(input.subject.trim().slice(0, 120));
  const topic = escapeHtml(input.topic.trim().slice(0, 60));
  const ticketId = escapeHtml(input.ticketId.trim().slice(0, 80));

  return sendTransactionalEmail({
    to: recipient,
    subject: `Nouveau ticket MAZIGHO — ${input.storeName.trim().slice(0, 120)}`,
    idempotencyKey: `store-support-ticket/${input.ticketId}`,
    tags: ["mazigho-support-ticket"],
    text: `Un nouveau ticket d’assistance est disponible dans MAZIGHO Studio.\n\nBoutique : ${input.storeName}\nDomaine : ${input.primaryDomain}\nSujet : ${input.subject}\nCatégorie : ${input.topic}\nRéférence : ${input.ticketId}\n\nOuvrir le Studio : ${studioSupportUrl}\n\nCe message ne contient volontairement ni le texte libre du ticket, ni donnée client, mot de passe, clé API ou information de paiement.`,
    html: `<p>Un nouveau ticket d’assistance est disponible dans <strong>MAZIGHO Studio</strong>.</p><ul><li><strong>Boutique :</strong> ${storeName}</li><li><strong>Domaine :</strong> ${primaryDomain}</li><li><strong>Sujet :</strong> ${subject}</li><li><strong>Catégorie :</strong> ${topic}</li><li><strong>Référence :</strong> ${ticketId}</li></ul><p><a href="${studioSupportUrl}" style="display:inline-block;background:#5a6834;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Ouvrir l’assistance Studio</a></p><p style="color:#64748b;font-size:12px">Cet e-mail ne contient volontairement ni le texte libre du ticket, ni donnée client, mot de passe, clé API ou information de paiement.</p>`,
  });
}

/**
 * Alerts the professional MAZIGHO mailbox after a public contact form message
 * was persisted. The notification intentionally contains only the storefront
 * name and no visitor name, email, subject, message body or other personal
 * data. The complete message remains tenant-scoped in the Messages panel.
 */
export async function sendPublicContactMessageAlert(input: {
  storeName: string;
}): Promise<DeliveryResult> {
  const { sender } = getMailConfiguration();
  if (!sender) return { delivered: false, reason: "EMAIL_NOT_CONFIGURED" };

  const storeName = escapeHtml(input.storeName.trim().slice(0, 160) || "Boutique MAZIGHO");
  return sendTransactionalEmail({
    to: sender.email,
    subject: "Nouveau message public MAZIGHO",
    idempotencyKey: `public-contact-alert/${Date.now()}`,
    tags: ["mazigho-public-contact-alert"],
    text: `Un message a été enregistré depuis le formulaire public de ${input.storeName.trim().slice(0, 160) || "la boutique MAZIGHO"}.\n\nConsultez le panneau Messages de cette boutique pour le lire et y répondre. Cet e-mail ne contient volontairement ni le nom, ni l’adresse, ni le sujet, ni le texte du visiteur.`,
    html: `<p>Un message a été enregistré depuis le formulaire public de <strong>${storeName}</strong>.</p><p>Consultez le panneau <strong>Messages</strong> de cette boutique pour le lire et y répondre.</p><p style="color:#64748b;font-size:12px">Cet e-mail ne contient volontairement ni le nom, ni l’adresse, ni le sujet, ni le texte du visiteur.</p>`,
  });
}
