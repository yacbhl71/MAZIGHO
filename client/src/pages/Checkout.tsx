import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/hooks/useCart";
import { ArrowLeft, CreditCard, LockKeyhole, PackageCheck, Truck } from "lucide-react";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, isLoaded } = useCart();

  useEffect(() => {
    if (isLoaded && cart.length === 0) {
      setLocation("/panier");
    }
  }, [cart.length, isLoaded, setLocation]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf7f2] text-slate-600">
        Chargement de votre panier…
      </div>
    );
  }

  if (cart.length === 0) {
    return null;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf7f2]">
      <Header />
      <main className="container flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">
              Commande en préparation
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Le paiement en ligne arrive prochainement
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              MAZIGHO prépare l’ouverture de son parcours de commande. Aucun paiement, aucune commande et aucune adresse de livraison ne sont enregistrés sur cette page pour le moment.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-5">
              <Card className="border-[#eadfd2] bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <PackageCheck className="h-5 w-5 text-orange-500" />
                    Avant l’ouverture des commandes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
                  <p>
                    Les moyens de paiement reconnus en Suisse, les frais de livraison et les délais par destination seront affichés de manière claire avant que la commande puisse être finalisée.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="border border-[#eadfd2] bg-[#fffaf5] p-4 text-center">
                      <LockKeyhole className="mx-auto mb-2 h-5 w-5 text-emerald-600" />
                      <strong className="block text-slate-900">Paiement</strong>
                      Activation sécurisée à venir
                    </div>
                    <div className="border border-[#eadfd2] bg-[#fffaf5] p-4 text-center">
                      <Truck className="mx-auto mb-2 h-5 w-5 text-orange-500" />
                      <strong className="block text-slate-900">Livraison</strong>
                      Suisse et Europe, selon disponibilité
                    </div>
                    <div className="border border-[#eadfd2] bg-[#fffaf5] p-4 text-center">
                      <CreditCard className="mx-auto mb-2 h-5 w-5 text-sky-600" />
                      <strong className="block text-slate-900">Confirmation</strong>
                      E-mail automatique après activation
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50/60 shadow-none">
                <CardContent className="p-5 text-sm leading-6 text-slate-700">
                  <strong className="text-slate-950">Aucune donnée de paiement n’est demandée à ce stade.</strong>
                  <br />
                  Vous pouvez conserver votre sélection dans le panier et revenir lorsque la commande en ligne sera activée.
                </CardContent>
              </Card>
            </section>

            <aside>
              <Card className="border-orange-200 bg-white shadow-none lg:sticky lg:top-24">
                <CardHeader>
                  <CardTitle>Votre sélection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 border-b border-[#eadfd2] pb-4">
                    {cart.map((item) => (
                      <div key={`${item.productId}-${JSON.stringify(item.options)}`} className="flex items-center gap-3 text-sm">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f2eee9]">
                          {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <span className="min-w-0 flex-1 truncate text-slate-600">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sous-total articles</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Livraison</span>
                      <span className="font-medium text-slate-700">À confirmer avant commande</span>
                    </div>
                  </div>

                  <div className="border-t border-[#eadfd2] pt-4">
                    <p className="text-xs leading-5 text-slate-600">
                      Le montant ci-dessus couvre les articles sélectionnés. Les frais éventuels et le paiement seront confirmés uniquement lorsque le parcours de commande sera ouvert.
                    </p>
                  </div>

                  <Button disabled className="h-12 w-full bg-slate-400 text-base font-semibold text-white hover:bg-slate-400">
                    Paiement en ligne bientôt disponible
                  </Button>
                  <Button type="button" variant="outline" className="w-full border-[#d9cbbc]" onClick={() => setLocation("/panier")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au panier
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
