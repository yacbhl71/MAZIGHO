import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart, ArrowLeft, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getMarketingCopy } from "@/lib/marketingCopy";
import { categoryT, commerceT, t } from "@/lib/i18n";
import { getLocalizedCountryName } from "@/lib/countryLocale";

export default function Promos() {
  const { locale } = useLocale();
  const copy = getMarketingCopy(locale).promos;
  const productsQuery = trpc.products.getAll.useQuery(locale);
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const products = (productsQuery.data || []).filter(product => product.originalPrice && getDeliveryProfileForCountry(product.deliveryProfiles, countryCode));
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart(productId, product.name, product.price, 1);
      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-red-50 to-orange-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{copy.back}</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-8 w-8 text-red-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                {copy.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {copy.lead.replace("{country}", countryLabel)}
            </p>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xl font-bold mb-2">{copy.codeTitle}</p>
            <p className="text-lg">{copy.codeText}</p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {productsQuery.isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                  const discount = product.originalPrice ? Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100
                  ) : 0;
                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow border-2 border-red-200">
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
	                          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-2 rounded-full text-center">
                            <div className="text-lg font-bold">-{discount}%</div>
                            <div className="text-xs">{copy.badge}</div>
                          </div>
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
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-red-600">
                                {formatPrice(product.price, locale)}
                              </span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.originalPrice, locale)}
                                </span>
                              )}
                            </div>
                            {product.originalPrice && (
                              <p className="text-xs text-red-600 font-semibold mt-1">
                                {copy.saving.replace("{amount}", formatPrice(product.originalPrice - product.price, locale))}
                              </p>
                            )}
                          </div>
                          {(() => { const profile = getDeliveryProfileForCountry(product.deliveryProfiles, countryCode); return profile ? <p className="text-xs font-medium text-slate-500">{profile.customerShippingCost === 0 ? categoryT(locale, "deliveryIncluded") : commerceT(locale, "shippingPerItem", { amount: formatPrice(profile.customerShippingCost, locale) })}{profile.minDeliveryDays ? ` · ${profile.minDeliveryDays}${profile.maxDeliveryDays && profile.maxDeliveryDays !== profile.minDeliveryDays ? `–${profile.maxDeliveryDays}` : ""} ${t(locale, "days")}` : ""}</p> : null; })()}

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
                              <Button className="w-full bg-red-500 hover:bg-red-600 text-white text-sm">
                                {categoryT(locale, "viewDetails")}
                              </Button>
                            </Link>
                            <button
                              onClick={() => handleAddToCart(product.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={categoryT(locale, "addToCart")}
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
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">{copy.empty.replace("{country}", countryLabel)}</p>
                <Link href="/boutique">
                  <Button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white">
                    {copy.allProducts}
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
