import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, ArrowLeft, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Orders() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/mon-compte">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à mon compte</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="h-8 w-8 text-blue-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Mes Commandes
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Consultez l'historique de vos achats et le statut de vos commandes
            </p>
          </div>
        </section>

        {/* Orders Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune commande pour le moment</h2>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas encore effectué de commande. Commencez vos achats dès maintenant !
              </p>
              <Link href="/boutique">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Découvrir nos produits
                </Button>
              </Link>
            </div>

            {/* Info Card */}
            <Card className="mt-12 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-2">📦 Historique de commandes</h3>
                <p className="text-gray-700">
                  Une fois que vous aurez passé une commande, vous pourrez suivre son statut ici. Vous recevrez également 
                  des notifications par email pour chaque étape de votre commande (confirmation, expédition, livraison).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
