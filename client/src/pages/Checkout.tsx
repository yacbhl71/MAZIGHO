import { useEffect, useState } from "react";
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
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [formData, setFormData] = useState({ shippingAddress: "", billingAddress: "", paymentMethod: "card" });

  const validatePromotion = trpc.shop.promotions.validate.useMutation({
    onSuccess: (data) => {
      setAppliedPromo({ code: data.code, discountAmount: data.discountAmount });
      setPromoCode(data.code);
      toast.success(`Code ${data.code} appliqué`);
    },
    onError: (error) => {
      setAppliedPromo(null);
      toast.error(error.message);
    },
  });

  const createOrder = trpc.shop.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success("Commande passée avec succès !");
      setLocation(`/commande-confirmation/${data.id}`);
    },
    onError: (error) => toast.error(`Erreur lors de la commande : ${error.message}`),
  });

  const subtotal = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - (appliedPromo?.discountAmount ?? 0));
  const shipping = discountedSubtotal > 10000 ? 0 : 1000;
  const total = discountedSubtotal + shipping;

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) setLocation("/panier");
  }, [cart, cartLoading, setLocation]);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setAppliedPromo(null);
      toast.error("Saisissez un code promo");
      return;
    }
    validatePromotion.mutate({ code: promoCode.trim(), orderAmount: subtotal });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.shippingAddress.trim()) {
      toast.error("Veuillez renseigner une adresse de livraison");
      return;
    }
    createOrder.mutate({ ...formData, promoCode: appliedPromo?.code });
  };

  if (cartLoading) return <div className="p-20 text-center">Chargement...</div>;
  if (!cart || cart.items.length === 0) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Finaliser votre commande</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Informations de livraison</CardTitle></CardHeader>
              <CardContent><form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="address">Adresse complète</Label><Textarea id="address" placeholder="Rue, Code postal, Ville, Pays" value={formData.shippingAddress} onChange={(event) => setFormData({ ...formData, shippingAddress: event.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="payment">Méthode de paiement</Label><select id="payment" className="w-full rounded-md border p-2" value={formData.paymentMethod} onChange={(event) => setFormData({ ...formData, paymentMethod: event.target.value })}><option value="card">Carte bancaire</option><option value="paypal">PayPal</option><option value="transfer">Virement bancaire</option></select></div>
                <Button type="submit" className="hidden">Confirmer</Button>
              </form></CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Code promo</CardTitle></CardHeader>
              <CardContent><div className="flex gap-2"><Input aria-label="Code promo" placeholder="BIENVENUE" value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} /><Button type="button" variant="outline" onClick={handleApplyPromo} disabled={validatePromotion.isPending}>{validatePromotion.isPending ? "..." : "Appliquer"}</Button></div>{appliedPromo && <p className="mt-2 text-sm font-medium text-green-600">{appliedPromo.code} : -{formatPrice(appliedPromo.discountAmount)}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Résumé de la commande</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => <div key={item.productId} className="flex justify-between text-sm"><span>{item.name} × {item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}
                <div className="space-y-2 border-t pt-4"><div className="flex justify-between text-sm"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>{appliedPromo && <div className="flex justify-between text-sm text-green-600"><span>Remise ({appliedPromo.code})</span><span>-{formatPrice(appliedPromo.discountAmount)}</span></div>}<div className="flex justify-between text-sm"><span>Livraison</span><span>{shipping === 0 ? "Gratuite" : formatPrice(shipping)}</span></div><div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span className="text-orange-500">{formatPrice(total)}</span></div></div>
                <Button onClick={handleSubmit} className="mt-6 w-full bg-orange-500 text-white hover:bg-orange-600" disabled={createOrder.isPending}>{createOrder.isPending ? "Traitement..." : "Confirmer la commande"}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
