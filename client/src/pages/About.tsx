import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Award, Users, Sparkles } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16 md:py-20">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              À Propos de Nous
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Découvrez l'histoire et les valeurs qui font de notre boutique une destination unique pour vos achats premium.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Notre Histoire
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                  <p>
                    Fondée avec la vision de rendre l'excellence accessible, notre boutique s'est donnée pour mission de sélectionner et de proposer uniquement les produits les plus raffinés dans chaque catégorie. Depuis nos débuts, nous avons construit une réputation solide basée sur la qualité, l'authenticité et un service client irréprochable.
                  </p>
                  <p>
                    Chaque produit que nous présentons est choisi avec soin par notre équipe d'experts passionnés. Que ce soit dans le domaine de la mode, des cosmétiques, des accessoires, des cadeaux ou des jouets, nous nous engageons à vous offrir des articles qui allient esthétique, durabilité et innovation.
                  </p>
                  <p>
                    Notre engagement envers l'excellence ne s'arrête pas à nos produits. Nous croyons fermement que l'expérience d'achat doit être aussi exceptionnelle que les articles que nous proposons. C'est pourquoi nous mettons tout en œuvre pour vous garantir une navigation fluide, un service personnalisé et une satisfaction totale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nos Valeurs
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Les principes qui guident chacune de nos actions et décisions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Qualité Premium</h3>
                  <p className="text-muted-foreground">
                    Nous sélectionnons uniquement des produits d'exception qui répondent à nos standards les plus élevés.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Passion</h3>
                  <p className="text-muted-foreground">
                    Notre équipe partage une passion authentique pour l'excellence et le service client.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Satisfaction Client</h3>
                  <p className="text-muted-foreground">
                    Votre satisfaction est notre priorité absolue. Nous sommes à votre écoute à chaque étape.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Innovation</h3>
                  <p className="text-muted-foreground">
                    Nous restons à l'affût des dernières tendances pour vous proposer des produits uniques.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
                Notre Engagement
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
                <p>
                  Nous nous engageons à maintenir les plus hauts standards de professionnalisme dans tous les aspects de notre activité. Cela signifie une transparence totale sur l'origine de nos produits, des pratiques commerciales éthiques et un respect absolu de vos données personnelles.
                </p>
                <p>
                  Notre service client est disponible pour répondre à toutes vos questions et vous accompagner dans vos choix. Nous croyons que chaque client mérite une attention personnalisée et un conseil expert.
                </p>
                <p>
                  Enfin, nous sommes constamment à la recherche de nouveaux partenaires et de nouvelles collections pour enrichir notre offre et vous surprendre avec des découvertes exceptionnelles. Votre fidélité nous inspire à toujours viser l'excellence.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
