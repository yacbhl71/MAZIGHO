import { useMemo, useState } from "react";
import { Boxes, Check, Edit3, Eye, EyeOff, Loader2, PackagePlus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { StoreProductBundle } from "@shared/storeProductBundles";
import { toast } from "sonner";

type OwnerBundleProduct = { id: number; name: string; status: string; stock?: number | null; price?: number | null };
type BundleForm = StoreProductBundle;

function newBundleId() {
  const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `bundle_${suffix}`;
}

function emptyBundle(): BundleForm {
  return { id: newBundleId(), name: "", description: "", productIds: [], promoCode: null, enabled: false };
}

/**
 * A selection is not a virtual SKU: it simply helps a customer choose two or
 * three real products. The normal basket and checkout remain solely responsible
 * for stock, variants, prices, delivery and any promotion code.
 */
export default function OwnerProductBundleCenter({ canManage, products }: { canManage: boolean; products: OwnerBundleProduct[] }) {
  const utils = trpc.useUtils();
  const bundlesQuery = trpc.owner.getProductBundles.useQuery(undefined, { refetchOnWindowFocus: false });
  const saveBundles = trpc.owner.saveProductBundles.useMutation({
    onSuccess: async () => {
      toast.success("Sélections enregistrées");
      setOpen(false);
      await utils.owner.getProductBundles.invalidate();
      await utils.products.getBundlesForProduct.invalidate();
    },
    onError: error => toast.error(error.message || "Les sélections n’ont pas pu être enregistrées."),
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BundleForm>(emptyBundle());
  const bundles = bundlesQuery.data || [];
  const activeProducts = useMemo(() => products.filter(product => product.status === "active"), [products]);
  const productsById = useMemo(() => new Map(products.map(product => [product.id, product])), [products]);

  const begin = () => { setEditingId(null); setForm(emptyBundle()); setOpen(true); };
  const edit = (bundle: StoreProductBundle) => { setEditingId(bundle.id); setForm({ ...bundle, productIds: [...bundle.productIds] }); setOpen(true); };
  const saveAll = (nextBundles: StoreProductBundle[]) => saveBundles.mutate({ bundles: nextBundles });

  const submit = () => {
    if (form.name.trim().length < 2) return toast.error("Donnez un nom à cette sélection.");
    if (form.productIds.length < 2) return toast.error("Choisissez au moins deux produits actifs.");
    if (form.enabled && !window.confirm(`Confirmer la diffusion de « ${form.name.trim()} » dans les fiches des produits choisis ?\n\nCette sélection sera immédiatement visible dans la vitrine francophone. Elle ne déclenche ni e-mail, ni publicité, ni réservation de stock, ni commande.`)) return;
    const next: StoreProductBundle = { ...form, name: form.name.trim(), description: form.description.trim(), promoCode: form.promoCode?.trim().toUpperCase() || null };
    saveAll(editingId ? bundles.map(bundle => bundle.id === editingId ? next : bundle) : [...bundles, next]);
  };
  const toggleProduct = (productId: number) => setForm(current => {
    const selected = current.productIds.includes(productId);
    if (!selected && current.productIds.length >= 3) { toast.info("Une sélection peut contenir au plus trois produits."); return current; }
    return { ...current, productIds: selected ? current.productIds.filter(id => id !== productId) : [...current.productIds, productId] };
  });
  const toggleBundle = (bundle: StoreProductBundle, enabled: boolean) => {
    if (enabled && !window.confirm(`Confirmer la diffusion de « ${bundle.name} » ?\n\nLa sélection sera visible dans les fiches françaises associées. Aucun e-mail, stock, prix, paiement ou code promotionnel n’est modifié.`)) return;
    saveAll(bundles.map(current => current.id === bundle.id ? { ...current, enabled } : current));
  };
  const remove = (bundle: StoreProductBundle) => {
    if (!window.confirm(`Supprimer « ${bundle.name} » ? Cette sélection ne sera plus proposée dans la vitrine.`)) return;
    saveAll(bundles.filter(current => current.id !== bundle.id));
  };

  return <section className="space-y-5" data-testid="owner-product-bundle-center">
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-indigo-950"><Boxes className="h-5 w-5 text-indigo-700" /> Duos & trios suggérés</CardTitle><CardDescription className="mt-1 max-w-3xl">Composez des sélections de 2 ou 3 produits déjà actifs. Elles apparaissent dans les fiches concernées pour faciliter la découverte, sans créer de produit virtuel.</CardDescription></div>{canManage && <Button type="button" className="min-h-11 bg-indigo-700 hover:bg-indigo-800" onClick={begin} disabled={activeProducts.length < 2}><Plus className="mr-2 h-4 w-4" /> Nouvelle sélection</Button>}</div></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/90 bg-white/85 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sélections</p><p className="mt-2 text-3xl font-bold text-slate-950">{bundles.length}</p></div><div className="rounded-xl border border-white/90 bg-white/85 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Visibles</p><p className="mt-2 text-3xl font-bold text-emerald-700">{bundles.filter(bundle => bundle.enabled).length}</p></div><div className="rounded-xl border border-white/90 bg-white/85 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Produits actifs</p><p className="mt-2 text-3xl font-bold text-indigo-700">{activeProducts.length}</p></div></CardContent>
    </Card>

    {activeProducts.length < 2 ? <Card className="border-dashed border-indigo-200"><CardContent className="p-6 text-center text-sm leading-6 text-indigo-950"><PackagePlus className="mx-auto h-7 w-7 text-indigo-700" /><p className="mt-3 font-semibold">Deux produits actifs sont nécessaires</p><p className="mt-1">Publiez au moins deux fiches de cette boutique avant de composer un duo ou un trio.</p></CardContent></Card> : null}
    {!canManage ? <Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950">Les sélections de produits sont visibles pour votre rôle, mais seul le propriétaire peut les enregistrer ou les diffuser.</CardContent></Card> : null}
    {bundlesQuery.isLoading ? <div className="h-44 animate-pulse rounded-2xl bg-slate-100" /> : bundlesQuery.isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-950">Les sélections sont temporairement indisponibles. Aucun changement n’a été appliqué.</CardContent></Card> : bundles.length === 0 ? <Card className="border-dashed border-indigo-200"><CardContent className="p-8 text-center"><Boxes className="mx-auto h-8 w-8 text-indigo-700" /><p className="mt-3 font-semibold text-slate-950">Aucun duo ou trio préparé</p><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Par exemple : un carnet, un stylo et une carte. Chaque article conservera son prix, ses options et son stock propres.</p>{canManage && activeProducts.length >= 2 ? <Button type="button" variant="outline" className="mt-4 min-h-11 border-indigo-300 text-indigo-800 hover:bg-indigo-50" onClick={begin}>Composer une sélection</Button> : null}</CardContent></Card> : <div className="grid gap-4 xl:grid-cols-2">{bundles.map(bundle => {
      const linked = bundle.productIds.map(id => productsById.get(id)).filter(Boolean) as OwnerBundleProduct[];
      const missing = bundle.productIds.length - linked.length;
      return <Card key={bundle.id} className="border-slate-200"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-bold text-slate-950">{bundle.name}</h3><Badge variant="outline" className={bundle.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}>{bundle.enabled ? "Visible" : "Brouillon"}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-600">{bundle.description || "Sans texte complémentaire."}</p></div><div className="flex items-center gap-2"><Switch checked={bundle.enabled} disabled={!canManage || saveBundles.isPending} onCheckedChange={enabled => toggleBundle(bundle, enabled)} aria-label={bundle.enabled ? `Masquer ${bundle.name}` : `Afficher ${bundle.name}`} /><span className="text-xs font-medium text-slate-600">{bundle.enabled ? "Visible" : "Masqué"}</span></div></div>
        <div className="mt-4 flex flex-wrap gap-2">{linked.map(product => <Badge key={product.id} variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-950">{product.name}</Badge>)}{missing > 0 ? <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">{missing} produit indisponible</Badge> : null}</div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs leading-5 text-slate-500">{bundle.promoCode ? `Code à saisir au panier : ${bundle.promoCode}` : "Sans code promotionnel associé"}</p>{canManage ? <div className="flex gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10" onClick={() => edit(bundle)}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Modifier</Button><Button type="button" size="sm" variant="outline" className="min-h-10 border-rose-200 text-rose-700 hover:bg-rose-50" disabled={saveBundles.isPending} onClick={() => remove(bundle)}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer</Button></div> : null}</div>
      </CardContent></Card>;
    })}</div>}

    <Card className="border-dashed border-slate-300"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" /><div><p className="font-semibold text-slate-800">Des suggestions, pas un nouveau tunnel de vente</p><p className="mt-1">Chaque produit est ajouté séparément au panier avec son prix, ses options et son stock au moment choisi par le client. Le checkout revalide ensuite toutes les lignes de manière atomique. Une sélection ne réserve rien, ne modifie aucun prix et n’applique pas automatiquement de code.</p></div></CardContent></Card>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" data-testid="owner-product-bundle-dialog"><DialogHeader><DialogTitle>{editingId ? "Modifier la sélection" : "Composer un duo ou un trio"}</DialogTitle><DialogDescription>Choisissez deux ou trois fiches actives de cette boutique. Enregistrez en brouillon ou confirmez sa diffusion dans les fiches françaises sélectionnées.</DialogDescription></DialogHeader><div className="space-y-5"><div className="space-y-2"><Label htmlFor="owner-bundle-name">Nom de la sélection</Label><Input id="owner-bundle-name" value={form.name} maxLength={120} placeholder="Ex. L’essentiel créatif" onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="owner-bundle-description">Texte complémentaire</Label><Textarea id="owner-bundle-description" rows={3} maxLength={360} placeholder="Ex. Trois idées qui vont naturellement ensemble." value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="owner-bundle-promo">Code promotionnel facultatif</Label><Input id="owner-bundle-promo" value={form.promoCode || ""} maxLength={64} placeholder="Ex. DUO10" onChange={event => setForm(current => ({ ...current, promoCode: event.target.value || null }))} /><p className="text-xs leading-5 text-slate-500">Le code est uniquement affiché au client : il doit être actif et sera vérifié normalement au panier.</p></div><div><div className="flex items-center justify-between gap-3"><Label>Produits de la sélection</Label><Badge variant="outline" className={form.productIds.length >= 2 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}>{form.productIds.length}/3 sélectionné{form.productIds.length > 1 ? "s" : ""}</Badge></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{activeProducts.map(product => { const selected = form.productIds.includes(product.id); return <button key={product.id} type="button" onClick={() => toggleProduct(product.id)} className={`min-h-16 rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 ${selected ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"}`}><span className="flex items-center justify-between gap-3"><span className="min-w-0 truncate font-semibold text-slate-950">{product.name}</span>{selected ? <Check className="h-4 w-4 shrink-0 text-indigo-700" /> : null}</span><span className="mt-1 block text-xs text-slate-600">Produit actif{typeof product.stock === "number" ? ` · stock ${product.stock}` : ""}</span></button>; })}</div></div><div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 p-4"><div><p className="text-sm font-semibold text-indigo-950">Autoriser la diffusion dans la vitrine</p><p className="mt-1 text-xs leading-5 text-indigo-900">Une confirmation explicite sera demandée à l’enregistrement.</p></div><Switch checked={form.enabled} onCheckedChange={enabled => setForm(current => ({ ...current, enabled }))} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="button" className="min-h-11 bg-indigo-700 hover:bg-indigo-800" disabled={saveBundles.isPending || form.productIds.length < 2} onClick={submit}>{saveBundles.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : form.enabled ? <><Eye className="mr-2 h-4 w-4" /> Confirmer et enregistrer</> : <><EyeOff className="mr-2 h-4 w-4" /> Enregistrer le brouillon</>}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
