import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Import, Loader2, PackageSearch, Save } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 170);
}

function formatPrice(cents: number | null | undefined) {
  return cents == null ? "—" : `${(cents / 100).toFixed(2)} €`;
}

export default function AdminDropshipping() {
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [marginPercent, setMarginPercent] = useState("50");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState("");
  const [sourcePriceCents, setSourcePriceCents] = useState("");
  const [stock, setStock] = useState("0");
  const [imagesText, setImagesText] = useState("");
  const [hasPreview, setHasPreview] = useState(false);

  const categoriesQuery = trpc.categories.getAll.useQuery();
  const previewImport = trpc.admin.products.previewImport.useMutation({
    onSuccess: (data) => {
      setHasPreview(true);
      setName(data.name);
      setSlug(slugify(data.name));
      setDescription(data.description || "");
      setSourcePriceCents(data.sourcePriceCents == null ? "" : String(data.sourcePriceCents));
      setPriceCents(data.suggestedPriceCents == null ? "" : String(data.suggestedPriceCents));
      setStock(String(data.stock));
      setImagesText(data.images.join("\\n"));
      toast.success("Aperçu récupéré. Vérifiez les informations avant importation.");
    },
    onError: (error) => toast.error(error.message || "Impossible de lire cette fiche fournisseur."),
  });
  const importProduct = trpc.admin.products.importFromUrl.useMutation({
    onSuccess: () => {
      toast.success("Produit importé en brouillon. Vous pouvez le vérifier avant publication.");
      setHasPreview(false);
      setUrl("");
      setName("");
      setSlug("");
      setDescription("");
      setPriceCents("");
      setSourcePriceCents("");
      setImagesText("");
      setStock("0");
    },
    onError: (error) => toast.error(error.message || "L'importation a échoué."),
  });

  const selectedCategoryName = useMemo(
    () => categoriesQuery.data?.find(category => String(category.id) === categoryId)?.name,
    [categoriesQuery.data, categoryId],
  );

  const handlePreview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryId) {
      toast.error("Choisissez une catégorie avant d'analyser le produit.");
      return;
    }
    if (!url.trim()) {
      toast.error("Collez l'URL d'une fiche AliExpress ou CJ Dropshipping.");
      return;
    }
    previewImport.mutate({ url: url.trim() });
  };

  const handleImport = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedPrice = Number(priceCents);
    const parsedSourcePrice = sourcePriceCents ? Number(sourcePriceCents) : null;
    if (!categoryId || !name.trim() || !slug.trim() || !Number.isInteger(parsedPrice) || parsedPrice <= 0) {
      toast.error("Complétez la catégorie, le nom, le slug et un prix de vente valide.");
      return;
    }
    const images = imagesText.split("\\n").map(value => value.trim()).filter(Boolean);
    importProduct.mutate({
      url: url.trim(),
      categoryId: Number(categoryId),
      marginPercent: Number(marginPercent) || 0,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      priceCents: parsedPrice,
      sourcePriceCents: parsedSourcePrice,
      stock: Math.max(0, Number(stock) || 0),
      images,
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin/produits" className="inline-flex items-center gap-1 hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Produits
              </Link>
              <span>/</span>
              <span>Importation fournisseur</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Importer un produit dropshipping</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">
              Collez une URL AliExpress ou CJ Dropshipping. MAZIGHO récupère un aperçu, puis crée le produit en brouillon pour validation manuelle.
            </p>
          </div>
          <Badge variant="secondary" className="gap-2 px-3 py-2">
            <PackageSearch className="h-4 w-4" /> Import sécurisé
          </Badge>
        </div>

        <form onSubmit={handlePreview} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px_180px_auto] lg:items-end">
            <label className="block space-y-2">
              <span className="text-sm font-medium">URL de la fiche fournisseur</span>
              <input
                value={url}
                onChange={event => setUrl(event.target.value)}
                placeholder="https://www.aliexpress.com/item/..."
                type="url"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Catégorie MAZIGHO</span>
              <select
                value={categoryId}
                onChange={event => setCategoryId(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choisir…</option>
                {categoriesQuery.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Marge (%)</span>
              <input
                value={marginPercent}
                onChange={event => setMarginPercent(event.target.value)}
                type="number"
                min="0"
                max="1000"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <Button type="submit" className="h-10 bg-orange-500 hover:bg-orange-600" disabled={previewImport.isPending}>
              {previewImport.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Import className="mr-2 h-4 w-4" />}
              Analyser
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Les données récupérées restent à vérifier : prix, variantes, stock, conformité et délais de livraison doivent être contrôlés avant publication.
          </p>
        </form>

        {hasPreview && (
          <form onSubmit={handleImport} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">Vérification avant import</h2>
                  <p className="text-sm text-muted-foreground">{selectedCategoryName || "Catégorie sélectionnée"} · le produit sera enregistré en brouillon.</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium">Nom commercial</span>
                  <input value={name} onChange={event => setName(event.target.value)} className="h-10 w-full rounded-md border px-3 text-sm" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Slug</span>
                  <input value={slug} onChange={event => setSlug(event.target.value)} className="h-10 w-full rounded-md border px-3 text-sm" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Stock de départ</span>
                  <input value={stock} onChange={event => setStock(event.target.value)} type="number" min="0" className="h-10 w-full rounded-md border px-3 text-sm" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Prix fournisseur (centimes)</span>
                  <input value={sourcePriceCents} onChange={event => setSourcePriceCents(event.target.value)} type="number" min="0" className="h-10 w-full rounded-md border px-3 text-sm" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Prix de vente (centimes)</span>
                  <input value={priceCents} onChange={event => setPriceCents(event.target.value)} type="number" min="1" className="h-10 w-full rounded-md border px-3 text-sm" />
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea value={description} onChange={event => setDescription(event.target.value)} rows={7} className="w-full rounded-md border px-3 py-2 text-sm" />
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium">Images (une URL par ligne)</span>
                  <textarea value={imagesText} onChange={event => setImagesText(event.target.value)} rows={5} className="w-full rounded-md border px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
                <Link href="/admin/produits"><Button type="button" variant="outline">Annuler</Button></Link>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={importProduct.isPending}>
                  {importProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Enregistrer en brouillon
                </Button>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Résumé commercial</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Prix fournisseur</dt><dd className="font-medium">{formatPrice(Number(sourcePriceCents) || null)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Prix de vente</dt><dd className="font-semibold text-orange-600">{formatPrice(Number(priceCents) || null)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Statut initial</dt><dd><Badge variant="secondary">Brouillon</Badge></dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Catégorie</dt><dd className="text-right font-medium">{selectedCategoryName || "—"}</dd></div>
                </dl>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
                <div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Contrôles obligatoires</div>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Vérifier les variantes et les frais d'expédition.</li>
                  <li>Contrôler les droits d'utilisation des images et du contenu.</li>
                  <li>Tester la qualité et le délai de livraison avant publication.</li>
                </ul>
              </div>
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-md border bg-white px-4 py-3 text-sm font-medium hover:bg-muted">
                Ouvrir la fiche fournisseur <ExternalLink className="h-4 w-4" />
              </a>
            </aside>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
