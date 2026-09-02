import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Boxes,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Loader2,
  PackageSearch,
  ShieldCheck,
  PackageCheck,
  Store,
  Search,
  MapPin,
  Workflow,
  ClipboardPenLine,
  ImagePlus,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import SupplierAccountRegistry from "@/components/admin/SupplierAccountRegistry";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const providerCards = [
  {
    name: "CJdropshipping",
    priority: "Priorité 1",
    tone: "emerald",
    state: "Configuré · brouillons contrôlés",
    description: "Connexion officielle active : stock, devis et profils de livraison sont contrôlés avant tout brouillon MAZIGHO.",
    benefits: ["Catalogue, stock et devis vérifiés", "Profils par pays enregistrés", "Aucune commande automatique"],
    href: "https://cjdropshipping.com/",
    action: "Ouvrir CJdropshipping",
  },
  {
    name: "AliExpress",
    priority: "Priorité 2",
    tone: "orange",
    state: "Prêt · accès OAuth requis",
    description: "Le même parcours MAZIGHO est prêt : catalogue, stock et devis par pays seront lus uniquement après l’autorisation officielle du compte vendeur.",
    benefits: ["Profils de livraison universels", "Brouillon après devis confirmé", "Aucune commande automatique"],
    href: "https://openservice.aliexpress.com/",
    action: "Voir la plateforme AliExpress",
  },
  {
    name: "BigBuy",
    priority: "Priorité 3",
    tone: "sky",
    state: "Prêt · pack API requis",
    description: "Le même parcours MAZIGHO est prêt : catalogue, stock et frais par pays seront lus seulement après l’activation officielle d’un accès API BigBuy compatible.",
    benefits: ["Profils de livraison universels", "Brouillon après devis confirmé", "Aucune commande automatique"],
    href: "https://www.bigbuy.eu/en/api_bigbuy.html",
    action: "Voir la documentation BigBuy",
  },
];

function ProviderCard({ provider }: { provider: typeof providerCards[number] }) {
  const isCj = provider.tone === "emerald";
  const isBigBuy = provider.tone === "sky";
  const palette = isCj
    ? "border-emerald-200 bg-emerald-50/50 text-emerald-700"
    : isBigBuy
      ? "border-sky-200 bg-sky-50/60 text-sky-700"
      : "border-orange-200 bg-orange-50/60 text-orange-700";
  const button = isCj ? "bg-emerald-600 hover:bg-emerald-700" : isBigBuy ? "bg-sky-600 hover:bg-sky-700" : "bg-orange-500 hover:bg-orange-600";
  const accent = isCj ? "bg-emerald-100 text-emerald-700" : isBigBuy ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700";
  const checkmark = isCj ? "text-emerald-600" : isBigBuy ? "text-sky-600" : "text-orange-600";

  return (
    <Card className={`overflow-hidden border shadow-sm ${isCj ? "border-emerald-100" : isBigBuy ? "border-sky-100" : "border-orange-100"}`}>
      <CardHeader className="border-b bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className={`${palette} border px-2.5 py-1 hover:${palette}`}>{provider.priority}</Badge>
              <span className="text-xs font-medium text-slate-500">{provider.state}</span>
            </div>
            <CardTitle className="text-xl text-slate-950">{provider.name}</CardTitle>
          </div>
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${accent}`}>
            <Boxes className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <p className="min-h-[72px] text-sm leading-6 text-slate-600">{provider.description}</p>
        <div className="space-y-2.5">
          {provider.benefits.map(benefit => <div key={benefit} className="flex items-center gap-2 text-sm text-slate-700"><BadgeCheck className={`h-4 w-4 shrink-0 ${checkmark}`} /> {benefit}</div>)}
        </div>
        <a href={provider.href} target="_blank" rel="noreferrer" className="block">
          <Button className={`w-full text-white ${button}`}><ExternalLink className="mr-2 h-4 w-4" /> {provider.action}</Button>
        </a>
      </CardContent>
    </Card>
  );
}

export default function AdminSuppliers() {
  const utils = trpc.useUtils();
  const cjStatusQuery = trpc.admin.suppliers.cjStatus.useQuery();
  const aliExpressStatusQuery = trpc.admin.suppliers.aliExpressStatus.useQuery();
  const bigBuyStatusQuery = trpc.admin.suppliers.bigBuyStatus.useQuery();
  const legalProfileQuery = trpc.admin.legal.get.useQuery();
  const verifyCj = trpc.admin.suppliers.verifyCj.useMutation({
    onSuccess: async (result) => {
      await utils.admin.suppliers.cjStatus.invalidate();
      result.verified ? toast.success("Connexion CJdropshipping vérifiée.") : toast.error(result.message);
    },
    onError: () => toast.error("La vérification CJdropshipping a échoué. Réessayez plus tard."),
  });
  const aliExpressStatus = aliExpressStatusQuery.data;
  const verifyAliExpress = trpc.admin.suppliers.verifyAliExpress.useMutation({
    onSuccess: async (result) => {
      await utils.admin.suppliers.aliExpressStatus.invalidate();
      toast.message(result.message);
    },
    onError: () => toast.error("La vérification de préparation AliExpress a échoué. Réessayez plus tard."),
  });
  const bigBuyStatus = bigBuyStatusQuery.data;
  const verifyBigBuy = trpc.admin.suppliers.verifyBigBuy.useMutation({
    onSuccess: async (result) => {
      await utils.admin.suppliers.bigBuyStatus.invalidate();
      toast.message(result.message);
    },
    onError: () => toast.error("La vérification de préparation BigBuy a échoué. Réessayez plus tard."),
  });
  const odooStatusQuery = trpc.admin.suppliers.odooStatus.useQuery();
  const odooStatus = odooStatusQuery.data;
  const verifyOdoo = trpc.admin.suppliers.verifyOdoo.useMutation({
    onSuccess: async (result) => {
      await utils.admin.suppliers.odooStatus.invalidate();
      result.verified ? toast.success("Connexion Odoo vérifiée.") : toast.message(result.message);
    },
    onError: () => toast.error("La vérification de la connexion Odoo a échoué. Réessayez plus tard."),
  });
  const cjStatus = cjStatusQuery.data;
  const cjBatchCategoriesQuery = trpc.admin.suppliers.cjBatchCategories.useQuery(undefined, { enabled: Boolean(cjStatus?.configured) });
  const cjFashionBatchCategoriesQuery = trpc.admin.suppliers.cjFashionBatchCategories.useQuery(undefined, { enabled: Boolean(cjStatus?.configured) });
  const importCjDraftBatch = trpc.admin.suppliers.importCjDraftBatch.useMutation();
  const curateCjFashionDrafts = trpc.admin.suppliers.curateCjFashionDrafts.useMutation();
  const [fashionCurationResult, setFashionCurationResult] = useState<{ reviewed: number; enriched: number; archived: number; byCategory: Array<{ category: string; enriched: number; archived: number }> } | null>(null);
  const runFashionCuration = async () => {
    if (!window.confirm("Nettoyer les brouillons Mode CJ existants ? Les fiches trop chères, mal classées ou hors univers seront archivées, tandis que les autres recevront un titre et une description françaises. Aucun produit ne sera publié ni supprimé.")) return;
    try {
      const result = await curateCjFashionDrafts.mutateAsync();
      setFashionCurationResult(result);
      toast.success(`Contrôle Mode terminé : ${result.enriched} fiche(s) enrichie(s), ${result.archived} archivée(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le nettoyage Mode n’a pas pu être terminé.");
    }
  };
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResults, setBatchResults] = useState<Array<{ category: string; requested: number; imported: number; skipped: number; failures: Array<{ productId: string | null; query: string; reason: string }> }>>([]);
  const runCjBatches = async () => {
    const batches = cjBatchCategoriesQuery.data || [];
    if (batches.length === 0) {
      toast.error("Les catégories CJ à importer ne sont pas disponibles pour le moment.");
      return;
    }
    if (!window.confirm(`Préparer jusqu’à ${batches.length * 8} brouillons CJ, soit 8 produits maximum par catégorie ? Chaque produit sera contrôlé pour le stock et la livraison Suisse. Aucun produit ne sera publié ni commandé.`)) return;
    setBatchRunning(true);
    setBatchResults([]);
    const results: Array<{ category: string; requested: number; imported: number; skipped: number; failures: Array<{ productId: string | null; query: string; reason: string }> }> = [];
    for (const batch of batches) {
      try {
        const result = await importCjDraftBatch.mutateAsync({ categorySlug: batch.categorySlug });
        results.push(result);
        setBatchResults([...results]);
        toast.success(`${result.category} : ${result.imported} brouillon(s) ajouté(s).`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lot CJ non terminé.";
        results.push({ category: batch.categoryLabel, requested: batch.requested, imported: 0, skipped: 0, failures: [{ productId: null, query: "lot", reason: message }] });
        setBatchResults([...results]);
        toast.error(`${batch.categoryLabel} : ${message}`);
      }
    }
    setBatchRunning(false);
    const imported = results.reduce((total, item) => total + item.imported, 0);
    toast.message(`Import CJ terminé : ${imported} brouillon(s) créés. Consultez Produits avant toute activation.`);
  };
  const [fashionBatchRunning, setFashionBatchRunning] = useState(false);
  const [fashionBatchResults, setFashionBatchResults] = useState<Array<{ category: string; requested: number; imported: number; skipped: number; failures: Array<{ productId: string | null; query: string; reason: string }> }>>([]);
  const runCjFashionBatches = async () => {
    const batches = cjFashionBatchCategoriesQuery.data || [];
    const totalRequested = batches.reduce((total, batch) => total + batch.requested, 0);
    if (batches.length === 0) {
      toast.error("Les catégories Mode Femme, Homme et Enfant ne sont pas disponibles.");
      return;
    }
    if (!window.confirm(`Préparer jusqu’à ${totalRequested} vêtements CJ en brouillon, répartis entre Femme, Homme et Enfant ? Chaque produit sera contrôlé pour le stock et la livraison Suisse. Aucun produit ne sera publié ni commandé.`)) return;
    setFashionBatchRunning(true);
    setFashionBatchResults([]);
    const results: Array<{ category: string; requested: number; imported: number; skipped: number; failures: Array<{ productId: string | null; query: string; reason: string }> }> = [];
    for (const batch of batches) {
      try {
        const result = await importCjDraftBatch.mutateAsync({ categorySlug: batch.categorySlug });
        results.push(result);
        setFashionBatchResults([...results]);
        toast.success(`${result.category} : ${result.imported} vêtement(s) ajouté(s).`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lot Mode non terminé.";
        results.push({ category: batch.categoryLabel, requested: batch.requested, imported: 0, skipped: 0, failures: [{ productId: null, query: "lot", reason: message }] });
        setFashionBatchResults([...results]);
        toast.error(`${batch.categoryLabel} : ${message}`);
      }
    }
    setFashionBatchRunning(false);
    const imported = results.reduce((total, item) => total + item.imported, 0);
    toast.message(`Import Mode terminé : ${imported} brouillon(s) créés. Consultez Produits avant toute activation.`);
  };
  const [cjKeyword, setCjKeyword] = useState("");
  const [cjCountry, setCjCountry] = useState("");
  const [cjFreeShippingOnly, setCjFreeShippingOnly] = useState(false);
  const searchCj = trpc.admin.suppliers.searchCj.useMutation({
    onError: (error) => toast.error(error.message || "La recherche CJ a échoué."),
  });
  const [swissChecks, setSwissChecks] = useState<Record<string, { deliverable: boolean; variantLabel: string | null; costUsd: number | null; delay: string | null; message: string }>>({});
  const checkCjSwissDelivery = trpc.admin.suppliers.checkCjSwissDelivery.useMutation({
    onSuccess: (result) => setSwissChecks(current => ({ ...current, [result.productId]: result })),
    onError: (error) => toast.error(error.message || "Impossible de vérifier la livraison Suisse."),
  });
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const searchCjByImage = trpc.admin.suppliers.searchCjByImage.useMutation({
    onError: (error) => toast.error(error.message || "La recherche à partir de l’image a échoué."),
  });

  const runCjSearch = (page = 1) => {
    if (cjKeyword.trim().length < 2) {
      toast.error("Saisissez au moins 2 caractères pour rechercher un produit.");
      return;
    }
    setSwissChecks({});
    searchCj.mutate({ keyword: cjKeyword.trim(), countryCode: cjCountry || undefined, freeShippingOnly: cjFreeShippingOnly, page });
  };

  const submitCjSearch = (event: React.FormEvent) => {
    event.preventDefault();
    runCjSearch(1);
  };

  const currentCjPage = searchCj.data?.page || 1;
  const cjTotalPages = searchCj.data ? Math.max(1, Math.ceil(searchCj.data.total / 12)) : 0;
  const cjVisiblePages = Array.from(new Set([1, cjTotalPages, ...Array.from({ length: 5 }, (_, index) => currentCjPage - 2 + index)
    .filter(page => page >= 1 && page <= cjTotalPages)])).sort((first, second) => first - second);

  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) {
      toast.error("Choisissez une image JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("L’image doit faire au maximum 4 Mo.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
        setPhotoName(file.name);
      }
    };
    reader.onerror = () => toast.error("Impossible de lire cette image.");
    reader.readAsDataURL(file);
  };

  const submitImageSearch = () => {
    if (!photoDataUrl) {
      toast.error("Ajoutez d’abord une photo de référence.");
      return;
    }
    searchCjByImage.mutate({ imageDataUrl: photoDataUrl, countryCode: cjCountry || undefined });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-700"><Workflow className="h-4 w-4" /> Hub fournisseurs</div>
              <h1 className="max-w-2xl font-serif text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Vos sources produits, sans perdre le contrôle.</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">MAZIGHO centralise les futurs canaux fournisseurs. Vous gardez toujours la main sur le choix du produit, la marge, le prix de vente et la publication.</p>
            </div>
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-sky-600 text-white shadow-lg shadow-sky-200 md:mx-0"><Globe2 className="h-12 w-12" /></div>
          </div>
          <div className="flex items-start gap-3 border-t border-sky-100 bg-white/70 px-6 py-4 text-sm text-slate-700 md:px-8"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Protection active :</strong> aucun produit n’est publié et aucune commande fournisseur n’est envoyée sans votre validation explicite.</span></div>
        </section>

        <SupplierAccountRegistry />

        <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cjStatus?.verified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Connexion CJdropshipping</h2><Badge className={cjStatus?.verified ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{cjStatus?.verified ? "Vérifiée" : cjStatus?.configured ? "À vérifier" : "En attente de clé"}</Badge></div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{cjStatusQuery.isLoading ? "Lecture de l’état de connexion…" : (cjStatus?.message || "État de connexion indisponible.")}</p>
              </div>
            </div>
            {cjStatus?.configured ? <Button onClick={() => verifyCj.mutate()} disabled={verifyCj.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700">{verifyCj.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Vérifier la connexion</Button> : <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">La clé sera ajoutée plus tard dans les variables sécurisées Vercel, jamais dans ce formulaire.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm md:p-6" data-testid="cj-batch-import-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><PackageCheck className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Sélection CJ guidée par catégorie</h2><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Brouillons uniquement</Badge></div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">Prépare jusqu’à 8 produits par catégorie standard, soit 48 brouillons maximum. Chaque candidat doit avoir un stock CJ positif et une livraison Suisse chiffrée. Les frais fournisseur sont inclus dans le prix client ; aucun transport n’est affiché ni facturé séparément au client.</p>
              </div>
            </div>
            <Button type="button" onClick={runCjBatches} disabled={!cjStatus?.configured || batchRunning || importCjDraftBatch.isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
              {batchRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
              {batchRunning ? `Préparation ${batchResults.length}/${cjBatchCategoriesQuery.data?.length || 6}` : "Préparer les 6 lots CJ"}
            </Button>
          </div>
          <p className="mt-4 rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-xs leading-5 text-emerald-950"><strong>Règles appliquées :</strong> recherche ciblée, contrôle d’un stock positif, devis de livraison CJ vers la Suisse, prix final avec livraison incluse, statut brouillon et protection contre les doublons. Les catégories de créations originales ne sont pas concernées.</p>
          {batchResults.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{batchResults.map(result => <div key={result.category} className="rounded-xl border border-emerald-200 bg-white p-3 text-sm"><p className="font-semibold text-slate-900">{result.category}</p><p className="mt-1 text-emerald-800"><strong>{result.imported}/{result.requested}</strong> brouillon(s) créés</p><p className="mt-1 text-xs text-slate-500">{result.skipped} doublon(s) ou candidat(s) écarté(s) · {result.failures.length} incident(s) CJ</p></div>)}</div>}
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm md:p-6" data-testid="cj-fashion-batch-import-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700"><PackageCheck className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Sélection CJ · Mode Femme, Homme & Enfant</h2><Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">50 brouillons maximum</Badge></div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">Prépare jusqu’à 50 vêtements, répartis en 17 modèles Femme, 17 modèles Homme et 16 modèles Enfant. Chaque article doit avoir un stock CJ positif et une livraison Suisse chiffrée. Le prix client inclut déjà le transport fournisseur.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={runFashionCuration} disabled={fashionBatchRunning || curateCjFashionDrafts.isPending} className="border-rose-300 bg-white text-rose-800 hover:bg-rose-100">
                {curateCjFashionDrafts.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardPenLine className="mr-2 h-4 w-4" />}
                {curateCjFashionDrafts.isPending ? "Nettoyage en cours…" : "Soigner les brouillons Mode"}
              </Button>
              <Button type="button" onClick={runCjFashionBatches} disabled={!cjStatus?.configured || fashionBatchRunning || importCjDraftBatch.isPending || curateCjFashionDrafts.isPending} className="bg-rose-700 text-white hover:bg-rose-800">
                {fashionBatchRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                {fashionBatchRunning ? `Préparation ${fashionBatchResults.length}/${cjFashionBatchCategoriesQuery.data?.length || 3}` : "Préparer les 50 vêtements CJ"}
              </Button>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-rose-200 bg-white/80 px-4 py-3 text-xs leading-5 text-rose-950"><strong>Règles appliquées :</strong> vêtements destinés à la catégorie choisie, contrôle du stock positif, devis de livraison Suisse, prix final tout compris, statut brouillon et prévention des doublons. Aucun produit n’est publié ni commandé.</p>
          {fashionBatchResults.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-3">{fashionBatchResults.map(result => <div key={result.category} className="rounded-xl border border-rose-200 bg-white p-3 text-sm"><p className="font-semibold text-slate-900">{result.category}</p><p className="mt-1 text-rose-800"><strong>{result.imported}/{result.requested}</strong> brouillon(s) créés</p><p className="mt-1 text-xs text-slate-500">{result.skipped} doublon(s) ou candidat(s) écarté(s) · {result.failures.length} incident(s) CJ</p></div>)}</div>}
          {fashionCurationResult && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><strong>Contrôle qualité terminé :</strong> {fashionCurationResult.enriched} fiche(s) enrichie(s), {fashionCurationResult.archived} fiche(s) archivée(s), sur {fashionCurationResult.reviewed} brouillon(s) analysés. Aucun produit n’a été publié ni supprimé.</div>}
        </section>

        <section className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${aliExpressStatus?.authorized ? "bg-emerald-100 text-emerald-700" : aliExpressStatus?.configured ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Connexion AliExpress</h2><Badge className={aliExpressStatus?.authorized ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : aliExpressStatus?.configured ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{aliExpressStatus?.authorized ? "OAuth détecté" : aliExpressStatus?.configured ? "Autorisation à finaliser" : "Application requise"}</Badge></div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{aliExpressStatusQuery.isLoading ? "Lecture de l’état de préparation…" : (aliExpressStatus?.message || "État AliExpress indisponible.")}</p><p className="mt-2 text-xs text-slate-500">Compte AliExpress de référence : <strong className="font-medium text-slate-700">yacbhll@gmail.com</strong> · rappel administratif uniquement, sans clé ni autorisation stockée.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => verifyAliExpress.mutate()} disabled={verifyAliExpress.isPending} className="bg-orange-500 text-white hover:bg-orange-600">{verifyAliExpress.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Vérifier la préparation</Button><a href="https://openservice.aliexpress.com/" target="_blank" rel="noreferrer"><Button variant="outline" className="border-orange-200 text-orange-800 hover:bg-orange-50"><ExternalLink className="mr-2 h-4 w-4" /> Open Platform</Button></a></div>
          </div>
          <p className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-xs leading-5 text-orange-950">Cette vérification lit seulement l’état sécurisé de l’application et de l’autorisation OAuth. Elle n’ouvre aucun catalogue, ne transmet aucune commande et n’affiche jamais de clé.</p>
        </section>

        <section className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${bigBuyStatus?.configured ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Connexion BigBuy</h2><Badge className={bigBuyStatus?.configured ? "bg-sky-100 text-sky-800 hover:bg-sky-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{bigBuyStatus?.configured ? "Clé à vérifier" : "Pack API requis"}</Badge></div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{bigBuyStatusQuery.isLoading ? "Lecture de l’état de préparation…" : (bigBuyStatus?.message || "État BigBuy indisponible.")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => verifyBigBuy.mutate()} disabled={verifyBigBuy.isPending} className="bg-sky-600 text-white hover:bg-sky-700">{verifyBigBuy.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Vérifier la préparation</Button><a href="https://www.bigbuy.eu/en/account/create/" target="_blank" rel="noreferrer"><Button variant="outline" className="border-sky-200 text-sky-800 hover:bg-sky-50"><ExternalLink className="mr-2 h-4 w-4" /> Créer un compte gratuit</Button></a></div>
          </div>
          <div className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-950"><strong>Étape gratuite :</strong> créez un compte pour consulter le catalogue, les prix distributeur et les frais/délais de transport. <strong>N’activez aucun pack ni aucun essai payant à cette étape.</strong><br /><span className="text-sky-900">L’accès API sera utile plus tard : MAZIGHO lira alors seulement le catalogue, le stock et les devis par pays avant tout brouillon ; aucune commande ou paiement ne sera envoyé automatiquement.</span></div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm md:p-6" data-testid="odoo-status-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${odooStatus?.configured ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Connexion Odoo (ERP)</h2><Badge data-testid="odoo-status-badge" className={verifyOdoo.data?.verified ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : odooStatus?.configured ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{verifyOdoo.data?.verified ? "Vérifiée" : odooStatus?.configured ? "À vérifier" : "En attente de variables"}</Badge></div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{odooStatusQuery.isLoading ? "Lecture de l’état de connexion…" : (verifyOdoo.data?.message || odooStatus?.message || "État Odoo indisponible.")}</p>
                {odooStatus?.configured && (odooStatus.url || odooStatus.db) && <p className="mt-1 text-xs text-slate-500">{odooStatus.url}{odooStatus.db ? ` · base ${odooStatus.db}` : ""}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => verifyOdoo.mutate()} disabled={verifyOdoo.isPending} data-testid="verify-odoo-btn" className="bg-emerald-600 text-white hover:bg-emerald-700">{verifyOdoo.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Tester la connexion</Button></div>
          </div>
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-950">Confirme que les variables <strong>ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY</strong> configurées dans Vercel répondent. Les commandes payées créent automatiquement le client et une vente chiffrée dans Odoo. Ce test lit uniquement l’état d’authentification (aucune donnée n’est modifiée).</div>
        </section>

        <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-800"><PackageCheck className="h-4 w-4" /> Identité colis MAZIGHO</div><h2 className="text-xl font-semibold text-slate-950">Préparer la marque avant les premières expéditions</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Ces informations serviront de référence pour les tests d’emballage et d’expédition CJ. Elles ne sont pas encore transmises à CJ, ni affichées sur un colis sans validation préalable.</p></div><Badge variant="secondary" className="w-fit bg-white text-violet-800">À confirmer dans CJ</Badge></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-violet-100 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Marque à utiliser</p><p className="mt-1 font-semibold text-slate-900">MAZIGHO</p><p className="mt-1 text-xs text-slate-500">À associer au packaging personnalisé, si choisi.</p></div><div className="rounded-xl border border-violet-100 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Adresse de référence</p><p className="mt-1 text-sm font-medium text-slate-900">{legalProfileQuery.data ? `${legalProfileQuery.data.addressLine}, ${legalProfileQuery.data.postalCodeCity}` : "Chargement de l’adresse légale…"}</p><p className="mt-1 text-xs text-slate-500">{legalProfileQuery.data?.country || "Suisse"} · à vérifier avec CJ avant toute expédition.</p></div><div className="rounded-xl border border-violet-100 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Statut fournisseur</p><p className="mt-1 text-sm font-medium text-slate-900">Aucune transmission automatique</p><p className="mt-1 text-xs text-slate-500">Le contenu du colis, l’adresse affichée et le packaging seront testés puis confirmés.</p></div></div>
          <div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="outline" className="border-violet-200 bg-white text-violet-900 hover:bg-violet-100"><Link href="/admin/legal">Vérifier l’adresse légale</Link></Button><a href="https://cjdropshipping.com/customPackaging" target="_blank" rel="noreferrer"><Button variant="outline" className="border-violet-200 bg-white text-violet-900 hover:bg-violet-100"><ExternalLink className="mr-2 h-4 w-4" /> Voir le packaging CJ</Button></a></div>
        </section>

        <section className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-sky-700"><PackageSearch className="h-4 w-4" /> Catalogue CJ — aperçu</div>
              <h2 className="text-xl font-semibold text-slate-950">Rechercher avant de choisir</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Cette recherche lit uniquement le catalogue officiel CJ. Elle sert à trouver un produit ; la livraison vers un pays client sera calculée séparément, sur une variante précise. Aucun produit n’est importé, publié ou commandé à cette étape.</p>
            </div>
            <Badge variant="secondary" className="w-fit bg-white text-slate-700">12 produits par page</Badge>
          </div>
          <form onSubmit={submitCjSearch} className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_auto_auto]">
            <label className="block">
              <span className="sr-only">Mot-clé CJ</span>
              <input value={cjKeyword} onChange={event => setCjKeyword(event.target.value)} placeholder="Ex. lampe de bureau, accessoire fitness…" className="h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-sky-500" />
            </label>
            <label className="block">
              <span className="sr-only">Filtre d’entrepôt CJ</span>
              <select value={cjCountry} onChange={event => setCjCountry(event.target.value)} aria-label="Filtre d’entrepôt CJ" className="h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                <option value="">Tous entrepôts CJ</option>
                <option value="CH">Stock en Suisse (CH)</option>
                <option value="FR">Stock en France (FR)</option>
                <option value="DE">Stock en Allemagne (DE)</option>
                <option value="IT">Stock en Italie (IT)</option>
                <option value="AT">Stock en Autriche (AT)</option>
                <option value="BE">Stock en Belgique (BE)</option>
                <option value="NL">Stock aux Pays-Bas (NL)</option>
                <option value="ES">Stock en Espagne (ES)</option>
              </select>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-medium text-sky-900"><input type="checkbox" checked={cjFreeShippingOnly} onChange={event => setCjFreeShippingOnly(event.target.checked)} className="h-4 w-4 accent-sky-600" /> Livraison gratuite CJ</label>
            <Button type="submit" disabled={!cjStatus?.configured || searchCj.isPending} className="h-11 bg-sky-600 text-white hover:bg-sky-700">{searchCj.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Rechercher</Button>
          </form>
          <p className="mt-3 text-xs leading-5 text-slate-600"><strong>Important :</strong> ce menu filtre seulement les produits ayant du stock dans un entrepôt CJ. Pour confirmer une livraison vers l’Espagne, l’Italie ou un autre pays, ouvrez ensuite « Préparer le devis par pays » sur le produit choisi.</p>
          {!cjStatus?.configured && <p className="mt-3 text-xs text-slate-500">Configurez et vérifiez d’abord la clé CJ dans le bloc situé au-dessus.</p>}

          <div className="mt-5 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-violet-800"><ImagePlus className="h-4 w-4" /> Rechercher à partir d’une photo</div><p className="mt-1 max-w-2xl text-xs leading-5 text-violet-900/80">Ajoutez une photo de référence : MAZIGHO en déduit un mot-clé générique, puis interroge le catalogue CJ officiel. Elle est transmise une seule fois au service d’analyse, mais n’est ni enregistrée dans le catalogue ni publiée. N’ajoutez pas de photo personnelle.</p></div><Badge variant="secondary" className="bg-white text-violet-800">JPG, PNG ou WebP · 4 Mo max.</Badge></div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-medium text-violet-900 hover:bg-violet-100"><ImagePlus className="h-4 w-4" /> {photoName || "Choisir une photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only" /></label>
              <Button type="button" onClick={submitImageSearch} disabled={!cjStatus?.configured || !photoDataUrl || searchCjByImage.isPending} className="h-11 bg-violet-600 text-white hover:bg-violet-700">{searchCjByImage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Trouver des produits similaires</Button>
            </div>
            {photoDataUrl && <div className="mt-4 flex items-center gap-3 rounded-lg border border-violet-100 bg-white p-2"><img src={photoDataUrl} alt="Photo de référence" className="h-16 w-16 rounded-md border bg-slate-50 object-contain p-1" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{photoName}</p><p className="text-xs text-slate-500">Photo prête pour une seule analyse à votre demande.</p></div><Button type="button" variant="ghost" size="icon" aria-label="Retirer la photo" onClick={() => { setPhotoDataUrl(null); setPhotoName(""); searchCjByImage.reset(); }}><X className="h-4 w-4" /></Button></div>}
          </div>

          {searchCj.data && (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm text-slate-600"><strong className="text-slate-900">{searchCj.data.total.toLocaleString("fr-CH")}</strong> résultats possibles pour « {searchCj.data.keyword} » <span className="text-slate-500">· page {currentCjPage} sur {cjTotalPages}</span></p>{cjFreeShippingOnly && <p className="mt-1 text-xs text-sky-700">Filtre actif : CJ signale une livraison incluse. Vérification Suisse toujours requise avant brouillon.</p>}</div><p className="text-xs text-slate-500">Prix fournisseur indicatif en USD — expédition à confirmer.</p></div>
              {searchCj.data.products.length === 0 ? <div className="rounded-xl border border-dashed border-sky-200 bg-white p-6 text-sm text-slate-600">Aucun produit n’a été renvoyé avec ces critères. Essayez un autre mot-clé ou sélectionnez « Tous entrepôts ».</div> : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {searchCj.data.products.map(product => <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex h-36 items-center justify-center bg-slate-50">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-2" /> : <Boxes className="h-8 w-8 text-slate-300" />}</div>
                    <div className="space-y-3 p-4"><div><h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">{product.name}</h3><p className="mt-1 truncate text-xs text-slate-500">SKU : {product.sku || "Non communiqué"}</p></div>
                      <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-slate-500">Prix fournisseur</p><p className="font-semibold text-slate-900">{product.supplierPriceUsd == null ? "—" : `$${product.supplierPriceUsd.toFixed(2)} USD`}</p></div><div className="text-right"><p className="text-xs text-slate-500">Stock catalogue CJ</p><p className="font-medium text-slate-700">{product.verifiedStock != null && product.verifiedStock > 0 ? `${product.verifiedStock.toLocaleString("fr-CH")} indiqué${product.verifiedStock > 1 ? "s" : ""}` : "À confirmer"}</p></div></div>
                      <div className="flex flex-wrap gap-1.5">{product.category && <Badge variant="secondary" className="max-w-full truncate bg-slate-100 text-slate-600">{product.category}</Badge>}{product.hasCeCertification && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">CE indiqué</Badge>}{product.isFreeShipping && <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Livraison gratuite indiquée</Badge>}</div>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> Délai CJ : {product.deliveryCycle ? `${product.deliveryCycle} jours` : "à confirmer"}</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => checkCjSwissDelivery.mutate({ productId: product.id, productSku: product.sku || undefined })} disabled={checkCjSwissDelivery.isPending} className="w-full border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100">{checkCjSwissDelivery.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />} Contrôle rapide Suisse</Button>
                      {swissChecks[product.id] && <p className={`rounded-md px-2 py-1.5 text-xs leading-4 ${swissChecks[product.id].deliverable ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{swissChecks[product.id].deliverable ? <><strong>Suisse confirmée :</strong> dès ${swissChecks[product.id].costUsd?.toFixed(2)} USD{swissChecks[product.id].delay ? ` · ${swissChecks[product.id].delay} jours` : ""}.</> : <><strong>Suisse non confirmée :</strong> {swissChecks[product.id].message}</>}</p>}
                      <Link href={`/admin/import-cj?pid=${encodeURIComponent(product.id)}`}><Button type="button" variant="outline" size="sm" className="w-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"><ClipboardPenLine className="mr-2 h-4 w-4" /> Préparer le devis par pays</Button></Link>
                    </div>
                  </article>)}
                </div>
              )}
              {cjTotalPages > 1 && <nav aria-label="Pagination des résultats CJ" className="mt-6 flex flex-wrap items-center justify-center gap-1.5"><Button type="button" size="sm" variant="outline" onClick={() => runCjSearch(currentCjPage - 1)} disabled={searchCj.isPending || currentCjPage <= 1}><ChevronLeft className="mr-1 h-4 w-4" /> Précédent</Button>{cjVisiblePages.map((page, index) => <span key={page} className="contents">{index > 0 && page - cjVisiblePages[index - 1] > 1 && <span className="px-1 text-sm text-slate-400">…</span>}<Button type="button" size="sm" variant={page === currentCjPage ? "default" : "outline"} onClick={() => runCjSearch(page)} disabled={searchCj.isPending} className={page === currentCjPage ? "bg-sky-700 hover:bg-sky-800" : ""}>{page}</Button></span>)}<Button type="button" size="sm" variant="outline" onClick={() => runCjSearch(currentCjPage + 1)} disabled={searchCj.isPending || currentCjPage >= cjTotalPages}>Suivant <ChevronRight className="ml-1 h-4 w-4" /></Button></nav>}
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Avant toute importation :</strong> vérifiez le prix rendu, la livraison vers votre pays, les variantes, la qualité, les droits d’image et la conformité. Ce module ne crée aucun produit MAZIGHO et aucune commande CJ.</div>
            </div>
          )}

          {searchCjByImage.data && <div className="mt-6 border-t border-violet-100 pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm text-slate-700"><strong className="text-violet-900">{searchCjByImage.data.total.toLocaleString("fr-CH")}</strong> résultats possibles à partir du mot-clé « {searchCjByImage.data.keyword} »</p><p className="mt-1 text-xs text-slate-500">Interprétation : {searchCjByImage.data.interpretation || "produit de référence"} · confiance {searchCjByImage.data.confidence === "high" ? "élevée" : searchCjByImage.data.confidence === "low" ? "faible" : "moyenne"}.</p></div><Badge variant="secondary" className="bg-violet-50 text-violet-800">Suggestion à vérifier</Badge></div>
            {searchCjByImage.data.products.length === 0 ? <div className="rounded-xl border border-dashed border-violet-200 bg-white p-6 text-sm text-slate-600">Aucun produit CJ n’a été renvoyé pour cette suggestion. Essayez une photo plus nette ou utilisez un mot-clé.</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{searchCjByImage.data.products.map(product => <article key={`image-${product.id}`} className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm"><div className="flex h-36 items-center justify-center bg-violet-50/50">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-2" /> : <Boxes className="h-8 w-8 text-slate-300" />}</div><div className="space-y-3 p-4"><div><h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">{product.name}</h3><p className="mt-1 truncate text-xs text-slate-500">SKU : {product.sku || "Non communiqué"}</p></div><div className="flex items-end justify-between gap-3"><div><p className="text-xs text-slate-500">Prix fournisseur</p><p className="font-semibold text-slate-900">{product.supplierPriceUsd == null ? "—" : `$${product.supplierPriceUsd.toFixed(2)} USD`}</p></div><div className="text-right"><p className="text-xs text-slate-500">Stock catalogue CJ</p><p className="font-medium text-slate-700">{product.verifiedStock != null && product.verifiedStock > 0 ? `${product.verifiedStock.toLocaleString("fr-CH")} indiqué${product.verifiedStock > 1 ? "s" : ""}` : "À confirmer"}</p></div></div><p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> Délai CJ : {product.deliveryCycle ? `${product.deliveryCycle} jours` : "à confirmer"}</p><Link href={`/admin/import-cj?pid=${encodeURIComponent(product.id)}`}><Button type="button" variant="outline" size="sm" className="w-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"><ClipboardPenLine className="mr-2 h-4 w-4" /> Préparer le devis par pays</Button></Link></div></article>)}</div>}
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Résultats indicatifs :</strong> une photo produit une suggestion de mot-clé, pas une identification certaine. Vérifiez toujours prix, livraison, variantes, conformité et droits d’image avant toute préparation de brouillon.</div>
          </div>}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-sky-700"><PackageSearch className="h-4 w-4" /></div><h2 className="font-semibold text-slate-900">1. Importer en aperçu</h2><p className="mt-2 text-sm leading-6 text-slate-600">Le produit arrive d’abord en brouillon : titre, images, prix et conformité restent à vérifier.</p></CardContent></Card>
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-700"><Store className="h-4 w-4" /></div><h2 className="font-semibold text-slate-900">2. Décider la publication</h2><p className="mt-2 text-sm leading-6 text-slate-600">Vous choisissez la marge, le stock, les variantes et le statut avant que le client ne voie le produit.</p></CardContent></Card>
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><LockKeyhole className="h-4 w-4" /></div><h2 className="font-semibold text-slate-900">3. Connecter officiellement</h2><p className="mt-2 text-sm leading-6 text-slate-600">Les API seront reliées seulement par les pages et autorisations officielles des plateformes.</p></CardContent></Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {providerCards.map(provider => <ProviderCard key={provider.name} provider={provider} />)}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle>Canal de vente Amazon</CardTitle><CardDescription>Amazon viendra après les fournisseurs et les paiements MAZIGHO.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>À préparer plus tard :</strong> compte Seller Central, produits testés, délais fiables, politique de retour et mode de livraison conforme. Amazon sera un canal de vente distinct, pas un fournisseur.</div>
              <a href="https://developer.amazonservices.com/" target="_blank" rel="noreferrer"><Button variant="outline" className="border-amber-200 bg-white text-amber-900 hover:bg-amber-50"><ExternalLink className="mr-2 h-4 w-4" /> Découvrir Amazon SP-API</Button></a>
            </CardContent>
          </Card>
          <Card className="border-sky-200 shadow-sm">
            <CardHeader><CardTitle>Règle commune de livraison</CardTitle><CardDescription>La même protection s’applique à chaque fournisseur retenu.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600"><p>Un produit reste invisible côté client tant que son coût, son délai et sa disponibilité ne sont pas confirmés pour le pays concerné.</p><Badge variant="secondary" className="bg-sky-50 text-sky-800">Profils par produit, pays et variante · sans commande automatique</Badge></CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-semibold text-emerald-950">Vous avez déjà une fiche produit fournisseur ?</h2><p className="mt-1 text-sm text-emerald-800">Le flux actuel reste disponible : analyse, vérification puis import en brouillon.</p></div>
          <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700"><Link href="/admin/importation">Importer manuellement <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
      </div>
    </DashboardLayout>
  );
}
