import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrevoMarketingCampaignDraft, getBrevoMarketingStatus, listBrevoMarketingLists } from "./brevoMarketing";

describe("brevoMarketing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports a draft-only marketing foundation without exposing secrets", () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "marketing@mazigho.ch");
    vi.stubEnv("BREVO_SENDER_NAME", "MAZIGHO");

    expect(getBrevoMarketingStatus()).toEqual({
      configured: true,
      sender: { email: "marketing@mazigho.ch", name: "MAZIGHO" },
      mode: "draft_only",
    });
  });

  it("creates a campaign in Brevo draft status without sending it", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "marketing@mazigho.ch");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 42 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createBrevoMarketingCampaignDraft({
      name: "Offre d’automne",
      subject: "Une sélection pour vous",
      htmlContent: "<p>Bonjour</p>",
      listIds: [7],
      previewText: "Découvrez notre offre.",
    })).resolves.toEqual({ id: 42 });

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/emailCampaigns");
    expect(request.method).toBe("POST");
    expect(JSON.parse(String(request.body))).toMatchObject({
      name: "Offre d’automne",
      sender: { email: "marketing@mazigho.ch", name: "MAZIGHO" },
      subject: "Une sélection pour vous",
      htmlContent: "<p>Bonjour</p>",
      recipients: { listIds: [7] },
      tag: "mazigho-marketing-draft",
    });
  });

  it("lists only the Brevo lists returned for the configured account", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "marketing@mazigho.ch");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      lists: [{ id: 7, name: "Clients consentants", totalBlacklisted: 1, totalSubscribers: 24 }],
    }), { status: 200 })));

    await expect(listBrevoMarketingLists()).resolves.toEqual([
      { id: 7, name: "Clients consentants", totalBlacklisted: 1, totalSubscribers: 24 },
    ]);
  });

  it("stops a marketing request when Brevo does not respond", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "marketing@mazigho.ch");
    const timeoutError = Object.assign(new Error("request timed out"), { name: "TimeoutError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    await expect(listBrevoMarketingLists()).rejects.toThrow("BREVO_MARKETING_UNAVAILABLE");
  });
});
