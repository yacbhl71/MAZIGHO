import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Brush, CheckCircle2, FileEdit, Globe2, Layers3, Loader2, PackageOpen, Plus, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import SupplierAccountRegistry from "@/components/admin/SupplierAccountRegistry";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getCollectionVisual } from "@/lib/collectionVisuals";
import { toast } from "sonner";

const defaultIcons = ["👕", "🧥", "☕", "🖼️", "👜", "✦"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCreations() {
  const categoriesQuery = trpc.categories.getAll.useQuery("fr");
  const productsQuery = trpc.admin.products.getAll.useQuery();
  const storefrontProductsQuery = trpc.products.getAll.useQuery("fr");
  const utils = trpc.useUtils();
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("✦");

  const creativeCategories = useMemo(
    () => (categoriesQuery.data || []).filter(category => category.catalogSection === "creations"),
    [categoriesQuery.data]
  );
  const creativeCategoryIds = useMemo(() => new Set(creativeCategories.map(category => category.id)), [creativeCategories]);
  const creativeProducts = useMemo(
    () => (productsQuery.data || []).filter(product => creativeCategoryIds.has(product.categoryId)),
    [productsQuery.data, creativeCategoryIds]
  );
  const deliveryProfilesByProductId = useMemo(() => new Map((storefrontProductsQuery.data || []).map(product => [product.id, product.deliveryProfiles || []])), [storefrontProductsQuery.data]);
  const creativeDrafts = creativeProducts.filter(product => product.status === "draft").length;
  const creativeActive = creativeProducts.filter(product => product.status === "active").length;

  const createCollection = trpc.admin.categories.create.useMutation({
    onSuccess: async () => {
      await utils.categories.getAll.invalidate();
      setIsCollectionDialogOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      setIcon("✦");
      toast.success("Collection créative ajoutée. Elle est visible dans le menu Créations.");
    },
    onError: error => toast.error(`Impossible de créer la collection : ${error.message}`),
  });

  const handleCreateCollection = (event: React.FormEvent) => {
    event.preventDefault();
    const finalSlug = slug.trim() || slugify(name);
    if (!name.trim() || !finalSlug) {
      toast.error("Indiquez un nom et un identifiant de collection valides.");
      return;
    }

    createCollection.mutate({
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || undefined,
      icon: icon.trim() || "✦",
      displayOrder: 100 + creativeCategories.length + 1,
      catalogSection: "creations",
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7 pb-8">
        <section className="overflow-hidden border border-rose-100 bg-slate-950 px-6 py-8 text-white md:px-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-200"><Brush className="h-4 w-4" /> Studio créatif</div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">Collections créatives</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Un univers autonome pour les produits imprimés à la demande et les designs imaginés par MAZIGHO. Les collections sont visibles dans le catalogue mondial, mais leur publication et leur commande restent soumises à tes validations.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button onClick={() => setIsCollectionDialogOpen(true)} className="bg-rose-500 text-white hover:bg-rose-600"><Plus className="mr-2 h-4 w-4" /> Nouvelle collection</Button>
              <Link href="/admin/produits"><Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white hover:text-slate-950"><PackageOpen className="mr-2 h-4 w-4" /> Gérer les produits</Button></Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="border border-rose-100 bg-white p-5"><Layers3 className="h-5 w-5 text-rose-600" /><p className="mt-5 text-3xl font-semibold text-slate-950">{creativeCategories.length}</p><p className="mt-1 text-sm text-slate-600">Collections créatives</p></div>
          <div className="border border-amber-100 bg-white p-5"><FileEdit className="h-5 w-5 text-amber-600" /><p className="mt-5 text-3xl font-semibold text-slate-950">{creativeDrafts}</p><p className="mt-1 text-sm text-slate-600">Brouillon(s) à contrôler</p></div>
          <div className="border border-emerald-100 bg-white p-5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="mt-5 text-3xl font-semibold text-slate-950">{creativeActive}</p><p className="mt-1 text-sm text-slate-600">Produit(s) publiés</p></div>
          <div className="border border-sky-100 bg-white p-5"><Globe2 className="h-5 w-5 text-sky-600" /><p className="mt-5 text-lg font-semibold text-slate-950">Catalogue ouvert</p><p className="mt-1 text-sm text-slate-600">Visible pour tous les pays</p></div>
        </section>

        <SupplierAccountRegistry focusService="printful" compact />

        <section className="border border-amber-200 bg-amber-50 p-5 md:p-6">
          <div className="flex gap-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-slate-900">Règle de sécurité commerciale</h2><p className="mt-1 text-sm leading-6 text-slate-700">La collection peut être visible dans tous les pays, mais un produit ne doit être mis en vente qu’après contrôle du visuel et de ses droits, du coût fournisseur, de la variante, du transport et du délai pour chaque destination proposée. Le futur Atelier sur mesure, où un client transmettra son propre fichier, sera un parcours séparé avec validation manuelle des droits et du rendu avant impression. Aucun compte Printful, API, paiement, ordre fournisseur ni synchronisation n’est activé ici.</p></div></div>
        </section>

        <section className="border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-700">Structure client</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">Collections visibles dans l’onglet Collections créatives</h2></div><Link href="/creations"><span className="inline-flex items-center gap-2 text-sm font-bold text-rose-700">Voir le rendu client <ArrowRight className="h-4 w-4" /></span></Link></div>
          {categoriesQuery.isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-rose-600" /></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{creativeCategories.map(category => { const visual = getCollectionVisual(category.slug); return <div key={category.id} className="overflow-hidden border border-rose-100 bg-[#fffaf7]"><div className="aspect-[4/3] bg-rose-50">{visual ? <img src={visual.imageUrl} alt={visual.alt} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl">{category.icon || "✦"}</div>}</div><div className="p-4"><h3 className="font-semibold text-slate-900">{category.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{category.description || "Collection créative MAZIGHO"}</p><Link href={`/categorie/${category.slug}`}><span className="mt-4 inline-flex text-xs font-bold text-rose-700">Voir côté client →</span></Link></div></div>; })}</div>}
        </section>

        <section className="border border-slate-200 bg-white p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-700">Contrôle de préparation</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">État de chaque collection</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ce tableau n’active rien : il permet uniquement de repérer ce qui manque avant toute publication manuelle.</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {creativeCategories.map(category => {
              const visual = getCollectionVisual(category.slug);
              const products = creativeProducts.filter(product => product.categoryId === category.id);
              const drafts = products.filter(product => product.status === "draft").length;
              const active = products.filter(product => product.status === "active").length;
              const withoutDeliveryProfile = products.filter(product => !(deliveryProfilesByProductId.get(product.id) || []).length).length;
              return <div key={`readiness-${category.id}`} className="border border-slate-200 bg-[#fffaf7] p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-950">{category.name}</h3><p className="mt-1 text-xs text-slate-600">{category.description || "Collection créative MAZIGHO"}</p></div><Badge variant="outline" className={visual ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}>{visual ? "Visuel associé" : "Visuel à choisir"}</Badge></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="border border-amber-100 bg-white p-3"><p className="text-lg font-semibold text-amber-700">{drafts}</p><p className="mt-1 text-[11px] text-slate-600">Brouillons</p></div><div className="border border-emerald-100 bg-white p-3"><p className="text-lg font-semibold text-emerald-700">{active}</p><p className="mt-1 text-[11px] text-slate-600">Publiés</p></div><div className="border border-rose-100 bg-white p-3"><p className="text-lg font-semibold text-rose-700">{withoutDeliveryProfile}</p><p className="mt-1 text-[11px] text-slate-600">Sans profil livraison</p></div></div><p className="mt-4 text-xs leading-5 text-slate-600">Vérifier les droits, le coût, les variantes et les destinations avant de transformer un brouillon en produit publié.</p></div>;
            })}
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-700">Processus manuel</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">De l’idée à la publication</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {["1. Définir une création originale", "2. Classer dans une collection", "3. Créer la fiche en brouillon", "4. Confirmer coût et livraison", "5. Publier après validation"].map((step, index) => <div key={step} className="border border-slate-200 p-4"><span className="text-xs font-bold text-rose-700">ÉTAPE {index + 1}</span><p className="mt-2 text-sm font-semibold leading-5 text-slate-800">{step.replace(/^\d+\. /, "")}</p></div>)}
          </div>
        </section>
      </div>

      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateCollection}>
            <DialogHeader><DialogTitle>Nouvelle collection créative</DialogTitle><DialogDescription>Cette collection de designs MAZIGHO sera visible sous l’onglet « Collections créatives ». Aucun produit ni fournisseur n’est activé par cette action.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-2"><Label htmlFor="creative-name">Nom</Label><Input id="creative-name" value={name} onChange={event => { setName(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} placeholder="Ex. Carnets et papeterie" /></div>
              <div className="space-y-2"><Label htmlFor="creative-slug">Identifiant d’URL</Label><Input id="creative-slug" value={slug} onChange={event => setSlug(slugify(event.target.value))} placeholder="carnets-papeterie" /></div>
              <div className="space-y-2"><Label htmlFor="creative-description">Courte description</Label><Textarea id="creative-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Présentez l’esprit de cette collection." /></div>
              <div className="space-y-2"><Label>Icône</Label><div className="flex flex-wrap gap-2">{defaultIcons.map(candidate => <button key={candidate} type="button" onClick={() => setIcon(candidate)} className={`flex h-10 w-10 items-center justify-center border text-lg ${icon === candidate ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white"}`}>{candidate}</button>)}</div></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Annuler</Button><Button type="submit" disabled={createCollection.isPending} className="bg-rose-600 hover:bg-rose-700">{createCollection.isPending ? "Création…" : "Créer la collection"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
