import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, PackagePlus, Ticket } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useStorePrice } from "@/hooks/useStorePrice";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { isProductPurchasableForStorefront, type StorefrontDeliveryProfile } from "@shared/storefrontProductVisibility";
import { toast } from "sonner";

type BundleProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  options?: unknown;
  isManualProduct?: boolean;
  deliveryProfiles?: StorefrontDeliveryProfile[] | null;
  images?: Array<{ imageUrl?: string }>;
  variants?: Array<{ id: number; label: string; stock: number }>;
};

type Bundle = {
  id: string;
  name: string;
  description: string;
  promoCode: string | null;
  products: BundleProduct[];
};

function productHasOptions(product: BundleProduct) {
  if (Array.isArray(product.options)) return product.options.length > 0;
  if (typeof product.options !== "string" || !product.options.trim()) return false;
  try { return Array.isArray(JSON.parse(product.options)) && JSON.parse(product.options).length > 0; }
  catch { return true; }
}

/**
 * Customer-facing bundle suggestions. It never creates a bundle SKU: the
 * operation adds only real, variant-free and option-free lines to the normal
 * basket, which is then validated by the ordinary checkout stock transaction.
 */
export default function ProductBundleSuggestions({ productId, commerceEnabled, isClientStore }: { productId: number; commerceEnabled: boolean; isClientStore: boolean }) {
  const [, setLocation] = useLocation();
  const { locale } = useLocale();
  const { countryCode } = useDeliveryCountry();
  const { formatStorePrice } = useStorePrice();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const bundlesQuery = trpc.products.getBundlesForProduct.useQuery({ productId, locale }, { enabled: locale === "fr" && productId > 0, retry: false, refetchOnWindowFocus: false });
  const bundles = (bundlesQuery.data || []) as Bundle[];

  const prepared = useMemo(() => bundles.map(bundle => {
    const products = bundle.products || [];
    const purchasable = products.every(product => product.stock > 0
      && !productHasOptions(product)
      && !(product.variants || []).length
      && isProductPurchasableForStorefront(product.deliveryProfiles, countryCode, isClientStore, Boolean(product.isManualProduct)));
    const total = products.reduce((sum, product) => sum + Number(product.price || 0), 0);
    return { ...bundle, products, purchasable, total };
  }), [bundles, countryCode, isClientStore]);

  if (!prepared.length) return null;

  const addBundle = (bundle: typeof prepared[number]) => {
    if (!commerceEnabled) return toast.info("Cette vitrine est ouverte à la découverte. Les commandes seront activées séparément.");
    if (!bundle.purchasable) return toast.info("Choisissez les produits individuellement pour sélectionner leurs variantes, options ou une livraison disponible.");
    setAddingId(bundle.id);
    for (const product of bundle.products) {
      const imageUrl = product.images?.[0]?.imageUrl;
      addToCart(product.id, product.name, Number(product.price || 0), 1, undefined, imageUrl);
    }
    toast.success(`${bundle.name} ajouté au panier`, { description: `${bundle.products.length} produits ont été ajoutés séparément.` });
    window.setTimeout(() => setAddingId(null), 700);
  };

  return <section className="border-t border-slate-200 bg-indigo-50/50 py-14" data-testid="product-bundle-suggestions">
    <div className="container mx-auto px-4"><div className="mb-7 max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">À composer ensemble</p><h2 className="mt-2 text-3xl font-bold text-slate-950">Des idées qui vont naturellement ensemble</h2><p className="mt-2 text-sm leading-6 text-slate-600">Chaque article garde son prix, ses options, son stock et sa livraison. Le total reste indicatif jusqu’au panier.</p></div><div className="grid gap-5 xl:grid-cols-2">{prepared.map(bundle => <Card key={bundle.id} className="overflow-hidden border-indigo-100 bg-white shadow-sm"><CardContent className="p-0"><div className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-bold text-slate-950">{bundle.name}</h3>{bundle.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{bundle.description}</p> : null}</div>{bundle.promoCode ? <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-900"><Ticket className="mr-1.5 h-3.5 w-3.5" />{bundle.promoCode}</span> : null}</div><div className="mt-4 grid gap-2 sm:grid-cols-3">{bundle.products.map(product => <button key={product.id} type="button" onClick={() => setLocation(`/produit/${product.slug || product.id}`)} className="group rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-600"><div className="aspect-square overflow-hidden rounded-lg bg-slate-200"><img src={product.images?.[0]?.imageUrl || ""} alt="" className="h-full w-full object-cover" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} /></div><p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-950 group-hover:text-indigo-800">{product.name}</p><p className="mt-1 text-xs font-medium text-indigo-800">{formatStorePrice(Number(product.price || 0), locale)}</p></button>)}</div><div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">Total indicatif : {formatStorePrice(bundle.total, locale)}</p><p className="mt-1 text-xs leading-5 text-slate-500">Hors éventuel code et frais de livraison.</p></div>{commerceEnabled && bundle.purchasable ? <Button type="button" className="min-h-11 bg-indigo-700 hover:bg-indigo-800" disabled={addingId === bundle.id} onClick={() => addBundle(bundle)}>{addingId === bundle.id ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Ajouté</> : <><PackagePlus className="mr-2 h-4 w-4" /> Ajouter la sélection</>}</Button> : <Button type="button" variant="outline" className="min-h-11 border-indigo-200 text-indigo-800 hover:bg-indigo-50" onClick={() => setLocation(`/produit/${bundle.products.find(product => product.id !== productId)?.slug || productId}`)}>Choisir les produits <ChevronRight className="ml-1 h-4 w-4" /></Button>}</div></div></CardContent></Card>)}</div></div>
  </section>;
}
