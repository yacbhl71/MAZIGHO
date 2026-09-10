import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, CircleAlert, Eye, FileText, LockKeyhole, PanelTop, Save, Sparkles } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

type PageId = "about" | "faq" | "contact" | "lookbook";
type BlockId = "intro" | "detail" | "reassurance";
type DraftBlock = { id: BlockId; label: string; visible: boolean; title: string; body: string };
type DraftPage = { id: PageId; label: string; description: string; enabled: boolean; blocks: DraftBlock[] };

function EditorSkeleton() {
  return <div className="space-y-5"><div className="h-28 animate-pulse rounded-3xl bg-slate-200" /><div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_350px]"><div className="h-[540px] animate-pulse rounded-3xl bg-slate-100" /><div className="h-[640px] animate-pulse rounded-3xl bg-slate-100" /><div className="h-[500px] animate-pulse rounded-3xl bg-slate-100" /></div></div>;
}

export default function AdminStudioOwnerPageEditor() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/pages/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const draftsQuery = trpc.admin.studio.getOwnerPageDrafts.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });
  const utils = trpc.useUtils();
  const [pages, setPages] = useState<DraftPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<PageId>("about");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!draftsQuery.data) return;
    setPages(draftsQuery.data.pages as DraftPage[]);
    const firstActive = draftsQuery.data.activePageIds[0] as PageId | undefined;
    setSelectedPageId(firstActive || (draftsQuery.data.pages[0]?.id as PageId) || "about");
  }, [draftsQuery.data]);

  const selectedPage = useMemo(() => pages.find(page => page.id === selectedPageId) ?? pages[0], [pages, selectedPageId]);
  const saveMutation = trpc.admin.studio.saveOwnerPageDraft.useMutation({
    onSuccess: async () => {
      setNotice("Brouillon de page enregistré. Il reste privé et non publié.");
      await utils.admin.studio.getOwnerPageDrafts.invalidate({ storeId });
    },
    onError: error => setNotice(error.message || "Impossible d’enregistrer ce brouillon de page."),
  });

  const updatePage = (update: (page: DraftPage) => DraftPage) => {
    if (!selectedPage) return;
    setNotice("");
    setPages(current => current.map(page => page.id === selectedPage.id ? update(page) : page));
  };

  const updateBlock = (blockId: BlockId, update: (block: DraftBlock) => DraftBlock) => {
    updatePage(page => ({ ...page, blocks: page.blocks.map(block => block.id === blockId ? update(block) : block) }));
  };

  const canSave = Boolean(selectedPage) && selectedPage.blocks.every(block => block.title.trim() && block.body.trim()) && !saveMutation.isPending;
  const activePageIds = new Set(draftsQuery.data?.activePageIds ?? []);

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1540px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Éditeur privé Studio</Badge><Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-950">Brouillon par blocs · étape 2</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Éditer les pages de votre boutique</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Modifiez de petits blocs clairs plutôt qu’une page complexe. Chaque page reste un brouillon privé, visible ici uniquement avant toute ouverture publique.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/constructeur/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au créateur</Button></header>

        {!isValidStoreId ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Boutique non sélectionnée.</p><p className="mt-1">Revenez dans MAZIGHO Studio et ouvrez l’éditeur depuis une boutique offerte en préparation.</p></div></CardContent></Card> : draftsQuery.isLoading ? <EditorSkeleton /> : draftsQuery.isError || !draftsQuery.data || !selectedPage ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Éditeur de pages indisponible.</p><p className="mt-1">Cette page est réservée à une boutique offerte en état `setup`, depuis MAZIGHO Studio uniquement.</p></div></CardContent></Card> : <>
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-4"><div className="flex items-center gap-3 rounded-xl bg-slate-950 px-3 py-2 text-white"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-sm font-bold">1</span><div><p className="text-sm font-semibold">Choisir</p><p className="text-xs text-slate-300">Une page</p></div></div><div className="flex items-center gap-3 rounded-xl px-3 py-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-800">2</span><div><p className="text-sm font-semibold text-slate-950">Écrire</p><p className="text-xs text-slate-500">Trois blocs simples</p></div></div><div className="flex items-center gap-3 rounded-xl px-3 py-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">3</span><div><p className="text-sm font-semibold text-slate-950">Vérifier</p><p className="text-xs text-slate-500">Aperçu instantané</p></div></div><div className="flex items-center gap-3 rounded-xl px-3 py-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">4</span><div><p className="text-sm font-semibold text-slate-950">Sauvegarder</p><p className="text-xs text-slate-500">Toujours privé</p></div></div></section>

          <section className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_350px]">
            <aside className="rounded-3xl bg-slate-950 p-4 text-white shadow-lg"><div className="border-b border-white/10 px-3 py-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Pages de la boutique</p><p className="mt-2 font-semibold">{draftsQuery.data.store.displayName}</p></div><nav className="mt-4 space-y-2">{pages.map(page => { const selected = selectedPage.id === page.id; const selectedForStructure = activePageIds.has(page.id); return <button key={page.id} type="button" onClick={() => { setNotice(""); setSelectedPageId(page.id); }} className={`w-full rounded-2xl p-3 text-left ${selected ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{page.label}</span>{selectedForStructure ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Prévue</span> : <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">Optionnelle</span>}</div><p className={`mt-1 text-xs leading-5 ${selected ? "text-slate-500" : "text-slate-400"}`}>{page.description}</p></button>; })}</nav><div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-xs leading-5 text-slate-300"><LockKeyhole className="mb-2 h-4 w-4" />Pour ajouter ou retirer une page de la structure, revenez dans le créateur de boutique. Ici, vous préparez son contenu privé.</div></aside>

            <div className="space-y-5"><Card className="border-slate-200"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Page sélectionnée</CardDescription><CardTitle className="mt-1 text-2xl">{selectedPage.label}</CardTitle><p className="mt-2 text-sm leading-6 text-slate-600">{selectedPage.description}</p></div><label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={selectedPage.enabled} onChange={event => updatePage(page => ({ ...page, enabled: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /> Préparer cette page</label></div></CardHeader><CardContent className="space-y-5">{selectedPage.blocks.map((block, index) => <section key={block.id} className={`rounded-2xl border p-4 ${block.visible ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70"}`}><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span><p className="text-sm font-semibold text-slate-950">{block.label}</p></div><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={block.visible} onChange={event => updateBlock(block.id, current => ({ ...current, visible: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /> Visible dans l’aperçu</label></div><div className="mt-4 space-y-2"><Label htmlFor={`${block.id}-title`}>Titre du bloc</Label><Input id={`${block.id}-title`} value={block.title} maxLength={120} onChange={event => updateBlock(block.id, current => ({ ...current, title: event.target.value }))} /></div><div className="mt-4 space-y-2"><Label htmlFor={`${block.id}-body`}>Texte</Label><Textarea id={`${block.id}-body`} value={block.body} maxLength={1200} onChange={event => updateBlock(block.id, current => ({ ...current, body: event.target.value }))} className="min-h-[108px] resize-y" /></div></section>)}</CardContent></Card>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Brouillon sans publication</p><p className="mt-1">Enregistrer ne crée pas de page accessible sur le domaine, ne lance aucun pixel marketing et ne modifie ni panier, paiement, commande, fournisseur, domaine ou accès client.</p></div></div></div>
              {notice && <p className={`rounded-xl border px-4 py-3 text-sm ${notice.startsWith("Brouillon") ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}>{notice}</p>}
              <Button type="button" disabled={!canSave} onClick={() => saveMutation.mutate({ storeId, pageId: selectedPage.id, enabled: selectedPage.enabled, blocks: selectedPage.blocks.map(block => ({ id: block.id, visible: block.visible, title: block.title, body: block.body })) })} className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"><Save className="mr-2 h-4 w-4" />{saveMutation.isPending ? "Enregistrement…" : "Enregistrer le brouillon"}</Button>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-6 xl:h-fit"><Card className="overflow-hidden border-slate-200"><div className="bg-gradient-to-br from-violet-950 via-slate-950 to-slate-900 p-5 text-white"><div className="flex items-center justify-between"><Badge className="border-0 bg-white/15 text-white hover:bg-white/15">Aperçu privé</Badge><Sparkles className="h-5 w-5 text-violet-200" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-violet-200">{selectedPage.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{selectedPage.blocks.find(block => block.id === "intro")?.title}</p><p className="mt-3 text-sm leading-6 text-slate-300">{selectedPage.blocks.find(block => block.id === "intro")?.body}</p></div><CardContent className="space-y-4 p-5">{selectedPage.enabled ? selectedPage.blocks.filter(block => block.visible && block.id !== "intro").map(block => <div key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-950">{block.title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{block.body}</p></div>) : <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Cette page est conservée comme brouillon, mais marquée non préparée dans la structure.</div>}<div className="border-t border-slate-200 pt-4"><p className="flex items-center gap-2 text-sm font-semibold text-slate-950"><FileText className="h-4 w-4" /> Vérification rapide</p><p className="mt-2 text-sm leading-6 text-slate-600">Relisez le texte sur mobile et gardez une idée par bloc. Les visuels et les liens seront ajoutés dans une étape distincte.</p></div></CardContent></Card><Link href={`/admin/studio/apercu/${storeId}`} className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Eye className="mr-2 h-4 w-4" /> Ouvrir l’aperçu storefront</Link><Card className="border-sky-200 bg-sky-50"><CardContent className="p-5 text-sm leading-6 text-sky-950"><PanelTop className="mb-2 h-5 w-5" /><p className="font-semibold">Ce qui vient ensuite</p><p className="mt-1">L’édition de médias et l’intégration des pages préparées au storefront resteront deux étapes distinctes, avec un contrôle explicite avant publication.</p></CardContent></Card></aside>
          </section>
        </>}
      </main>
    </DashboardLayout>
  );
}
