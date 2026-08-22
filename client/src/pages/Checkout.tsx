import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { data: cart, isLoading: cartLoading } = trpc.shop.cart.get.useQuery();
  const createOrder = trpc.shop.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success("Commande passée avec succès !");
      setLocation(`/commande-confirmation/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la commande : ${error.message}`);
    }
  });

  const [formData, setFormData] = useState({
    shippingAddress: "",
    billingAddress: "",
    paymentMethod: "card",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shippingAddress) {
      toast.error("Veuillez renseigner une adresse de livraison");
      return;
    }
    createOrder.mutate(formData);
  };

  if (cartLoading) return <div className="p-20 text-center">Chargement...</div>;
  if (!cart || cart.items.length === 0) {
    setLocation("/panier");
    return null;
  }

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 10000 ? 0 : 1000;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Finaliser votre commande</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse complète</Label>
                    <Textarea 
                      id="address" 
                      placeholder="Rue, Code postal, Ville, Pays"
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment">Méthode de paiement</Label>
                    <select 
                      id="payment"
                      className="w-full p-2 border rounded-md"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    >
                      <option value="card">Carte Bancaire</option>
                      <option value="paypal">PayPal</option>
                      <option value="transfer">Virement Bancaire</option>
                    </select>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>{shipping === 0 ? "Gratuite" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span className="text-orange-500">{formatPrice(total)}</span>
                  </div>
                </div>
                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-6"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? "Traitement..." : "Confirmer la commande"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
