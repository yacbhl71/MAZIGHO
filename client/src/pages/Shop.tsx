import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllCategories } from "@/data/mockData";

export default function Shop() {
  const categories = getAllCategories();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-16 md:py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Notre Boutique
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Explorez nos catégories et découvrez des produits d'exception sélectionnés avec soin.
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                <Link key={category.id} href={`/categorie/${category.slug}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-gray-200 hover:border-orange-500 h-full">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                        <span className="text-9xl group-hover:scale-110 transition-transform duration-300">
                          {category.icon}
                        </span>
                      </div>
                      <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-orange-500 transition-colors">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-orange-500 font-medium group-hover:gap-3 transition-all">
                          <span>Découvrir</span>
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  Aucune catégorie disponible pour le moment.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
