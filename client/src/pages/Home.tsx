import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.getAll.useQuery();
  const { data: featuredProducts, isLoading: productsLoading } = trpc.products.getFeatured.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-20 md:py-32">
          <div className="container mx-auto">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Découvrez l'Excellence Premium
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Une sélection raffinée de vêtements, cosmétiques, accessoires, cadeaux et jouets pour sublimer votre quotidien.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/boutique">
                  <Button size="lg" className="gap-2">
                    Découvrir la boutique
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/a-propos">
                  <Button size="lg" variant="outline">
                    En savoir plus
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nos Catégories
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explorez notre sélection soigneusement organisée pour trouver exactement ce que vous recherchez.
              </p>
            </div>

            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {categories?.map((category) => (
                  <Link key={category.id} href={`/categorie/${category.slug}`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-primary/50">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-4xl">🛍️</span>
                          )}
                        </div>
                        <div className="p-4 text-center">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Produits Phares
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Découvrez notre sélection de produits exceptionnels, choisis avec soin pour leur qualité et leur élégance.
              </p>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts?.map((product) => (
                  <Link key={product.id} href={`/produit/${product.slug}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-gradient-to-br from-muted to-secondary overflow-hidden">
                          <div className="w-full h-full bg-muted flex items-center justify-center text-6xl">
                            📦
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span>4.5</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-primary">
                              {(product.price / 100).toFixed(2)} €
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                {(product.originalPrice / 100).toFixed(2)} €
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link href="/boutique">
                <Button size="lg" variant="outline" className="gap-2">
                  Voir tous les produits
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Avis Clients
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Découvrez ce que nos clients pensent de nos produits et services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Sophie Martin",
                  comment: "Des produits d'une qualité exceptionnelle ! Je suis ravie de mes achats et le service client est impeccable.",
                  rating: 5,
                },
                {
                  name: "Thomas Dubois",
                  comment: "Livraison rapide et produits conformes à la description. Je recommande vivement cette boutique !",
                  rating: 5,
                },
                {
                  name: "Marie Leroy",
                  comment: "Une sélection raffinée et un service personnalisé. C'est ma boutique préférée pour les cadeaux.",
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <Card key={index} className="bg-card">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                    <p className="font-semibold text-foreground">— {testimonial.name}</p>
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
