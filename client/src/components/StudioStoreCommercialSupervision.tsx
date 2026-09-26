import { AlertTriangle, CalendarClock, CheckCircle2, CircleDollarSign, ClipboardCheck, Globe2, HardDrive, Loader2, PlugZap, ReceiptText, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storeCommercialOfferModeDescriptions, storeCommercialOfferModeLabels, type StoreCommercialOfferMode } from "@shared/storeCommercialOffer";

type ReadinessItem = { id: string; label: string; ready: boolean; detail: string };
type Supervision = {
  store: { id: number; displayName: string; primaryDomain: string; status: string };
  commercialOfferMode: StoreCommercialOfferMode;
  billing: { plan: { kind: "rental" | "perpetual_sale"; label: string; amountCents: number; currency: string; interval: "monthly" | "yearly" | "one_time" } | null; invoiceDrafts: number };
  planAssignment: { planId: string; planName: string; features: string[]; status: "draft"; assignedAt: string } | null;
  integrationRequests: Array<{ id: "stripe" | "paypal" | "google_analytics" | "transactional_email"; requestedAt: string }>;
  domainRequest: { domain: string; requestedAt: string } | null;
  mediaUsage: { usedBytes: number; quotaBytes: number; remainingBytes: number; managedBy: "vercel_blob" | "legacy_storage" } | null;
  mediaUsageUnavailable: boolean;
  paymentStatus: "not_activated";
  readiness: {
    summary: { completed: number; total: number; baseCommerciallyPrepared: boolean; paymentStatus: "not_activated" };
    inventory: { activeProducts: number; sellableProducts: number; productsWithoutImages: number; productsWithoutStock: number; activeVariants: number; outOfStockVariants: number };
    items: readonly ReadinessItem[];
  };
};

const statusLabels: Record<string, string> = {
  setup: "En préparation",
  active: "Active",
  limited: "Accès limité",
  suspended: "Suspendue",
  closed: "Clôturée",
};

const integrationLabels: Record<Supervision["integrationRequests"][number]["id"], string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  google_analytics: "Google Analytics",
  transactional_email: "E-mails transactionnels",
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  const display = value / 1024 ** index;
  return `${display >= 10 || index === 0 ? Math.round(display) : display.toFixed(1)} ${units[index]}`;
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

export default function StudioStoreCommercialSupervision({ supervision, loading, error, onRefresh }: { supervision?: Supervision; loading: boolean; error: boolean; onRefresh: () => void }) {
  if (loading && !supervision) return <Card className="border-sky-200"><CardContent className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-sky-700" /></CardContent></Card>;
  if (error || !supervision) return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-rose-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Supervision temporairement indisponible.</p><p className="mt-1">Aucun réglage de boutique n’a été modifié. Actualisez cette lecture avant de poursuivre une vérification.</p></div></CardContent></Card>;

  const { readiness, mediaUsage } = supervision;
  const attentionItems = readiness.items.filter(item => !item.ready);
  const mediaPercent = mediaUsage ? Math.min(100, Math.round((mediaUsage.usedBytes / mediaUsage.quotaBytes) * 100)) : 0;
  const readyClass = readiness.summary.baseCommerciallyPrepared ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900";

  return <Card className="border-sky-200 shadow-sm">
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-sky-700" /> Supervision commerciale SaaS</CardTitle><CardDescription className="mt-1 max-w-3xl">Lecture d’opérateur consolidée pour cette boutique : préparation à la vente, offre SaaS, brouillons internes et stockage média. Elle ne publie pas la boutique, ne modifie aucun état et n’active aucun encaissement.</CardDescription></div>
        <div className="flex items-center gap-2"><Badge variant="outline" className={readyClass}>{readiness.summary.completed}/{readiness.summary.total} points renseignés</Badge><Button type="button" size="icon" variant="outline" className="min-h-10 min-w-10" onClick={onRefresh} aria-label="Actualiser la supervision" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="État de la boutique" value={statusLabels[supervision.store.status] || supervision.store.status} detail={supervision.store.primaryDomain} text /><Metric label="Produits vendables" value={readiness.inventory.sellableProducts} detail={`${readiness.inventory.activeProducts} produit(s) actif(s)`} /><Metric label="Visuels à compléter" value={readiness.inventory.productsWithoutImages} detail={readiness.inventory.productsWithoutImages ? "Produits actifs sans image" : "Tous les produits actifs sont illustrés"} warn={readiness.inventory.productsWithoutImages > 0} /><Metric label="Variantes en rupture" value={readiness.inventory.outOfStockVariants} detail={`${readiness.inventory.activeVariants} variante(s) active(s)`} warn={readiness.inventory.outOfStockVariants > 0} /></div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5"><section className="rounded-xl border border-sky-100 bg-sky-50/60 p-4"><p className="text-xs font-bold uppercase tracking-wide text-sky-800">Offre préparatoire</p><p className="mt-2 font-semibold text-slate-950">{storeCommercialOfferModeLabels[supervision.commercialOfferMode]}</p><p className="mt-2 text-xs leading-5 text-slate-600">{storeCommercialOfferModeDescriptions[supervision.commercialOfferMode]}</p></section><section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Médias isolés</p><p className="mt-2 font-semibold text-slate-950">{mediaUsage ? `${formatBytes(mediaUsage.usedBytes)} sur ${formatBytes(mediaUsage.quotaBytes)}` : "Lecture indisponible"}</p></div><HardDrive className="h-5 w-5 text-slate-500" /></div>{mediaUsage ? <><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className={mediaPercent >= 90 ? "h-full bg-rose-500" : mediaPercent >= 75 ? "h-full bg-amber-500" : "h-full bg-sky-600"} style={{ width: `${mediaPercent}%` }} /></div><p className="mt-2 text-xs leading-5 text-slate-600">{formatBytes(mediaUsage.remainingBytes)} disponibles · {mediaUsage.managedBy === "vercel_blob" ? "Blob mutualisé" : "stockage historique"}</p></> : <p className="mt-2 text-xs leading-5 text-slate-600">Aucun média, quota ou stockage n’a été modifié.</p>}</section><section className={supervision.domainRequest ? "rounded-xl border border-violet-200 bg-violet-50 p-4" : "rounded-xl border border-slate-200 bg-slate-50 p-4"}><div className="flex items-start gap-3"><Globe2 className={supervision.domainRequest ? "mt-0.5 h-5 w-5 shrink-0 text-violet-800" : "mt-0.5 h-5 w-5 shrink-0 text-slate-500"} /><div><p className="font-semibold text-slate-950">{supervision.domainRequest ? "Domaine demandé" : "Domaine personnalisé"}</p><p className="mt-1 break-all text-xs leading-5 text-slate-700">{supervision.domainRequest ? supervision.domainRequest.domain : "Aucune demande propriétaire"}</p><p className="mt-1 text-xs leading-5 text-slate-600">{supervision.domainRequest ? `Demande du ${new Date(supervision.domainRequest.requestedAt).toLocaleDateString("fr-CH")}. Examen et rattachement manuels requis.` : "Aucun DNS ni domaine n’est modifié depuis cette vue."}</p></div></div></section><section className="rounded-xl border border-violet-200 bg-violet-50 p-4"><div className="flex items-start gap-3"><CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-violet-800" /><div><p className="font-semibold text-violet-950">Préparation SaaS</p>{supervision.billing.plan ? <><p className="mt-1 text-xs font-medium leading-5 text-violet-950">{supervision.billing.plan.label}</p><p className="mt-1 text-xs leading-5 text-violet-900">{formatMoney(supervision.billing.plan.amountCents, supervision.billing.plan.currency)} · {supervision.billing.plan.interval === "monthly" ? "mensuel" : supervision.billing.plan.interval === "yearly" ? "annuel" : "ponctuel"}</p></> : <p className="mt-1 text-xs leading-5 text-violet-900">Aucun plan interne préparé.</p>}<p className="mt-2 flex items-center gap-1 text-xs leading-5 text-violet-900"><ReceiptText className="h-3.5 w-3.5" />{supervision.billing.invoiceDrafts} brouillon{supervision.billing.invoiceDrafts > 1 ? "s" : ""} interne{supervision.billing.invoiceDrafts > 1 ? "s" : ""}</p><p className="mt-1 text-xs leading-5 text-violet-900">Aucun abonnement, facture légale ou paiement n’est activé.</p></div></div></section><section className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" /><div><p className="font-semibold text-amber-950">Encaissement réel non activé</p><p className="mt-1 text-xs leading-5 text-amber-900">La préparation ne connecte ni Stripe Live, ni moyen de paiement, ni facture, ni abonnement.</p></div></div></section></div>
      <section className={supervision.planAssignment ? "rounded-xl border border-sky-200 bg-sky-50/60 p-4" : "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"}><p className="text-xs font-bold uppercase tracking-wide text-sky-800">Attribution de plan SaaS</p>{supervision.planAssignment ? <><div className="mt-2 flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{supervision.planAssignment.planName}</p><Badge variant="outline" className="border-sky-200 bg-white text-sky-900">{supervision.planAssignment.features.length} fonctionnalité(s) proposées</Badge></div><p className="mt-2 text-xs leading-5 text-slate-600">Brouillon attribué le {new Date(supervision.planAssignment.assignedAt).toLocaleDateString("fr-CH")}. Les fonctionnalités sont descriptives et ne sont pas encore appliquées comme droits ou limites.</p></> : <p className="mt-2 text-xs leading-5 text-slate-600">Aucun modèle SaaS n’est attribué à cette boutique. L’offre commerciale et les brouillons de facturation restent indépendants.</p>}</section>
      <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><PlugZap className="mt-0.5 h-5 w-5 shrink-0 text-violet-800" /><div><p className="font-semibold text-violet-950">Demandes d’intégrations</p><p className="mt-1 text-xs leading-5 text-violet-900">Intentions remontées depuis le panneau propriétaire. Elles ne constituent ni une autorisation, ni une connexion, ni une installation.</p></div></div><Badge variant="outline" className={supervision.integrationRequests.length ? "border-violet-300 bg-white text-violet-900" : "border-slate-200 bg-white text-slate-700"}>{supervision.integrationRequests.length ? `${supervision.integrationRequests.length} demande${supervision.integrationRequests.length > 1 ? "s" : ""}` : "Aucune demande"}</Badge></div>{supervision.integrationRequests.length ? <div className="mt-4 flex flex-wrap gap-2">{supervision.integrationRequests.map(request => <Badge key={request.id} variant="outline" className="border-violet-200 bg-white text-violet-950">{integrationLabels[request.id]} · {new Date(request.requestedAt).toLocaleDateString("fr-CH")}</Badge>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-violet-200 bg-white/70 p-3 text-xs leading-5 text-slate-700">La boutique n’a demandé aucun outil tiers. Aucun secret, fournisseur ou réglage externe n’est exposé ici.</p>}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">Points à compléter</p><p className="mt-1 text-xs leading-5 text-slate-600">Les détails ci-dessous restent propres à cette boutique et ne révèlent aucune donnée client.</p></div><Badge variant="outline" className={attentionItems.length ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}>{attentionItems.length ? `${attentionItems.length} point(s) à compléter` : "Préparation renseignée"}</Badge></div>{attentionItems.length ? <div className="mt-4 grid gap-2">{attentionItems.map(item => <div key={`${item.id}-${item.label}`} className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-slate-950">{item.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{item.detail}</p></div></div>)}</div> : <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p>Les éléments préparatoires de cette boutique sont renseignés. Cela ne constitue pas une activation de paiement ni une autorisation d’encaissement.</p></div>}</section>
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p><strong>Limites conservées :</strong> cette vue ne lit ni clients, ni adresses, ni commandes, ni coordonnées légales, ni secrets, ni clés externes. Toute activation de paiement, automatisation commerciale ou transfert de stockage nécessite une brique séparée et validée.</p></div>
    </CardContent>
  </Card>;
}

function Metric({ label, value, detail, warn = false, text = false }: { label: string; value: string | number; detail: string; warn?: boolean; text?: boolean }) {
  return <div className={`rounded-xl border p-4 ${warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 font-bold text-slate-950 ${text ? "text-base" : "text-2xl"}`}>{value}</p><p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p></div>;
}
