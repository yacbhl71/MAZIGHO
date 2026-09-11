import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, ClipboardCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function AdminStudioOwnerSetupIsolationReview() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/revue-etancheite/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const query = trpc.admin.studio.getOwnerSetupIsolationReview.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Revue privée Studio</Badge><Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-950">Étanchéité de l’état setup</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Vérifier l’étanchéité avant passage manuel</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette page décrit les garde-fous déjà appliqués à la boutique en préparation et les vérifications humaines à faire. Elle ne teste pas en ligne, n’ouvre rien et ne modifie aucune donnée.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/prevol-commercial/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Prévol commercial</Button></header>

    {query.isLoading ? <div className="h-[540px] animate-pulse rounded-3xl bg-slate-100" /> : query.isError || !query.data ? <Unavailable /> : <>
      <section className={`rounded-3xl border p-5 text-sm leading-6 ${query.data.review.protectedSetup ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}><div className="flex gap-3">{query.data.review.protectedSetup ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />}<div><p className="font-bold">{query.data.store.displayName} · état actuel : {query.data.review.status}</p><p className="mt-1">{query.data.review.protectedSetup ? "Le statut setup conserve la boutique dans son périmètre privé prévu." : "Cette revue est conçue pour une boutique en setup : aucun passage public ne doit être entrepris depuis cet écran."}</p></div></div></section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-3"><Protection title="Storefront public" active={query.data.review.publicStorefrontServed} enabledLabel="Servi publiquement" protectedLabel="Fermé par l’état setup" detail="Aucun storefront public ne doit être servi tant que la boutique reste en préparation." /><Protection title="Panier public" active={query.data.review.publicCartAvailable} enabledLabel="Disponible" protectedLabel="Non disponible" detail="Aucun panier persistant ni article public n’est créé depuis les brouillons Studio." /><Protection title="Checkout et paiement" active={query.data.review.publicCheckoutAvailable} enabledLabel="Disponible" protectedLabel="Non disponible" detail="Le prévol et la revue ne déclenchent ni checkout, ni paiement, ni commande." /><Protection title="Publication catalogue" active={query.data.review.cataloguePublicationExecuted} enabledLabel="Exécutée" protectedLabel="Non exécutée" detail="Aucun brouillon Studio n’est copié vers le catalogue réel dans cette étape." /></div>
        <aside className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><CardDescription>À faire hors de cette page</CardDescription><CardTitle className="mt-1 text-xl">Vérifications manuelles</CardTitle></CardHeader><CardContent className="space-y-4 p-5">{query.data.review.manualChecks.map(check => <div key={check.key} className="flex gap-3"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-800" /><div><p className="text-sm font-bold text-slate-950">{check.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{check.detail}</p></div></div>)}</CardContent></Card><Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4" /> Pas d’activation automatique</p><p className="mt-2">Une revue positive ne publie pas de catalogue et n’active pas la boutique. Ces décisions restent séparées et nécessitent une confirmation explicite.</p></CardContent></Card></aside>
      </section>
    </>}
  </main></DashboardLayout>;
}

function Protection({ title, active, enabledLabel, protectedLabel, detail }: { title: string; active: boolean; enabledLabel: string; protectedLabel: string; detail: string }) {
  return <Card className={active ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}><CardContent className="flex items-start gap-3 p-5"><CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-rose-800" : "text-emerald-800"}`} /><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{title}</p><Badge variant="outline" className={active ? "border-rose-200 bg-white text-rose-900" : "border-emerald-200 bg-white text-emerald-900"}>{active ? enabledLabel : protectedLabel}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-700">{detail}</p></div></CardContent></Card>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Revue d’étanchéité indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
