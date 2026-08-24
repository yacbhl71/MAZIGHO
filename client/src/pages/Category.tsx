import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getCollectionVisual } from "@/lib/collectionVisuals";
import { categoryT, t } from "@/lib/i18n";
import { getLocalizedCategoryPresentation } from "@/lib/categoryPresentation";
import { getLocalizedCountryName } from "@/lib/countryLocale";

const categoryHeroImages: Record<string, string> = {
  "high-tech-gadgets": "/assets/category-high-tech.jpg",
  "maison-organisation": "/assets/category-maison.jpg",
  "beaute-bien-etre": "/assets/category-beaute.jpg",
  "sport-fitness": "/assets/category-sport.jpg",
  "auto-accessoires": "/assets/category-auto.jpg",
  mode: "/assets/category-mode.jpg",
};

export default function Category() {
  const [, params] = useRoute("/categorie/:slug");
  const slug = params?.slug || "";
  const { locale } = useLocale();
  const categoryQuery = trpc.categories.getBySlug.useQuery({ slug, locale });
  const category = categoryQuery.data ? getLocalizedCategoryPresentation(locale, categoryQuery.data) : undefined;
  
  const productsQuery = trpc.products.getByCategory.useQuery({ categoryId: category?.id || 0, locale }, {
    enabled: !!category?.id
  });
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const isCreativeCategory = category?.catalogSection === "creations";
  const creativeVisual = isCreativeCategory ? getCollectionVisual(slug) : undefined;
  const products = (productsQuery.data || []).filter(product => isCreativeCategory || getDeliveryProfileForCountry(product.deliveryProfiles, countryCode));
  
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product && getDeliveryProfileForCountry(product.deliveryProfiles, countryCode)) {
      const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : undefined;
      addToCart(productId, product.name, product.price, 1, undefined, imageUrl);
      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 2000);
    }
  };

  if (categoryQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{categoryT(locale, "notFoundTitle")}</h1>
            <p className="text-gray-600 mb-6">{categoryT(locale, "notFoundText")}</p>
            <Link href="/boutique">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                {categoryT(locale, "backShop")}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Editorial Category Header */}
        <section className="relative min-h-[330px] overflow-hidden bg-slate-950 md:min-h-[390px]">
          <img src={creativeVisual?.imageUrl || categoryHeroImages[slug] || "/assets/shop-editorial-hero.jpg"} alt={creativeVisual?.alt || `Sélection ${category.name}`} className="absolute inset-0 h-full w-full object-cover" />
          <div className={isCreativeCategory ? "absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/45 to-slate-950/10" : "absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/10"} />
          <div className="relative flex min-h-[330px] items-end px-6 py-10 md:min-h-[390px] md:px-12 lg:px-20">
            <div className="max-w-2xl text-white">
              <Link href={isCreativeCategory ? "/creations" : "/boutique"}>
                <div className="mb-7 flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-white/85 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{isCreativeCategory ? categoryT(locale, "backCreations") : categoryT(locale, "backShop")}</span>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl" aria-hidden="true">{(category as any).icon || "✦"}</span>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">{isCreativeCategory ? categoryT(locale, "creativeCollection") : categoryT(locale, "universe")}</p>
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{category.name}</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/85">{category.description || categoryT(locale, "dailySelection")}</p>
            </div>
          </div>
        </section>
        <div className="border-b border-[#eadfd2] bg-white px-6 py-4 text-center text-sm text-slate-600">{isCreativeCategory ? categoryT(locale, "creativeNotice", { country: countryLabel }) : categoryT(locale, "categoryNotice", { category: category.name, country: countryLabel })}</div>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
	                      {/* Product Image */}
	                      <div className="relative bg-gray-100 h-48 flex items-center justify-center overflow-hidden group">
	                        {product.images && product.images.length > 0 ? (
	                          <img 
	                            src={product.images[0].imageUrl} 
	                            alt={product.name}
	                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
	                          />
	                        ) : (
	                          <div className="text-6xl group-hover:scale-110 transition-transform">📦</div>
	                        )}
	                        {product.originalPrice && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-3">
                        <Link href={`/produit/${product.slug}`}>
                          <h3 className="font-semibold text-gray-800 hover:text-orange-500 transition-colors cursor-pointer line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.round((product as any).averageRating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            ({(product as any).reviews?.length || 0})
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-800">
                            {formatPrice(product.price, locale)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.originalPrice, locale)}
                            </span>
                          )}
                        </div>
                        {(() => { const profile = getDeliveryProfileForCountry(product.deliveryProfiles, countryCode); return profile ? <p className="text-xs font-medium text-slate-500">{profile.customerShippingCost === 0 ? categoryT(locale, "deliveryIncluded") : `${formatPrice(profile.customerShippingCost, locale)} / article`}{profile.minDeliveryDays ? ` · ${profile.minDeliveryDays}${profile.maxDeliveryDays && profile.maxDeliveryDays !== profile.minDeliveryDays ? `–${profile.maxDeliveryDays}` : ""} ${t(locale, "days")}` : ""}</p> : isCreativeCategory ? <p className="text-xs font-medium text-amber-700">{categoryT(locale, "deliveryToConfirm", { country: countryLabel })}</p> : null; })()}

                        {/* Stock Status */}
                        <div className="text-xs font-semibold">
                          {product.stock > 10 ? (
                            <span className="text-green-600">{categoryT(locale, "inStock")}</span>
                          ) : product.stock > 0 ? (
                            <span className="text-orange-600">{categoryT(locale, "limitedStock")}</span>
                          ) : (
                            <span className="text-red-600">{categoryT(locale, "outOfStock")}</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Link href={`/produit/${product.slug}`} className="flex-1">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
                              {categoryT(locale, "viewDetails")}
                            </Button>
                          </Link>
                          <button
                            onClick={() => handleAddToCart(product.id)}
                            disabled={!getDeliveryProfileForCountry(product.deliveryProfiles, countryCode)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                            title={getDeliveryProfileForCountry(product.deliveryProfiles, countryCode) ? categoryT(locale, "addToCart") : categoryT(locale, "deliveryToConfirm", { country: countryLabel })}
                          >
                            <ShoppingCart className="h-5 w-5 text-gray-700" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={categoryT(locale, "addToWishlist")}>
                            <Heart className="h-5 w-5 text-gray-700" />
                          </button>
                        </div>

                        {addedToCart === product.id && (
                          <div className="text-xs text-green-600 font-semibold text-center">
                            {categoryT(locale, "addedToCart")}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">{isCreativeCategory ? categoryT(locale, "creativeEmpty") : categoryT(locale, "categoryEmpty", { country: countryLabel })}</p>
                <Link href={isCreativeCategory ? "/creations" : "/boutique"}>
                  <Button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white">
                    {isCreativeCategory ? categoryT(locale, "backCreations") : categoryT(locale, "chooseCountryOrShop")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
