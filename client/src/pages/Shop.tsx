import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Check, Sparkles, Store, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useStorePrice } from "@/hooks/useStorePrice";
import { useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { commerceT, t } from "@/lib/i18n";
import { getPublicCopy } from "@/lib/publicCopy";
import { getLocalizedCategoryPresentation } from "@/lib/categoryPresentation";
import { getLocalizedCountryName } from "@/lib/countryLocale";
import { getShopControlsCopy } from "@/lib/shopControlsCopy";
import { isNewProduct } from "@/lib/isNewProduct";
import { isProductVisibleForStorefront } from "@shared/storefrontProductVisibility";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import StorefrontCatalogueFilters, { productMatchesCatalogueFilters } from "@/components/StorefrontCatalogueFilters";
import { getLimitedStorefrontCopy } from "@/lib/limitedStorefrontCopy";

const categoryAccents = ["bg-orange-50 text-orange-700", "bg-sky-50 text-sky-700", "bg-rose-50 text-rose-700", "bg-emerald-50 text-emerald-700", "bg-violet-50 text-violet-700", "bg-amber-50 text-amber-700"];

export default function Shop() {
  const { locale } = useLocale();
  const { profile, palette } = useDesignProfile(locale);
  const { formatStorePrice: formatPrice } = useStorePrice();
  const publicCopy = getPublicCopy(locale);
  const shopCopy = locale === "fr" ? {
    eyebrow: profile.shopEyebrow,
    title: profile.shopTitle,
    intro: profile.shopIntro,
    productsEyebrow: profile.shopProductsEyebrow,
    productsTitle: profile.shopProductsTitle,
    editorialEyebrow: profile.shopEditorialEyebrow,
    editorialTitle: profile.shopEditorialTitle,
  } : {
    eyebrow: t(locale, "shopEyebrow"),
    title: t(locale, "shopTitle"),
    intro: t(locale, "shopIntro", { country: "{country}" }),
    productsEyebrow: t(locale, "readyToDiscover"),
    productsTitle: t(locale, "currentProducts"),
    editorialEyebrow: publicCopy.editorial.eyebrow,
    editorialTitle: publicCopy.editorial.title,
  };
  const shopReassuranceItems = locale === "fr" ? profile.reassuranceItems : [
    { icon: "sparkles" as const, title: t(locale, "editorialSelection"), text: "" },
    { icon: "check" as const, title: t(locale, "pricesInChf"), text: "" },
    { icon: "arrow" as const, title: t(locale, "switzerlandEurope"), text: "" },
  ];
  const categoriesQuery = trpc.categories.getAll.useQuery(locale, { placeholderData: (prev) => prev });
  const productsQuery = trpc.products.getAll.useQuery(locale, { placeholderData: (prev) => prev });
  const storeAvailability = trpc.storefront.getAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const marketSettings = trpc.storefront.getMarketSettings.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const limitedShowcase = Boolean(storeAvailability.data?.publicStorefront && storeAvailability.data.commerceEnabled === false);
  const limitedCopy = getLimitedStorefrontCopy(locale);
  const categories = (categoriesQuery.data || []).map(category => getLocalizedCategoryPresentation(locale, category));
  const standardCategories = categories.filter(category => category.catalogSection !== "creations");
  const standardCategoryIds = new Set(standardCategories.map(category => category.id));
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const isClientStore = Boolean(storeAvailability.data && !storeAvailability.data.isPlatformStore);
  const hasSingleActiveMarket = marketSettings.data?.activeCountries.length === 1;
  const products = (productsQuery.data || []).filter(product => standardCategoryIds.has(product.categoryId) && isProductVisibleForStorefront(product.deliveryProfiles, countryCode, isClientStore, Boolean(product.isManualProduct)));

  const controls = getShopControlsCopy(locale);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price-asc" | "price-desc">("featured");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const priceBounds = useMemo<[number, number]>(() => products.length ? [Math.min(...products.map(product => product.price)), Math.max(...products.map(product => product.price))] : [0, 0], [products]);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const activePriceRange = priceRange ?? priceBounds;
  const visibleProducts = [...products]
    .filter(product => productMatchesCatalogueFilters(product, { categoryId: categoryFilter, availableOnly, priceRange: activePriceRange, selectedOptions }))
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "newest") return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
      return ((b as any).featured ? 1 : 0) - ((a as any).featured ? 1 : 0);
    });

  return <div className="min-h-screen text-slate-900" style={{ backgroundColor: palette.soft }}><Header /><main>
    <section className="border-b border-[#eadfd2] bg-white px-4 py-10 md:py-14"><div className="container"><p className="mb-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: palette.primary }}>{limitedShowcase ? limitedCopy.shopEyebrow : shopCopy.eyebrow}</p><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">{limitedShowcase ? limitedCopy.shopTitle : shopCopy.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{limitedShowcase ? limitedCopy.shopIntro : shopCopy.intro.replace("{country}", countryLabel)}</p></div>{!limitedShowcase && <Link href="/best-sellers" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800" style={{ color: palette.primary }}>{t(locale, "viewBestSellers")} <ArrowUpRight className="h-4 w-4" /></Link>}</div></div></section>
    <section className="bg-white py-10 md:py-14"><div className="container"><div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: palette.primary }}>{limitedShowcase ? limitedCopy.productsEyebrow : shopCopy.productsEyebrow}</p><h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{limitedShowcase ? limitedCopy.productsTitle : shopCopy.productsTitle}</h2></div>{!limitedShowcase && !hasSingleActiveMarket && <span className="text-sm text-slate-500">{t(locale, "deliverableCount", { count: visibleProducts.length, country: countryLabel })}</span>}</div>{limitedShowcase ? <div className="border border-dashed bg-[var(--mazigho-soft)] px-6 py-12 text-center text-sm leading-6 text-slate-600" style={{ borderColor: "color-mix(in srgb, var(--mazigho-primary) 18%, #d9cbbc)" }}>{limitedCopy.productsText}</div> : <>{!productsQuery.isLoading && <div className="mb-6"><StorefrontCatalogueFilters products={products} categories={standardCategories} categoryLabel={controls.categoryLabel} allCategoriesLabel={controls.allCategories} sortLabel={controls.sortLabel} sortOptions={[{ value: "featured", label: controls.sortFeatured }, { value: "newest", label: controls.sortNewest }, { value: "price-asc", label: controls.sortPriceAsc }, { value: "price-desc", label: controls.sortPriceDesc }]} value={{ categoryId: categoryFilter, availableOnly, priceRange: activePriceRange, selectedOptions, sortBy }} onChange={next => { setCategoryFilter(next.categoryId); setAvailableOnly(next.availableOnly); setPriceRange(next.priceRange); setSelectedOptions(next.selectedOptions); setSortBy(next.sortBy); }} formatPrice={cents => formatPrice(cents, locale)} primaryColor={palette.primary} /></div>}{productsQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-9 w-9 animate-spin" style={{ color: palette.accent }} /></div> : visibleProducts.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visibleProducts.map((product) => { const imageUrl = product.images?.[0]?.imageUrl; const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price); const outOfStock = product.stock <= 0; return <Link key={product.id} href={`/produit/${product.slug}`}><article className="group overflow-hidden border bg-[var(--mazigho-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" style={{ borderColor: "color-mix(in srgb, var(--mazigho-primary) 18%, #e5e1d4)" }}><div className="relative aspect-[4/3] overflow-hidden bg-white/60">{imageUrl ? <img src={imageUrl} alt={product.name} width={640} height={480} loading="lazy" decoding="async" className={outOfStock ? "h-full w-full object-cover opacity-55 grayscale transition-transform duration-500 group-hover:scale-105" : "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"} /> : <div className="flex h-full items-center justify-center text-5xl text-slate-300">✦</div>}{hasDiscount && <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: palette.accent }}>{t(locale, "offer")}</span>}{isNewProduct((product as any).createdAt) && !outOfStock && <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white" data-testid="badge-new">{controls.newBadge}</span>}{outOfStock && <span className="absolute right-3 top-3 rounded-full bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Indisponible</span>}</div><div className="p-5"><h3 className="line-clamp-2 min-h-[3rem] text-sm font-semibold leading-6" style={{ color: palette.primary }}>{product.name}</h3><div className="mt-3 flex items-baseline gap-2"><span className="font-bold" style={{ color: palette.primary }}>{formatPrice(product.price, locale)}</span>{hasDiscount && <span className="text-xs text-slate-400 line-through">{formatPrice(product.originalPrice!, locale)}</span>}</div></div></article></Link>; })}</div> : <div className="border border-dashed bg-[var(--mazigho-soft)] px-6 py-12 text-center text-sm text-slate-500" style={{ borderColor: "color-mix(in srgb, var(--mazigho-primary) 18%, #d9cbbc)" }}>{t(locale, "noProducts", { country: countryLabel })}</div>}</>}</div></section>
    <section className="border-y border-[#e5e1d4] py-12 md:py-16" style={{ backgroundColor: palette.soft }}><div className="container"><div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: palette.primary }}>{t(locale, "exploreUniverse")}</p><h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{t(locale, "findYourStyle")}</h2></div><Link href="/nouveautes" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-[var(--mazigho-primary)]">{t(locale, "viewNew")} <ArrowUpRight className="h-4 w-4" /></Link></div>{categoriesQuery.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" style={{ color: palette.accent }} /></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{standardCategories.map((category, index) => <Link key={category.id} href={`/categorie/${category.slug}`}><article className="group min-h-[132px] overflow-hidden border bg-white transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: "color-mix(in srgb, var(--mazigho-primary) 18%, #eadfd2)" }}><div className="flex h-full items-center gap-4 p-4"><div className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ${categoryAccents[index % categoryAccents.length]}`}>{category.imageUrl ? <img src={category.imageUrl} alt="" width={160} height={160} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <span className="grid h-full w-full place-items-center text-2xl" aria-hidden="true">{category.icon || "✦"}</span>}</div><div className="min-w-0 flex-1"><h3 className="text-base font-semibold text-slate-900" style={{ color: palette.primary }}>{category.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{category.description}</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: palette.accent }}>{t(locale, "discover")} <ArrowRight className="h-3 w-3" /></span></div></div></article></Link>)}</div>}</div></section>
    {profile.showShopEditorial && <section className="container py-10 md:py-14"><div className="relative min-h-[210px] overflow-hidden rounded-[1.75rem] bg-slate-950"><img src={profile.shopPageCopyCustomized ? profile.shopEditorialImageUrl : "/assets/shop-editorial-hero.webp"} srcSet={profile.shopPageCopyCustomized ? undefined : "/assets/shop-editorial-hero-640.webp 640w, /assets/shop-editorial-hero.webp 1600w"} sizes="(max-width: 768px) 640px, 1600px" alt={shopCopy.editorialTitle} width={1600} height={900} loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" /><div className="relative flex min-h-[210px] items-center px-7 py-8 text-white md:px-12"><div><p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: palette.accent }}>{shopCopy.editorialEyebrow}</p><h2 className="mt-3 max-w-lg text-2xl font-semibold md:text-3xl">{shopCopy.editorialTitle}</h2></div></div></div></section>}
    {profile.showShopReassurance && <section className="border-y border-[#eadfd2] bg-white"><div className="container grid gap-0 md:grid-cols-3">{shopReassuranceItems.map(({ icon, title, text }, index) => { const Icon = icon === "check" ? Check : icon === "arrow" ? Store : Sparkles; return <div key={`${title}-${index}`} className={`flex items-center gap-3 py-5 ${index < 2 ? "border-b border-[#eadfd2] md:border-b-0 md:border-r md:px-8" : "md:pl-8"} ${index === 0 ? "md:pr-8 md:pl-0" : ""}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: palette.soft, color: palette.primary }}><Icon className="h-4 w-4" /></div><div><p className="text-sm font-semibold">{title}</p>{text && <p className="mt-1 text-xs text-slate-500">{text}</p>}</div></div>; })}</div></section>}
  </main><Footer /></div>;
}
