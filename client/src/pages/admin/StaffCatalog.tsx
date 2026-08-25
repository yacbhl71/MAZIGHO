import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StaffWorkspaceLayout from "@/components/StaffWorkspaceLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Pencil, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

type DraftForm = { id?: number; categoryId: string; name: string; slug: string; description: string; longDescription: string; options: string; images: string };
const blankDraft: DraftForm = { categoryId: "", name: "", slug: "", description: "", longDescription: "", options: "", images: "" };

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function StaffCatalog() {
  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.staff.catalog.getCategories.useQuery();
  const { data: drafts = [], isLoading } = trpc.staff.catalog.getDrafts.useQuery();
  const [form, setForm] = useState<DraftForm>(blankDraft);

  const refresh = async () => {
    await utils.staff.catalog.getDrafts.invalidate();
  };
  const createDraft = trpc.staff.catalog.createDraft.useMutation({
    onSuccess: async () => { toast.success("Brouillon créé. Il reste invisible aux clients."); setForm(blankDraft); await refresh(); },
    onError: error => toast.error(error.message || "Création impossible."),
  });
  const updateDraft = trpc.staff.catalog.updateDraft.useMutation({
    onSuccess: async () => { toast.success("Brouillon enregistré."); setForm(blankDraft); await refresh(); },
    onError: error => toast.error(error.message || "Enregistrement impossible."),
  });
  const deleteDraft = trpc.staff.catalog.deleteDraft.useMutation({
    onSuccess: async () => { toast.success("Brouillon supprimé."); setForm(blankDraft); await refresh(); },
    onError: error => toast.error(error.message || "Suppression impossible."),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.categoryId) { toast.error("Choisissez une catégorie."); return; }
    const payload = {
      categoryId: Number(form.categoryId),
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || undefined,
      longDescription: form.longDescription.trim() || undefined,
      options: form.options.trim() || undefined,
      images: form.images.split("\n").map(value => value.trim()).filter(Boolean),
    };
    if (form.id) updateDraft.mutate({ id: form.id, ...payload });
    else createDraft.mutate(payload);
  };
  const isSaving = createDraft.isPending || updateDraft.isPending;

  return <StaffWorkspaceLayout role="catalog_editor"><div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FilePlus2 className="h-5 w-5 text-orange-600" />{form.id ? "Modifier un brouillon" : "Nouveau brouillon"}</CardTitle><CardDescription>Les produits préparés ici restent en brouillon. L’administrateur ajoute ensuite prix, livraison et publication après vérification.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="catalog-name">Nom du produit</Label><Input id="catalog-name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value, slug: form.slug || slugify(event.target.value) })} required /></div><div className="space-y-2"><Label htmlFor="catalog-slug">Identifiant URL</Label><Input id="catalog-slug" value={form.slug} onChange={event => setForm({ ...form, slug: slugify(event.target.value) })} placeholder="nom-du-produit" required /></div></div><div className="space-y-2"><Label htmlFor="catalog-category">Catégorie</Label><select id="catalog-category" value={form.categoryId} onChange={event => setForm({ ...form, categoryId: event.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required><option value="">Sélectionner…</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="catalog-description">Description courte</Label><Textarea id="catalog-description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows={3} /></div><div className="space-y-2"><Label htmlFor="catalog-long-description">Description détaillée</Label><Textarea id="catalog-long-description" value={form.longDescription} onChange={event => setForm({ ...form, longDescription: event.target.value })} rows={5} /></div><div className="space-y-2"><Label htmlFor="catalog-images">Liens d’images</Label><Textarea id="catalog-images" value={form.images} onChange={event => setForm({ ...form, images: event.target.value })} rows={3} placeholder="Une adresse d’image par ligne" /><p className="text-xs text-muted-foreground">Maximum 8 images. Utilisez uniquement des images autorisées et adaptées au produit.</p></div><div className="flex flex-wrap gap-2"><Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isSaving}><Save className="mr-2 h-4 w-4" />{form.id ? "Enregistrer" : "Créer le brouillon"}</Button>{form.id && <Button type="button" variant="outline" onClick={() => setForm(blankDraft)}>Annuler</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>Brouillons en préparation</CardTitle><CardDescription>{drafts.length} fiche(s) visible(s) uniquement à l’équipe autorisée.</CardDescription></CardHeader><CardContent className="space-y-3">{isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : drafts.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">Aucun brouillon pour le moment.</p> : drafts.map(draft => <div key={draft.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{draft.name}</p><p className="mt-1 text-sm text-muted-foreground">{draft.categoryName || "Catégorie à préciser"} · {draft.images.length} image(s)</p><Badge className="mt-2" variant="secondary">Brouillon</Badge></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setForm({ id: draft.id, categoryId: String(draft.categoryId), name: draft.name, slug: draft.slug, description: draft.description || "", longDescription: draft.longDescription || "", options: draft.options || "", images: draft.images.map(image => image.imageUrl).join("\n") })}><Pencil className="mr-1 h-4 w-4" />Modifier</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (window.confirm("Supprimer ce brouillon ?")) deleteDraft.mutate({ id: draft.id }); }}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}</CardContent></Card></div></StaffWorkspaceLayout>;
}
