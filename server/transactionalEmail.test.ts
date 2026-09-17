import { afterEach, describe, expect, it, vi } from "vitest";
import { isTransactionalEmailConfigured, sendTransactionalEmail } from "./transactionalEmail";

describe("transactionalEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("stays unavailable until both a Brevo API key and verified sender are configured", () => {
    vi.stubEnv("BREVO_API_KEY", "");
    vi.stubEnv("BREVO_SENDER_EMAIL", "");
    vi.stubEnv("MAZIGHO_EMAIL_FROM", "");

    expect(isTransactionalEmailConfigured()).toBe(false);
  });

  it("sends account-security messages through Brevo with a separate sender identity", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "securite@mazigho.ch");
    vi.stubEnv("BREVO_SENDER_NAME", "MAZIGHO Sécurité");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "<brevo-message-id>" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendTransactionalEmail({
      to: "client@example.com",
      subject: "Sécurité du compte",
      html: "<p>Bonjour</p>",
      text: "Bonjour",
      idempotencyKey: "test/1",
    })).resolves.toEqual({ delivered: true, id: "<brevo-message-id>" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(request.headers).toMatchObject({ "api-key": "test-brevo-key", Accept: "application/json", "Content-Type": "application/json" });
    expect(JSON.parse(String(request.body))).toMatchObject({
      sender: { email: "securite@mazigho.ch", name: "MAZIGHO Sécurité" },
      to: [{ email: "client@example.com" }],
      subject: "Sécurité du compte",
      htmlContent: "<p>Bonjour</p>",
      textContent: "Bonjour",
      tags: ["mazigho-account-security"],
    });
  });

  it("does not claim delivery when Brevo rejects a message", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "securite@mazigho.ch");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "invalid_parameter", message: "Sender is not verified" }), { status: 400 })));

    await expect(sendTransactionalEmail({
      to: "client@example.com",
      subject: "Sécurité du compte",
      html: "<p>Bonjour</p>",
      text: "Bonjour",
      idempotencyKey: "test/2",
    })).rejects.toThrow("EMAIL_DELIVERY_FAILED");
  });
});
