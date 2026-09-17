type BrevoSender = { email: string; name: string };

type BrevoList = { id: number; name: string; totalBlacklisted: number; totalSubscribers: number };

type CreateCampaignDraftInput = {
  name: string;
  subject: string;
  htmlContent: string;
  listIds: number[];
  previewText?: string;
};

type BrevoMarketingConfiguration = {
  apiKey: string | undefined;
  sender: BrevoSender | null;
};

type ConfiguredBrevoMarketingConfiguration = {
  apiKey: string;
  sender: BrevoSender;
};

const defaultSenderName = "MAZIGHO";

function parseSender(value: string | undefined, configuredName: string | undefined): BrevoSender | null {
  const raw = value?.trim();
  if (!raw) return null;
  const formatted = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/.exec(raw);
  const email = (formatted?.[2] || raw).trim();
  const name = (configuredName?.trim() || formatted?.[1]?.trim() || defaultSenderName).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, name: name || defaultSenderName };
}

function getConfiguration(): BrevoMarketingConfiguration {
  return {
    apiKey: process.env.BREVO_API_KEY?.trim(),
    sender: parseSender(
      process.env.BREVO_SENDER_EMAIL || process.env.MAZIGHO_EMAIL_FROM,
      process.env.BREVO_SENDER_NAME
    ),
  };
}

function configuredOrThrow(): ConfiguredBrevoMarketingConfiguration {
  const configuration = getConfiguration();
  if (!configuration.apiKey || !configuration.sender) throw new Error("EMAIL_NOT_CONFIGURED");
  return { apiKey: configuration.apiKey, sender: configuration.sender };
}

async function brevoRequest(path: string, init: RequestInit): Promise<Response> {
  const configuration = configuredOrThrow();
  return fetch(`https://api.brevo.com/v3${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": configuration.apiKey,
      ...(init.headers || {}),
    },
  });
}

export function getBrevoMarketingStatus() {
  const { apiKey, sender } = getConfiguration();
  return {
    configured: Boolean(apiKey && sender),
    sender: sender ? { email: sender.email, name: sender.name } : null,
    mode: "draft_only" as const,
  };
}

export async function listBrevoMarketingLists(): Promise<BrevoList[]> {
  const response = await brevoRequest("/contacts/lists?limit=50&offset=0", { method: "GET" });
  const payload = (await response.json().catch(() => null)) as { lists?: BrevoList[]; code?: string } | null;
  if (!response.ok || !payload?.lists) {
    console.error("[Brevo] Could not list marketing lists", { status: response.status, code: payload?.code ?? "UNKNOWN_PROVIDER_ERROR" });
    throw new Error("BREVO_MARKETING_LISTS_FAILED");
  }
  return payload.lists.map(list => ({
    id: Number(list.id),
    name: String(list.name),
    totalBlacklisted: Number(list.totalBlacklisted || 0),
    totalSubscribers: Number(list.totalSubscribers || 0),
  })).filter(list => Number.isInteger(list.id) && list.id > 0);
}

export async function createBrevoMarketingCampaignDraft(input: CreateCampaignDraftInput): Promise<{ id: number }> {
  const { sender } = configuredOrThrow();
  const response = await brevoRequest("/emailCampaigns", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      sender,
      subject: input.subject,
      htmlContent: input.htmlContent,
      previewText: input.previewText || undefined,
      recipients: { listIds: input.listIds },
      tag: "mazigho-marketing-draft",
    }),
  });
  const payload = (await response.json().catch(() => null)) as { id?: number; code?: string } | null;
  const campaignId = Number(payload?.id);
  if (!response.ok || !Number.isInteger(campaignId) || campaignId <= 0) {
    console.error("[Brevo] Could not create campaign draft", { status: response.status, code: payload?.code ?? "UNKNOWN_PROVIDER_ERROR" });
    throw new Error("BREVO_MARKETING_DRAFT_FAILED");
  }
  return { id: campaignId };
}
