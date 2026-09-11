import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, ClipboardCheck, ExternalLink, LockKeyhole, TriangleAlert } from "lucide-react";
import { useLocation, useRoute } from "wouter";

type ReviewCheck = { key: string; label: string; state: "ready" | "blocked" | "manual"; detail: string };

const style = {
  ready: { label: "Préparé", icon: CheckCircle2, card: "border-emerald-200 bg-emerald-50", badge: "border-emerald-200 bg-white text-emerald-900" },
  blocked: { label: "À compléter", icon: CircleAlert, card: "border-rose-200 bg-rose-50", badge: "border-rose-200 bg-white text-rose-900" },
  manual: { label: "Confirmation humaine", icon: TriangleAlert, card: "border-amber-200 bg-amber-50", badge: "border-amber-200 bg-white text-amber-900" },
};

export default function AdminStudioOwnerManualCommercialPassageReview() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/revue-passage/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const query = trpc.admin.studio.getOwnerManualCommercialPassageReview.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Revue privée Studio</Badge><Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-950">Passage commercial manuel</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Préparer la décision de passage</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ce tableau clôt la préparation privée en distinguant les contrôles calculés des confirmations qui restent humaines. Il ne publie rien et ne transforme pas les brouillons en commerce actif.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/revue-etancheite/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Revue d’étanchéité</Button></header>

    {query.isLoading ? <div className="h-[600px] animate-pulse rounded-3xl bg-slate-100" /> : query.isError || !query.data ? <Unavailable /> : <>
      <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 text-sm leading-6 text-indigo-950"><div className="flex gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{query.data.store.displayName} · préparation sous contrôle</p><p className="mt-1">Ce résultat aide à organiser une revue future ; aucune copie vers le catalogue réel, aucun panier public et aucune activation ne sont exécutés.</p></div></div></section>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-3">{(query.data.review.checks as ReviewCheck[]).map(check => { const current = style[check.state]; const Icon = current.icon; return <Card key={check.key} className={current.card}><CardContent className="flex gap-3 p-5"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" /><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{check.label}</p><Badge variant="outline" className={current.badge}>{current.label}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-700">{check.detail}</p></div></CardContent></Card>; })}</div>
        <aside className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><CardDescription>État de cette revue</CardDescription><CardTitle className="mt-1 text-xl">Décision ultérieure</CardTitle></CardHeader><CardContent className="space-y-4 p-5">{query.data.review.mayRequestManualPublicationReview ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p className="font-bold">Les brouillons peuvent être soumis à une revue humaine.</p><p className="mt-1">Cela ne vaut ni publication ni activation : les confirmations orange restent obligatoires.</p></div> : <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><p className="font-bold">La préparation doit être complétée.</p><p className="mt-1">Retournez au prévol commercial pour traiter les points bloqués avant une revue humaine.</p></div>}<Button type="button" variant="outline" className="min-h-11 w-full border-indigo-300 bg-indigo-50 text-indigo-950 hover:bg-indigo-100" onClick={() => setLocation(`/admin/studio/prevol-commercial/${storeId}`)}>Retour au prévol commercial<ExternalLink className="ml-2 h-4 w-4" /></Button></CardContent></Card><Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4" /> Limite volontaire</p><p className="mt-2">La future publication de catalogue et l’activation publique sont des chantiers distincts. Ils ne sont pas disponibles depuis cette page.</p></CardContent></Card></aside>
      </section>
    </>}
  </main></DashboardLayout>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Revue de passage indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
