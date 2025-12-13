import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, Share2, Truck, Shield, RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import ProductOptions from "@/components/ProductOptions";
import ReviewForm from "@/components/ReviewForm";
import { getProductBySlug, getAllProducts } from "@/data/mockData";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const product = slug ? getProductBySlug(slug) : null;
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Produit non trouvé</h1>
          <p className="text-gray-600 mb-8">Le produit que vous recherchez n'existe pas.</p>
          <Button 
            onClick={() => setLocation("/boutique")}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Retour à la boutique
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedProducts = getAllProducts()
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    console.log("Ajouté au panier:", {
      product: product.name,
      quantity,
      options: selectedOptions,
    });
    // TODO: Implémenter la logique du panier
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4 text-sm text-gray-600">
          <button onClick={() => setLocation("/")} className="hover:text-orange-500">
            Accueil
          </button>
          <span className="mx-2">/</span>
          <button onClick={() => setLocation("/boutique")} className="hover:text-orange-500">
            Boutique
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">{product.name}</span>
        </div>

        {/* Product Details */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Image Gallery */}
            <div>
              <ImageGallery images={product.images} productName={product.name} />
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Title and Rating */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.averageRating)
                            ? "fill-orange-500 text-orange-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {product.reviews.length} avis
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-orange-500">
                    {(product.price / 100).toFixed(2)} €
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      {(product.originalPrice / 100).toFixed(2)} €
                    </span>
                  )}
                </div>
                {product.originalPrice && (
                  <p className="text-green-600 font-semibold">
                    Économisez {(((product.originalPrice - product.price) / product.originalPrice) * 100).toFixed(0)}%
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 text-lg leading-relaxed">
                {product.longDescription || product.description}
              </p>

              {/* Stock Status */}
              <div className={`p-4 rounded-lg ${product.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {product.stock > 0 ? (
                  <p className="font-semibold">✓ En stock ({product.stock} disponibles)</p>
                ) : (
                  <p className="font-semibold">✗ Rupture de stock</p>
                )}
              </div>

              {/* Options */}
              {product.options && product.options.length > 0 && (
                <ProductOptions
                  options={product.options}
                  onSelectOptions={setSelectedOptions}
                />
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-800">Quantité:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-l border-r border-gray-300 py-2"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-semibold"
                >
                  Ajouter au panier
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-gray-300 hover:border-orange-500"
                >
                  <Heart className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-gray-300 hover:border-orange-500"
                >
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium text-gray-800">Livraison gratuite</p>
                  <p className="text-xs text-gray-600">Dès 50€</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium text-gray-800">Paiement sécurisé</p>
                  <p className="text-xs text-gray-600">100% protégé</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium text-gray-800">Retours gratuits</p>
                  <p className="text-xs text-gray-600">30 jours</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Avis Clients</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Review Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="text-4xl font-bold text-gray-800 mb-2">
                        {product.averageRating}
                      </div>
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.averageRating)
                                ? "fill-orange-500 text-orange-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">
                        Basé sur {product.reviews.length} avis
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{review.userName}</p>
                            <p className="text-sm text-gray-600">{review.createdAt}</p>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-orange-500 text-orange-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    Aucun avis pour le moment. Soyez le premier à donner votre avis !
                  </p>
                )}
              </div>
            </div>

            {/* Review Form */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Laisser un avis
              </h3>
              <ReviewForm productId={product.id} />
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                Produits similaires
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <button
                    key={relatedProduct.id}
                    onClick={() => setLocation(`/produit/${relatedProduct.slug}`)}
                    className="text-left"
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 h-full bg-white">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                          📦
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2">
                            {relatedProduct.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                            <span>{relatedProduct.averageRating}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-orange-500">
                              {(relatedProduct.price / 100).toFixed(2)} €
                            </span>
                            {relatedProduct.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {(relatedProduct.originalPrice / 100).toFixed(2)} €
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
