import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, TrendingUp, Users, Percent, Loader2, ShoppingBag } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chf = (cents: number) => (cents / 100).toLocaleString("fr-CH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function AdminConversion() {
  const query = trpc.admin.system.conversion.useQuery(undefined, { refetchInterval: 120000 });
  const data = query.data;
  const connected = Boolean(data?.connected);
  const hasTraffic = (data?.visitors ?? 0) > 0;
  const analyticsError = data && "error" in data && typeof data.error === "string" ? data.error : null;

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-conversion">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <TrendingUp className="h-6 w-6 text-orange-500" /> Analyse du taux de conversion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Taux de conversion = (Ventes payées / Visiteurs uniques). Trafic fourni par Vercel Web Analytics, ventes issues de tes commandes réelles.
          </p>
        </div>

        {query.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : !connected ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="analytics-not-connected">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Vercel Web Analytics non connecté</p>
              <p className="mt-1 leading-6">
                {analyticsError ? `Erreur : ${analyticsError}. ` : ""}
                Vérifiez que les variables <span className="font-mono">VERCEL_ANALYTICS_TOKEN</span>, <span className="font-mono">VERCEL_PROJECT_ID</span> et <span className="font-mono">VERCEL_TEAM_ID</span> sont définies sur Vercel.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-emerald-700" data-testid="analytics-connected">
              <CheckCircle2 className="h-4 w-4" /> Connecté à Vercel Web Analytics — 30 derniers jours ({data?.since} → {data?.until})
            </div>

            {!hasTraffic && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>Connecté, mais aucun visiteur enregistré pour l'instant. Les données apparaîtront après le déploiement du script <span className="font-mono">@vercel/analytics</span> en production et l'arrivée des premiers visiteurs.</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="kpi-visitors">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> Visiteurs uniques (30 j)</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-foreground">{(data?.visitors ?? 0).toLocaleString("fr-CH")}</p></CardContent>
              </Card>
              <Card data-testid="kpi-pageviews">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Pages vues (30 j)</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-foreground">{(data?.pageviews ?? 0).toLocaleString("fr-CH")}</p></CardContent>
              </Card>
              <Card data-testid="kpi-sales">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingBag className="h-4 w-4" /> Ventes payées (30 j)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{data?.sales.orders ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{chf(data?.sales.revenue ?? 0)} CHF</p>
                </CardContent>
              </Card>
              <Card data-testid="kpi-conversion">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Percent className="h-4 w-4" /> Taux de conversion</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{data?.conversionRate != null ? `${data.conversionRate}%` : "—"}</p>
                  {data?.conversionRate == null && <p className="mt-1 text-xs text-amber-600">En attente de visiteurs</p>}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Visiteurs vs Ventes — 30 derniers jours</CardTitle>
                    <CardDescription>Données réelles (trafic Vercel + commandes payées).</CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.series || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="visiteurs" name="Visiteurs" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="ventes" name="Ventes" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
