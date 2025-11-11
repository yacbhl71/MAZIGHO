import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Category() {
  const [, params] = useRoute("/categorie/:slug");
  const slug = params?.slug || "";

  const { data: category, isLoading: categoryLoading } = trpc.categories.getBySlug.useQuery(slug);
  const { data: products, isLoading: productsLoading } = trpc.products.getByCategory.useQuery(
    category?.id || 0,
    { enabled: !!category }
  );

  if (categoryLoading) {
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

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Catégorie introuvable</h1>
            <Link href="/boutique">
              <span className="text-primary hover:underline cursor-pointer">Retour à la boutique</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Category Header */}
        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16 md:py-20">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-muted-foreground max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
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
                          {product.stock === 0 && (
                            <p className="text-sm text-destructive font-medium">Rupture de stock</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Aucun produit disponible dans cette catégorie pour le moment.
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
