import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart, ArrowLeft, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getMarketingCopy } from "@/lib/marketingCopy";
import { categoryT, commerceT, t } from "@/lib/i18n";
import { getLocalizedCountryName } from "@/lib/countryLocale";
import { getProductPublicCopy } from "@/lib/productPublicCopy";
import { toast } from "sonner";

export default function BestSellers() {
  const { locale } = useLocale();
  const copy = getMarketingCopy(locale).bestSellers;
  const productCopy = getProductPublicCopy(locale);
  const productsQuery = trpc.products.getAll.useQuery(locale);
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const products = (productsQuery.data || []).filter(product => getDeliveryProfileForCountry(product.deliveryProfiles, countryCode)).sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart(productId, product.name, product.price, 1);
      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 2000);
    }
  };
  const handleFavorite = (productId: number) => {
    const wasFavorite = isFavorite(productId);
    toggleFavorite(productId);
    toast.success(wasFavorite ? productCopy.favoriteRemoved : productCopy.favoriteAdded);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{copy.back}</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                {copy.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {copy.lead.replace("{country}", countryLabel)}
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {productsQuery.isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              </div>
            ) : (
            products.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 12).map((product, index) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
	                    {/* Product Image */}
	                    <div className="relative bg-gray-100 h-48 flex items-center justify-center overflow-hidden group">
	                      {product.images && product.images.length > 0 ? (
	                        <img 
	                          src={product.images[0].imageUrl} 
	                          alt={product.name}
	                          width={640}
                          height={480}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
	                        />
	                      ) : (
	                        <div className="text-6xl group-hover:scale-110 transition-transform">📦</div>
	                      )}
	                      {index < 3 && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          {copy.top.replace("{rank}", String(index + 1))}
                        </div>
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
                          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
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
                        <button onClick={() => handleFavorite(product.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={isFavorite(product.id) ? productCopy.removeFavorite : productCopy.addFavorite} aria-label={isFavorite(product.id) ? productCopy.removeFavorite : productCopy.addFavorite}>
                          <Heart className={`h-5 w-5 ${isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
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
            </div> : <div className="py-16 text-center text-sm text-gray-600">{copy.empty.replace("{country}", countryLabel)}</div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
