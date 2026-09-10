import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CircleAlert, Eye, LockKeyhole, PackagePlus, Plus, Save, Sparkles, Trash2, WalletCards } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

type ProductDraft = { id: string; name: string; description: string; collectionId: string; priceCents: number; featured: boolean };
type Collection = { id: string; title: string };

function copyProducts(products: ProductDraft[]) {
  return products.map(product => ({ ...product }));
}

function priceInputValue(priceCents: number) {
  return (priceCents / 100).toFixed(2);
}

function parsePriceInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

export default function AdminStudioOwnerProducts() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/produits/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const utils = trpc.useUtils();
  const query = trpc.admin.studio.getOwnerProductDrafts.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });
  const [products, setProducts] = useState<ProductDraft[]>([]);
  const [initialProducts, setInitialProducts] = useState<ProductDraft[]>([]);

  useEffect(() => {
    if (!query.data) return;
    const next = copyProducts(query.data.products);
    setProducts(next);
    setInitialProducts(next);
  }, [query.data]);

  const collections = query.data?.collections ?? [] as Collection[];
  const collectionById = useMemo(() => new Map(collections.map(collection => [collection.id, collection])), [collections]);
  const currencyCode = query.data?.currencyCode || "CHF";
  const formatPrice = (priceCents: number) => new Intl.NumberFormat("fr-CH", { style: "currency", currency: currencyCode, minimumFractionDigits: 2 }).format(priceCents / 100);

  const saveMutation = trpc.admin.studio.saveOwnerProductDrafts.useMutation({
    onSuccess: async () => {
      toast.success("Fiches produits privées enregistrées.");
      await Promise.all([
        utils.admin.studio.getOwnerProductDrafts.invalidate({ storeId }),
        utils.admin.studio.getGiftStorePreparationChecklist.invalidate({ storeId }),
        utils.admin.studio.getGiftStoreLaunchCenter.invalidate({ storeId }),
      ]);
    },
    onError: error => toast.error(error.message || "Les fiches produits n’ont pas pu être enregistrées."),
  });

  const changed = JSON.stringify(products) !== JSON.stringify(initialProducts);
  const update = (index: number, patch: Partial<ProductDraft>) => setProducts(current => current.map((item, currentIndex) => currentIndex === index ? { ...item, ...patch } : item));
  const remove = (index: number) => setProducts(current => current.filter((_, currentIndex) => currentIndex !== index));
  const add = () => setProducts(current => {
    if (current.length >= 24 || !collections.length) return current;
    return [...current, {
      id: `draft-${Date.now()}`,
      name: `Produit à préparer ${current.length + 1}`,
      description: "Décrivez en quelques mots l’usage, la promesse et le style de ce futur produit.",
      collectionId: collections[0].id,
      priceCents: 1990,
      featured: current.length === 0,
    }];
  });
  const invalid = products.some(product => product.name.trim().length < 2 || product.description.trim().length < 2 || product.priceCents < 1 || !collectionById.has(product.collectionId));

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Atelier privé Studio</Badge><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-900">Fiches et prix de préparation</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Préparer les fiches produits</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Rédigez les premières fiches et leurs prix de présentation. Elles restent des brouillons isolés : aucun produit réel, stock, fournisseur, panier ou publication n’est créé à cette étape.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/collections/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Collections</Button></header>

    {query.isLoading ? <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_390px]"><div className="h-[620px] animate-pulse rounded-3xl bg-slate-100" /><div className="h-[420px] animate-pulse rounded-3xl bg-slate-100" /></div> : query.isError || !query.data ? <Unavailable /> : <>
      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950"><div className="flex gap-3"><PackagePlus className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{query.data.store.displayName} · état `setup`</p><p className="mt-1">Préparez jusqu’à 24 fiches dans la devise {currencyCode}. Les prix sont uniquement des valeurs de travail visibles dans Studio : ils ne sont pas transmis à un panier, un paiement ou un fournisseur.</p></div></div></section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_390px]">
        <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Offre de préparation</CardDescription><CardTitle className="mt-1 text-xl">Vos futures fiches</CardTitle></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">{products.length} / 24</Badge></div></CardHeader><CardContent className="space-y-4 p-4 sm:p-6">
          {!collections.length ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">Préparez d’abord une collection.</p><p className="mt-1">Une fiche produit doit être rattachée à une collection de présentation. Revenez à l’atelier précédent, créez au moins une collection, puis enregistrez-la.</p></div> : products.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><WalletCards className="mx-auto h-7 w-7 text-slate-500" /><p className="mt-3 font-bold text-slate-950">Aucune fiche produit préparée</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">Commencez par une fiche claire. Vous pourrez compléter plus tard le stock, les images, variantes et références fournisseur dans des ateliers distincts.</p></div> : null}
          {products.map((product, index) => <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-950">Fiche {index + 1}</p><p className="mt-1 text-xs text-slate-500">Brouillon privé · jamais visible sur le site à ce stade</p></div><Button type="button" variant="ghost" size="icon" aria-label="Retirer la fiche produit" onClick={() => remove(index)} className="shrink-0 text-rose-700 hover:bg-rose-50 hover:text-rose-800"><Trash2 className="h-4 w-4" /></Button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label htmlFor={`product-name-${index}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Nom du produit</Label><Input id={`product-name-${index}`} value={product.name} maxLength={120} onChange={event => update(index, { name: event.target.value })} className="mt-2 border-slate-300" /></div><div><Label htmlFor={`product-collection-${index}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Collection</Label><select id={`product-collection-${index}`} value={product.collectionId} onChange={event => update(index, { collectionId: event.target.value })} className="mt-2 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400"><option value="" disabled>Choisir une collection</option>{collections.map(collection => <option key={collection.id} value={collection.id}>{collection.title}</option>)}</select></div></div><div className="mt-4"><Label htmlFor={`product-description-${index}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Description courte</Label><Textarea id={`product-description-${index}`} value={product.description} maxLength={700} rows={4} onChange={event => update(index, { description: event.target.value })} className="mt-2 resize-y border-slate-300" /><p className="mt-1 text-right text-xs text-slate-500">{product.description.length}/700</p></div><div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div><Label htmlFor={`product-price-${index}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Prix de présentation · {currencyCode}</Label><Input id={`product-price-${index}`} inputMode="decimal" value={priceInputValue(product.priceCents)} onChange={event => update(index, { priceCents: parsePriceInput(event.target.value) })} className="mt-2 border-slate-300" /><p className="mt-1 text-xs text-slate-500">Visible uniquement dans cet aperçu privé.</p></div><div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><div><Label htmlFor={`product-featured-${index}`} className="text-sm font-semibold text-slate-950">Mettre en avant</Label><p className="mt-0.5 text-xs leading-5 text-slate-600">Ajoute un repère dans la maquette privée.</p></div><Switch id={`product-featured-${index}`} checked={product.featured} onCheckedChange={featured => update(index, { featured })} /></div></div></article>)}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="outline" disabled={!collections.length || products.length >= 24} onClick={add} className="border-slate-300 bg-white"><Plus className="mr-2 h-4 w-4" /> Ajouter une fiche</Button><Button type="button" onClick={() => saveMutation.mutate({ storeId, products })} disabled={!changed || invalid || saveMutation.isPending} className="bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Enregistrement…" : "Enregistrer les brouillons"}</Button></div>
        </CardContent></Card>

        <aside className="space-y-5"><Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex items-center justify-between"><div><CardDescription>Aperçu privé</CardDescription><CardTitle className="mt-1 text-xl">Première sélection</CardTitle></div><Eye className="h-5 w-5 text-slate-500" /></div></CardHeader><CardContent className="p-5"><div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400"><Sparkles className="h-4 w-4" /> À préparer</div><p className="mt-3 text-xl font-bold tracking-tight">Une offre qui prend forme</p><p className="mt-2 text-sm leading-6 text-slate-300">Cette sélection n’est visible que dans Studio. Aucun bouton d’achat ni panier n’est affiché.</p></div><div className="mt-4 space-y-3">{products.length ? products.map(product => <div key={`preview-${product.id}`} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-950">{product.name || "Produit à définir"}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{collectionById.get(product.collectionId)?.title || "Collection à choisir"}</p></div>{product.featured && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950">À la une</span>}</div><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{product.description || "Description à définir"}</p><p className="mt-3 text-sm font-bold text-slate-950">{formatPrice(product.priceCents)}</p></div>) : <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">Les futures fiches produits apparaîtront ici.</p>}</div></CardContent></Card>
          <Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4" /> Limite volontaire</p><p className="mt-2">Les produits réels, les images produit, les variantes, le stock, les SKU, les références fournisseur, la livraison, le panier et la publication seront traités séparément. Rien de cet atelier ne peut être acheté ou transmis à un tiers.</p></CardContent></Card>
        </aside>
      </section>
    </>}
  </main></DashboardLayout>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Atelier de fiches produits indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
