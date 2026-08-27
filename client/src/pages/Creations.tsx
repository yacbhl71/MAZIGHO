import { Link } from "wouter";
import { ArrowRight, Brush, CheckCircle2, Globe2, Loader2, Palette, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/currency";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getCollectionVisual } from "@/lib/collectionVisuals";
import { getCreativeCategoryFallbacks } from "@/lib/categoryPresentation";
import { getCollectionsCopy } from "@/lib/collectionsCopy";
import { commerceT, t } from "@/lib/i18n";
import { getLocalizedCountryName } from "@/lib/countryLocale";

export default function Creations() {
  const { locale } = useLocale();
  const copy = getCollectionsCopy(locale).creations;
  const categoriesQuery = trpc.categories.getAll.useQuery(locale);
  const productsQuery = trpc.products.getAll.useQuery(locale);
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);

  const creativeCategories = categoriesQuery.data?.length
    ? categoriesQuery.data.filter(category => category.catalogSection === "creations")
    : getCreativeCategoryFallbacks(locale);
  const creativeCategoryIds = new Set(creativeCategories.map(category => category.id));
  const creativeProducts = (productsQuery.data || []).filter(product => creativeCategoryIds.has(product.categoryId));

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-900">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-rose-100 bg-slate-950 px-4 py-16 text-white md:py-24">
          <div className="absolute -left-24 top-4 h-72 w-72 rounded-full bg-rose-500/25 blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="container relative mx-auto grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-rose-100">
                <Palette className="h-4 w-4" /> {copy.eyebrow}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                {copy.lead}
              </p>
              <a href="#collections" className="mt-8 inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-rose-100">
                {copy.cta} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <Globe2 className="h-5 w-5 text-rose-200" />
                <p className="mt-3 text-sm font-semibold">{copy.globalTitle}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{copy.globalText}</p>
              </div>
              <div className="border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 text-rose-200" />
                <p className="mt-3 text-sm font-semibold">{copy.customTitle}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{copy.customText}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="collections" className="container mx-auto px-4 py-14 md:py-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-700">{copy.chooseEyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{copy.collectionsTitle}</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-600">{copy.collectionsText}</p>
          </div>

          {categoriesQuery.isLoading ? (
            <div className="flex justify-center py-14"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {creativeCategories.map(category => {
                const visual = getCollectionVisual(category.slug);
                return (
                  <Link key={category.id} href={`/categorie/${category.slug}`}>
                    <article className="group overflow-hidden border border-rose-100 bg-white transition-all hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg">
                      <div className="aspect-[4/3] overflow-hidden bg-rose-50">
                        {visual ? <img src={visual.imageUrl} alt={visual.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-3xl">{category.icon || "✦"}</div>}
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-rose-700">{category.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{category.description}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">{copy.explore} <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="border-y border-rose-100 bg-white py-14 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-700">{copy.discoverEyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{copy.preparingTitle}</h2>
              </div>
              <p className="text-sm text-slate-500">{copy.destination} : <span className="font-semibold text-slate-700">{countryLabel}</span></p>
            </div>

            {productsQuery.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>
            ) : creativeProducts.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {creativeProducts.map(product => {
                  const imageUrl = product.images?.[0]?.imageUrl;
                  const profile = getDeliveryProfileForCountry(product.deliveryProfiles, countryCode);
                  return (
                    <Link key={product.id} href={`/produit/${product.slug}`}>
                      <article className="group overflow-hidden border border-rose-100 bg-[#fffaf7] transition-all hover:-translate-y-1 hover:shadow-xl">
                        <div className="aspect-[4/3] overflow-hidden bg-rose-50">
                          {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Brush className="h-10 w-10 text-rose-300" /></div>}
                        </div>
                        <div className="p-5">
                          <h3 className="line-clamp-2 min-h-[3rem] text-sm font-semibold leading-6 text-slate-900 group-hover:text-rose-700">{product.name}</h3>
                          <p className="mt-3 font-bold text-rose-700">{formatPrice(product.price, locale)}</p>
                          {profile ? (
                            <p className="mt-2 text-[11px] font-medium text-slate-500">{profile.customerShippingCost === 0 ? commerceT(locale, "deliveryIncluded") : commerceT(locale, "shippingPerItem", { amount: formatPrice(profile.customerShippingCost, locale) })}{profile.minDeliveryDays ? ` · ${profile.minDeliveryDays}${profile.maxDeliveryDays && profile.maxDeliveryDays !== profile.minDeliveryDays ? `–${profile.maxDeliveryDays}` : ""} ${t(locale, "days")}` : ""}</p>
                          ) : (
                            <p className="mt-2 text-[11px] font-medium text-amber-700">{copy.deliveryPending.replace("{country}", countryLabel)}</p>
                          )}
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 grid gap-6 border border-dashed border-rose-200 bg-[#fffaf7] px-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center bg-rose-100 text-rose-700"><Sparkles className="h-5 w-5" /></div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{copy.firstTitle}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{copy.firstText}</p>
                </div>
                <Link href="#collections" className="inline-flex items-center gap-2 text-sm font-bold text-rose-700">{copy.categories} <ArrowRight className="h-4 w-4" /></Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
