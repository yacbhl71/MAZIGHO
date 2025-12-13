import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import { getAllCategories, getFeaturedProducts } from "@/data/mockData";

export default function Home() {
  const categories = getAllCategories();
  const featuredProducts = getFeaturedProducts();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner with Carousel */}
        <HeroBanner />

        {/* Categories Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Nos Catégories
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explorez notre sélection soigneusement organisée pour trouver exactement ce que vous recherchez.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {categories.map((category) => (
                <Link key={category.id} href={`/categorie/${category.slug}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-gray-200 hover:border-orange-500 h-full">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <span className="text-6xl mb-4">{category.icon}</span>
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors mb-2">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Produits Phares
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Découvrez notre sélection de produits exceptionnels, choisis avec soin pour leur qualité et leur élégance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/produit/${product.slug}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-white">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                          📦
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                          <span>{product.averageRating || 4.5}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-orange-500">
                            {(product.price / 100).toFixed(2)} €
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
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

            <div className="text-center mt-12">
              <Link href="/boutique">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                  Voir tous les produits
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Avis Clients
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
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
                <Card key={index} className="bg-white border-2 border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-orange-500 text-orange-500" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">"{testimonial.comment}"</p>
                    <p className="font-semibold text-gray-800">— {testimonial.name}</p>
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
