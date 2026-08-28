import { TRPCError } from "@trpc/server";

type MakeTestPayload = {
  event: "mazigho.integration.test";
  requestId: string;
  source: "mazigho-vercel-preview";
  schemaVersion: "1.0";
  occurredAt: string;
  locale: "fr";
  countryCode: "CH";
  currency: "CHF";
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
    options: Record<string, string>;
  }>;
  totals: {
    subtotalCents: number;
    shippingCents: 0;
    totalCents: number;
  };
};

function getTimeoutMs() {
  const configured = Number(process.env.MAKE_WEBHOOK_TIMEOUT_MS ?? "8000");
  if (!Number.isFinite(configured)) return 8000;
  return Math.min(Math.max(Math.trunc(configured), 1000), 15000);
}

export function getMakeIntegrationStatus() {
  return {
    enabled: process.env.MAKE_INTEGRATION_ENABLED === "true",
    configured: Boolean(process.env.MAKE_WEBHOOK_URL && process.env.MAKE_WEBHOOK_API_KEY),
    timeoutMs: getTimeoutMs(),
  };
}

export async function sendMakeIntegrationTest(): Promise<{ accepted: boolean; requestId: string; stage: string }> {
  const status = getMakeIntegrationStatus();
  if (!status.enabled) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’intégration Make est désactivée. Activez-la uniquement après vérification des variables Preview." });
  }
  if (!status.configured) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La passerelle Make n’est pas configurée côté serveur." });
  }

  const requestId = `mazigho-test-${Date.now().toString(36)}`;
  const payload: MakeTestPayload = {
    event: "mazigho.integration.test",
    requestId,
    source: "mazigho-vercel-preview",
    schemaVersion: "1.0",
    occurredAt: new Date().toISOString(),
    locale: "fr",
    countryCode: "CH",
    currency: "CHF",
    items: [{ productId: "test-product-001", quantity: 1, unitPriceCents: 3190, options: {} }],
    totals: { subtotalCents: 3190, shippingCents: 0, totalCents: 3190 },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), status.timeoutMs);
  try {
    const response = await fetch(process.env.MAKE_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-make-apikey": process.env.MAKE_WEBHOOK_API_KEY!,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new TRPCError({ code: "BAD_GATEWAY", message: `Make a refusé le test (HTTP ${response.status}).` });
    }

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      // Make peut répondre avec du texte ; l’acceptation HTTP reste suffisante pour le test.
    }
    const result = data && typeof data === "object" ? data as Record<string, unknown> : {};
    return {
      accepted: result.accepted === true || response.ok,
      requestId,
      stage: typeof result.stage === "string" ? result.stage : "make-received",
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new TRPCError({ code: "TIMEOUT", message: "Make n’a pas répondu dans le délai prévu." });
    }
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Impossible de joindre Make pour le test." });
  } finally {
    clearTimeout(timer);
  }
}
