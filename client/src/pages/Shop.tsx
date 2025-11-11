import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Shop() {
  const { data: categories, isLoading } = trpc.categories.getAll.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16 md:py-20">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Notre Boutique
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explorez nos catégories et découvrez des produits d'exception sélectionnés avec soin.
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories?.map((category) => (
                  <Link key={category.id} href={`/categorie/${category.slug}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-primary/50 h-full">
                      <CardContent className="p-0">
                        <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-8xl">🛍️</span>
                          )}
                        </div>
                        <div className="p-6">
                          <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {category.name}
                          </h2>
                          {category.description && (
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                            <span>Découvrir</span>
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && categories && categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
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
