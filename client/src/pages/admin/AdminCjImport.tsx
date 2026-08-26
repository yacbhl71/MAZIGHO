import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, ArrowLeft, BadgeCheck, ClipboardPenLine, ImageIcon, Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { centsToChfInput, parseChfToCents } from "@/lib/moneyInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 170);
}

function parseChfCents(value: string) {
  return parseChfToCents(value);
}

function formatChfInput(cents: number | null) {
  return cents == null ? "" : centsToChfInput(cents);
}

function parseDeliveryRange(value: string | null) {
  const days = (value?.match(/\d+/g) || []).map(Number).filter(Number.isFinite);
  return { minDeliveryDays: days[0] ?? null, maxDeliveryDays: days[days.length - 1] ?? null };
}

const deliveryMarkets = [
  { code: "CH", label: "Suisse" }, { code: "FR", label: "France" }, { code: "DE", label: "Allemagne" }, { code: "IT", label: "Italie" },
  { code: "AT", label: "Autriche" }, { code: "BE", label: "Belgique" }, { code: "NL", label: "Pays-Bas" }, { code: "ES", label: "Espagne" },
] as const;

export default function AdminCjImport() {
  const [, setLocation] = useLocation();
  const parameters = new URLSearchParams(window.location.search);
  const productId = parameters.get("pid")?.trim() || "";
  const countryCode = parameters.get("country")?.trim() || undefined;
  const categoriesQuery = trpc.categories.getAll.useQuery("fr");

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [marginPercent, setMarginPercent] = useState("50");
  const [supplierCostChf, setSupplierCostChf] = useState("");
  const [salePriceChf, setSalePriceChf] = useState("");
  const [stock, setStock] = useState("0");
  const [deliveryVariantId, setDeliveryVariantId] = useState("");
  const [deliveryCountries, setDeliveryCountries] = useState<Array<(typeof deliveryMarkets)[number]["code"]>>(["CH", "FR", "DE", "IT", "AT", "BE", "NL", "ES"]);

  const prepareCjImport = trpc.admin.suppliers.prepareCjImport.useMutation({
    onSuccess: (product) => {
      setName(product.name);
      setSlug(slugify(product.name));
      setDescription(product.description);
      setImagesText(product.images.join("\n"));
      setDeliveryVariantId(product.variants[0]?.id || "");
    },
    onError: (error) => toast.error(error.message || "Impossible de lire cette fiche CJ."),
  });

  useEffect(() => {
    if (!productId || prepareCjImport.isPending || prepareCjImport.data) return;
    prepareCjImport.mutate({ productId, countryCode });
  }, [productId, countryCode, prepareCjImport]);

  const preparedProduct = prepareCjImport.data;
  const quoteCjDelivery = trpc.admin.suppliers.quoteCjDelivery.useMutation({
    onError: error => toast.error(error.message || "Impossible de calculer la livraison CJ."),
  });
  const selectedVariant = preparedProduct?.variants.find(variant => variant.id === deliveryVariantId) || null;
  const deliveryQuoteIsCurrent = quoteCjDelivery.data?.variantId === deliveryVariantId;
  const confirmedDeliveryCountries = useMemo(() => deliveryQuoteIsCurrent ? (quoteCjDelivery.data?.countries.filter(country => country.options.length > 0) || []) : [], [deliveryQuoteIsCurrent, quoteCjDelivery.data]);
  const confirmedVariantStock = deliveryQuoteIsCurrent && quoteCjDelivery.data?.stock.checked === true && (quoteCjDelivery.data.stock.totalQuantity ?? 0) > 0;
  const suggestedCostCents = useMemo(() => {
    const rate = Number(exchangeRate.replace(",", "."));
    const productUsd = selectedVariant?.supplierPriceUsd ?? preparedProduct?.supplierPriceUsd;
    if (productUsd == null || !Number.isFinite(rate) || rate <= 0) return null;
    return Math.round(productUsd * rate * 100);
  }, [exchangeRate, preparedProduct, selectedVariant]);

  useEffect(() => {
    if (suggestedCostCents == null) return;
    setSupplierCostChf(formatChfInput(suggestedCostCents));
  }, [suggestedCostCents]);

  const supplierCostCents = parseChfCents(supplierCostChf);
  const salePriceCents = parseChfCents(salePriceChf);
  const productMarkupCents = supplierCostCents == null || salePriceCents == null ? null : salePriceCents - supplierCostCents;
  const deliveryProfiles = useMemo(() => {
    const rate = Number(exchangeRate.replace(",", "."));
    const targetMargin = Number(marginPercent.replace(",", "."));
    if (!selectedVariant || !salePriceCents || supplierCostCents == null || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(targetMargin) || targetMargin < 0) return [];
    const requiredProfitCents = Math.round(supplierCostCents * targetMargin / 100);
    return confirmedDeliveryCountries.flatMap(country => {
      const option = country.options[0];
      if (!option) return [];
      const supplierShippingCost = Math.round(option.costUsd * rate * 100);
      const profitAfterShipping = salePriceCents - supplierCostCents - supplierShippingCost;
      const customerShippingCost = profitAfterShipping >= requiredProfitCents ? 0 : supplierShippingCost;
      const range = parseDeliveryRange(option.delay);
      return [{
        countryCode: country.countryCode as (typeof deliveryMarkets)[number]["code"],
        supplierVariantId: selectedVariant.id,
        supplierShippingCost,
        customerShippingCost,
        deliveryMethod: option.name,
        ...range,
      }];
    });
  }, [confirmedDeliveryCountries, exchangeRate, marginPercent, salePriceCents, selectedVariant, supplierCostCents]);
  const suggestedSaleCents = useMemo(() => {
    const margin = Number(marginPercent.replace(",", "."));
    if (supplierCostCents == null || supplierCostCents <= 0 || !Number.isFinite(margin) || margin < 0) return null;
    return Math.round(supplierCostCents * (1 + margin / 100));
  }, [supplierCostCents, marginPercent]);

  useEffect(() => {
    if (suggestedSaleCents == null) return;
    setSalePriceChf(formatChfInput(suggestedSaleCents));
  }, [suggestedSaleCents]);

  const importCjDraft = trpc.admin.products.importCjDraft.useMutation({
    onSuccess: () => {
      toast.success("Produit CJ enregistré en brouillon. Il reste invisible pour les clients.");
      setLocation("/admin/produits");
    },
    onError: (error) => toast.error(error.message || "Le brouillon CJ n’a pas pu être enregistré."),
  });

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedStock = Number(stock);
    const images = imagesText.split("\n").map(value => value.trim()).filter(Boolean);

    if (!preparedProduct || !categoryId || !name.trim() || !slug.trim()) {
      toast.error("Choisissez une catégorie et complétez le titre ainsi que le slug.");
      return;
    }
    if (!deliveryQuoteIsCurrent || confirmedDeliveryCountries.length === 0) {
      toast.error("Vérifiez au moins une destination CJ réellement desservie avant de créer le brouillon.");
      return;
    }
    if (!confirmedVariantStock) {
      toast.error("Le stock officiel de la variante CJ doit être contrôlé et supérieur à zéro avant le brouillon.");
      return;
    }
    if (supplierCostCents == null || supplierCostCents <= 0 || salePriceCents == null || salePriceCents <= 0) {
      toast.error("Vérifiez le coût fournisseur et le prix de vente en CHF.");
      return;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      toast.error("Saisissez un stock MAZIGHO valide.");
      return;
    }
    if (images.length === 0) {
      toast.error("Conservez au moins une image ou ajoutez votre propre image.");
      return;
    }

    importCjDraft.mutate({
      categoryId: Number(categoryId),
      productId: preparedProduct.productId,
      sku: preparedProduct.sku,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      priceCents: salePriceCents,
      supplierPriceCents: supplierCostCents,
      stock: parsedStock,
      images,
      deliveryProfiles,
    });
  };

  const selectedCategoryName = categoriesQuery.data?.find(category => String(category.id) === categoryId)?.name;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin/fournisseurs" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Hub fournisseurs</Link>
              <span>/</span><span>Préparation CJ</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Préparer un brouillon CJ</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">Vous contrôlez le contenu, les images, la catégorie, le coût converti et le prix de vente avant tout enregistrement.</p>
          </div>
          <Badge className="gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 hover:bg-emerald-50"><ShieldCheck className="h-4 w-4" /> Aucune commande CJ</Badge>
        </div>

        {!productId && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Produit manquant.</strong> Revenez au Hub fournisseurs et sélectionnez « Préparer l’import » depuis un résultat CJ.</div>}

        {(prepareCjImport.isPending || (!prepareCjImport.data && productId && !prepareCjImport.isError)) && <div className="flex min-h-56 items-center justify-center rounded-xl border bg-white"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Lecture sécurisée de la fiche CJ…</div></div>}

        {preparedProduct && <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div><h2 className="text-xl font-semibold">Vérification avant brouillon</h2><p className="mt-1 text-sm text-muted-foreground">Les données CJ restent modifiables. Le résultat restera <strong>invisible</strong> tant que vous ne le publierez pas plus tard.</p></div>
              <ClipboardPenLine className="h-6 w-6 shrink-0 text-emerald-600" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium">Catégorie MAZIGHO</span><select value={categoryId} onChange={event => setCategoryId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Choisir une catégorie…</option>{categoriesQuery.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium">Nom commercial</span><input value={name} onChange={event => { setName(event.target.value); setSlug(slugify(event.target.value)); }} className="h-10 w-full rounded-md border px-3 text-sm" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Slug</span><input value={slug} onChange={event => setSlug(event.target.value)} className="h-10 w-full rounded-md border px-3 text-sm" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Stock MAZIGHO initial</span><input value={stock} onChange={event => setStock(event.target.value)} type="number" min="0" className="h-10 w-full rounded-md border px-3 text-sm" /><span className="block text-xs text-muted-foreground">0 recommandé tant que le stock et la livraison ne sont pas validés.</span></label>
              <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium">Description client</span><textarea value={description} onChange={event => setDescription(event.target.value)} rows={7} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Réécrivez et adaptez la description avant publication." /></label>
            </div>

            <div className="space-y-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4">
              <div><h3 className="font-semibold text-slate-900">Livraison Suisse et Europe à contrôler</h3><p className="mt-1 text-xs leading-5 text-slate-600">Choisissez une variante puis demandez un devis officiel CJ pour les pays sélectionnés. Aucun client, aucune adresse réelle et aucune commande CJ ne sont transmis.</p></div>
              {preparedProduct.variants.length === 0 ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">CJ ne renvoie aucune variante exploitable pour calculer le transport. Choisissez un autre produit.</p> : <><div className="grid gap-4 md:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium">Variante pour le devis</span><select value={deliveryVariantId} onChange={event => { setDeliveryVariantId(event.target.value); quoteCjDelivery.reset(); }} className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="">Choisir une variante…</option>{preparedProduct.variants.map(variant => <option key={variant.id} value={variant.id}>{variant.label}{variant.supplierPriceUsd == null ? "" : ` · $${variant.supplierPriceUsd.toFixed(2)} USD`}</option>)}</select></label><div className="space-y-2"><span className="block text-sm font-medium">Destinations à confirmer</span><div className="flex flex-wrap gap-x-3 gap-y-2 rounded-md border bg-white p-3">{deliveryMarkets.map(market => <label key={market.code} className="flex items-center gap-1.5 text-xs text-slate-700"><input type="checkbox" checked={deliveryCountries.includes(market.code)} onChange={event => { setDeliveryCountries(current => event.target.checked ? [...current, market.code] : current.filter(code => code !== market.code)); quoteCjDelivery.reset(); }} className="h-3.5 w-3.5 accent-sky-600" />{market.label}</label>)}</div></div></div><Button type="button" onClick={() => selectedVariant && quoteCjDelivery.mutate({ productId: preparedProduct.productId, variantId: selectedVariant.id, countryCodes: deliveryCountries })} disabled={!selectedVariant || deliveryCountries.length === 0 || quoteCjDelivery.isPending} className="bg-sky-700 hover:bg-sky-800">{quoteCjDelivery.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Vérifier livraison et stock CJ</Button>{quoteCjDelivery.data && <><div className="mb-2 rounded-md border border-slate-200 bg-white p-2 text-xs"><strong>Stock officiel de la variante :</strong> {quoteCjDelivery.data.stock.checked ? (quoteCjDelivery.data.stock.totalQuantity && quoteCjDelivery.data.stock.totalQuantity > 0 ? <span className="text-emerald-700"> {quoteCjDelivery.data.stock.totalQuantity.toLocaleString("fr-CH")} unité(s) confirmée(s)</span> : <span className="text-amber-700"> zéro unité — brouillon bloqué</span>) : <span className="text-amber-700"> non confirmé — brouillon bloqué</span>}</div><div className="grid gap-2 rounded-lg border border-sky-200 bg-white p-3 md:grid-cols-2">{quoteCjDelivery.data.countries.map(country => <div key={country.countryCode} className="rounded-md border border-slate-100 p-2 text-xs"><div className="flex items-center justify-between gap-2"><strong>{country.countryName}</strong><span className={country.options.length ? "text-emerald-700" : "text-amber-700"}>{country.options.length ? "Desservi" : "À confirmer"}</span></div>{country.options[0] ? <p className="mt-1 text-slate-600">Dès <strong>${country.options[0].costUsd.toFixed(2)} USD</strong> · {country.options[0].delay ? `${country.options[0].delay} jours` : "délai à confirmer"}</p> : <p className="mt-1 text-amber-700">{country.message}</p>}</div>)}</div></>}</>}
              <div className="border-t border-sky-200 pt-4"><h3 className="font-semibold text-slate-900">Prix produit et transport à valider</h3><p className="mt-1 text-xs leading-5 text-slate-600">La majoration cible s’applique au prix du produit hors transport. Le transport reste facturé au client, sauf si le prix produit couvre aussi le devis CJ tout en conservant cette majoration : la livraison est alors offerte.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2"><span className="text-sm font-medium">Taux USD → CHF vérifié</span><input value={exchangeRate} onChange={event => setExchangeRate(event.target.value)} type="text" inputMode="decimal" placeholder="Ex. 0,90" className="h-10 w-full rounded-md border bg-white px-3 text-sm" /><span className="block text-xs text-muted-foreground">Aucun taux de change n’est supposé par MAZIGHO.</span></label>
                <label className="block space-y-2"><span className="text-sm font-medium">Majoration cible sur le produit (%)</span><input value={marginPercent} onChange={event => setMarginPercent(event.target.value)} type="number" min="0" max="1000" className="h-10 w-full rounded-md border bg-white px-3 text-sm" /><span className="block text-xs text-muted-foreground">Ex. 50 % : coût produit × 1,50. Le transport n’est pas inclus dans ce calcul.</span></label>
                <label className="block space-y-2"><span className="text-sm font-medium">Coût produit CJ hors livraison (CHF)</span><input value={supplierCostChf} onChange={event => setSupplierCostChf(event.target.value)} type="text" inputMode="decimal" placeholder="0,00" className="h-10 w-full rounded-md border bg-white px-3 text-sm" /></label>
                <label className="block space-y-2"><span className="text-sm font-medium">Prix produit (CHF)</span><input value={salePriceChf} onChange={event => setSalePriceChf(event.target.value)} type="text" inputMode="decimal" placeholder="0,00" className="h-10 w-full rounded-md border bg-white px-3 text-sm" /><span className="block text-xs text-muted-foreground">Le transport éventuel est affiché séparément au client.</span></label>
              </div>
              {deliveryProfiles.length > 0 && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><strong>Frais de livraison importés automatiquement :</strong><p className="mt-1">Ces montants viennent du devis CJ confirmé. Ils sont enregistrés avec le brouillon par pays ; ils ne peuvent pas être modifiés ici.</p><div className="mt-3 grid gap-3 md:grid-cols-2">{deliveryProfiles.map(profile => <div key={profile.countryCode} className="rounded-md border border-emerald-100 bg-white/80 p-2.5"><p className="mb-2 font-semibold">{deliveryMarkets.find(market => market.code === profile.countryCode)?.label || profile.countryCode}</p><div className="grid gap-2 sm:grid-cols-2"><label className="block"><span className="block text-[11px] font-medium text-slate-600">Frais CJ fournisseur</span><input readOnly value={`${formatChfInput(profile.supplierShippingCost)} CHF`} className="mt-1 h-8 w-full rounded-md border bg-slate-50 px-2 text-xs text-slate-700" /></label><label className="block"><span className="block text-[11px] font-medium text-slate-600">Frais facturés au client</span><input readOnly value={`${formatChfInput(profile.customerShippingCost)} CHF`} className="mt-1 h-8 w-full rounded-md border bg-slate-50 px-2 text-xs text-slate-700" /></label></div><p className="mt-2">{profile.customerShippingCost === 0 ? "Livraison offerte : la majoration validée couvre le devis CJ." : "Transport ajouté séparément au total client."}{profile.minDeliveryDays != null ? ` · ${profile.minDeliveryDays}${profile.maxDeliveryDays && profile.maxDeliveryDays !== profile.minDeliveryDays ? `–${profile.maxDeliveryDays}` : ""} jours` : ""}</p>{supplierCostCents != null && salePriceCents != null && <p className="mt-2 border-t border-emerald-100 pt-2 text-emerald-900"><strong>Prix de revient total :</strong> {formatChfInput(supplierCostCents + profile.supplierShippingCost)} CHF <span className="text-emerald-700">(produit + transport fournisseur)</span><br /><strong>Marge après transport :</strong> {formatChfInput(salePriceCents - supplierCostCents - profile.supplierShippingCost + profile.customerShippingCost)} CHF</p>}</div>)}</div>{productMarkupCents != null && <p className="mt-3 border-t border-emerald-200 pt-2">Prix produit : <strong>{formatChfInput(salePriceCents || 0)} CHF</strong> · majoration produit : <strong>{formatChfInput(productMarkupCents)} CHF</strong>.</p>}</div>}
            </div>

            <label className="block space-y-2"><span className="text-sm font-medium">Images (une URL par ligne)</span><textarea value={imagesText} onChange={event => setImagesText(event.target.value)} rows={5} className="w-full rounded-md border px-3 py-2 text-sm" /><span className="block text-xs text-muted-foreground">Vérifiez les droits d’utilisation. Vous pourrez remplacer ces images dans la fiche produit après l’enregistrement.</span></label>

            <div className="flex flex-wrap justify-end gap-3 border-t pt-4"><Button asChild type="button" variant="outline"><Link href="/admin/fournisseurs">Annuler</Link></Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={importCjDraft.isPending}>{importCjDraft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer en brouillon</Button></div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold">Fiche CJ consultée</h2><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Référence CJ</dt><dd className="max-w-44 break-all text-right font-medium">{preparedProduct.productId}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">SKU</dt><dd className="text-right font-medium">{preparedProduct.sku || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Prix CJ indicatif</dt><dd className="text-right font-semibold">{preparedProduct.supplierPriceUsd == null ? "À confirmer" : `$${preparedProduct.supplierPriceUsd.toFixed(2)} USD`}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Stock du détail CJ</dt><dd className="text-right font-medium">{preparedProduct.reportedStock == null ? "À confirmer par le devis" : preparedProduct.reportedStock.toLocaleString("fr-CH")}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Catégorie CJ</dt><dd className="max-w-44 text-right font-medium">{preparedProduct.category || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Catégorie MAZIGHO</dt><dd className="text-right font-medium">{selectedCategoryName || "À choisir"}</dd></div></dl>{preparedProduct.variantsLabel && <p className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground"><strong>Variantes signalées :</strong> {preparedProduct.variantsLabel}</p>}</div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Contrôles obligatoires</div><ul className="list-disc space-y-1 pl-5"><li>Confirmer le prix rendu, y compris transport, taxes et éventuels frais.</li><li>Vérifier la livraison vers chaque destination visée, les délais et le stock officiel de la variante.</li><li>Contrôler conformité, sécurité, droits d’image et qualité du produit.</li></ul></div>
            {preparedProduct.images.length > 0 && <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4 text-slate-500" /> Images reçues</div><div className="grid grid-cols-2 gap-2">{preparedProduct.images.slice(0, 4).map(image => <img key={image} src={image} alt="" className="h-24 w-full rounded-lg border bg-slate-50 object-contain p-1" />)}</div></div>}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-950"><BadgeCheck className="mb-2 h-4 w-4 text-emerald-700" /><strong>Protection conservée :</strong> ce bouton crée seulement une fiche MAZIGHO au statut brouillon. Il ne publie pas le produit et n’envoie aucune commande à CJdropshipping.</div>
          </aside>
        </form>}
      </div>
    </DashboardLayout>
  );
}
