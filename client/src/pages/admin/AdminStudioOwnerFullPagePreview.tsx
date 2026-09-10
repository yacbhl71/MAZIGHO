import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronRight, CircleAlert, Eye, Image as ImageIcon, LockKeyhole, Menu, MonitorSmartphone, ShoppingBag, Sparkles } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

type PageId = "home" | "about" | "faq" | "contact" | "lookbook";
type NavigationItem = { pageId: PageId; label: string; visible: boolean };
type PageDraft = { id: Exclude<PageId, "home">; label: string; enabled: boolean; coverImageUrl: string; blocks: Array<{ id: string; label: string; visible: boolean; title: string; body: string }> };

const paletteColors = {
  terracotta: { primary: "#B45309", accent: "#D97706", soft: "#FFF7ED" },
  sage: { primary: "#0F766E", accent: "#D97706", soft: "#F0FDFA" },
  midnight: { primary: "#1E3A8A", accent: "#DB2777", soft: "#EFF6FF" },
  rose: { primary: "#BE185D", accent: "#A16207", soft: "#FFF1F2" },
} as const;

function PreviewSkeleton() {
  return <div className="space-y-5"><div className="h-24 animate-pulse rounded-3xl bg-slate-200" /><div className="h-[620px] animate-pulse rounded-3xl bg-slate-100" /></div>;
}

export default function AdminStudioOwnerFullPagePreview() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/page-preview/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const previewQuery = trpc.admin.studio.getOwnerFullPagePreview.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });
  const [selectedPageId, setSelectedPageId] = useState<PageId>("home");
  const data = previewQuery.data;
  const visibleNavigation = useMemo(() => (data?.navigation as NavigationItem[] | undefined)?.filter(item => item.visible) ?? [], [data]);
  const selectedPage = (data?.pages as PageDraft[] | undefined)?.find(page => page.id === selectedPageId);

  useEffect(() => {
    if (!data) return;
    const first = (data.navigation as NavigationItem[]).find(item => item.visible)?.pageId ?? "home";
    setSelectedPageId(current => (data.navigation as NavigationItem[]).some(item => item.visible && item.pageId === current) ? current : first);
  }, [data]);

  if (!isValidStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Boutique non sélectionnée.</p><p className="mt-1">Ouvrez cet aperçu depuis le créateur d’une boutique offerte en préparation.</p></div></CardContent></Card></main></DashboardLayout>;

  const palette = data ? paletteColors[data.configuration.paletteId] : paletteColors.sage;
  const primary = palette.primary;
  const accent = palette.accent;
  const soft = palette.soft;
  const isHome = selectedPageId === "home";

  return <DashboardLayout><main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Aperçu complet privé</Badge><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">Non public · sans vente</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Voir la boutique telle qu’elle se prépare</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette présentation rassemble l’identité, le menu, les pages et les images de couverture enregistrés dans Studio. Les boutons du menu changent uniquement la vue de cet aperçu privé.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/navigation/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à la navigation</Button></header>

    {previewQuery.isLoading ? <PreviewSkeleton /> : previewQuery.isError || !data ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Aperçu indisponible.</p><p className="mt-1">Cette vue est réservée aux boutiques offertes encore en état `setup`, depuis MAZIGHO Studio.</p></div></CardContent></Card> : <>
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 md:px-6"><span className="flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-slate-800" /> Maquette privée · lecture seule</span><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-slate-800" /> Domaine, panier et paiement désactivés</span></div>
        <div className="min-h-[650px]" style={{ backgroundColor: soft }}>
          <nav className="flex items-center justify-between gap-4 border-b border-black/10 bg-white/85 px-5 py-4 backdrop-blur md:px-8"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Sparkles className="h-4 w-4" /></div><span className="truncate text-lg font-bold tracking-tight text-slate-950">{data.identity.brandName}</span></div><div className="hidden items-center gap-1 md:flex">{visibleNavigation.map(item => <button key={item.pageId} type="button" onClick={() => setSelectedPageId(item.pageId)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${selectedPageId === item.pageId ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{item.label}</button>)}</div><div className="flex items-center gap-2 md:hidden"><Menu className="h-5 w-5 text-slate-700" /><span className="text-xs font-medium text-slate-600">Menu privé</span></div></nav>

          <div className="px-5 py-8 md:px-10 md:py-12">{isHome ? <HomePreview brandName={data.identity.brandName} brandMessage={data.identity.brandMessage} niche={data.configuration.niche} model={data.configuration.model} primary={primary} accent={accent} pages={data.pages as PageDraft[]} onSelectPage={setSelectedPageId} /> : !selectedPage ? <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white/75 p-8 text-center text-sm leading-6 text-slate-600">Cette page n’est pas encore préparée.</div> : <EditorialPagePreview page={selectedPage} primary={primary} accent={accent} />}</div>
        </div>
      </section>
      <section className="flex flex-col gap-4 rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">Ce rendu est strictement privé.</p><p className="mt-1 max-w-3xl">Il lit les brouillons Studio d’une seule boutique. Il ne crée aucun compte, ne publie aucune page, ne charge aucun pixel marketing et n’utilise pas le domaine de la boutique.</p></div><Link href={`/admin/studio/checklist/${storeId}`} className="inline-flex w-fit items-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 font-semibold text-sky-950 hover:bg-sky-100">Voir la checklist <ChevronRight className="ml-1.5 h-4 w-4" /></Link></section>
    </>}
  </main></DashboardLayout>;
}

type HomeModel = "commerce" | "editorial" | "catalogue";

function HomePreview({ brandName, brandMessage, niche, model, primary, accent, pages, onSelectPage }: { brandName: string; brandMessage: string; niche: string; model: HomeModel; primary: string; accent: string; pages: PageDraft[]; onSelectPage: (pageId: PageId) => void }) {
  const preparedPages = pages.filter(page => page.enabled);
  const message = brandMessage || `Bienvenue chez ${brandName}`;
  const intro = "Une maquette privée fidèle à la marque, sans produit vendable, panier ou action commerciale.";

  if (model === "editorial") return <div className="mx-auto max-w-6xl"><section className="overflow-hidden rounded-[30px] bg-slate-950 px-6 py-10 text-white md:px-10 md:py-14"><p className="text-xs font-bold uppercase tracking-[0.19em]" style={{ color: accent }}>{niche || "Votre univers"}</p><div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)] lg:items-end"><div><h2 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">{message}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">{intro}</p></div><div className="border-l border-white/15 pl-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">L’histoire continue</p><p className="mt-3 text-lg font-semibold">Une composition pensée pour installer un ton, une promesse et un univers avant les collections.</p></div></div></section><div className="mt-6 grid gap-4 md:grid-cols-3">{preparedPages.length ? preparedPages.slice(0, 3).map((page, index) => <button key={page.id} type="button" onClick={() => onSelectPage(page.id)} className={`min-h-44 rounded-3xl border p-5 text-left transition-none ${index === 1 ? "border-slate-950 bg-slate-950 text-white" : "border-white bg-white shadow-sm"}`}><p className={`text-xs font-bold uppercase tracking-[0.15em] ${index === 1 ? "text-slate-400" : "text-slate-500"}`}>Chapitre {index + 1}</p><p className="mt-5 text-xl font-bold">{page.label}</p><span className={`mt-6 inline-flex items-center text-sm font-semibold ${index === 1 ? "text-white" : "text-slate-700"}`}>Lire la page <ChevronRight className="ml-1.5 h-4 w-4" style={{ color: accent }} /></span></button>) : <EmptyPages />}</div></div>;

  if (model === "catalogue") return <div className="mx-auto max-w-6xl"><header className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: primary }}>{niche || "Votre univers"}</p><h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{message}</h2><p className="mt-5 text-base leading-8 text-slate-700">Une composition sobre qui guide clairement vers les collections et les pages importantes de la boutique.</p></header><div className="mt-9 grid gap-4 md:grid-cols-2"><div className="min-h-64 rounded-[28px] bg-slate-950 p-7 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Collections</p><p className="mt-4 max-w-sm text-3xl font-bold tracking-tight">Un catalogue lisible, prêt à recevoir vos sélections.</p><span className="mt-8 inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold">Prévisualisation uniquement</span></div><div className="grid gap-4 sm:grid-cols-2">{preparedPages.length ? preparedPages.slice(0, 2).map((page, index) => <button key={page.id} type="button" onClick={() => onSelectPage(page.id)} className="min-h-40 rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: index === 0 ? primary : accent }}>Page préparée</p><p className="mt-5 text-xl font-bold text-slate-950">{page.label}</p><ChevronRight className="mt-5 h-4 w-4 text-slate-600" /></button>) : <EmptyPages />}</div></div></div>;

  return <div className="mx-auto max-w-6xl"><div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)] lg:items-end"><div className="py-5"><p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: primary }}>{niche || "Votre univers"}</p><h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">{message}</h2><p className="mt-5 max-w-xl text-base leading-8 text-slate-700">{intro}</p><div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => preparedPages[0] && onSelectPage(preparedPages[0].id)} disabled={!preparedPages.length} className="rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: primary }}>Découvrir l’univers <ChevronRight className="ml-1.5 inline h-4 w-4" /></button><span className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600"><ShoppingBag className="mr-2 h-4 w-4" /> Vente indisponible</span></div></div><div className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Pages préparées</p><div className="mt-5 space-y-3">{preparedPages.length ? preparedPages.map(page => <button key={page.id} type="button" onClick={() => onSelectPage(page.id)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:border-slate-300"><span>{page.label}</span><ChevronRight className="h-4 w-4" style={{ color: accent }} /></button>) : <p className="text-sm leading-6 text-slate-600">Préparez une première page dans l’éditeur pour compléter cet aperçu.</p>}</div></div></div></div>;
}

function EmptyPages() {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-6 text-slate-600 md:col-span-3">Préparez une première page dans l’éditeur pour compléter cet aperçu.</div>;
}

function EditorialPagePreview({ page, primary, accent }: { page: PageDraft; primary: string; accent: string }) {
  const visibleBlocks = page.blocks.filter(block => block.visible);
  return <article className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-white/90 bg-white shadow-sm">{page.coverImageUrl ? <div className="relative h-64 w-full bg-slate-100 md:h-80"><img src={page.coverImageUrl} alt="Illustration de couverture préparée" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" /><p className="absolute bottom-6 left-6 text-xs font-bold uppercase tracking-[0.18em] text-white">{page.label}</p></div> : <div className="flex min-h-44 items-end bg-slate-950 p-6 md:min-h-56 md:p-9"><div><p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>{page.label}</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Une page à votre image</h2></div></div>}<div className="p-6 md:p-10">{page.coverImageUrl && <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: primary }}>{page.label}</p>}<div className="mt-6 grid gap-8 md:grid-cols-3">{visibleBlocks.length ? visibleBlocks.map((block, index) => <section key={block.id} className={index === 0 ? "md:col-span-2" : ""}><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{block.label}</p><h2 className={`${index === 0 ? "mt-3 text-3xl md:text-4xl" : "mt-3 text-xl"} font-bold tracking-tight text-slate-950`}>{block.title}</h2><p className="mt-3 text-sm leading-7 text-slate-700">{block.body}</p></section>) : <div className="md:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">Activez au moins un bloc dans l’éditeur pour préparer cette page.</div>}</div><div className="mt-10 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500"><ImageIcon className="mr-1.5 inline h-3.5 w-3.5" /> Contenu et image visibles seulement dans cet aperçu Studio privé.</div></div></article>;
}
