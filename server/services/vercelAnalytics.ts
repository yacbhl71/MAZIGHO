const BASE = "https://api.vercel.com/v1/query/web-analytics";

function cfg() {
  const token = process.env.VERCEL_ANALYTICS_TOKEN || "";
  const projectId = process.env.VERCEL_PROJECT_ID || "";
  const teamId = process.env.VERCEL_TEAM_ID || "";
  return { token, projectId, teamId, configured: Boolean(token && projectId) };
}

export function isVercelAnalyticsConfigured(): boolean {
  return cfg().configured;
}

async function vfetch(path: string, params: Record<string, string>) {
  const { token, projectId, teamId } = cfg();
  const usp = new URLSearchParams({ projectId, ...(teamId ? { teamId } : {}), ...params });
  const res = await fetch(`${BASE}/${path}?${usp.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Vercel Analytics ${res.status}`);
  return res.json();
}

export async function getVisitsCount(since: string, until: string): Promise<{ visitors: number; pageviews: number }> {
  const json: any = await vfetch("visits/count", { since, until });
  return { visitors: json?.data?.visitors ?? 0, pageviews: json?.data?.pageviews ?? 0 };
}

export async function getVisitsDaily(since: string, until: string): Promise<Array<{ timestamp: string; visitors: number; pageviews: number }>> {
  const json: any = await vfetch("visits/aggregate", { since, until, by: "day" });
  return (json?.data || []).map((r: any) => ({
    timestamp: r.timestamp,
    visitors: r.visitors ?? 0,
    pageviews: r.pageviews ?? 0,
  }));
}
