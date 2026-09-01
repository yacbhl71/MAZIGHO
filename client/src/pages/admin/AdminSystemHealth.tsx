import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, Database, GitCommitHorizontal, Network, RefreshCw, Loader2 } from "lucide-react";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex h-3 w-3" title={ok ? "OK" : "Problème"}>
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${ok ? "bg-emerald-400 animate-ping" : "bg-red-400"}`} />
      <span className={`relative inline-flex h-3 w-3 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
    </span>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminSystemHealth() {
  const healthQuery = trpc.admin.system.health.useQuery(undefined, { refetchInterval: 30000 });
  const data = healthQuery.data;

  const dbOk = Boolean(data?.database.ok);
  const odooOk = Boolean(data?.odoo.configured);

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-system-health">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Activity className="h-6 w-6 text-orange-500" /> Santé du système
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              État en temps réel de la base de données, de la synchronisation Odoo et de la version déployée du site.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Vérifié : {formatDateTime(data?.checkedAt)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => healthQuery.refetch()}
              disabled={healthQuery.isFetching}
              data-testid="health-refresh-btn"
            >
              {healthQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Rafraîchir
            </Button>
          </div>
        </div>

        {healthQuery.isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {/* Base de données TiDB */}
            <Card data-testid="health-card-db">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4 text-slate-500" /> Base de données</CardTitle>
                  <StatusDot ok={dbOk} />
                </div>
                <CardDescription>TiDB Cloud (MySQL serverless)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className={`font-semibold ${dbOk ? "text-emerald-600" : "text-red-600"}`} data-testid="health-db-status">
                    {dbOk ? "Connecté" : "Déconnecté"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Temps de réponse</span>
                  <span className="font-semibold text-foreground">{data?.database.responseMs != null ? `${data.database.responseMs} ms` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hôte</span>
                  <span className="max-w-[60%] truncate text-right text-xs text-foreground" title={data?.database.host || ""}>{data?.database.host || "—"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Synchronisation Odoo */}
            <Card data-testid="health-card-odoo">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><Network className="h-4 w-4 text-slate-500" /> Synchro Odoo</CardTitle>
                  <StatusDot ok={odooOk} />
                </div>
                <CardDescription>ERP — commandes payées</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className={`font-semibold ${odooOk ? "text-emerald-600" : "text-red-600"}`} data-testid="health-odoo-status">
                    {odooOk ? "Configuré" : "Non configuré"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dernière synchro</span>
                  <span className="font-semibold text-foreground">{formatDateTime(data?.odoo.lastSyncAt)}</span>
                </div>
                <p className="pt-1 text-xs leading-5 text-muted-foreground">{data?.odoo.message}</p>
              </CardContent>
            </Card>

            {/* Version du site */}
            <Card data-testid="health-card-site">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><GitCommitHorizontal className="h-4 w-4 text-slate-500" /> Version du site</CardTitle>
                  <StatusDot ok={true} />
                </div>
                <CardDescription>Dernier déploiement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Environnement</span>
                  <span className="font-semibold uppercase text-foreground">{data?.site.environment || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Commit</span>
                  <span className="font-mono text-xs text-foreground" data-testid="health-site-commit">{data?.site.commitShort || "local / dev"}</span>
                </div>
                {data?.site.branch && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Branche</span>
                    <span className="font-semibold text-foreground">{data.site.branch}</span>
                  </div>
                )}
                {data?.site.commitMessage && (
                  <p className="line-clamp-2 pt-1 text-xs leading-5 text-muted-foreground" title={data.site.commitMessage}>{data.site.commitMessage}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Les informations de version proviennent des variables Vercel (<span className="font-mono">VERCEL_GIT_COMMIT_SHA</span>). En prévisualisation locale, « local / dev » s'affiche.
        </p>
      </div>
    </DashboardLayout>
  );
}
