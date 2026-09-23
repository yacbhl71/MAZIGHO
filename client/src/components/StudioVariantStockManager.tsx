import { useMemo, useState } from "react";
import { Loader2, PackagePlus, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductOption = { name: string; values: string[] };
type ManagedVariant = { id: number; label: string; sku: string | null; priceAdjustmentCents: number; stock: number; status: "active" | "inactive"; displayOrder: number };
type VariantDraft = { id?: number; label: string; sku: string; priceAdjustment: string; stock: string; status: "active" | "inactive" };

const emptyDraft = (): VariantDraft => ({ label: "", sku: "", priceAdjustment: "0", stock: "0", status: "active" });

function displayAdjustment(cents: number) {
  if (cents === 0) return "Prix de base";
  return `${cents > 0 ? "+" : "−"}${(Math.abs(cents) / 100).toFixed(2)} CHF`;
}

export default function StudioVariantStockManager({ storeId, productId, basePriceCents, options }: { storeId: number; productId: number; basePriceCents: number; options: ProductOption[] }) {
  const utils = trpc.useUtils();
  const variantsQuery = trpc.admin.studio.getOwnerExistingCatalogueProductVariants.useQuery({ storeId, productId }, { retry: false, refetchOnWindowFocus: false });
  const [draft, setDraft] = useState<VariantDraft | null>(null);
  const [formError, setFormError] = useState("");
  const create = trpc.admin.studio.createOwnerExistingCatalogueProductVariant.useMutation({
    onSuccess: async () => {
      setDraft(null);
      setFormError("");
      await utils.admin.studio.getOwnerExistingCatalogueProductVariants.invalidate({ storeId, productId });
    },
    onError: error => setFormError(error.message || "La variante n’a pas pu être ajoutée."),
  });
  const update = trpc.admin.studio.updateOwnerExistingCatalogueProductVariant.useMutation({
    onSuccess: async () => {
      setDraft(null);
      setFormError("");
      await utils.admin.studio.getOwnerExistingCatalogueProductVariants.invalidate({ storeId, productId });
    },
    onError: error => setFormError(error.message || "La variante n’a pas pu être enregistrée."),
  });
  const remove = trpc.admin.studio.deleteOwnerExistingCatalogueProductVariant.useMutation({
    onSuccess: async () => {
      await utils.admin.studio.getOwnerExistingCatalogueProductVariants.invalidate({ storeId, productId });
    },
  });
  const variants = (variantsQuery.data || []) as ManagedVariant[];
  const suggestedLabels = useMemo(() => options.flatMap(option => option.values.map(value => `${option.name} : ${value}`))
    .filter(label => !variants.some(variant => variant.label.trim().toLocaleLowerCase("fr") === label.toLocaleLowerCase("fr")))
    .slice(0, 40), [options, variants]);
  const pending = create.isPending || update.isPending;

  const beginCreate = (label = "") => {
    setFormError("");
    setDraft({ ...emptyDraft(), label });
  };
  const beginEdit = (variant: ManagedVariant) => {
    setFormError("");
    setDraft({ id: variant.id, label: variant.label, sku: variant.sku || "", priceAdjustment: (variant.priceAdjustmentCents / 100).toFixed(2), stock: String(variant.stock), status: variant.status });
  };
  const submit = () => {
    if (!draft) return;
    const priceAdjustmentCents = Math.round(Number(draft.priceAdjustment.replace(",", ".")) * 100);
    const stock = Math.round(Number(draft.stock));
    if (draft.label.trim().length < 1) return setFormError("Indiquez le nom de la variante, par exemple « Taille : S ».");
    if (!Number.isFinite(stock) || stock < 0 || stock > 1_000_000) return setFormError("Indiquez une quantité entière comprise entre 0 et 1 000 000.");
    if (!Number.isFinite(priceAdjustmentCents) || priceAdjustmentCents < -10_000_000 || priceAdjustmentCents > 10_000_000) return setFormError("L’ajustement de prix est invalide.");
    const variant = { label: draft.label.trim(), sku: draft.sku.trim() || null, priceAdjustmentCents, stock, status: draft.status };
    if (draft.id) update.mutate({ storeId, productId, variantId: draft.id, variant });
    else create.mutate({ storeId, productId, variant });
  };

  return <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-amber-950"><PackagePlus className="h-4 w-4" /> Stock et prix par variante</p><p className="mt-1 max-w-3xl text-xs leading-5 text-amber-900">Créez une ligne pour chaque Taille, Couleur, Dimension, Modèle, Parfum ou combinaison. Chaque ligne possède sa propre quantité, son statut et, si besoin, son ajustement de prix.</p></div><Button type="button" onClick={() => beginCreate()} disabled={Boolean(draft)} className="min-h-11 bg-amber-700 text-white hover:bg-amber-800"><Plus className="mr-2 h-4 w-4" /> Ajouter une variante</Button></div>
    <div className="mt-4 rounded-xl border border-amber-200 bg-white/80 p-3 text-xs leading-5 text-amber-950"><strong>Règle simple :</strong> dès qu’au moins une variante est active, la boutique utilise ces quantités individuelles à la place du stock global. Une variante à 0 apparaît en rupture ; inactive, elle n’est pas proposée au client.</div>

    {suggestedLabels.length > 0 ? <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Créer depuis les choix déjà saisis</p><div className="mt-2 flex flex-wrap gap-2">{suggestedLabels.map(label => <Button key={label} type="button" size="sm" variant="outline" disabled={Boolean(draft)} onClick={() => beginCreate(label)} className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100">+ {label}</Button>)}</div></div> : null}

    {draft ? <div className="mt-4 rounded-xl border border-amber-300 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-950">{draft.id ? "Modifier la variante" : "Nouvelle variante avec stock"}</p><p className="mt-1 text-xs leading-5 text-slate-600">Exemples : « Taille : S », « Couleur : Noir », « Dimension : 30×40 cm » ou « Noir / Taille S ».</p></div><Button type="button" size="icon" variant="ghost" aria-label="Fermer" onClick={() => { setDraft(null); setFormError(""); }}><X className="h-4 w-4" /></Button></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div className="space-y-2 xl:col-span-2"><Label htmlFor={`studio-variant-label-${productId}`}>Nom affiché au client</Label><Input id={`studio-variant-label-${productId}`} value={draft.label} maxLength={160} placeholder="Ex. Taille : S" onChange={event => setDraft(current => current ? { ...current, label: event.target.value } : current)} /></div><div className="space-y-2"><Label htmlFor={`studio-variant-stock-${productId}`}>Quantité en stock</Label><Input id={`studio-variant-stock-${productId}`} value={draft.stock} inputMode="numeric" type="number" min="0" max="1000000" onChange={event => setDraft(current => current ? { ...current, stock: event.target.value } : current)} /></div><div className="space-y-2"><Label htmlFor={`studio-variant-status-${productId}`}>Disponibilité</Label><select id={`studio-variant-status-${productId}`} value={draft.status} onChange={event => setDraft(current => current ? { ...current, status: event.target.value as VariantDraft["status"] } : current)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="active">Disponible à la vente</option><option value="inactive">Masquée / indisponible</option></select></div><div className="space-y-2"><Label htmlFor={`studio-variant-adjustment-${productId}`}>Ajustement prix CHF</Label><Input id={`studio-variant-adjustment-${productId}`} value={draft.priceAdjustment} inputMode="decimal" placeholder="0.00" onChange={event => setDraft(current => current ? { ...current, priceAdjustment: event.target.value } : current)} /></div><div className="space-y-2 xl:col-span-2"><Label htmlFor={`studio-variant-sku-${productId}`}>Référence interne (facultatif)</Label><Input id={`studio-variant-sku-${productId}`} value={draft.sku} maxLength={100} placeholder="Ex. TSHIRT-NOIR-S" onChange={event => setDraft(current => current ? { ...current, sku: event.target.value } : current)} /></div><div className="flex items-end xl:col-span-1"><Button type="button" disabled={pending} onClick={submit} className="min-h-10 w-full bg-slate-950 text-white hover:bg-slate-800">{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer</>}</Button></div></div>{formError ? <p className="mt-3 text-sm text-rose-700">{formError}</p> : null}</div> : null}

    <div className="mt-4 space-y-3">{variantsQuery.isLoading ? <div className="h-24 animate-pulse rounded-xl bg-amber-100" /> : null}{!variantsQuery.isLoading && variants.length === 0 ? <p className="rounded-xl border border-dashed border-amber-300 bg-white/70 p-4 text-sm leading-6 text-amber-950">Aucune quantité par variante. Le stock global du produit reste utilisé tant que vous n’ajoutez pas une première ligne.</p> : null}{variants.map(variant => { const effectivePriceCents = basePriceCents + variant.priceAdjustmentCents; const stockState = variant.status === "inactive" ? { label: "Indisponible", className: "border-slate-300 bg-slate-100 text-slate-700" } : variant.stock === 0 ? { label: "Rupture", className: "border-rose-200 bg-rose-50 text-rose-800" } : variant.stock <= 3 ? { label: "Stock faible", className: "border-amber-300 bg-amber-100 text-amber-900" } : { label: "Disponible", className: "border-emerald-200 bg-emerald-50 text-emerald-800" }; return <div key={variant.id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-slate-950">{variant.label}</p><p className="mt-1 text-xs text-slate-500">{variant.sku ? `Réf. ${variant.sku}` : "Aucune référence interne"}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant="outline" className={stockState.className}>{stockState.label} · {variant.stock}</Badge><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{displayAdjustment(variant.priceAdjustmentCents)} · prix final {(effectivePriceCents / 100).toFixed(2)} CHF</Badge></div></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => beginEdit(variant)} disabled={Boolean(draft)}> <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Modifier</Button><Button type="button" size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" disabled={remove.isPending || Boolean(draft)} onClick={() => { if (window.confirm(`Supprimer la variante « ${variant.label} » ?`)) remove.mutate({ storeId, productId, variantId: variant.id }); }}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer</Button></div></div>; })}</div>
  </section>;
}
