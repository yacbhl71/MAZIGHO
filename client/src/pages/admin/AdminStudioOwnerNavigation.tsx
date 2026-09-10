import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CircleAlert, Eye, LayoutPanelTop, LockKeyhole, Menu, Save, Settings2 } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

type PageId = "home" | "about" | "faq" | "contact" | "lookbook";
type NavigationItem = { pageId: PageId; label: string; visible: boolean };

const pageDescriptions: Record<PageId, string> = {
  home: "Point d’entrée permanent de la boutique.",
  about: "Histoire et promesse de marque.",
  faq: "Questions fréquentes et réassurance.",
  contact: "Accueil et message de contact.",
  lookbook: "Inspiration, sélections et collections.",
};

function NavigationSkeleton() {
  return <div className="space-y-5"><div className="h-28 animate-pulse rounded-3xl bg-slate-200" /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]"><div className="h-[560px] animate-pulse rounded-3xl bg-slate-100" /><div className="h-[420px] animate-pulse rounded-3xl bg-slate-100" /></div></div>;
}

export default function AdminStudioOwnerNavigation() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/navigation/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const navigationQuery = trpc.admin.studio.getOwnerNavigationDraft.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });
  const utils = trpc.useUtils();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (navigationQuery.data) setItems(navigationQuery.data.items as NavigationItem[]);
  }, [navigationQuery.data]);

  const saveMutation = trpc.admin.studio.saveOwnerNavigationDraft.useMutation({
    onSuccess: async () => {
      setNotice("Navigation enregistrée. Elle reste privée et non publiée.");
      await utils.admin.studio.getOwnerNavigationDraft.invalidate({ storeId });
    },
    onError: error => setNotice(error.message || "Impossible d’enregistrer cette navigation."),
  });

  const activePages = useMemo(() => new Set(navigationQuery.data?.activePageIds as PageId[] | undefined), [navigationQuery.data]);
  const updateItem = (pageId: PageId, update: (item: NavigationItem) => NavigationItem) => {
    setNotice("");
    setItems(current => current.map(item => item.pageId === pageId ? update(item) : item));
  };
  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (index <= 0 || target <= 0 || target >= items.length) return;
    setNotice("");
    setItems(current => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const visibleItems = items.filter(item => item.visible);

  return <DashboardLayout><main className="mx-auto w-full max-w-[1320px] space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Navigation privée Studio</Badge><Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-900">Structure de la boutique · étape 3</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Organiser le menu de votre boutique</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Choisissez les pages à montrer, simplifiez leurs noms et placez-les dans l’ordre voulu. Le résultat est visible dans l’aperçu privé seulement.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/constructeur/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au créateur</Button></header>

    {!isValidStoreId ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Boutique non sélectionnée.</p><p className="mt-1">Revenez dans Studio et ouvrez la navigation depuis une boutique offerte en préparation.</p></div></CardContent></Card> : navigationQuery.isLoading ? <NavigationSkeleton /> : navigationQuery.isError || !navigationQuery.data ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Navigation indisponible.</p><p className="mt-1">Cet atelier est réservé à une boutique offerte en état `setup`, depuis MAZIGHO Studio uniquement.</p></div></CardContent></Card> : <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
      <Card className="border-slate-200"><CardHeader><CardDescription>Pages et ordre du menu</CardDescription><CardTitle className="mt-1 text-2xl">Un menu clair en quelques choix</CardTitle><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">L’accueil est toujours présent. Les autres pages deviennent disponibles après leur sélection dans le créateur. Aucun lien externe ou URL libre n’est accepté.</p></CardHeader><CardContent className="space-y-3">{items.map((item, index) => { const isHome = item.pageId === "home"; const isPrepared = isHome || activePages.has(item.pageId); return <article key={item.pageId} className={`rounded-2xl border p-4 ${isPrepared ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-75"}`}><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">{index + 1}</span><div className="min-w-0 flex-1"><Label htmlFor={`nav-${item.pageId}`} className="text-sm font-semibold text-slate-950">{isHome ? "Accueil" : pageDescriptions[item.pageId]}</Label><Input id={`nav-${item.pageId}`} value={item.label} disabled={isHome || !isPrepared} maxLength={40} onChange={event => updateItem(item.pageId, current => ({ ...current, label: event.target.value }))} className="mt-2 max-w-sm bg-white disabled:bg-slate-100" />{!isPrepared && <p className="mt-2 text-xs leading-5 text-slate-500">Ajoutez d’abord cette page dans le créateur de boutique.</p>}</div></div><div className="flex flex-wrap items-center gap-2"><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={item.visible} disabled={isHome || !isPrepared} onChange={event => updateItem(item.pageId, current => ({ ...current, visible: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" />{item.visible ? "Visible" : "Masquée"}</label><Button type="button" size="icon" variant="outline" disabled={index <= 1} onClick={() => moveItem(index, -1)} aria-label="Monter la page"><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" disabled={index === 0 || index === items.length - 1} onClick={() => moveItem(index, 1)} aria-label="Descendre la page"><ArrowDown className="h-4 w-4" /></Button></div></div></article>; })}
        {notice && <p className={`rounded-xl border px-4 py-3 text-sm ${notice.startsWith("Navigation") ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}>{notice}</p>}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Les libellés ont une limite de 40 caractères pour garder le menu lisible sur mobile.</p><Button type="button" disabled={saveMutation.isPending || items.length !== 5} onClick={() => saveMutation.mutate({ storeId, items })} className="w-fit bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" />{saveMutation.isPending ? "Enregistrement…" : "Enregistrer la navigation"}</Button></div></CardContent></Card>

      <aside className="space-y-5 xl:sticky xl:top-6 xl:h-fit"><Card className="overflow-hidden border-slate-200"><div className="bg-gradient-to-br from-slate-950 via-sky-950 to-violet-950 p-5 text-white"><div className="flex items-center justify-between"><Badge className="border-0 bg-white/15 text-white hover:bg-white/15">Aperçu du menu</Badge><Menu className="h-5 w-5 text-sky-200" /></div><p className="mt-6 text-xl font-bold">{navigationQuery.data.store.displayName}</p><p className="mt-1 text-sm text-slate-300">Navigation privée de la boutique</p><div className="mt-6 flex flex-wrap gap-2">{visibleItems.map(item => <span key={item.pageId} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium">{item.label}</span>)}</div></div><CardContent className="p-5"><p className="text-sm font-semibold text-slate-950">Contrôle de cohérence</p><div className="mt-3 space-y-3 text-sm leading-6 text-slate-600"><p className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> Accueil toujours présent.</p><p className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> Pages visibles liées à la structure préparée.</p><p className="flex gap-2"><LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-slate-500" /> Aucun lien externe, panier ou paiement dans ce menu.</p></div></CardContent></Card><div className="grid gap-2"><Link href={`/admin/studio/page-preview/${storeId}`} className="flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"><Eye className="mr-2 h-4 w-4" /> Voir l’aperçu complet</Link><Link href={`/admin/studio/apercu/${storeId}`} className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Eye className="mr-2 h-4 w-4" /> Aperçu catalogue</Link></div><Card className="border-violet-200 bg-violet-50"><CardContent className="p-5 text-sm leading-6 text-violet-950"><LayoutPanelTop className="mb-2 h-5 w-5" /><p className="font-semibold">Toujours une préparation privée</p><p className="mt-1">Cette navigation ne remplace pas le menu du storefront et ne publie aucun lien. Son intégration publique restera une étape séparée et explicitement contrôlée.</p></CardContent></Card></aside>
    </section>}
  </main></DashboardLayout>;
}
