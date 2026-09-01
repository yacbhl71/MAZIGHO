import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, TrendingUp, Users, Percent, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chf = (cents: number) => (cents / 100).toLocaleString("fr-CH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function AdminConversion() {
  const statsQuery = trpc.admin.getStats.useQuery();
  const stats = statsQuery.data;

  const chartData = (stats?.revenueTrend || []).map((d: any) => ({
    date: d.date.slice(5),
    ventes: Math.round(Number(d.revenue) / 100),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-conversion">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <TrendingUp className="h-6 w-6 text-orange-500" /> Analyse du taux de conversion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rapport (Ventes / Visiteurs uniques). Les ventes sont réelles ; le trafic visiteurs nécessite Vercel Web Analytics.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="analytics-not-connected">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Vercel Web Analytics non connecté</p>
            <p className="mt-1 leading-6">
              Pour afficher les visiteurs uniques et le taux de conversion réel, ajoutez un <span className="font-semibold">token Vercel Analytics</span> et l'ID du projet, puis nous brancherons les données. En attendant, les visiteurs et la conversion ci-dessous sont des valeurs de <span className="font-semibold">démonstration</span>.
            </p>
          </div>
        </div>

        {statsQuery.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card data-testid="kpi-sales">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Ventes encaissées (30 j)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{chf(stats?.revenueLast30Days || 0)} CHF</p>
                  <p className="mt-1 text-xs text-emerald-600">Données réelles</p>
                </CardContent>
              </Card>
              <Card data-testid="kpi-visitors">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> Visiteurs uniques (30 j)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-400">—</p>
                  <p className="mt-1 text-xs text-amber-600">En attente du token Vercel</p>
                </CardContent>
              </Card>
              <Card data-testid="kpi-conversion">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Percent className="h-4 w-4" /> Taux de conversion</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-400">—</p>
                  <p className="mt-1 text-xs text-amber-600">Nécessite les visiteurs</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ventes des 30 derniers jours (CHF)</CardTitle>
                <CardDescription>Chiffre d'affaires quotidien encaissé — données réelles.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v} CHF`, "Ventes"]} />
                      <Bar dataKey="ventes" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
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
