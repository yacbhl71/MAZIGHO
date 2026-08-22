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

export default function Category() {
  const [, params] = useRoute("/categorie/:slug");
  const slug = params?.slug || "";
  
  const categoryQuery = trpc.categories.getBySlug.useQuery(slug);
  const category = categoryQuery.data;
  
  const productsQuery = trpc.products.getByCategory.useQuery(category?.id || 0, {
    enabled: !!category?.id
  });
  const products = productsQuery.data || [];
  
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Catégorie introuvable</h1>
            <p className="text-gray-600 mb-6">La catégorie que vous recherchez n'existe pas.</p>
            <Link href="/boutique">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Retour à la boutique
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
        {/* Header Section */}
        <section className="bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/boutique">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à la boutique</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{(category as any).icon || "📦"}</span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                {category.name}
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {category.description}
            </p>
          </div>
        </section>

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
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>

                        {/* Stock Status */}
                        <div className="text-xs font-semibold">
                          {product.stock > 10 ? (
                            <span className="text-green-600">✓ En stock</span>
                          ) : product.stock > 0 ? (
                            <span className="text-orange-600">⚠ Stock limité</span>
                          ) : (
                            <span className="text-red-600">✗ Rupture de stock</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Link href={`/produit/${product.slug}`} className="flex-1">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
                              Voir détails
                            </Button>
                          </Link>
                          <button
                            onClick={() => handleAddToCart(product.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ajouter au panier"
                          >
                            <ShoppingCart className="h-5 w-5 text-gray-700" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ajouter à la wishlist">
                            <Heart className="h-5 w-5 text-gray-700" />
                          </button>
                        </div>

                        {addedToCart === product.id && (
                          <div className="text-xs text-green-600 font-semibold text-center">
                            ✓ Ajouté au panier
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Aucun produit dans cette catégorie pour le moment.</p>
                <Link href="/boutique">
                  <Button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white">
                    Voir tous les produits
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
