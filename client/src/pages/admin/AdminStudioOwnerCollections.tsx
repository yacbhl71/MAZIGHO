import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowDown, ArrowLeft, ArrowUp, Check, CircleAlert, Eye, FolderKanban, GripVertical, LockKeyhole, PackagePlus, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

type Collection = { id: string; title: string; description: string; featured: boolean };

function copyCollections(collections: Collection[]) {
  return collections.map(collection => ({ ...collection }));
}

export default function AdminStudioOwnerCollections() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/collections/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const utils = trpc.useUtils();
  const query = trpc.admin.studio.getOwnerCollectionDrafts.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [initialCollections, setInitialCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (!query.data) return;
    const next = copyCollections(query.data.collections);
    setCollections(next);
    setInitialCollections(next);
  }, [query.data]);

  const saveMutation = trpc.admin.studio.saveOwnerCollectionDrafts.useMutation({
    onSuccess: async () => {
      toast.success("Collections privées enregistrées.");
      await Promise.all([
        utils.admin.studio.getOwnerCollectionDrafts.invalidate({ storeId }),
        utils.admin.studio.getGiftStoreLaunchCenter.invalidate({ storeId }),
      ]);
    },
    onError: error => toast.error(error.message || "Les collections n’ont pas pu être enregistrées."),
  });

  const changed = JSON.stringify(collections) !== JSON.stringify(initialCollections);
  const update = (index: number, patch: Partial<Collection>) => setCollections(current => current.map((item, currentIndex) => currentIndex === index ? { ...item, ...patch } : item));
  const move = (index: number, offset: number) => setCollections(current => {
    const destination = index + offset;
    if (destination < 0 || destination >= current.length) return current;
    const next = copyCollections(current);
    [next[index], next[destination]] = [next[destination], next[index]];
    return next;
  });
  const remove = (index: number) => setCollections(current => current.length <= 1 ? current : current.filter((_, currentIndex) => currentIndex !== index));
  const add = () => setCollections(current => current.length >= 8 ? current : [...current, { id: `draft-${Date.now()}`, title: `Nouvelle collection ${current.length + 1}`, description: "Présentez en quelques mots l’idée, le style ou la sélection de cette collection.", featured: false }]);

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Atelier privé Studio</Badge><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-900">Collections de présentation</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Préparer les collections</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Organisez les univers visibles dans votre future boutique. Cette étape prépare uniquement une structure éditoriale ; elle ne crée ni catégorie réelle ni produit vendable.</p></div><div className="flex flex-wrap gap-2"><Button type="button" onClick={() => setLocation(`/admin/studio/produits/${storeId}`)} className="w-fit bg-slate-950 text-white hover:bg-slate-800"><PackagePlus className="mr-2 h-4 w-4" /> Fiches produits</Button><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/constructeur/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Créateur de boutique</Button></div></header>

    {query.isLoading ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_360px]"><div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" /><div className="h-[420px] animate-pulse rounded-3xl bg-slate-100" /></div> : query.isError || !query.data ? <Unavailable /> : <>
      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950"><div className="flex gap-3"><FolderKanban className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{query.data.store.displayName} · état `setup`</p><p className="mt-1">Vous pouvez enregistrer jusqu’à huit collections. Les titres et accroches restent isolés dans l’atelier, sans toucher aux catégories réelles ni aux produits de la boutique.</p></div></div></section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_390px]">
        <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Structure éditoriale</CardDescription><CardTitle className="mt-1 text-xl">Vos collections à présenter</CardTitle></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">{collections.length} / 8</Badge></div></CardHeader><CardContent className="space-y-4 p-4 sm:p-6">{collections.map((collection, index) => <article key={collection.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><GripVertical className="h-5 w-5 shrink-0 text-slate-400" /><p className="truncate text-sm font-bold text-slate-950">Collection {index + 1}</p>{collection.featured && <Badge className="border-0 bg-amber-100 text-amber-950 hover:bg-amber-100">À la une</Badge>}</div><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon" aria-label="Monter la collection" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="Descendre la collection" disabled={index === collections.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="Supprimer la collection" disabled={collections.length <= 1} onClick={() => remove(index)} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"><Trash2 className="h-4 w-4" /></Button></div></div><div className="mt-4 grid gap-4"><div><Label htmlFor={`collection-title-${index}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Titre</Label><Input id={`collection-title-${index}`} value={collection.title} maxLength={72} onChange={event => update(index, { title: event.target.value })} className="mt-2 border-slate-300" /></div><div><Label htmlFor={`collection-description-${index}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Accroche</Label><Textarea id={`collection-description-${index}`} value={collection.description} maxLength={220} rows={3} onChange={event => update(index, { description: event.target.value })} className="mt-2 resize-y border-slate-300" /><p className="mt-1 text-right text-xs text-slate-500">{collection.description.length}/220</p></div><div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><div><Label htmlFor={`collection-featured-${index}`} className="text-sm font-semibold text-slate-950">Mettre à la une</Label><p className="mt-0.5 text-xs leading-5 text-slate-600">Ajoute un repère dans l’aperçu privé.</p></div><Switch id={`collection-featured-${index}`} checked={collection.featured} onCheckedChange={featured => update(index, { featured })} /></div></div></article>)}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="outline" disabled={collections.length >= 8} onClick={add} className="border-slate-300 bg-white"><Plus className="mr-2 h-4 w-4" /> Ajouter une collection</Button><Button type="button" onClick={() => saveMutation.mutate({ storeId, collections })} disabled={!changed || saveMutation.isPending || collections.some(item => item.title.trim().length < 2 || item.description.trim().length < 2)} className="bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Enregistrement…" : "Enregistrer le brouillon"}</Button></div></CardContent></Card>

        <aside className="space-y-5"><Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex items-center justify-between"><div><CardDescription>Aperçu privé</CardDescription><CardTitle className="mt-1 text-xl">Organisation des collections</CardTitle></div><Eye className="h-5 w-5 text-slate-500" /></div></CardHeader><CardContent className="p-5"><div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400"><Sparkles className="h-4 w-4" /> Collections</div><p className="mt-3 text-xl font-bold tracking-tight">Découvrir par univers</p><p className="mt-2 text-sm leading-6 text-slate-300">Voici la structure qui pourra guider vos visiteurs lorsque la boutique sera prête.</p></div><div className="mt-4 space-y-3">{collections.map(collection => <div key={`preview-${collection.id}`} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-950">{collection.title || "Titre à définir"}</p>{collection.featured && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950">À la une</span>}</div><p className="mt-2 text-sm leading-6 text-slate-600">{collection.description || "Accroche à définir"}</p></div>)}</div></CardContent></Card>
          <Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4" /> Limite volontaire</p><p className="mt-2">Cet atelier ne crée pas de catégories opérationnelles, produits, prix, stock, fournisseurs, panier, domaine ou publication. Ces briques seront ajoutées séparément au parcours, avec leurs propres contrôles.</p></CardContent></Card>
        </aside>
      </section>
    </>}
  </main></DashboardLayout>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Atelier de collections indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
