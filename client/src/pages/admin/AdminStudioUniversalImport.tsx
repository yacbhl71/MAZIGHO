import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { storeFactoryModels, type StoreFactoryModelId } from "@shared/storeFactoryModel";
import {
  parseStudioCatalogueArchive,
  studioCatalogueAssetDataUrl,
  type StudioCatalogueArchivePreview,
} from "@/lib/studioCatalogueArchiveImport";
import {
  convertStudioWordpressBackup,
  StudioWordpressConversionError,
  type StudioWordpressConversionResult,
} from "@/lib/studioWordpressWpressConverter";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Download, FileArchive, FileCheck2, FileCog, FileUp, ImagePlus, Info, Loader2, LockKeyhole, PackageCheck, ShieldCheck, Store, WandSparkles } from "lucide-react";
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

type NewStoreDraft = {
  displayName: string;
  requestedDomain: string;
  ownerName: string;
  ownerEmail: string;
  factoryModel: StoreFactoryModelId;
  customBusinessTheme: string;
  provisioningTemplate: "standard" | "algeria";
  preferredCurrency: "CHF" | "EUR" | "USD" | "GBP" | "DZD";
};

const emptyNewStoreDraft: NewStoreDraft = {
  displayName: "",
  requestedDomain: "",
  ownerName: "",
  ownerEmail: "",
  factoryModel: "blank",
  customBusinessTheme: "Catalogue importé à organiser",
  provisioningTemplate: "standard",
  preferredCurrency: "CHF",
};

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
  const importTargets = trpc.admin.studio.getCatalogueImportTargets.useQuery(undefined, { refetchOnWindowFocus: false });
  const [preview, setPreview] = useState<StudioCatalogueArchivePreview | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [newStoreDraft, setNewStoreDraft] = useState<NewStoreDraft>(emptyNewStoreDraft);
  const [preparedDraftId, setPreparedDraftId] = useState<number | null>(null);
  const [rightsAcknowledged, setRightsAcknowledged] = useState(false);
  const [applyAcknowledged, setApplyAcknowledged] = useState(false);
  const [reading, setReading] = useState(false);
  const [convertingWordpress, setConvertingWordpress] = useState(false);
  const [wordpressCurrency, setWordpressCurrency] = useState("");
  const [wordpressConversion, setWordpressConversion] = useState<StudioWordpressConversionResult | null>(null);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ imported: number; updated: number; images: number; variants: number; failures: string[]; storeId: number } | null>(null);

  const importProducts = trpc.admin.studio.importOwnerExistingCatalogueProducts.useMutation();
  const uploadProductImage = trpc.admin.studio.uploadOwnerExistingCatalogueProductImage.useMutation();
  const saveProduct = trpc.admin.studio.saveOwnerExistingCatalogueProduct.useMutation();
  const createVariants = trpc.admin.studio.createOwnerExistingCatalogueProductVariantMatrix.useMutation();
  const createProvisioningDraft = trpc.admin.studio.createProvisioningDraft.useMutation({
    onSuccess: async (draft) => {
      setPreparedDraftId(draft.id);
      await utils.admin.studio.getProvisioningDrafts.invalidate();
      await utils.admin.studio.getCatalogueImportTargets.invalidate();
      toast.success("Brouillon de nouvelle boutique prêt", { description: "Aucune boutique publique, aucun domaine, paiement ou e-mail n’a été créé." });
    },
    onError: error => toast.error("Préparation impossible", { description: error.message || "Vérifiez les informations de la nouvelle boutique." }),
  });

  const stores = useMemo(() => ((importTargets.data ?? []) as StoreTarget[])
    .filter(store => !store.isPlatformStore && store.status === "setup")
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "fr-CH")), [importTargets.data]);
  const selectedStore = stores.find(store => String(store.id) === selectedStoreId) || null;
  const hasIssues = Boolean(preview?.issues.length);
  const selectedFactoryModel = storeFactoryModels.find(model => model.id === newStoreDraft.factoryModel) ?? storeFactoryModels[0];
  const newStoreNeedsCustomTheme = (selectedFactoryModel.businessType ?? "autre") === "autre";
  const canPrepareNewStore = Boolean(
    preview && preview.rows.length && !hasIssues
    && newStoreDraft.displayName.trim().length >= 2
    && newStoreDraft.requestedDomain.trim().length >= 3
    && newStoreDraft.ownerName.trim().length >= 2
    && newStoreDraft.ownerEmail.includes("@")
    && (!newStoreNeedsCustomTheme || newStoreDraft.customBusinessTheme.trim().length >= 2)
    && !createProvisioningDraft.isPending
  );
  const canApply = Boolean(preview && preview.rows.length && !hasIssues && selectedStore && rightsAcknowledged && applyAcknowledged && !importProducts.isPending && !reading && !convertingWordpress);

  const prepareNewStoreDraft = () => {
    if (!canPrepareNewStore) return;
    const model = selectedFactoryModel;
    createProvisioningDraft.mutate({
      displayName: newStoreDraft.displayName,
      requestedDomain: newStoreDraft.requestedDomain,
      ownerName: newStoreDraft.ownerName,
      ownerEmail: newStoreDraft.ownerEmail,
      businessType: model.businessType ?? "autre",
      customBusinessTheme: model.customBusinessTheme ?? newStoreDraft.customBusinessTheme,
      themePreset: model.suggestedTheme,
      factoryModel: model.id,
      provisioningTemplate: newStoreDraft.provisioningTemplate,
      preferredCurrency: newStoreDraft.provisioningTemplate === "algeria" ? "DZD" : newStoreDraft.preferredCurrency,
      notes: `[catalogue_import] Brouillon préparé depuis l’atelier d’import Studio. Archive : ${preview?.sourceName || "non indiquée"}. Produits détectés : ${preview?.rows.length || 0}. L’archive n’est pas conservée en base et devra être rechargée pour l’import après la création contrôlée de la boutique.`,
    });
  };

  const readArchive = async (file?: File) => {
    if (!file) return;
    setReading(true);
    setProgress("Lecture locale de l’archive…");
    setResult(null);
    setWordpressConversion(null);
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

  const convertWordpress = async (file?: File) => {
    if (!file) return;
    setConvertingWordpress(true);
    setProgress("Conversion locale de la sauvegarde WordPress…");
    setResult(null);
    try {
      const conversion = await convertStudioWordpressBackup(file, wordpressCurrency.trim() || undefined);
      const nextPreview = await parseStudioCatalogueArchive({
        name: conversion.archiveName,
        size: conversion.archive.size,
        arrayBuffer: () => conversion.archive.arrayBuffer(),
      });
      setPreview(nextPreview);
      setRightsAcknowledged(false);
      setApplyAcknowledged(false);
      setWordpressConversion(conversion);
      setProgress("Conversion locale terminée : l’archive MAZIGHO est ouverte en aperçu, sans envoi ni modification.");
      toast.success("Archive MAZIGHO prête", { description: `${conversion.productCount} fiche(s) détectée(s) : contrôlez l’aperçu avant toute application.` });
    } catch (error) {
      setWordpressConversion(null);
      const message = error instanceof StudioWordpressConversionError || error instanceof Error ? error.message : "Conversion WordPress impossible.";
      setProgress(message);
      toast.error("Conversion WordPress interrompue", { description: message });
    } finally {
      setConvertingWordpress(false);
    }
  };

  const downloadWordpressArchive = () => {
    if (!wordpressConversion) return;
    const url = URL.createObjectURL(wordpressConversion.archive);
    const link = document.createElement("a");
    link.href = url;
    link.download = wordpressConversion.archiveName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Studio privé</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-950">Essai d’import universel</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Importer une boutique</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Un atelier privé pour vos exports Shopify, WooCommerce, PrestaShop, Wix, Etsy, CSV ou boutique sur mesure, une fois rangés dans le format ZIP MAZIGHO. L’archive est lue localement, préparée en aperçu, puis appliquée uniquement dans une nouvelle boutique créée depuis ce parcours.</p></div><Button type="button" variant="outline" onClick={() => setLocation("/admin/studio")} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au Studio</Button></header>

    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Frontière conservée</p><p className="mt-1">Cet atelier ne publie rien, ne bascule aucun domaine, ne touche pas aux clients, aux commandes, aux paiements, aux abonnements ni aux fournisseurs. Les pages, navigation et identité détectées restent en <strong>brouillon à examiner</strong> : elles ne remplacent jamais une vitrine automatiquement.</p></div></div></section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-5"><div className="grid gap-5 lg:grid-cols-2"><Card className="border-slate-200 shadow-sm"><CardHeader><CardDescription>Étape 1 — archive privée</CardDescription><CardTitle className="mt-1 flex items-center gap-2 text-xl"><FileArchive className="h-5 w-5 text-violet-700" /> Charger un ZIP MAZIGHO ou un CSV</CardTitle><CardDescription className="mt-2 max-w-3xl">Le ZIP peut contenir <code>catalogue.csv</code>, <code>categories.csv</code>, <code>variations.csv</code>, <code>images/</code>, <code>contenus/</code>, <code>marque/</code> et <code>manifest.json</code>. Pour ce premier essai, les produits, catégories, images et variantes sont pris en charge ; contenus et identité sont listés pour validation ultérieure.</CardDescription></CardHeader><CardContent><Label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-violet-300 bg-violet-50 px-4 text-sm font-semibold text-violet-950 hover:bg-violet-100"><FileUp className="mr-2 h-4 w-4" /> {reading ? "Lecture en cours…" : "Choisir une archive"}<input type="file" accept=".zip,.csv,application/zip,text/csv" className="sr-only" disabled={reading} onChange={event => { void readArchive(event.target.files?.[0]); event.currentTarget.value = ""; }} /></Label>{progress ? <p className="mt-3 text-sm leading-6 text-slate-600">{progress}</p> : null}</CardContent></Card>

      <Card className="border-amber-200 bg-amber-50/70 shadow-sm"><CardHeader><CardDescription>Étape 1 bis — sauvegarde WordPress</CardDescription><CardTitle className="mt-1 flex items-center gap-2 text-xl"><FileCog className="h-5 w-5 text-amber-800" /> Convertir un .wpress</CardTitle><CardDescription className="mt-2 leading-6">Choisissez une sauvegarde All-in-One WP Migration <code>.wpress</code>, ou un ZIP qui contient exactement un <code>.wpress</code>. La conversion se fait dans cet appareil : la sauvegarde brute ne part pas vers MAZIGHO.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]"><div className="space-y-2"><Label htmlFor="wordpress-currency">Devise source <span className="font-normal text-slate-500">(facultatif)</span></Label><input id="wordpress-currency" value={wordpressCurrency} onChange={event => setWordpressCurrency(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))} placeholder="Ex. DZD" inputMode="text" maxLength={3} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm uppercase" /></div><div className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs leading-5 text-amber-950">Aucune conversion de prix.</div></div><Label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-950 hover:bg-amber-100"><FileCog className="mr-2 h-4 w-4" /> {convertingWordpress ? "Conversion en cours…" : "Choisir la sauvegarde WordPress"}<input type="file" accept=".wpress,.zip,application/zip" className="sr-only" disabled={convertingWordpress || reading} onChange={event => { void convertWordpress(event.target.files?.[0]); event.currentTarget.value = ""; }} /></Label><p className="text-xs leading-5 text-slate-600">Limite directe : <strong>512 Mio</strong> pour un <code>.wpress</code>. La conversion extrait uniquement les produits, prix, stock et médias explicitement liés ; comptes, clients, commandes, paiements et réglages restent exclus.</p>{wordpressConversion ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p className="font-semibold">Archive MAZIGHO générée localement</p><p className="mt-1">{wordpressConversion.productCount} fiche(s) · {wordpressConversion.imageCount} visuel(s) lié(s) · source {wordpressConversion.sourceKind} · devise {wordpressConversion.currency}.</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={downloadWordpressArchive} className="border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100"><Download className="mr-2 h-4 w-4" /> Télécharger le ZIP</Button><Badge variant="outline" className="border-emerald-200 bg-white text-emerald-800">Aperçu déjà chargé</Badge></div>{wordpressConversion.warnings.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-950">{wordpressConversion.warnings.slice(0, 3).map(warning => <li key={warning}>{warning}</li>)}</ul> : null}</div> : null}</CardContent></Card></div>

      {preview ? <ArchivePreviewCard preview={preview} /> : <Card className="border-dashed border-slate-300 bg-slate-50"><CardContent className="p-6 text-sm leading-6 text-slate-600">Chargez l’un de vos ZIP de test. Rien n’est envoyé à la base tant que vous n’avez pas préparé une nouvelle boutique et confirmé l’application.</CardContent></Card>}

      {preview && !hasIssues ? <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardDescription>Étape 2 — créer la destination isolée</CardDescription>
          <CardTitle className="mt-1 flex items-center gap-2 text-xl"><PackageCheck className="h-5 w-5 text-violet-700" /> Préparer une nouvelle boutique depuis ce catalogue</CardTitle>
          <CardDescription className="mt-2">Cet atelier ne propose plus de choisir une boutique existante. L’archive ne peut alimenter qu’une nouvelle boutique créée depuis ce parcours et maintenue en préparation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-sm leading-6 text-violet-950"><p className="font-semibold">Aucune boutique existante ne sera modifiée</p><p className="mt-1">Cette étape enregistre seulement un brouillon Studio lié à l’archive aperçue. Vous contrôlerez ensuite le prévol et confirmerez séparément la création d’une boutique en état <code>setup</code>. Le ZIP reste sur cet appareil et devra être rechargé avant l’import.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="new-import-store-name">Nom de la future boutique</Label><Input id="new-import-store-name" value={newStoreDraft.displayName} onChange={event => setNewStoreDraft(current => ({ ...current, displayName: event.target.value }))} placeholder="Ex. Maison Azur" /></div>
            <div className="space-y-2"><Label htmlFor="new-import-store-domain">Domaine ou sous-domaine souhaité</Label><Input id="new-import-store-domain" value={newStoreDraft.requestedDomain} onChange={event => setNewStoreDraft(current => ({ ...current, requestedDomain: event.target.value }))} placeholder="maison-azur.mazigho.ch" autoCapitalize="none" /></div>
            <div className="space-y-2"><Label htmlFor="new-import-store-owner">Nom du propriétaire</Label><Input id="new-import-store-owner" value={newStoreDraft.ownerName} onChange={event => setNewStoreDraft(current => ({ ...current, ownerName: event.target.value }))} placeholder="Nom et prénom" /></div>
            <div className="space-y-2"><Label htmlFor="new-import-store-email">E-mail du propriétaire</Label><Input id="new-import-store-email" type="email" value={newStoreDraft.ownerEmail} onChange={event => setNewStoreDraft(current => ({ ...current, ownerEmail: event.target.value }))} placeholder="proprietaire@exemple.ch" autoCapitalize="none" /></div>
          </div>
          <div className="space-y-2"><Label>Base visuelle et catégories vides</Label><p className="text-xs leading-5 text-slate-500">Le catalogue aperçu sera importé plus tard ; ce choix ajoute seulement une structure modifiable à la nouvelle boutique.</p><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{storeFactoryModels.map(model => <button key={model.id} type="button" onClick={() => setNewStoreDraft(current => ({ ...current, factoryModel: model.id, customBusinessTheme: model.customBusinessTheme ?? current.customBusinessTheme }))} className={newStoreDraft.factoryModel === model.id ? "rounded-xl border-2 border-violet-700 bg-violet-50 p-3 text-left ring-2 ring-violet-100" : "rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-violet-300 hover:bg-violet-50/40"}><p className="text-sm font-semibold text-slate-950">{model.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{model.summary}</p></button>)}</div></div>
          {newStoreNeedsCustomTheme ? <div className="space-y-2"><Label htmlFor="new-import-store-theme">Univers de la boutique</Label><Input id="new-import-store-theme" value={newStoreDraft.customBusinessTheme} onChange={event => setNewStoreDraft(current => ({ ...current, customBusinessTheme: event.target.value }))} placeholder="Ex. décoration artisanale, thé, beauté…" /></div> : null}
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Base de marché</Label><div className="grid gap-2"><button type="button" onClick={() => setNewStoreDraft(current => ({ ...current, provisioningTemplate: "standard" }))} className={newStoreDraft.provisioningTemplate === "standard" ? "rounded-xl border-2 border-slate-800 bg-slate-50 p-3 text-left" : "rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-slate-300"}><p className="font-semibold text-slate-950">Standard</p><p className="mt-1 text-xs leading-5 text-slate-600">Marchés, livraison et devise seront réglés plus tard.</p></button><button type="button" onClick={() => setNewStoreDraft(current => ({ ...current, provisioningTemplate: "algeria", preferredCurrency: "DZD" }))} className={newStoreDraft.provisioningTemplate === "algeria" ? "rounded-xl border-2 border-emerald-700 bg-emerald-50 p-3 text-left" : "rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-left hover:border-emerald-400"}><p className="font-semibold text-emerald-950">Algérie — préparation DZD</p><p className="mt-1 text-xs leading-5 text-emerald-900">Wilayas et COD seront préparés, jamais activés automatiquement.</p></button></div></div><div className="space-y-2"><Label htmlFor="new-import-store-currency">Devise de départ</Label><select id="new-import-store-currency" value={newStoreDraft.preferredCurrency} disabled={newStoreDraft.provisioningTemplate === "algeria"} onChange={event => setNewStoreDraft(current => ({ ...current, preferredCurrency: event.target.value as NewStoreDraft["preferredCurrency"] }))} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"><option value="CHF">CHF — Franc suisse</option><option value="EUR">EUR — Euro</option><option value="USD">USD — Dollar US</option><option value="GBP">GBP — Livre sterling</option><option value="DZD">DZD — Dinar algérien</option></select><p className="text-xs leading-5 text-slate-500">La devise déclarée dans l’archive est informative : les prix ne seront pas convertis.</p></div></div>
          {preparedDraftId ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p className="font-semibold">Brouillon Studio prêt</p><p className="mt-1">Ouvrez les brouillons Studio, vérifiez le prévol, puis confirmez la création de la boutique en préparation. Revenez ensuite ici et rechargez l’archive : elle apparaîtra seule dans l’étape d’import dès que la boutique sera créée.</p><Link href="/admin/studio" className="mt-3 inline-flex"><Button type="button" variant="outline" className="border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100"><Store className="mr-2 h-4 w-4" /> Ouvrir les brouillons Studio</Button></Link></div> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Un brouillon ne réserve pas de domaine et ne crée aucun accès, paiement, e-mail ou publication.</p><Button type="button" disabled={!canPrepareNewStore} onClick={prepareNewStoreDraft} className="min-h-11 shrink-0 bg-violet-700 text-white hover:bg-violet-800">{createProvisioningDraft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Store className="mr-2 h-4 w-4" />}Préparer la nouvelle boutique</Button></div>}

          <div className="border-t border-slate-100 pt-5"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Étape 3 — importer dans la nouvelle boutique</p><p className="mt-1 text-sm leading-6 text-slate-600">Seules les boutiques créées depuis cet atelier et encore en préparation sont proposées ci-dessous. Une boutique existante, pilote ou active ne peut pas être sélectionnée.</p>{stores.length ? <div className="mt-4 space-y-4"><div className="space-y-2"><Label htmlFor="universal-import-store">Nouvelle boutique cible</Label><select id="universal-import-store" value={selectedStoreId} onChange={event => setSelectedStoreId(event.target.value)} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="">Choisir la nouvelle boutique créée depuis cet atelier…</option>{stores.map(store => <option key={store.id} value={store.id}>{store.displayName} · préparation</option>)}</select></div>{selectedStore ? <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950"><p className="font-semibold">Destination isolée : {selectedStore.displayName}</p><p className="mt-1">L’archive sera écrite seulement dans cette nouvelle boutique. Les boutiques déjà existantes restent hors périmètre.</p></div> : null}<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><Checkbox checked={rightsAcknowledged} onCheckedChange={value => setRightsAcknowledged(value === true)} /><span>Je confirme disposer des droits nécessaires sur les produits, images, descriptions, logo et autres contenus importés. Les ressources détectées resteront à contrôler.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><Checkbox checked={applyAcknowledged} onCheckedChange={value => setApplyAcknowledged(value === true)} /><span>Je confirme importer les <strong>{preview.rows.length} fiche(s)</strong> dans cette nouvelle boutique isolée. Je comprends que cela ne publie rien et n’active ni vente ni paiement.</span></label><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Les prix sont importés exactement comme indiqués dans le fichier : aucune conversion de devise n’est effectuée.</p><Button type="button" disabled={!canApply} onClick={() => void applyImport()} className="min-h-11 shrink-0 bg-teal-700 text-white hover:bg-teal-800"><WandSparkles className="mr-2 h-4 w-4" /> Importer dans la nouvelle boutique</Button></div></div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">Aucune nouvelle boutique issue de cet atelier n’est encore prête. Préparez un brouillon ci-dessus, créez la boutique après le prévol Studio, puis revenez ici avec la même archive.</div>}</div>
        </CardContent>
      </Card> : null}

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
