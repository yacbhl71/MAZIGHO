import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, LockKeyhole, PackagePlus, PencilLine, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";

type Category = { id: number; name: string; slug: string; description: string | null; displayOrder: number };
type Product = { id: number; categoryId: number; name: string; slug: string; description: string | null; longDescription: string | null; price: number; stock: number; featured: boolean; status: "active" | "draft" | "archived" };

export default function AdminStudioOwnerExistingCatalogueEditor() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/catalogue-existant/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const utils = trpc.useUtils();
  const query = trpc.admin.studio.getOwnerExistingCatalogue.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false, refetchOnWindowFocus: false });
  const [addOpen, setAddOpen] = useState(false);
  const saveCategory = trpc.admin.studio.saveOwnerExistingCatalogueCategory.useMutation({ onSuccess: () => utils.admin.studio.getOwnerExistingCatalogue.invalidate({ storeId }) });
  const saveProduct = trpc.admin.studio.saveOwnerExistingCatalogueProduct.useMutation({ onSuccess: () => utils.admin.studio.getOwnerExistingCatalogue.invalidate({ storeId }) });
  const createProduct = trpc.admin.studio.createOwnerExistingCatalogueProduct.useMutation({ onSuccess: () => { setAddOpen(false); utils.admin.studio.getOwnerExistingCatalogue.invalidate({ storeId }); } });

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;
  if (query.isLoading) return <DashboardLayout><main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8"><div className="h-[680px] animate-pulse rounded-3xl bg-slate-100" /></main></DashboardLayout>;
  if (query.isError || !query.data) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;
  const catalogue = query.data;
  const categories = catalogue.categories as Category[];
  const products = catalogue.products as Product[];

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Éditeur privé Studio</Badge><Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-950">Catalogue réel conservé</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Compléter le catalogue existant</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Vous avez choisi de préserver le kit animalier. Modifiez ses catégories et sa fiche, ou ajoutez de nouvelles fiches. Les changements sont réels dans le catalogue mais la boutique reste en `setup`, donc non publique.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/publication-catalogue/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Publication contrôlée</Button></header>

    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{catalogue.store.displayName} reste protégée.</p><p className="mt-1">Aucun enregistrement de cette page ne rend le storefront, le panier, le checkout ou le paiement accessibles au public.</p></div></div></section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><CardDescription>Base existante à préserver</CardDescription><CardTitle className="mt-1 text-xl">Catégories</CardTitle></CardHeader><CardContent className="space-y-4 p-5">{categories.map(category => <CategoryEditor key={category.id} category={category} pending={saveCategory.isPending} onSave={input => saveCategory.mutate({ storeId, ...input })} />)}</CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Fiches réelles, non publiques</CardDescription><CardTitle className="mt-1 text-xl">Produits</CardTitle></div><Button type="button" onClick={() => setAddOpen(value => !value)} className="min-h-11 bg-teal-700 text-white hover:bg-teal-800"><PackagePlus className="mr-2 h-4 w-4" /> Ajouter une fiche</Button></div></CardHeader><CardContent className="space-y-5 p-5">{addOpen ? <NewProductEditor categories={categories} pending={createProduct.isPending} onCancel={() => setAddOpen(false)} onCreate={input => createProduct.mutate({ storeId, ...input })} /> : null}{products.map(product => <ProductEditor key={product.id} product={product} categories={categories} pending={saveProduct.isPending} onSave={input => saveProduct.mutate({ storeId, ...input })} />)}{!products.length ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Aucune fiche réelle. Ajoutez une première fiche dans une catégorie existante.</p> : null}</CardContent></Card></div>
      <aside className="space-y-5"><Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><PencilLine className="h-4 w-4" /> Portée de cet éditeur</p><p className="mt-2">Il modifie uniquement le texte, prix, stock, catégorie et mise en avant. Les images, variantes, fournisseurs, livraisons et paiements restent des étapes distinctes.</p></CardContent></Card><Card className="border-slate-200"><CardContent className="p-5 text-sm leading-6 text-slate-700"><p className="font-bold text-slate-950">Après vos modifications</p><p className="mt-2">Revenez à l’aperçu privé pour vérifier la présentation. L’ouverture publique reste séparée et demande son prévol ainsi qu’une confirmation explicite.</p><Button type="button" variant="outline" className="mt-4 min-h-11 w-full border-slate-300" onClick={() => setLocation(`/admin/studio/apercu/${storeId}`)}>Voir l’aperçu privé</Button></CardContent></Card></aside>
    </section>
  </main></DashboardLayout>;
}

function CategoryEditor({ category, pending, onSave }: { category: Category; pending: boolean; onSave: (input: { categoryId: number; name: string; description: string }) => void }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  return <article className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor={`category-name-${category.id}`}>Nom de catégorie</Label><Input id={`category-name-${category.id}`} value={name} onChange={event => setName(event.target.value)} /></div><Button type="button" disabled={pending || name.trim().length < 2} onClick={() => onSave({ categoryId: category.id, name: name.trim(), description: description.trim() })} className="min-h-11 bg-slate-900 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" /> Enregistrer</Button></div><div className="mt-3 space-y-2"><Label htmlFor={`category-description-${category.id}`}>Description</Label><Textarea id={`category-description-${category.id}`} value={description} onChange={event => setDescription(event.target.value)} rows={3} /></div><p className="mt-2 text-xs text-slate-500">Slug actuel : /{category.slug} — il sera ajusté automatiquement si le nom change.</p></article>;
}

function ProductEditor({ product, categories, pending, onSave }: { product: Product; categories: Category[]; pending: boolean; onSave: (input: { productId: number; categoryId: number; name: string; description: string; longDescription: string; priceCents: number; stock: number; featured: boolean }) => void }) {
  const [categoryId, setCategoryId] = useState(String(product.categoryId));
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [longDescription, setLongDescription] = useState(product.longDescription || "");
  const [price, setPrice] = useState((product.price / 100).toFixed(2));
  const [stock, setStock] = useState(String(product.stock));
  const [featured, setFeatured] = useState(product.featured);
  const priceCents = Math.round(Number(price.replace(",", ".")) * 100);
  const stockValue = Math.max(0, Math.round(Number(stock) || 0));
  const valid = name.trim().length >= 2 && Number.isFinite(priceCents) && priceCents >= 0 && Number.isInteger(Number(categoryId));
  return <article className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-950">{product.name}</p><p className="mt-1 text-xs text-slate-500">/{product.slug} · statut {product.status}</p></div><Label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><Checkbox checked={featured} onCheckedChange={value => setFeatured(value === true)} /> Mettre à la une</Label></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Nom" id={`product-name-${product.id}`} value={name} setValue={setName} /><div className="space-y-2"><Label htmlFor={`product-category-${product.id}`}>Catégorie</Label><select id={`product-category-${product.id}`} value={categoryId} onChange={event => setCategoryId(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Choisir</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><Field label="Prix CHF" id={`product-price-${product.id}`} value={price} setValue={setPrice} inputMode="decimal" /><Field label="Stock" id={`product-stock-${product.id}`} value={stock} setValue={setStock} inputMode="numeric" /></div><div className="mt-4 space-y-2"><Label htmlFor={`product-description-${product.id}`}>Accroche / description courte</Label><Textarea id={`product-description-${product.id}`} value={description} onChange={event => setDescription(event.target.value)} rows={3} /></div><div className="mt-4 space-y-2"><Label htmlFor={`product-long-description-${product.id}`}>Description détaillée</Label><Textarea id={`product-long-description-${product.id}`} value={longDescription} onChange={event => setLongDescription(event.target.value)} rows={5} /></div><div className="mt-4 flex justify-end"><Button type="button" disabled={pending || !valid} onClick={() => onSave({ productId: product.id, categoryId: Number(categoryId), name: name.trim(), description: description.trim(), longDescription: longDescription.trim(), priceCents, stock: stockValue, featured })} className="min-h-11 bg-slate-900 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" /> Enregistrer la fiche</Button></div></article>;
}

function NewProductEditor({ categories, pending, onCancel, onCreate }: { categories: Category[]; pending: boolean; onCancel: () => void; onCreate: (input: { categoryId: number; name: string; description: string; longDescription: string; priceCents: number; stock: number; featured: boolean }) => void }) {
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id || ""));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [featured, setFeatured] = useState(false);
  const priceCents = Math.round(Number(price.replace(",", ".")) * 100);
  const valid = name.trim().length >= 2 && Number.isFinite(priceCents) && priceCents >= 1 && Number.isInteger(Number(categoryId));
  return <article className="rounded-2xl border border-teal-200 bg-teal-50 p-4"><div className="flex items-center justify-between"><p className="font-bold text-teal-950">Nouvelle fiche réelle</p><Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Nom" id="new-product-name" value={name} setValue={setName} /><div className="space-y-2"><Label htmlFor="new-product-category">Catégorie</Label><select id="new-product-category" value={categoryId} onChange={event => setCategoryId(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><Field label="Prix CHF" id="new-product-price" value={price} setValue={setPrice} inputMode="decimal" /><Field label="Stock" id="new-product-stock" value={stock} setValue={setStock} inputMode="numeric" /></div><div className="mt-4 space-y-2"><Label htmlFor="new-product-description">Accroche / description courte</Label><Textarea id="new-product-description" value={description} onChange={event => setDescription(event.target.value)} rows={3} /></div><div className="mt-4 space-y-2"><Label htmlFor="new-product-long-description">Description détaillée</Label><Textarea id="new-product-long-description" value={longDescription} onChange={event => setLongDescription(event.target.value)} rows={5} /></div><Label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-teal-950"><Checkbox checked={featured} onCheckedChange={value => setFeatured(value === true)} /> Mettre à la une</Label><div className="mt-4 flex justify-end"><Button type="button" disabled={pending || !valid} onClick={() => onCreate({ categoryId: Number(categoryId), name: name.trim(), description: description.trim(), longDescription: longDescription.trim(), priceCents, stock: Math.max(0, Math.round(Number(stock) || 0)), featured })} className="min-h-11 bg-teal-700 text-white hover:bg-teal-800"><PackagePlus className="mr-2 h-4 w-4" /> Ajouter au catalogue</Button></div></article>;
}

function Field({ label, id, value, setValue, inputMode }: { label: string; id: string; value: string; setValue: (value: string) => void; inputMode?: "decimal" | "numeric" }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} inputMode={inputMode} onChange={event => setValue(event.target.value)} /></div>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Éditeur de catalogue indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
