import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  parseStudioCatalogueArchive,
  studioCatalogueAssetDataUrl,
  type StudioCatalogueArchivePreview,
} from "@/lib/studioCatalogueArchiveImport";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FileArchive, FileCheck2, FileUp, ImagePlus, Info, Loader2, LockKeyhole, PackageCheck, ShieldCheck, Store, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type StoreTarget = {
  id: number;
  displayName: string;
  primaryDomain: string;
  status: "setup" | "active" | "limited" | "suspended" | "closed";
  isPlatformStore: boolean | number;
};

type CatalogueProduct = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  longDescription: string | null;
  price: number;
  stock: number;
  featured: boolean;
  options: string | null;
  images: string[];
};

type VariantOption = { name: string; values: string[] };

function normalizedKey(value: string) {
  return value.trim().toLocaleLowerCase("fr-CH");
}

function parseOptions(raw: string | null): VariantOption[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is VariantOption => Boolean(value && typeof value.name === "string" && Array.isArray(value.values)))
        .map(value => ({ name: value.name.slice(0, 60), values: value.values.filter(item => typeof item === "string").map(item => item.slice(0, 60)).slice(0, 30) }))
        .filter(value => value.name && value.values.length)
        .slice(0, 4)
      : [];
  } catch { return []; }
}

function archiveFileLabel(preview: StudioCatalogueArchivePreview) {
  if (preview.sourceKind === "csv") return "CSV direct";
  return `${preview.archiveEntryCount} fichier${preview.archiveEntryCount > 1 ? "s" : ""} dans le ZIP`;
}

export default function AdminStudioUniversalImport() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const inventory = trpc.admin.studio.getInventory.useQuery({ pageSize: 100 }, { refetchOnWindowFocus: false });
  const [preview, setPreview] = useState<StudioCatalogueArchivePreview | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [rightsAcknowledged, setRightsAcknowledged] = useState(false);
  const [applyAcknowledged, setApplyAcknowledged] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ imported: number; updated: number; images: number; variants: number; failures: string[]; storeId: number } | null>(null);

  const importProducts = trpc.admin.studio.importOwnerExistingCatalogueProducts.useMutation();
  const uploadProductImage = trpc.admin.studio.uploadOwnerExistingCatalogueProductImage.useMutation();
  const saveProduct = trpc.admin.studio.saveOwnerExistingCatalogueProduct.useMutation();
  const createVariants = trpc.admin.studio.createOwnerExistingCatalogueProductVariantMatrix.useMutation();

  const stores = useMemo(() => ((inventory.data?.stores ?? []) as StoreTarget[])
    .filter(store => !store.isPlatformStore && store.status !== "closed")
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "fr-CH")), [inventory.data?.stores]);
  const selectedStore = stores.find(store => String(store.id) === selectedStoreId) || null;
  const hasIssues = Boolean(preview?.issues.length);
  const canApply = Boolean(preview && preview.rows.length && !hasIssues && selectedStore && rightsAcknowledged && applyAcknowledged && !importProducts.isPending && !reading);

  const readArchive = async (file?: File) => {
    if (!file) return;
    setReading(true);
    setProgress("Lecture locale de l’archive…");
    setResult(null);
    try {
      const nextPreview = await parseStudioCatalogueArchive(file);
      setPreview(nextPreview);
      setRightsAcknowledged(nextPreview.manifest?.rightsConfirmed === true);
      setApplyAcknowledged(false);
      setProgress(nextPreview.issues.length ? "Archive à corriger avant application." : "Aperçu prêt : aucune donnée n’a été envoyée ni modifiée.");
    } catch {
      setPreview(null);
      setProgress("Lecture impossible. Aucun changement n’a été effectué.");
    } finally {
      setReading(false);
    }
  };

  const applyImport = async () => {
    if (!preview || !selectedStore) return;
    setResult(null);
    const failures: string[] = [];
    let images = 0;
    let variants = 0;
    try {
      setProgress("Création des catégories et fiches produit dans la boutique choisie…");
      const imported = await importProducts.mutateAsync({ storeId: selectedStore.id, rows: preview.rows, acknowledged: true });
      const productsByName = new Map((imported.catalogue.products as CatalogueProduct[]).map(product => [normalizedKey(product.name), product]));
      const assetsByPath = new Map(preview.assets.map(asset => [asset.path, asset]));

      for (const row of preview.rows) {
        const product = productsByName.get(normalizedKey(row.name));
        if (!product) { failures.push(`La fiche « ${row.name} » a été créée mais ne peut pas encore recevoir ses médias.`); continue; }
        const localAssets = (row.localImagePaths || []).map(path => assetsByPath.get(path)).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset)).slice(0, 8);
        if (!localAssets.length) continue;
        setProgress(`Téléversement des visuels de « ${row.name} »…`);
        const urls = [...product.images];
        for (const asset of localAssets) {
          try {
            const uploaded = await uploadProductImage.mutateAsync({ storeId: selectedStore.id, productId: product.id, fileName: asset.path.split("/").at(-1) || "visuel", dataUrl: studioCatalogueAssetDataUrl(asset) });
            if (!urls.includes(uploaded.url)) { urls.push(uploaded.url); images += 1; }
          } catch {
            failures.push(`Le visuel « ${asset.path} » n’a pas été importé pour « ${row.name} ».`);
          }
        }
        if (urls.length !== product.images.length) {
          await saveProduct.mutateAsync({
            storeId: selectedStore.id,
            productId: product.id,
            categoryId: product.categoryId,
            name: product.name,
            description: product.description || "",
            longDescription: product.longDescription || "",
            priceCents: product.price,
            stock: product.stock,
            featured: product.featured,
            images: urls.slice(0, 8),
            options: parseOptions(product.options),
          });
        }
      }

      const variantsByProduct = new Map<string, typeof preview.variants>();
      for (const variant of preview.variants) variantsByProduct.set(normalizedKey(variant.productName), [...(variantsByProduct.get(normalizedKey(variant.productName)) || []), variant]);
      for (const [productName, productVariants] of Array.from(variantsByProduct.entries())) {
        const product = productsByName.get(productName);
        if (!product) { failures.push(`Les variantes de « ${productVariants[0]?.productName || "ce produit"} » n’ont pas trouvé leur fiche.`); continue; }
        setProgress(`Ajout des variantes de « ${product.name} »…`);
        try {
          const created = await createVariants.mutateAsync({ storeId: selectedStore.id, productId: product.id, variants: productVariants.map(variant => ({ label: variant.label, sku: variant.sku, priceAdjustmentCents: variant.priceAdjustmentCents, stock: variant.stock, status: variant.status })) });
          variants += created.created;
        } catch {
          failures.push(`Les variantes de « ${product.name} » restent à vérifier manuellement.`);
        }
      }

      await utils.admin.studio.getOwnerExistingCatalogue.invalidate({ storeId: selectedStore.id });
      setResult({ imported: imported.imported, updated: imported.updated, images, variants, failures, storeId: selectedStore.id });
      setProgress(failures.length ? "Import effectué avec quelques éléments à vérifier." : "Import terminé dans l’espace privé de la boutique.");
      toast.success("Import privé terminé", { description: "Aucune publication, aucun panier et aucun paiement n’ont été activés." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import impossible.";
      setProgress(message);
      toast.error("Import interrompu", { description: "Les éléments déjà ajoutés restent privés et peuvent être revus dans l’éditeur." });
    }
  };

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Studio privé</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-950">Essai d’import universel</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Importer une boutique</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Un atelier privé pour vos exports Shopify, WooCommerce, PrestaShop, Wix, Etsy, CSV ou boutique sur mesure, une fois rangés dans le format ZIP MAZIGHO. L’archive est lue localement, préparée en aperçu, puis appliquée uniquement à la boutique choisie.</p></div><Button type="button" variant="outline" onClick={() => setLocation("/admin/studio")} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au Studio</Button></header>

    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Frontière conservée</p><p className="mt-1">Cet atelier ne publie rien, ne bascule aucun domaine, ne touche pas aux clients, aux commandes, aux paiements, aux abonnements ni aux fournisseurs. Les pages, navigation et identité détectées restent en <strong>brouillon à examiner</strong> : elles ne remplacent jamais une vitrine automatiquement.</p></div></div></section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader><CardDescription>Étape 1 — archive privée</CardDescription><CardTitle className="mt-1 flex items-center gap-2 text-xl"><FileArchive className="h-5 w-5 text-violet-700" /> Charger un ZIP MAZIGHO ou un CSV</CardTitle><CardDescription className="mt-2 max-w-3xl">Le ZIP peut contenir <code>catalogue.csv</code>, <code>categories.csv</code>, <code>variations.csv</code>, <code>images/</code>, <code>contenus/</code>, <code>marque/</code> et <code>manifest.json</code>. Pour ce premier essai, les produits, catégories, images et variantes sont pris en charge ; contenus et identité sont listés pour validation ultérieure.</CardDescription></CardHeader><CardContent><Label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-violet-300 bg-violet-50 px-4 text-sm font-semibold text-violet-950 hover:bg-violet-100"><FileUp className="mr-2 h-4 w-4" /> {reading ? "Lecture en cours…" : "Choisir une archive"}<input type="file" accept=".zip,.csv,application/zip,text/csv" className="sr-only" disabled={reading} onChange={event => { void readArchive(event.target.files?.[0]); event.currentTarget.value = ""; }} /></Label>{progress ? <p className="mt-3 text-sm leading-6 text-slate-600">{progress}</p> : null}</CardContent></Card>

      {preview ? <ArchivePreviewCard preview={preview} /> : <Card className="border-dashed border-slate-300 bg-slate-50"><CardContent className="p-6 text-sm leading-6 text-slate-600">Chargez l’un de vos ZIP de test. Rien n’est envoyé à la base tant que vous n’avez pas choisi la boutique et confirmé l’application.</CardContent></Card>}

      {preview && !hasIssues ? <Card className="border-slate-200 shadow-sm"><CardHeader><CardDescription>Étape 2 — appliquer une copie contrôlée</CardDescription><CardTitle className="mt-1 flex items-center gap-2 text-xl"><PackageCheck className="h-5 w-5 text-teal-700" /> Choisir la boutique de test</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="universal-import-store">Boutique cible</Label><select id="universal-import-store" value={selectedStoreId} onChange={event => setSelectedStoreId(event.target.value)} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="">Choisir une boutique…</option>{stores.map(store => <option key={store.id} value={store.id}>{store.displayName} · {store.status}</option>)}</select>{inventory.isLoading ? <p className="text-xs text-slate-500">Chargement des boutiques Studio…</p> : null}</div>{selectedStore ? <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><p className="font-semibold">Cible : {selectedStore.displayName}</p><p className="mt-1">Les fiches seront isolées dans cette boutique. Aucun autre catalogue ne sera lu ni modifié.</p></div> : null}<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><Checkbox checked={rightsAcknowledged} onCheckedChange={value => setRightsAcknowledged(value === true)} /><span>Je confirme disposer des droits nécessaires sur les produits, images, descriptions, logo et autres contenus importés. Les ressources détectées resteront à contrôler.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><Checkbox checked={applyAcknowledged} onCheckedChange={value => setApplyAcknowledged(value === true)} /><span>Je confirme importer les <strong>{preview.rows.length} fiche(s)</strong> dans la boutique sélectionnée. Je comprends que les produits existants du même nom peuvent être mis à jour, mais que l’import ne publie pas la boutique et n’active ni vente ni paiement.</span></label><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Les prix sont importés exactement comme indiqués dans le fichier : aucune conversion de devise n’est effectuée.</p><Button type="button" disabled={!canApply} onClick={() => void applyImport()} className="min-h-11 shrink-0 bg-teal-700 text-white hover:bg-teal-800"><WandSparkles className="mr-2 h-4 w-4" /> Appliquer l’import privé</Button></div></CardContent></Card> : null}

      {result ? <Card className={result.failures.length ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}><CardContent className="p-5 text-sm leading-6"><div className="flex gap-3"><CheckCircle2 className={result.failures.length ? "mt-0.5 h-5 w-5 shrink-0 text-amber-700" : "mt-0.5 h-5 w-5 shrink-0 text-emerald-700"} /><div><p className="font-bold text-slate-950">Import privé terminé</p><p className="mt-1 text-slate-700">{result.imported} fiche(s) ajoutée(s), {result.updated} mise(s) à jour, {result.images} image(s) téléversée(s), {result.variants} variante(s) ajoutée(s).</p>{result.failures.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-amber-950">{result.failures.slice(0, 8).map(failure => <li key={failure}>{failure}</li>)}</ul> : null}<div className="mt-4 flex flex-wrap gap-2"><Link href={`/admin/studio/catalogue-existant/${result.storeId}`}><Button type="button" variant="outline" className="border-slate-300 bg-white"><Store className="mr-2 h-4 w-4" /> Vérifier le catalogue</Button></Link><Link href={`/admin/studio/apercu/${result.storeId}`}><Button type="button" variant="outline" className="border-slate-300 bg-white">Voir l’aperçu privé</Button></Link></div></div></div></CardContent></Card> : null}
    </div>
    <aside className="space-y-5"><Card className="border-violet-200 bg-violet-50"><CardContent className="p-5 text-sm leading-6 text-violet-950"><p className="flex items-center gap-2 font-bold"><Info className="h-4 w-4" /> Format recommandé</p><ol className="mt-3 list-decimal space-y-1 pl-5 text-violet-900"><li><code>manifest.json</code> — origine, devise, langue, droits ;</li><li><code>catalogue.csv</code> — catégories, produits, prix, stock ;</li><li><code>variations.csv</code> — variantes et SKU ;</li><li><code>images/</code> — visuels reliés par chemin relatif ;</li><li><code>contenus/</code> et <code>marque/</code> — à examiner.</li></ol></CardContent></Card><Card className="border-slate-200"><CardContent className="p-5 text-sm leading-6 text-slate-700"><p className="font-bold text-slate-950">Limites de sécurité</p><p className="mt-2">ZIP de 30 Mio maximum, 120 fichiers, 42 Mio décompressés, 40 images et 5 Mio par image. Les ZIP chiffrés, chemins dangereux et archives ambiguës sont refusés.</p></CardContent></Card><Card className="border-sky-200 bg-sky-50"><CardContent className="p-5 text-sm leading-6 text-sky-950"><p className="font-bold">Déploiement progressif</p><p className="mt-2">Cet outil reste d’abord réservé à Studio et à vos boutiques tests. Il lit aujourd’hui le contrat MAZIGHO ; les adaptateurs directs Shopify, WooCommerce et autres seront ajoutés ensuite sur cette même fondation.</p></CardContent></Card></aside>
    </section>
  </main></DashboardLayout>;
}

function ArchivePreviewCard({ preview }: { preview: StudioCatalogueArchivePreview }) {
  const hasWarnings = preview.issues.length > 0;
  return <Card className={hasWarnings ? "border-rose-200 bg-rose-50" : "border-slate-200 shadow-sm"}><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Étape 1 — aperçu local</CardDescription><CardTitle className="mt-1 flex items-center gap-2 text-xl"><FileCheck2 className="h-5 w-5 text-slate-700" /> {preview.sourceName}</CardTitle></div><Badge variant="outline" className={hasWarnings ? "border-rose-200 bg-white text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}>{hasWarnings ? "À corriger" : "Prêt à contrôler"}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Source" value={archiveFileLabel(preview)} /><Metric label="Produits" value={String(preview.rows.length)} /><Metric label="Visuels locaux" value={String(preview.assets.length)} /><Metric label="Variantes" value={String(preview.variants.length)} /></div>{preview.manifest ? <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950"><p className="font-semibold">Manifest détecté</p><p className="mt-1">Origine : {preview.manifest.source || "non indiquée"} · devise : {preview.manifest.currency || "non indiquée"} · langue : {preview.manifest.language || "non indiquée"} · droits : {preview.manifest.rightsConfirmed === true ? "confirmés dans le fichier" : preview.manifest.rightsConfirmed === false ? "non confirmés dans le fichier" : "à confirmer"}.</p></div> : null}{hasWarnings ? <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-rose-950">{preview.issues.slice(0, 10).map(problem => <li key={`${problem.line}-${problem.message}`}>Ligne {problem.line} : {problem.message}</li>)}</ul> : <><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p><strong>Catalogue :</strong> {preview.csvPath || "non détecté"} · catégories séparées : {preview.categoryCsvFound ? "détectées, à examiner séparément" : "non fournies (catégories du catalogue utilisées)"} · {preview.ignoredAssetCount} fichier(s) hors périmètre ignoré(s).</p><p className="mt-1"><strong>Brouillons détectés :</strong> {preview.contentPaths.length} contenu(s) éditorial(aux), {preview.brandPaths.length} élément(s) d’identité. Ils ne seront pas appliqués dans cette étape.</p></div><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Produit</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Média</th></tr></thead><tbody>{preview.rows.slice(0, 8).map(row => <tr key={`${row.category}-${row.name}`} className="border-t border-slate-100"><td className="px-4 py-3 font-medium text-slate-950">{row.name}</td><td className="px-4 py-3 text-slate-600">{row.category}</td><td className="px-4 py-3 text-slate-600">{(row.priceCents / 100).toFixed(2)}</td><td className="px-4 py-3 text-slate-600">{row.localImagePaths?.length || (row.imageUrl ? 1 : 0)} visuel(s)</td></tr>)}</tbody></table></div>{preview.rows.length > 8 ? <p className="text-xs text-slate-500">Aperçu des 8 premières fiches sur {preview.rows.length}.</p> : null}</>}</CardContent></Card>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p></div>;
}
