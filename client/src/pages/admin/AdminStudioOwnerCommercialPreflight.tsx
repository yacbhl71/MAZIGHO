import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, ClipboardCheck, ExternalLink, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { useLocation, useRoute } from "wouter";

type Check = { key: string; label: string; state: "ready" | "blocked" | "manual"; detail: string };

const actions: Record<string, { label: string; path: (storeId: number) => string }> = {
  identity: { label: "Ouvrir le créateur", path: storeId => `/admin/studio/constructeur/${storeId}` },
  collections: { label: "Préparer les collections", path: storeId => `/admin/studio/collections/${storeId}` },
  products: { label: "Préparer les fiches", path: storeId => `/admin/studio/produits/${storeId}` },
  operations: { label: "Préparer stock et fournisseur", path: storeId => `/admin/studio/stock-fournisseurs/${storeId}` },
  private_cart: { label: "Tester le panier privé", path: storeId => `/admin/studio/panier-simulation/${storeId}` },
};

const appearance = {
  ready: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-950", badge: "border-emerald-200 bg-white text-emerald-900", label: "Prêt" },
  blocked: { icon: CircleAlert, className: "border-rose-200 bg-rose-50 text-rose-950", badge: "border-rose-200 bg-white text-rose-900", label: "À compléter" },
  manual: { icon: TriangleAlert, className: "border-amber-200 bg-amber-50 text-amber-950", badge: "border-amber-200 bg-white text-amber-900", label: "Revue manuelle" },
};

export default function AdminStudioOwnerCommercialPreflight() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/prevol-commercial/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const query = trpc.admin.studio.getOwnerCommercialPublicationPreflight.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Prévol privé Studio</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">Catalogue et panier de préparation</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Revoir la préparation commerciale</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette revue vérifie les brouillons enregistrés avant une future décision manuelle de publication. Elle ne copie aucun produit, n’ouvre aucun panier public et ne peut pas activer la boutique.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/panier-simulation/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Panier simulé</Button></header>

    {query.isLoading ? <div className="h-[620px] animate-pulse rounded-3xl bg-slate-100" /> : query.isError || !query.data ? <Unavailable /> : <>
      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-sm leading-6 text-violet-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{query.data.store.displayName} · la boutique reste en `setup`</p><p className="mt-1">Cette lecture est réservée à Studio. Aucun produit public, panier persistant, client, checkout, paiement, commande, fournisseur ou domaine n’est créé ou modifié.</p></div></div></section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-3">{(query.data.preflight.checks as Check[]).map(check => { const style = appearance[check.state]; const Icon = style.icon; const action = actions[check.key]; return <Card key={check.key} className={style.className}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0" /><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{check.label}</p><Badge variant="outline" className={style.badge}>{style.label}</Badge></div><p className="mt-2 text-sm leading-6 opacity-90">{check.detail}</p></div></div>{action && check.state !== "ready" ? <Button type="button" variant="outline" className="min-h-11 shrink-0 border-current bg-white/70 hover:bg-white" onClick={() => setLocation(action.path(storeId))}>{action.label}<ExternalLink className="ml-2 h-4 w-4" /></Button> : null}</CardContent></Card>; })}</div>
        <aside className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><CardDescription>Résumé de la revue</CardDescription><CardTitle className="mt-1 text-xl">Prochaine étape</CardTitle></CardHeader><CardContent className="space-y-4 p-5"><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xl font-bold text-emerald-900">{query.data.preflight.readyCount}</p><p className="text-xs text-emerald-800">prêts</p></div><div className="rounded-xl bg-rose-50 p-3"><p className="text-xl font-bold text-rose-900">{query.data.preflight.blockedCount}</p><p className="text-xs text-rose-800">à compléter</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-xl font-bold text-amber-900">{query.data.preflight.manualCount}</p><p className="text-xs text-amber-800">manuels</p></div></div>{query.data.preflight.locallyReadyForManualCommercialReview ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p className="font-bold">Brouillons prêts pour une revue manuelle.</p><p className="mt-1">Aucune publication ne sera proposée ici. Les visuels, variantes, livraisons et règles réelles devront être vérifiés séparément.</p></div> : <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p className="font-bold">Complétez les points rouges.</p><p className="mt-1">Utilisez les boutons de cette page pour revenir au bon atelier privé.</p></div>}</CardContent></Card><Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><ClipboardCheck className="h-4 w-4" /> Ce prévol ne vend rien</p><p className="mt-2">La publication du catalogue, le panier réel et l’activation publique restent trois décisions séparées. Cette page ne possède aucune mutation.</p></CardContent></Card></aside>
      </section>
    </>}
  </main></DashboardLayout>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Prévol commercial indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
