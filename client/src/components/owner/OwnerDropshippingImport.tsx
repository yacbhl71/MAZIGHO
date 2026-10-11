import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, FileCode2, Import, Loader2, PackageSearch, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Category = { id: number; name: string };
type DropshippingAccess = { enabled: boolean; source: "pro_plan" | "studio_grant" | "not_included" };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 170);
}

function displayToCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function centsToDisplay(value: number | null | undefined): string {
  return value == null ? "" : (value / 100).toFixed(2);
}

function errorMessage(error: { message?: string } | undefined, fallback: string) {
  const message = error?.message || fallback;
  if (!message.startsWith("{")) return message;
  try {
    const parsed = JSON.parse(message);
    return Array.isArray(parsed) ? parsed.map(row => row?.message).filter(Boolean).join(", ") || fallback : parsed?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function OwnerDropshippingImport({
  categories,
  currencyCode,
  access,
  onImported,
}: {
  categories: Category[];
  currencyCode: string;
  access: DropshippingAccess;
  onImported: () => void;
}) {
  const [url, setUrl] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [showHtmlInput, setShowHtmlInput] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [marginPercent, setMarginPercent] = useState("50");
  const [hasPreview, setHasPreview] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sourcePrice, setSourcePrice] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [imagesText, setImagesText] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  const selectedCategoryName = useMemo(
    () => categories.find(category => String(category.id) === categoryId)?.name || "Catégorie à choisir",
    [categories, categoryId],
  );
  const previewImport = trpc.owner.previewDropshippingImport.useMutation({
    onSuccess: preview => {
      setHasPreview(true);
      setName(preview.name);
      setSlug(slugify(preview.name));
      setDescription(preview.description || "");
      setSourcePrice(centsToDisplay(preview.sourcePriceCents));
      setPrice(centsToDisplay(preview.suggestedPriceCents));
      setStock(String(preview.stock));
      setImagesText(preview.images.join("\n"));
      setWarnings(preview.warnings);
      if (!url.trim() && preview.supplierUrl) setUrl(preview.supplierUrl);
      toast.success("Aperçu préparé. Vérifiez-le avant de créer le brouillon.");
    },
    onError: error => toast.error(errorMessage(error, "Impossible de lire cette fiche fournisseur.")),
  });
  const importProduct = trpc.owner.importDropshippingProduct.useMutation({
    onSuccess: () => {
      toast.success("Produit créé en brouillon dans cette boutique.");
      setHasPreview(false);
      setUrl("");
      setRawHtml("");
      setName("");
      setSlug("");
      setDescription("");
      setSourcePrice("");
      setPrice("");
      setStock("0");
      setImagesText("");
      setWarnings([]);
      onImported();
    },
    onError: error => toast.error(errorMessage(error, "L’importation a échoué.")),
  });

  const updateSourcePrice = (value: string) => {
    setSourcePrice(value);
    const sourceCents = displayToCents(value);
    const margin = Number(marginPercent.replace(",", "."));
    if (sourceCents != null && sourceCents > 0 && Number.isFinite(margin) && margin >= 0) {
      setPrice(centsToDisplay(Math.round(sourceCents * (1 + margin / 100))));
    }
  };

  const preparePreview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryId) {
      toast.error("Choisissez d’abord la catégorie qui recevra le brouillon.");
      return;
    }
    if (!url.trim() && !rawHtml.trim()) {
      toast.error("Ajoutez l’URL publique du fournisseur ou le code HTML de sa page.");
      return;
    }
    previewImport.mutate({ url: url.trim() || undefined, rawHtml: rawHtml.trim() || undefined });
  };

  const saveDraft = (event: React.FormEvent) => {
    event.preventDefault();
    const sourcePriceCents = sourcePrice.trim() ? displayToCents(sourcePrice) : null;
    const priceCents = displayToCents(price);
    const safeStock = Number(stock);
    const images = imagesText.split("\n").map(value => value.trim()).filter(Boolean);
    if (!categoryId || !name.trim() || !slug.trim() || priceCents == null || priceCents <= 0) {
      toast.error("Complétez la catégorie, le nom, le slug et un prix de vente valide.");
      return;
    }
    if (!url.trim()) {
      toast.error("Conservez l’URL publique du fournisseur pour tracer la source de ce brouillon.");
      return;
    }
    if (!Number.isInteger(safeStock) || safeStock < 0 || safeStock > 1_000_000) {
      toast.error("Le stock doit être un nombre entier compris entre 0 et 1 000 000.");
      return;
    }
    importProduct.mutate({
      url: url.trim(),
      categoryId: Number(categoryId),
      marginPercent: Number(marginPercent.replace(",", ".")) || 0,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      priceCents,
      sourcePriceCents,
      stock: safeStock,
      images,
    });
  };

  return <div className="space-y-5" data-testid="owner-dropshipping-import">
    <section className="overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between md:p-6">
        <div className="flex gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700"><PackageSearch className="h-5 w-5" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold text-slate-950">Importer depuis un fournisseur</h3><Badge className="border-0 bg-sky-100 text-sky-800 hover:bg-sky-100">{access.source === "studio_grant" ? "Accès accordé par Studio" : "Accès inclus"}</Badge></div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Préparez une fiche produit depuis une URL autorisée. Le résultat est enregistré <strong>uniquement dans cette boutique</strong>, toujours en brouillon.</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Contrôle humain</Badge>
      </div>
      <div className="border-t border-sky-100 bg-white/75 px-5 py-4 text-xs leading-5 text-slate-700 md:px-6">Aucune commande fournisseur, aucun paiement, aucun prélèvement et aucune synchronisation de stock ne sont lancés ici. Les comptes et clés fournisseurs de MAZIGHO Studio restent invisibles et séparés.</div>
    </section>

    <form onSubmit={preparePreview} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_230px_160px_auto] xl:items-end">
        <div className="space-y-2"><Label htmlFor="owner-supplier-url">URL publique de la fiche fournisseur</Label><Input id="owner-supplier-url" value={url} onChange={event => setUrl(event.target.value)} type="url" inputMode="url" placeholder="https://www.aliexpress.com/item/..." /><p className="text-xs leading-5 text-slate-500">AliExpress, CJ et autres sources autorisées uniquement.</p></div>
        <div className="space-y-2"><Label htmlFor="owner-supplier-category">Catégorie de cette boutique</Label><select id="owner-supplier-category" value={categoryId} onChange={event => setCategoryId(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="">Choisir…</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="owner-supplier-margin">Marge indicative (%)</Label><Input id="owner-supplier-margin" value={marginPercent} onChange={event => setMarginPercent(event.target.value)} type="number" min="0" max="1000" inputMode="decimal" /></div>
        <Button type="submit" className="min-h-10 bg-sky-700 hover:bg-sky-800" disabled={previewImport.isPending}>{previewImport.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Import className="mr-2 h-4 w-4" />}Analyser</Button>
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4"><Button type="button" variant="ghost" className="px-0 text-sky-800 hover:bg-transparent hover:text-sky-950" onClick={() => setShowHtmlInput(current => !current)}><FileCode2 className="mr-2 h-4 w-4" />{showHtmlInput ? "Masquer le HTML de secours" : "Utiliser le HTML de secours"}</Button>{showHtmlInput && <div className="mt-3 space-y-2"><Label htmlFor="owner-supplier-html">Code HTML visible de la fiche</Label><Textarea id="owner-supplier-html" rows={6} value={rawHtml} onChange={event => setRawHtml(event.target.value)} placeholder="Collez le code HTML d’une fiche fournisseur que vous êtes autorisé à consulter." /><p className="text-xs leading-5 text-slate-500">N’ajoutez jamais d’identifiant, de mot de passe, de cookie, de clé ou de donnée client.</p></div>}</div>
    </form>

    {hasPreview && <form onSubmit={saveDraft} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5"><div><h3 className="flex items-center gap-2 text-lg font-bold text-slate-950"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Vérifier avant création</h3><p className="mt-1 text-sm text-slate-600">{selectedCategoryName} · la fiche restera en brouillon après enregistrement.</p></div><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">Aucune publication</Badge></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label htmlFor="owner-supplier-name">Nom commercial</Label><Input id="owner-supplier-name" value={name} maxLength={200} onChange={event => { setName(event.target.value); setSlug(current => current || slugify(event.target.value)); }} /></div><div className="space-y-2"><Label htmlFor="owner-supplier-slug">Adresse de la fiche</Label><Input id="owner-supplier-slug" value={slug} maxLength={200} onChange={event => setSlug(slugify(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="owner-supplier-stock">Stock de départ</Label><Input id="owner-supplier-stock" value={stock} onChange={event => setStock(event.target.value)} type="number" min="0" max="1000000" inputMode="numeric" /></div><div className="space-y-2"><Label htmlFor="owner-supplier-source-price">Prix fournisseur ({currencyCode})</Label><Input id="owner-supplier-source-price" value={sourcePrice} onChange={event => updateSourcePrice(event.target.value)} inputMode="decimal" placeholder="0,00" /></div><div className="space-y-2"><Label htmlFor="owner-supplier-price">Prix de vente ({currencyCode})</Label><Input id="owner-supplier-price" value={price} onChange={event => setPrice(event.target.value)} inputMode="decimal" placeholder="0,00" /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="owner-supplier-description">Description à vérifier</Label><Textarea id="owner-supplier-description" rows={6} value={description} maxLength={10_000} onChange={event => setDescription(event.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="owner-supplier-images">Images (une URL HTTPS par ligne)</Label><Textarea id="owner-supplier-images" rows={5} value={imagesText} onChange={event => setImagesText(event.target.value)} /></div></div>
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-5"><Button type="submit" className="min-h-11 bg-sky-700 hover:bg-sky-800" disabled={importProduct.isPending}>{importProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Créer le brouillon</Button></div>
      </section>
      <aside className="space-y-4"><section className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><p className="font-semibold text-sky-950">Avant publication</p><ul className="mt-3 space-y-2 text-sm leading-6 text-sky-900"><li>• Confirmez le prix rendu et votre marge.</li><li>• Vérifiez les variantes, le stock et le délai réel.</li><li>• Vérifiez les droits d’image et de contenu.</li><li>• Testez l’échantillon et le parcours de livraison.</li></ul></section>{warnings.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="flex items-center gap-2 font-semibold text-amber-950"><AlertTriangle className="h-4 w-4" /> Points signalés par la source</p><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">{warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></section>}<a href={url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">Ouvrir la fiche source <ExternalLink className="h-4 w-4" /></a></aside>
    </form>}
  </div>;
}
