import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllProducts } from "@/data/mockData";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useState } from "react";

export default function Favorites() {
  const allProducts = getAllProducts();
  const { favorites, removeFavorite } = useFavorites();
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const favoriteProducts = allProducts.filter(p => favorites.includes(p.id));

  const handleAddToCart = (productId: number) => {
    const product = favoriteProducts.find(p => p.id === productId);
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
        <section className="bg-gradient-to-r from-red-50 to-pink-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à l'accueil</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Mes Favoris
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {favoriteProducts.length} produit{favoriteProducts.length !== 1 ? 's' : ''} en attente
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {favoriteProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {favoriteProducts.map((product) => (
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
                          <button
                            onClick={() => removeFavorite(product.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Supprimer des favoris"
                          >
                            <Trash2 className="h-5 w-5 text-red-600" />
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
              <div className="text-center py-20">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun favori pour le moment</h2>
                <p className="text-gray-600 mb-6">
                  Commencez à ajouter vos produits préférés à votre liste de souhaits !
                </p>
                <Link href="/boutique">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Découvrir les produits
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
