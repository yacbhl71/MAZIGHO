import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllProducts } from "@/data/mockData";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";

export default function Nouveautes() {
  const products = getAllProducts();
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
        <section className="bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à l'accueil</span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              🆕 Nouveautés
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Découvrez nos derniers produits fraîchement arrivés. Des sélections exclusives pour vous !
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="relative bg-gray-100 h-48 flex items-center justify-center overflow-hidden group">
                      <div className="text-6xl group-hover:scale-110 transition-transform">📦</div>
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
                                i < Math.round(product.averageRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({product.reviews.length})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-800">
                          {(product.price / 100).toFixed(2)}€
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {(product.originalPrice / 100).toFixed(2)}€
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
