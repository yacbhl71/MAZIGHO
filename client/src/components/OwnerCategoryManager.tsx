import { useMemo, useState } from "react";
import { ImagePlus, Loader2, PencilLine, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder?: number | null;
  catalogSection?: "standard" | "creations" | null;
};

type Product = { categoryId?: number | null };

type CategoryForm = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
  catalogSection: "standard" | "creations";
};

const emptyCategory = (displayOrder = 0): CategoryForm => ({
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  displayOrder: String(displayOrder),
  catalogSection: "standard",
});

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 220);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OwnerCategoryManager({ categories, products, onUpdated }: { categories: Category[]; products: Product[]; onUpdated: () => void | Promise<void> }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(() => emptyCategory());
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const orderedCategories = useMemo(() => [...categories].sort((left, right) => Number(left.displayOrder ?? 0) - Number(right.displayOrder ?? 0) || left.name.localeCompare(right.name, "fr")), [categories]);
  const productCounts = useMemo(() => products.reduce<Record<number, number>>((counts, product) => {
    if (typeof product.categoryId === "number") counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
    return counts;
  }, {}), [products]);

  const refresh = async () => {
    await Promise.all([
      utils.owner.getWorkspace.invalidate(),
      utils.categories.getAll.invalidate(),
    ]);
    await onUpdated();
  };

  const createCategory = trpc.owner.createCategory.useMutation({
    onSuccess: async () => {
      toast.success("Catégorie ajoutée à votre boutique.");
      setOpen(false);
      setForm(emptyCategory(categories.length * 10 + 10));
      await refresh();
    },
    onError: error => toast.error(error.message || "La catégorie n’a pas pu être ajoutée."),
  });
  const updateCategory = trpc.owner.updateCategory.useMutation({
    onSuccess: async () => {
      toast.success("Catégorie enregistrée.");
      setOpen(false);
      setForm(emptyCategory(categories.length * 10 + 10));
      await refresh();
    },
    onError: error => toast.error(error.message || "La catégorie n’a pas pu être enregistrée."),
  });
  const deleteCategory = trpc.owner.deleteCategory.useMutation({
    onSuccess: async () => {
      toast.success("Catégorie supprimée.");
      setDeleteTarget(null);
      setDeleteConfirmation("");
      await refresh();
    },
    onError: error => toast.error(error.message || "Cette catégorie ne peut pas être supprimée tant qu’elle contient des produits."),
  });
  const upload = trpc.owner.uploadImage.useMutation({ onError: error => toast.error(error.message || "L’image n’a pas pu être téléversée.") });

  const isSaving = createCategory.isPending || updateCategory.isPending;
  const nextOrder = (Math.max(-10, ...categories.map(category => Number(category.displayOrder ?? 0))) + 10);
  const openCreate = () => { setForm(emptyCategory(nextOrder)); setOpen(true); };
  const openEdit = (category: Category) => {
    setForm({
      id: category.id,
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      displayOrder: String(category.displayOrder ?? 0),
      catalogSection: category.catalogSection === "creations" ? "creations" : "standard",
    });
    setOpen(true);
  };
  const submit = () => {
    const displayOrder = Number(form.displayOrder);
    if (form.name.trim().length < 2 || form.slug.trim().length < 2) { toast.error("Indiquez un nom et un identifiant de catégorie."); return; }
    if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 999_999) { toast.error("L’ordre doit être un nombre entier entre 0 et 999 999."); return; }
    const payload = { name: form.name.trim(), slug: slugify(form.slug), description: form.description.trim(), imageUrl: form.imageUrl.trim(), displayOrder, catalogSection: form.catalogSection };
    if (form.id) updateCategory.mutate({ id: form.id, ...payload });
    else createCategory.mutate(payload);
  };
  const uploadImage = async (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) { toast.error("Choisissez une image PNG, JPEG ou WebP."); return; }
    const dataUrl = await fileToDataUrl(file);
    const result = await upload.mutateAsync({ dataUrl, fileName: file.name });
    setForm(current => ({ ...current, imageUrl: result.url }));
  };
  const categoryProductCount = deleteTarget ? productCounts[deleteTarget.id] || 0 : 0;
  const canDelete = Boolean(deleteTarget && categoryProductCount === 0 && deleteConfirmation.trim() === deleteTarget.name.trim());

  return <div className="space-y-5">
    <Card className="border-teal-100">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-teal-700" /> Catégories de votre boutique</CardTitle><CardDescription className="mt-1 max-w-3xl">Créez et organisez les catégories qui alimentent votre catalogue, votre menu et les cartes « univers » de l’accueil. Chaque catégorie est isolée à votre boutique.</CardDescription></div>
          <Button type="button" onClick={openCreate} className="min-h-11 bg-teal-700 hover:bg-teal-800"><Plus className="mr-2 h-4 w-4" /> Ajouter une catégorie</Button>
        </div>
      </CardHeader>
      <CardContent>
        {orderedCategories.length === 0 ? <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50 p-8 text-center"><ImagePlus className="mx-auto h-8 w-8 text-teal-700" /><p className="mt-3 font-semibold text-teal-950">Aucune catégorie pour le moment.</p><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-teal-900">Ajoutez une première catégorie pour organiser vos produits et préparer les cartes de votre accueil.</p><Button type="button" onClick={openCreate} className="mt-5 min-h-11 bg-teal-700 hover:bg-teal-800"><Plus className="mr-2 h-4 w-4" /> Créer la première catégorie</Button></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{orderedCategories.map(category => {
          const productCount = productCounts[category.id] || 0;
          const isCreation = category.catalogSection === "creations";
          return <article key={category.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative aspect-[16/8] bg-gradient-to-br from-teal-50 via-slate-50 to-white">{category.imageUrl ? <img src={category.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-teal-700"><ImagePlus className="h-8 w-8" /></div>}<Badge className={`absolute left-3 top-3 border-0 ${isCreation ? "bg-violet-100 text-violet-900 hover:bg-violet-100" : "bg-teal-100 text-teal-900 hover:bg-teal-100"}`}>{isCreation ? "Créations" : "Catalogue"}</Badge></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-slate-950">{category.name}</h3><p className="mt-1 truncate text-xs text-slate-500">/{category.slug}</p></div><Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 text-slate-700">Ordre {category.displayOrder ?? 0}</Badge></div><p className="mt-3 line-clamp-3 min-h-[3.75rem] text-sm leading-6 text-slate-600">{category.description || "Sans description pour le moment."}</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><span className="text-xs font-medium text-slate-500">{productCount} produit{productCount > 1 ? "s" : ""}</span><div className="flex gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10 border-teal-200 text-teal-800 hover:bg-teal-50" onClick={() => openEdit(category)}><PencilLine className="mr-1.5 h-4 w-4" /> Modifier</Button><Button type="button" size="icon" variant="outline" aria-label={`Supprimer ${category.name}`} disabled={productCount > 0} title={productCount > 0 ? "Déplacez ou supprimez d’abord les produits de cette catégorie." : "Supprimer la catégorie"} className="min-h-10 min-w-10 border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { setDeleteTarget(category); setDeleteConfirmation(""); }}><Trash2 className="h-4 w-4" /></Button></div></div></div></article>;
        })}</div>}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600"><p className="font-semibold text-slate-800">Suppression protégée</p><p className="mt-1">Une catégorie qui contient encore des produits ne peut pas être supprimée. Déplacez d’abord ses produits vers une autre catégorie pour préserver le catalogue et les liens publics.</p></div>
      </CardContent>
    </Card>

    <Dialog open={open} onOpenChange={nextOpen => { if (!isSaving) setOpen(nextOpen); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{form.id ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle><DialogDescription>Le nom, la description, l’image, l’ordre et l’univers sont modifiables. L’image alimente directement les cartes de catégories de votre vitrine.</DialogDescription></DialogHeader><div className="grid gap-5 py-2"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]"><div className="space-y-2"><Label htmlFor="owner-category-name">Nom de catégorie</Label><Input id="owner-category-name" value={form.name} maxLength={100} placeholder="Ex. Diamond Painting" onChange={event => setForm(current => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} /></div><div className="space-y-2"><Label htmlFor="owner-category-order">Ordre d’affichage</Label><Input id="owner-category-order" type="number" inputMode="numeric" min="0" max="999999" value={form.displayOrder} onChange={event => setForm(current => ({ ...current, displayOrder: event.target.value }))} /></div></div><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]"><div className="space-y-2"><Label htmlFor="owner-category-slug">Identifiant de l’adresse</Label><Input id="owner-category-slug" value={form.slug} maxLength={220} placeholder="diamond-painting" onChange={event => setForm(current => ({ ...current, slug: slugify(event.target.value) }))} /><p className="text-xs leading-5 text-slate-500">Minuscules, chiffres et tirets : <code>/categorie/{form.slug || "votre-categorie"}</code></p></div><div className="space-y-2"><Label htmlFor="owner-category-section">Univers de vitrine</Label><select id="owner-category-section" value={form.catalogSection} onChange={event => setForm(current => ({ ...current, catalogSection: event.target.value === "creations" ? "creations" : "standard" }))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="standard">Catalogue</option><option value="creations">Créations</option></select></div></div><div className="space-y-2"><Label htmlFor="owner-category-description">Description</Label><Textarea id="owner-category-description" rows={4} maxLength={2000} value={form.description} placeholder="Présentez en quelques phrases ce que les visiteurs trouveront dans cette catégorie." onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></div><div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><Label htmlFor="owner-category-image">Image de catégorie</Label><p className="mt-1 text-xs leading-5 text-slate-500">PNG, JPEG ou WebP. L’image est conservée dans l’espace média de votre boutique.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-teal-200 bg-white px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"><Upload className="mr-2 h-4 w-4" />{upload.isPending ? "Téléversement…" : "Téléverser"}<input id="owner-category-image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={upload.isPending} onChange={event => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} /></label></div><div className="flex gap-4"><div className="grid h-24 w-36 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white">{form.imageUrl ? <img src={form.imageUrl} alt="Aperçu catégorie" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-slate-400" />}</div><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="owner-category-image-url">Ou adresse de l’image</Label><Input id="owner-category-image-url" value={form.imageUrl} maxLength={1000} placeholder="https://… ou /assets/…" onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} /><p className="text-xs leading-5 text-slate-500">Vous pouvez effacer l’adresse pour afficher une carte sans image.</p></div></div></div></div><DialogFooter><Button type="button" variant="outline" disabled={isSaving} onClick={() => setOpen(false)}>Annuler</Button><Button type="button" className="min-h-11 bg-teal-700 hover:bg-teal-800" disabled={isSaving} onClick={submit}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{form.id ? "Enregistrer la catégorie" : "Ajouter la catégorie"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(deleteTarget)} onOpenChange={nextOpen => { if (!deleteCategory.isPending && !nextOpen) { setDeleteTarget(null); setDeleteConfirmation(""); } }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-900"><Trash2 className="h-5 w-5" /> Supprimer une catégorie</DialogTitle><DialogDescription>Cette action retire uniquement cette catégorie de votre boutique. Le catalogue des autres boutiques et MAZIGHO Studio ne sont jamais concernés.</DialogDescription></DialogHeader>{deleteTarget && <div className="space-y-4"><div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><p><strong>Catégorie :</strong> {deleteTarget.name}</p><p className="mt-1"><strong>Produits associés :</strong> {categoryProductCount}</p>{categoryProductCount > 0 && <p className="mt-3 font-semibold">Déplacez ou supprimez les produits associés avant de pouvoir supprimer cette catégorie.</p>}</div>{categoryProductCount === 0 && <div className="space-y-2"><Label htmlFor="owner-delete-category-confirmation">Recopiez le nom de la catégorie</Label><Input id="owner-delete-category-confirmation" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} placeholder={deleteTarget.name} /></div>}</div>}<DialogFooter><Button type="button" variant="outline" disabled={deleteCategory.isPending} onClick={() => { setDeleteTarget(null); setDeleteConfirmation(""); }}>Annuler</Button><Button type="button" variant="destructive" disabled={!canDelete || deleteCategory.isPending} onClick={() => deleteTarget && deleteCategory.mutate({ id: deleteTarget.id })}>{deleteCategory.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Supprimer définitivement</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
