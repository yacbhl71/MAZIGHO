import { CheckCircle2, CircleDollarSign, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatSaasMediaQuota, getSaasPlanEntitlements } from "../../../../shared/saasEntitlements";

const billingLabels = {
  free_included: { title: "FREE inclus", detail: "Aucun abonnement MAZIGHO n’est dû. La commission de vente reste gérée séparément par Stripe Connect.", tone: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  awaiting_checkout: { title: "Paiement SaaS à préparer", detail: "Le checkout Lemon Squeezy Test peut être ouvert par le propriétaire. Aucun débit réel n’est activé dans cette étape.", tone: "border-amber-200 bg-amber-50 text-amber-950" },
  active: { title: "Droit SaaS Test actif", detail: "La confirmation provient d’un webhook Lemon Squeezy signé. Elle ne change pas le statut public de la boutique.", tone: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  past_due: { title: "Paiement à régulariser", detail: "La situation est visible sans fermer ni limiter automatiquement la boutique. MAZIGHO Studio décide séparément de toute suite.", tone: "border-amber-200 bg-amber-50 text-amber-950" },
  inactive: { title: "Droit SaaS inactif", detail: "La boutique reste inchangée ; seul le suivi de facturation indique que l’abonnement n’est plus actif.", tone: "border-slate-200 bg-slate-50 text-slate-800" },
  not_assigned: { title: "Aucun plan officiel attribué", detail: "Votre boutique et ses modules actuels restent accessibles. Par sécurité, les limites FREE s’appliquent par défaut ; seul MAZIGHO Studio peut attribuer officiellement FREE, BASIC, PRO ou LIFETIME. Choisir « Vente définitive » ne suffit pas.", tone: "border-slate-200 bg-slate-50 text-slate-800" },
} as const;

function configurationMessage(reason: string | undefined) {
  switch (reason) {
    case "test_mode_disabled": return "Le mode Lemon Squeezy Test est volontairement fermé par MAZIGHO Studio.";
    case "api_key_missing": return "La clé Lemon Squeezy Test n’est pas encore configurée côté plateforme.";
    case "store_id_missing": return "L’identifiant de boutique Lemon Squeezy Test est à compléter côté plateforme.";
    case "variant_missing": return "Les variantes Test BASIC, PRO et LIFETIME ne sont pas encore renseignées côté plateforme.";
    case "webhook_secret_missing": return "Le secret du webhook Lemon Squeezy Test est à compléter avant d’ouvrir un checkout.";
    default: return "La configuration Lemon Squeezy Test est prête.";
  }
}

export default function OwnerSaasBilling({ canManage }: { canManage: boolean }) {
  const status = trpc.owner.getLemonSqueezyBillingStatus.useQuery(undefined, { refetchOnWindowFocus: false });
  const checkout = trpc.owner.createLemonSqueezyBillingCheckout.useMutation({
    onSuccess: data => window.location.assign(data.checkoutUrl),
    onError: error => toast.error(error.message || "Le checkout SaaS n’a pas pu être préparé."),
  });
  const data = status.data;
  const presentation = data ? billingLabels[data.billingAccess] : null;
  const entitlements = getSaasPlanEntitlements(data?.plan?.id);
  const canOpenCheckout = canManage && data?.schemaReady && data.configuration.enabled && data.plan?.billable && data.billingAccess === "awaiting_checkout";

  return <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50">
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-violet-950"><CircleDollarSign className="h-5 w-5 text-violet-700" /> Abonnement MAZIGHO</CardTitle><CardDescription className="mt-2 max-w-3xl">Facturation de la plateforme uniquement : <strong>Lemon Squeezy Test</strong> ne touche ni vos clients, ni vos ventes, ni votre compte Stripe Connect.</CardDescription></div><Badge variant="outline" className={data?.configuration.enabled ? "w-fit border-violet-200 bg-white text-violet-800" : "w-fit border-amber-200 bg-amber-50 text-amber-800"}>{data?.configuration.enabled ? "Test disponible" : "Configuration requise"}</Badge></div>
    </CardHeader>
    <CardContent className="space-y-4">
      {status.isLoading ? <div className="h-28 animate-pulse rounded-xl bg-white/80" /> : !data || !presentation ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Le statut de facturation n’est pas disponible pour le moment.</div> : <>
        <div className={`rounded-xl border p-4 text-sm leading-6 ${presentation.tone}`}><p className="font-semibold">{presentation.title}</p><p className="mt-1">{presentation.detail}</p></div>
        {data.plan && <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Offre attribuée</p><p className="mt-1 text-lg font-bold text-slate-950">{data.plan.name}</p><p className="mt-1 text-xs leading-5 text-slate-600">{data.plan.billable ? "Cette offre utilise Lemon Squeezy pour l’abonnement MAZIGHO." : "Cette offre ne demande pas d’abonnement MAZIGHO."}</p></div>{data.subscription ? <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Abonnement Test</p><p className="mt-1 font-semibold text-slate-950">{data.subscription.status}</p><p className="mt-1 text-xs leading-5 text-slate-600">{data.subscription.endsAt ? `Fin indiquée : ${new Date(data.subscription.endsAt).toLocaleDateString("fr-CH")}.` : "Aucune date de fin communiquée."}</p></div> : <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Checkout Test</p><p className="mt-1 font-semibold text-slate-950">{data.checkout?.status === "paid" ? "Confirmé" : data.checkout ? "Préparé" : "Non ouvert"}</p><p className="mt-1 text-xs leading-5 text-slate-600">La confirmation finale vient exclusivement d’un webhook signé.</p></div>}</div>}
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Capacités de l’offre {data.plan?.name ?? "FREE"}</p><div className="mt-3 grid gap-3 sm:grid-cols-4"><div><p className="text-sm font-bold text-slate-950">{entitlements.maxActiveProducts === null ? "Illimités" : entitlements.maxActiveProducts}</p><p className="text-xs text-slate-600">produits actifs</p></div><div><p className="text-sm font-bold text-slate-950">{entitlements.maxTeamMembers === null ? "Illimités" : entitlements.maxTeamMembers}</p><p className="text-xs text-slate-600">accès délégués</p></div><div><p className="text-sm font-bold text-slate-950">{formatSaasMediaQuota(entitlements.mediaQuotaBytes)}</p><p className="text-xs text-slate-600">médias partagés</p></div><div><p className="text-sm font-bold text-slate-950">{entitlements.dropshippingEnabled ? "Inclus" : "PRO"}</p><p className="text-xs text-slate-600">dropshipping</p></div></div><p className="mt-3 text-xs leading-5 text-slate-500">Les produits déjà créés restent intacts ; seuls les nouveaux ajouts ou activations au-delà de la capacité sont bloqués côté serveur.</p>{!data.plan && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Capacités FREE appliquées par défaut, sans attribution commerciale. Les paiements en ligne nécessitent un plan officiel et la préparation des moyens de paiement ; l’état public de la boutique ne change pas ici.</p>}</div>
        {!data.configuration.enabled && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>{configurationMessage(data.configuration.reason)}</p></div>}
        {!data.schemaReady && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">La migration de facturation SaaS doit être appliquée avant de créer un checkout.</div>}
        {canManage ? <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11" disabled={status.isFetching} onClick={() => void status.refetch()}>{status.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Actualiser</Button><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={!canOpenCheckout || checkout.isPending} onClick={() => checkout.mutate({ acknowledged: true })}>{checkout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}Ouvrir le checkout Test</Button></div> : <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Seul le propriétaire peut ouvrir le checkout SaaS de sa boutique. Cette action n’est pas disponible aux rôles délégués.</p></div>}
        <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />Aucun passage en Live, aucun débit réel et aucune limitation automatique de la boutique ne sont déclenchés ici.</p>
      </>}
    </CardContent>
  </Card>;
}
