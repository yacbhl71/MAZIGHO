import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureVercelManagedStoreDomain, normalizeManagedStoreDomain } from "./vercelManagedStoreDomain";

const config = { token: "test-token", projectId: "prj_test", teamId: "team_test" };
const originalToken = process.env.VERCEL_DOMAIN_AUTOMATION_TOKEN;
const originalProject = process.env.VERCEL_PROJECT_ID;
const originalTeam = process.env.VERCEL_TEAM_ID;

afterEach(() => {
  if (originalToken === undefined) delete process.env.VERCEL_DOMAIN_AUTOMATION_TOKEN;
  else process.env.VERCEL_DOMAIN_AUTOMATION_TOKEN = originalToken;
  if (originalProject === undefined) delete process.env.VERCEL_PROJECT_ID;
  else process.env.VERCEL_PROJECT_ID = originalProject;
  if (originalTeam === undefined) delete process.env.VERCEL_TEAM_ID;
  else process.env.VERCEL_TEAM_ID = originalTeam;
});

describe("vercel managed store domains", () => {
  it("accepts only first-level managed MAZIGHO subdomains", () => {
    expect(normalizeManagedStoreDomain(" HTTPS://BHL-Boutique.mazigho.ch/ ")).toBe("bhl-boutique.mazigho.ch");
    expect(normalizeManagedStoreDomain("mazigho.ch")).toBeNull();
    expect(normalizeManagedStoreDomain("nested.bhl-boutique.mazigho.ch")).toBeNull();
    expect(normalizeManagedStoreDomain("bhl-boutique.example.com")).toBeNull();
  });

  it("does not contact Vercel without the dedicated domain token", async () => {
    delete process.env.VERCEL_DOMAIN_AUTOMATION_TOKEN;
    delete process.env.VERCEL_PROJECT_ID;
    delete process.env.VERCEL_TEAM_ID;
    const fetcher = vi.fn();

    await expect(ensureVercelManagedStoreDomain("bhl-boutique.mazigho.ch", { fetcher: fetcher as unknown as typeof fetch })).resolves.toMatchObject({
      status: "not_configured",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("attaches and verifies a missing subdomain", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: "bhl-boutique.mazigho.ch", verified: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: "bhl-boutique.mazigho.ch", verified: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: "bhl-boutique.mazigho.ch", verified: true }), { status: 200 }));

    await expect(ensureVercelManagedStoreDomain("bhl-boutique.mazigho.ch", { fetcher, config })).resolves.toMatchObject({ status: "ready" });
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(String(fetcher.mock.calls[1][0])).toContain("/v10/projects/prj_test/domains");
    expect(fetcher.mock.calls[1][1]).toMatchObject({ method: "POST", body: JSON.stringify({ name: "bhl-boutique.mazigho.ch" }) });
    expect(String(fetcher.mock.calls[3][0])).toContain("/verify");
  });

  it("does not post when an existing subdomain is already verified", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ name: "bhl-boutique.mazigho.ch", verified: true }), { status: 200 }));

    await expect(ensureVercelManagedStoreDomain("bhl-boutique.mazigho.ch", { fetcher, config })).resolves.toMatchObject({ status: "ready" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
