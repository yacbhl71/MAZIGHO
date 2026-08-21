import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: order, isLoading } = trpc.shop.orders.getDetail.useQuery(Number(id));

  if (isLoading) return <div className="p-20 text-center">Chargement...</div>;
  if (!order) return <div className="p-20 text-center">Commande non trouvée.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Merci pour votre commande !</h1>
          <p className="text-lg text-gray-600">
            Votre commande <span className="font-bold text-orange-500">#{order.id}</span> a été enregistrée avec succès. 
            Un email de confirmation vous a été envoyé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                Détails de la commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{((item.priceAtPurchase * item.quantity) / 100).toFixed(2)} €</span>
                </div>
              ))}
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-orange-500">{(order.totalAmount / 100).toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations de livraison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Adresse de livraison :</p>
                <p className="whitespace-pre-line">{order.shippingAddress}</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Méthode de paiement :</p>
                <p className="capitalize">{order.paymentMethod}</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Statut :</p>
                <p className="capitalize">{order.status}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => setLocation("/boutique")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
          >
            Continuer mes achats
          </Button>
          <Button 
            variant="outline"
            onClick={() => setLocation("/commandes")}
            className="px-8"
          >
            Voir mes commandes <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
