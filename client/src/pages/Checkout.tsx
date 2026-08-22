import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/hooks/useCart";
import { trpc } from "@/lib/trpc";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, isLoaded } = useCart();
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - (appliedPromo?.discountAmount ?? 0));
  const shipping = discountedSubtotal >= 10000 ? 0 : 1000;
  const total = discountedSubtotal + shipping;

  useEffect(() => {
    if (isLoaded && cart.length === 0) setLocation("/panier");
  }, [cart.length, isLoaded, setLocation]);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setAppliedPromo(null);
      toast.error("Saisissez un code promo");
      return;
    }
    validatePromotion.mutate({ code: promoCode.trim(), orderAmount: subtotal });
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!formData.shippingAddress.trim()) {
      toast.error("Veuillez renseigner une adresse de livraison");
      return;
    }
    toast.info("Votre panier et votre remise sont prêts. Le paiement en ligne sera activé lors de l'intégration Stripe.");
  };

  if (!isLoaded) return <div className="p-20 text-center">Chargement...</div>;
  if (cart.length === 0) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf7f2]">
      <Header />
      <main className="container flex-1 py-10 md:py-14">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">Dernière étape</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Finaliser votre commande</h1>
          <p className="mt-2 text-sm text-slate-600">Vérifiez vos informations et appliquez votre code promo avant le paiement.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="border-[#eadfd2] bg-white shadow-none">
              <CardHeader><CardTitle>Informations de livraison</CardTitle></CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="address">Adresse complète</Label><Textarea id="address" placeholder="Rue, code postal, ville, pays" value={formData.shippingAddress} onChange={(event) => setFormData({ ...formData, shippingAddress: event.target.value })} required /></div>
                  <div className="space-y-2"><Label htmlFor="payment">Méthode de paiement</Label><select id="payment" className="w-full rounded-md border border-[#d9cbbc] bg-white p-2.5 text-sm" value={formData.paymentMethod} onChange={(event) => setFormData({ ...formData, paymentMethod: event.target.value })}><option value="card">Carte bancaire</option><option value="paypal">PayPal</option><option value="transfer">Virement bancaire</option></select></div>
                </form>
              </CardContent>
            </Card>
            <div className="border border-dashed border-[#d9cbbc] bg-white/60 p-4 text-sm text-slate-600">Le paiement en ligne n'est pas encore connecté. Cette étape permet de valider le panier et le calcul de votre remise avant l'activation de Stripe.</div>
          </div>

          <div className="space-y-6">
            <Card className="border-[#eadfd2] bg-white shadow-none">
              <CardHeader><CardTitle>Code promo</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2"><Input aria-label="Code promo" placeholder="TEST10" value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} /><Button type="button" variant="outline" onClick={handleApplyPromo} disabled={validatePromotion.isPending}>{validatePromotion.isPending ? "..." : "Appliquer"}</Button></div>
                {appliedPromo && <p className="mt-3 text-sm font-medium text-emerald-600">{appliedPromo.code} : -{formatPrice(appliedPromo.discountAmount)}</p>}
              </CardContent>
            </Card>
            <Card className="border-[#eadfd2] bg-white shadow-none">
              <CardHeader><CardTitle>Résumé de la commande</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 border-b border-[#eadfd2] pb-4">{cart.map((item) => <div key={`${item.productId}-${JSON.stringify(item.options)}`} className="flex justify-between gap-4 text-sm"><span className="text-slate-600">{item.productName} × {item.quantity}</span><span className="font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</span></div>)}</div>
                <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>{appliedPromo && <div className="flex justify-between text-emerald-600"><span>Remise ({appliedPromo.code})</span><span>-{formatPrice(appliedPromo.discountAmount)}</span></div>}<div className="flex justify-between"><span>Livraison</span><span>{shipping === 0 ? <span className="font-semibold text-emerald-600">Gratuite</span> : formatPrice(shipping)}</span></div></div>
                <div className="flex justify-between border-t border-[#eadfd2] pt-4 text-xl font-bold"><span>Total</span><span className="text-orange-600">{formatPrice(total)}</span></div>
                {shipping > 0 && <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-700">Livraison gratuite à partir de 100 CHF.</p>}
                <Button type="submit" form="checkout-form" className="mt-2 w-full bg-orange-500 text-white hover:bg-orange-600">Continuer vers le paiement</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setLocation("/panier")}>Retour au panier</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

