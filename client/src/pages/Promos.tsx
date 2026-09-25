import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart, ArrowLeft, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useStorePrice } from "@/hooks/useStorePrice";
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
import { useDesignProfile } from "@/hooks/useDesignProfile";

export default function Promos() {
  const { locale } = useLocale();
  const { palette } = useDesignProfile(locale);
  const { formatStorePrice: formatPrice } = useStorePrice();
  const copy = getMarketingCopy(locale).promos;
  const productCopy = getProductPublicCopy(locale);
  const productsQuery = trpc.products.getAll.useQuery(locale, { placeholderData: (prev) => prev });
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const products = (productsQuery.data || []).filter(product => product.originalPrice && getDeliveryProfileForCountry(product.deliveryProfiles, countryCode));
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
        <section className="py-12 md:py-16" style={{ background: `linear-gradient(120deg, ${palette.soft}, #ffffff)` }}>
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="mb-6 flex w-fit cursor-pointer items-center gap-2" style={{ color: palette.accent }}>
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{copy.back}</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-8 w-8" style={{ color: palette.accent }} />
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
        <section className="py-8 text-white" style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})` }}>
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
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: palette.accent }} />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                  const discount = product.originalPrice ? Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100
                  ) : 0;
                  return (
                    <Card key={product.id} className="overflow-hidden border-2 transition-shadow hover:shadow-lg" style={{ borderColor: palette.accent }}>
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
	                          <div className="absolute right-3 top-3 rounded-full px-3 py-2 text-center text-white" style={{ backgroundColor: palette.accent }}>
                            <div className="text-lg font-bold">-{discount}%</div>
                            <div className="text-xs">{copy.badge}</div>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3">
                          <Link href={`/produit/${product.slug}`}>
                            <h3 className="line-clamp-2 cursor-pointer font-semibold text-gray-800 transition-colors" style={{ color: palette.primary }}>
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
                          <div className="rounded-lg p-3" style={{ backgroundColor: palette.soft }}>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold" style={{ color: palette.accent }}>
                                {formatPrice(product.price, locale)}
                              </span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.originalPrice, locale)}
                                </span>
                              )}
                            </div>
                            {product.originalPrice && (
                              <p className="mt-1 text-xs font-semibold" style={{ color: palette.accent }}>
                                {copy.saving.replace("{amount}", formatPrice(product.originalPrice - product.price, locale))}
                              </p>
                            )}
                          </div>

                          {/* Stock Status */}
                          <div className="text-xs font-semibold">
                            {product.stock > 10 ? (
                              <span className="text-green-600">{categoryT(locale, "inStock")}</span>
                            ) : product.stock > 0 ? (
                              <span style={{ color: palette.primary }}>{categoryT(locale, "limitedStock")}</span>
                            ) : (
                              <span className="text-red-600">{categoryT(locale, "outOfStock")}</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Link href={`/produit/${product.slug}`} className="flex-1">
                              <Button className="w-full text-sm text-white hover:brightness-95" style={{ backgroundColor: palette.accent }}>
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
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">{copy.empty.replace("{country}", countryLabel)}</p>
                <Button asChild className="mt-6 text-white hover:brightness-95" style={{ backgroundColor: palette.accent }}><Link href="/boutique">
                    {copy.allProducts}
                  </Link></Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
