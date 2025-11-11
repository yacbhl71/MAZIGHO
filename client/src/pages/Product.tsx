import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Star, ShoppingCart, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function Product() {
  const [, params] = useRoute("/produit/:slug");
  const slug = params?.slug || "";
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: productData, isLoading } = trpc.products.getBySlug.useQuery(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Produit introuvable</h1>
            <Link href="/boutique">
              <span className="text-primary hover:underline cursor-pointer">Retour à la boutique</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = productData.images.length > 0 ? productData.images : [{ imageUrl: "", displayOrder: 0 }];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto">
          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-muted to-secondary rounded-lg overflow-hidden">
                {images[selectedImage]?.imageUrl ? (
                  <img
                    src={images[selectedImage].imageUrl}
                    alt={productData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl">
                    📦
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? "border-primary" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {image.imageUrl ? (
                        <img
                          src={image.imageUrl}
                          alt={`${productData.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">
                          📦
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {productData.name}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(productData.averageRating)
                            ? "fill-primary text-primary"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    ({productData.reviews.length} avis)
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">
                    {(productData.price / 100).toFixed(2)} €
                  </span>
                  {productData.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      {(productData.originalPrice / 100).toFixed(2)} €
                    </span>
                  )}
                </div>
              </div>

              {productData.description && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {productData.description}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">Stock:</span>
                {productData.stock > 0 ? (
                  <span className="text-green-600 font-medium">{productData.stock} disponible(s)</span>
                ) : (
                  <span className="text-destructive font-medium">Rupture de stock</span>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button size="lg" className="flex-1 gap-2" disabled={productData.stock === 0}>
                  <ShoppingCart className="h-5 w-5" />
                  Ajouter au panier
                </Button>
                <Button size="lg" variant="outline">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground border-t border-border pt-4">
                Livraison gratuite pour toute commande supérieure à 50€
              </p>
            </div>
          </div>

          {/* Reviews Section */}
          {productData.reviews.length > 0 && (
            <section className="mb-20">
              <h2 className="text-3xl font-bold text-foreground mb-8">Avis Clients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productData.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-primary text-primary" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="text-sm font-medium text-foreground">
                        {review.userName || "Client anonyme"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
