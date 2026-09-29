import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Activity, Database, GitCommitHorizontal, Network, RefreshCw, Loader2, MailCheck, Send } from "lucide-react";

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
  const [emailHealth, setEmailHealth] = useState<{
    configured: boolean;
    authenticated: boolean;
    senderReady: boolean | null;
    message: string;
  } | null>(null);
  const [emailTest, setEmailTest] = useState<{
    sent: boolean;
    sentAt: string | null;
    message: string;
  } | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const verifyEmail = trpc.admin.system.verifyTransactionalEmail.useMutation({
    onSuccess: result => setEmailHealth(result),
  });
  const sendEmailTest = trpc.admin.system.sendTransactionalEmailTest.useMutation({
    onSuccess: result => {
      setEmailTest(result);
      setTestDialogOpen(false);
    },
    onError: () => {
      setEmailTest({
        sent: false,
        sentAt: null,
        message: "Le test n’a pas pu être lancé. Vérifiez vos droits Studio et réessayez.",
      });
      setTestDialogOpen(false);
    },
  });
  const data = healthQuery.data;

  const dbOk = Boolean(data?.database.ok);
  const odooOk = Boolean(data?.odoo.configured);
  const emailConfigured = Boolean(data?.email.configured);
  const emailReady = emailTest?.sent || emailHealth?.senderReady === true;
  const emailStatus = emailTest?.sent ? "Test accepté" : emailReady ? "Prêt" : emailHealth?.authenticated === false && emailHealth?.configured ? "Clé à corriger" : emailConfigured ? "À vérifier" : "À configurer";

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-system-health">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Activity className="h-6 w-6 text-orange-500" /> Santé du système
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              État en temps réel de la base de données, du service e-mail, de la synchronisation Odoo et de la version déployée du site.
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

            {/* Brevo transactionnel */}
            <Card data-testid="health-card-email">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><MailCheck className="h-4 w-4 text-slate-500" /> E-mails transactionnels</CardTitle>
                  <StatusDot ok={emailReady} />
                </div>
                <CardDescription>Brevo — sécurité et notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">État</span>
                  <span className={`font-semibold ${emailReady ? "text-emerald-600" : "text-amber-700"}`} data-testid="health-email-status">
                    {emailStatus}
                  </span>
                </div>
                <p className="min-h-10 text-xs leading-5 text-muted-foreground">
                  {emailHealth?.message || (emailConfigured
                    ? "Vérifiez la clé et l’expéditeur Brevo avant de compter sur les invitations et réinitialisations."
                    : "Une clé Brevo et un expéditeur vérifié sont nécessaires.")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 w-full"
                  onClick={() => verifyEmail.mutate()}
                  disabled={verifyEmail.isPending}
                  data-testid="health-verify-email-btn"
                >
                  {verifyEmail.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailCheck className="mr-2 h-4 w-4" />}
                  Vérifier Brevo
                </Button>
                <p className="text-[11px] leading-4 text-muted-foreground">Ce contrôle ne crée ni n’envoie aucun e-mail.</p>

                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-start gap-2">
                    <Send className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">Preuve de réception interne</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        Envoie un message fixe uniquement vers la boîte professionnelle configurée. Aucun client ni destinataire libre ne peut être choisi.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 min-h-11 w-full"
                    onClick={() => setTestDialogOpen(true)}
                    disabled={!emailConfigured || sendEmailTest.isPending}
                    data-testid="health-send-email-test-btn"
                  >
                    {sendEmailTest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Envoyer un test à la boîte professionnelle
                  </Button>
                  {emailTest && (
                    <div
                      className={`mt-3 rounded-md px-3 py-2 text-xs leading-5 ${emailTest.sent ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100" : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"}`}
                      role="status"
                      data-testid="health-email-test-result"
                    >
                      <p className="font-medium">{emailTest.message}</p>
                      {emailTest.sentAt && <p className="mt-1 opacity-80">Résultat : {formatDateTime(emailTest.sentAt)}</p>}
                    </div>
                  )}
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
      <AlertDialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer le test professionnel ?</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              Un seul e-mail technique, sans donnée client, sera envoyé à la boîte professionnelle définie dans la configuration MAZIGHO. Aucun autre destinataire ne sera utilisé. Brevo accepté ne prouve pas encore la lecture ou la réception dans la boîte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendEmailTest.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendEmailTest.mutate()}
              disabled={sendEmailTest.isPending}
              data-testid="health-confirm-send-email-test-btn"
            >
              {sendEmailTest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Envoyer le test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
