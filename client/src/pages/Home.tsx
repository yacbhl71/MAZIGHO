import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Quote, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/currency";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import { trpc } from "@/lib/trpc";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getDiscoveryTiles, getPublicCopy, interpolatePublicCopy } from "@/lib/publicCopy";
import { t } from "@/lib/i18n";
import { getLocalizedCountryName } from "@/lib/countryLocale";

const categoryAccents = [
  "from-orange-100 via-amber-50 to-white",
  "from-sky-100 via-blue-50 to-white",
  "from-rose-100 via-pink-50 to-white",
  "from-emerald-100 via-teal-50 to-white",
  "from-violet-100 via-purple-50 to-white",
];

const discoveryTileMeta = [
  { image: "/assets/category-mode.jpg", href: "/categorie/mode" },
  { image: "/assets/category-beaute.jpg", href: "/categorie/beaute-bien-etre" },
  { image: "/assets/category-maison.jpg", href: "/categorie/maison-organisation" },
  { image: "/assets/category-sport.jpg", href: "/categorie/sport-fitness" },
  { image: "/assets/category-high-tech.jpg", href: "/categorie/high-tech-gadgets" },
  { image: "/assets/category-auto.jpg", href: "/categorie/auto-accessoires" },
];

const testimonialImages = [
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/tAsMVzoYcQaYPlZx.jpg",
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/beKRpGNWQVYLtodg.jpg",
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/EaGZFquHaQggRJfK.jpg",
];

export default function Home() {
  const { locale } = useLocale();
  const { profile, palette } = useDesignProfile(locale);
  const generatedCopy = getPublicCopy(locale);
  const copy = {
    ...generatedCopy,
    highlight: { ...generatedCopy.highlight, eyebrow: profile.highlightEyebrow, title: profile.highlightTitle, text: profile.highlightText },
    story: { ...generatedCopy.story, title: profile.storyTitle, text: profile.storyText },
    editorial: { ...generatedCopy.editorial, eyebrow: profile.editorialEyebrow, title: profile.editorialTitle },
  };
  const discoveryTiles = getDiscoveryTiles(locale);
  const featuredProductsQuery = trpc.products.getFeatured.useQuery(locale);
  const catalogProductsQuery = trpc.products.getAll.useQuery(locale);
  const categoriesQuery = trpc.categories.getAll.useQuery(locale);
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);

  const catalogProducts = (catalogProductsQuery.data || []).filter(product => getDeliveryProfileForCountry(product.deliveryProfiles, countryCode));
  const highlightedProducts = (featuredProductsQuery.data || []).filter(product => getDeliveryProfileForCountry(product.deliveryProfiles, countryCode));
  const featuredProducts = highlightedProducts.length ? highlightedProducts : catalogProducts.slice(0, 4);
  const localizedDiscoveryTiles = discoveryTileMeta.map((tile, index) => {
    const slug = tile.href.split("/").pop();
    const category = categoriesQuery.data?.find(item => item.slug === slug);
    const fallback = discoveryTiles[index];
    return { ...tile, title: category?.name || fallback?.title || "Découvrir", description: category?.description || fallback?.description || "" };
  });

  return (
    <div className="min-h-screen text-slate-900" style={{ backgroundColor: palette.soft }}>
      <Header />

      <main>
        <HeroBanner />

        <section className="container py-8 md:py-12">
          <div className="relative min-h-[230px] overflow-hidden rounded-[1.75rem] bg-slate-950 md:min-h-[300px]">
            <img src={profile.highlightImageUrl} alt="Sélection lifestyle MAZIGHO" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent" />
            <div className="relative flex min-h-[230px] items-center px-7 py-8 text-white md:min-h-[300px] md:px-12">
              <div className="max-w-md">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: palette.primary }}>{copy.highlight.eyebrow}</p>
                <h2 className="text-2xl font-semibold leading-tight md:text-4xl">{copy.highlight.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/80 md:text-base">{copy.highlight.text}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#eadfd2] bg-white/80">
          <div className="container grid gap-0 md:grid-cols-3">
            <div className="flex items-center gap-4 border-b border-[#eadfd2] py-5 md:border-b-0 md:border-r md:pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{copy.reassurance[0].title}</p>
                <p className="mt-1 text-xs text-slate-500">{copy.reassurance[0].text}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b border-[#eadfd2] py-5 md:border-b-0 md:border-r md:px-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{copy.reassurance[1].title}</p>
                <p className="mt-1 text-xs text-slate-500">{copy.reassurance[1].text}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-5 md:pl-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{copy.reassurance[2].title}</p>
                <p className="mt-1 text-xs text-slate-500">{copy.reassurance[2].text}</p>
              </div>
            </div>
          </div>
        </section>

        {profile.showDiscovery && (
        <section className="bg-white py-16 md:py-24">
          <div className="container">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">{copy.discovery.eyebrow}</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{copy.discovery.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">{copy.discovery.text}</p>
              </div>
              <Link href="/boutique" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-orange-600">{copy.discovery.allShop} <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {localizedDiscoveryTiles.map(tile => (
                <Link key={tile.href} href={tile.href} className="group overflow-hidden rounded-2xl border border-[#eadfd2] bg-[#fbf7f2] transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
                  <div className="aspect-[16/10] overflow-hidden bg-[#f3ebe2]"><img src={tile.image} alt={tile.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                  <div className="flex items-start justify-between gap-3 p-5"><div><h3 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600">{tile.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{tile.description}</p></div><ChevronRight className="mt-1 h-5 w-5 shrink-0 text-orange-500" /></div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center"><Link href="/boutique"><Button variant="outline" className="border-[#d9cbbc] bg-white text-slate-800 hover:border-orange-300 hover:text-orange-600">{copy.discovery.browseShop} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
          </div>
        </section>
        )}

        {profile.showStory && (
        <section className="relative overflow-hidden py-16 md:py-24" style={{ backgroundColor: palette.soft }}>
          <div aria-hidden="true" className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-orange-200/45 blur-3xl" />
          <div aria-hidden="true" className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-100/80 blur-3xl" />
          <div className="container relative grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-20">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-700"><Sparkles className="h-3.5 w-3.5" /> {copy.story.eyebrow}</div>
              <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-tight text-slate-950 md:text-6xl">{copy.story.title}</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 md:text-lg">{copy.story.text}</p>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{copy.story.followup}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm"><p className="text-2xl font-semibold text-orange-600">01</p><p className="mt-2 text-sm font-semibold text-slate-800">{copy.story.points[0]}</p></div>
                <div className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm"><p className="text-2xl font-semibold text-orange-600">02</p><p className="mt-2 text-sm font-semibold text-slate-800">{copy.story.points[1]}</p></div>
                <div className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm"><p className="text-2xl font-semibold text-orange-600">03</p><p className="mt-2 text-sm font-semibold text-slate-800">{copy.story.points[2]}</p></div>
              </div>
              <Link href="/boutique" className="mt-8 inline-block"><Button className="bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600">{copy.story.cta} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
            <div className="relative order-1 mx-auto w-full max-w-[570px] lg:order-2">
              <div className="relative min-h-[420px] overflow-hidden rounded-[2.25rem] border-[10px] border-white bg-slate-900 shadow-2xl shadow-slate-900/15 md:min-h-[520px]"><img src={profile.storyImageUrl} alt="Sélection lifestyle MAZIGHO" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" /><div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5 text-orange-300" /> {copy.story.visualEyebrow}</div><div className="absolute bottom-7 left-7 right-7"><p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-200">{copy.story.visualEyebrow}</p><p className="mt-2 max-w-sm text-xl font-semibold leading-tight text-white md:text-2xl">{copy.story.visualTitle}</p></div></div>
              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-xl md:-left-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">{copy.story.promiseEyebrow}</p><p className="mt-1 text-sm font-semibold text-slate-800">{copy.story.promise}</p></div>
              <div className="absolute -right-3 top-12 hidden rounded-2xl bg-orange-500 p-3 text-white shadow-lg md:flex"><ArrowUpRight className="h-5 w-5" /></div>
            </div>
          </div>
        </section>
        )}

        {profile.showTestimonials && (
        <section className="bg-slate-950 py-16 text-white md:py-24">
          <div className="container">
            <div className="mx-auto mb-10 max-w-2xl text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-300">{copy.testimonials.eyebrow}</p><h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{copy.testimonials.title}</h2><p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">{copy.testimonials.text}</p></div>
            <div className="grid gap-5 md:grid-cols-3">
              {copy.testimonials.items.map((testimonial, index) => <article key={testimonial.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"><div className="relative aspect-[16/8] overflow-hidden"><img src={testimonialImages[index]} alt="MAZIGHO" className="h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" /><Quote className="absolute bottom-4 left-4 h-7 w-7 text-orange-300" /></div><div className="p-6"><h3 className="text-lg font-semibold text-white">{testimonial.title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{testimonial.text}</p></div></article>)}
            </div>
            <div className="mt-8 text-center"><Link href="/boutique"><Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">{copy.testimonials.cta} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
          </div>
        </section>
        )}

        {profile.showEditorial && (
        <section className="container py-4 md:py-8">
          <div className="relative min-h-[180px] overflow-hidden rounded-[1.5rem] bg-[#c9b8a8]">
            <img src={profile.editorialImageUrl} alt="Ambiance bien-être et accessoires MAZIGHO" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#3a281f]/75 via-[#3a281f]/25 to-transparent" />
            <div className="relative flex min-h-[180px] items-center px-7 py-8 text-white md:px-12">
              <div className="max-w-sm">
                <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: palette.primary }}>{copy.editorial.eyebrow}</p>
                <p className="mt-3 text-xl font-semibold md:text-3xl">{copy.editorial.title}</p>
              </div>
            </div>
          </div>
        </section>
        )}

        <section className="py-16 md:py-24" style={{ backgroundColor: palette.soft }}>
          <div className="container">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">{copy.featured.eyebrow}</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{copy.featured.title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">{interpolatePublicCopy(copy.featured.text, { country: countryLabel })}</p>
              </div>
              <Link href="/boutique" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-orange-600">
                {copy.featured.catalogue} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => {
                  const imageUrl = product.images?.[0]?.imageUrl;
                  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
                  return (
                    <Link key={product.id} href={`/produit/${product.slug}`}>
                      <Card className="group h-full overflow-hidden border border-[#e5d8cb] bg-white shadow-none transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                        <CardContent className="p-0">
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f0ea]">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl text-slate-300" aria-label="Image indisponible">✦</div>
                            )}
                            {hasDiscount && <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{copy.featured.new}</span>}
                          </div>
                          <div className="space-y-3 p-5">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                              <span>{(product as any).averageRating || copy.featured.new}</span>
                            </div>
                            <h3 className="line-clamp-2 min-h-[3.5rem] text-base font-semibold leading-6 text-slate-900 group-hover:text-orange-600">{product.name}</h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-orange-600">{formatPrice(product.price, locale)}</span>
                              {hasDiscount && <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice!, locale)}</span>}
                            </div>
                            {(() => { const profile = getDeliveryProfileForCountry(product.deliveryProfiles, countryCode); return profile ? <p className="text-xs font-medium text-slate-500">{profile.customerShippingCost === 0 ? "✓" : formatPrice(profile.customerShippingCost, locale)}{profile.minDeliveryDays ? ` · ${profile.minDeliveryDays}${profile.maxDeliveryDays && profile.maxDeliveryDays !== profile.minDeliveryDays ? `–${profile.maxDeliveryDays}` : ""} ${t(locale, "days")}` : ""}</p> : null; })()}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-[#d9cbbc] bg-white/70 px-6 py-12 text-center text-sm text-slate-500">{interpolatePublicCopy(copy.featured.unavailable, { country: countryLabel })}</div>
            )}
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-10 text-white md:grid-cols-[1.15fr_0.85fr] md:px-12 md:py-14">
              <div className="flex flex-col justify-center">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-orange-300">{copy.closing.eyebrow}</p>
                <h2 className="max-w-xl text-3xl font-semibold leading-tight md:text-5xl">{copy.closing.title}</h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 md:text-base">{copy.closing.text}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/boutique"><Button className="bg-orange-500 text-white hover:bg-orange-600">{copy.closing.shopCta} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                  <Link href="/contact"><Button variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-white/10 hover:text-white">{copy.closing.contactCta}</Button></Link>
                </div>
              </div>
              <div className="relative min-h-[250px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-orange-500/80 via-amber-300/30 to-sky-500/50">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-white/15" />
                <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full border-[36px] border-orange-200/20" />
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <div>
                    <p className="text-6xl font-semibold tracking-tight text-white/95">CHF</p>
                    <p className="mt-3 text-sm text-white/75">{copy.closing.chfText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

