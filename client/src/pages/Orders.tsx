import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, ArrowLeft, CheckCircle2, CircleAlert, Package, Truck, RotateCcw, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  processing: { label: "En préparation", className: "bg-blue-100 text-blue-800" },
  shipped: { label: "Expédiée", className: "bg-purple-100 text-purple-800" },
  delivered: { label: "Livrée", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annulée", className: "bg-rose-100 text-rose-800" },
};

const RETURN_STATUS: Record<string, { label: string; className: string }> = {
  requested: { label: "Retour demandé", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Retour approuvé", className: "bg-blue-100 text-blue-800" },
  rejected: { label: "Retour refusé", className: "bg-rose-100 text-rose-800" },
  refunded: { label: "Remboursée", className: "bg-emerald-100 text-emerald-800" },
};

function money(cents: number, currencyCode = "CHF") {
  return `${(Number(cents || 0) / 100).toFixed(2)} ${currencyCode || "CHF"}`;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("fr-CH", { day: "2-digit", month: "long", year: "numeric" });
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [location] = useLocation();
  const { clearCart } = useCart();
  const stripeSessionId = new URLSearchParams(location.split("?")[1] || "").get("stripe_session_id");
  const hasValidStripeSessionId = Boolean(stripeSessionId && /^cs_[A-Za-z0-9_]+$/.test(stripeSessionId));
  const ordersQuery = trpc.shop.orders.getMyOrders.useQuery(undefined, { enabled: Boolean(user) });
  const returnsQuery = trpc.shop.orders.getMyReturns.useQuery(undefined, { enabled: Boolean(user) });
  const stripeCheckoutStatus = trpc.checkout.getSessionStatus.useQuery({ sessionId: stripeSessionId || "" }, { enabled: Boolean(user && hasValidStripeSessionId) });
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const requestReturn = trpc.shop.orders.requestReturn.useMutation({
    onSuccess: async () => { toast.success("Demande de retour envoyée"); setReturnOrderId(null); setReason(""); await returnsQuery.refetch(); },
    onError: error => toast.error(error.message),
  });

  const orders = ordersQuery.data ?? [];
  const { refetch: refetchOrders } = ordersQuery;
  const returns = returnsQuery.data ?? [];
  const returnByOrder = new Map(returns.map(r => [r.orderId, r]));
  const returnedOrder = stripeCheckoutStatus.data?.order;
  const confirmedOrder = stripeCheckoutStatus.data?.status === "paid" && returnedOrder?.paymentStatus === "paid" ? returnedOrder : null;
  const checkoutConfirmed = Boolean(confirmedOrder);

  useEffect(() => {
    if (checkoutConfirmed) {
      clearCart();
      void refetchOrders();
    }
  }, [checkoutConfirmed, clearCart, refetchOrders]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/mon-compte"><div className="mb-6 flex w-fit cursor-pointer items-center gap-2 text-orange-500 hover:text-orange-600"><ArrowLeft className="h-5 w-5" /><span className="font-medium">Mon compte</span></div></Link>
            <div className="mb-4 flex items-center gap-3"><ShoppingBag className="h-8 w-8 text-blue-500" /><h1 className="text-4xl font-bold text-gray-800 md:text-5xl">Mes commandes</h1></div>
            <p className="max-w-2xl text-lg text-gray-600">Suivez vos commandes, leur numéro de suivi et vos demandes de retour.</p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {stripeSessionId && <div className={checkoutConfirmed ? "mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950" : stripeCheckoutStatus.isError || !hasValidStripeSessionId ? "mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950" : "mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"} data-testid="stripe-checkout-return"><div className="flex items-start gap-3">{stripeCheckoutStatus.isLoading ? <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" /> : checkoutConfirmed ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : stripeCheckoutStatus.isError || !hasValidStripeSessionId ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /> : <Package className="mt-0.5 h-5 w-5 shrink-0" />}<div className="min-w-0 flex-1"><p className="font-semibold">{stripeCheckoutStatus.isLoading ? "Vérification du paiement Test…" : confirmedOrder ? `Paiement Test confirmé · commande #${confirmedOrder.id}` : stripeCheckoutStatus.isError || !hasValidStripeSessionId ? "Vérification du paiement impossible" : "Paiement en attente de confirmation"}</p><p className="mt-1 text-sm leading-6">{stripeCheckoutStatus.isLoading ? "Le statut est vérifié directement auprès de Stripe Test et de cette boutique." : confirmedOrder ? <>Votre commande est enregistrée pour {money(confirmedOrder.totalAmount, confirmedOrder.currencyCode)} et passe en préparation. Le panier a été vidé. Aucun paiement Live n’a été encaissé.</> : stripeCheckoutStatus.isError || !hasValidStripeSessionId ? "Ce lien ne peut pas confirmer un paiement pour cette boutique. Aucun panier, statut de commande ou paiement n’a été modifié." : "Stripe n’a pas encore confirmé ce paiement. Vous pouvez vérifier de nouveau dans quelques instants ; le panier est conservé tant que la confirmation serveur n’existe pas."}</p>{!stripeCheckoutStatus.isLoading && !checkoutConfirmed && hasValidStripeSessionId && <Button type="button" size="sm" variant="outline" className="mt-3 min-h-10 border-current bg-white/65 text-current hover:bg-white" onClick={() => stripeCheckoutStatus.refetch()} disabled={stripeCheckoutStatus.isFetching}>{stripeCheckoutStatus.isFetching ? "Vérification…" : "Vérifier à nouveau"}</Button>}</div></div></div>}
            {authLoading || (user && ordersQuery.isLoading) ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : !user ? (
              <div className="py-20 text-center" data-testid="orders-login-required">
                <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h2 className="mb-2 text-2xl font-bold text-gray-800">Connectez-vous</h2>
                <p className="mb-6 text-gray-600">Connectez-vous pour retrouver l'historique de vos commandes.</p>
                <Button asChild className="bg-orange-500 text-white hover:bg-orange-600"><Link href="/login">Se connecter</Link></Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center" data-testid="orders-empty">
                <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h2 className="mb-2 text-2xl font-bold text-gray-800">Aucune commande</h2>
                <p className="mb-6 text-gray-600">Vos futures commandes apparaîtront ici avec leur suivi.</p>
                <Button asChild className="bg-orange-500 text-white hover:bg-orange-600"><Link href="/boutique">Découvrir la boutique</Link></Button>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4" data-testid="orders-list">
                {orders.map(order => {
                  const status = STATUS[order.status] || { label: order.status, className: "bg-slate-100 text-slate-700" };
                  const existingReturn = returnByOrder.get(order.id);
                  const canReturn = order.paymentStatus === "paid" && (!existingReturn || existingReturn.status === "rejected");
                  return (
                    <Card key={order.id} className="border-slate-200" data-testid={`order-card-${order.id}`}>
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">Commande #{order.id}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`border-0 ${status.className}`}>{status.label}</Badge>
                            {order.paymentStatus === "refunded" && <Badge className="border-0 bg-emerald-100 text-emerald-800">Remboursée</Badge>}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <p className="text-sm text-slate-700">Total : <span className="font-semibold">{money(order.totalAmount)}</span>{order.discountAmount ? <span className="ml-2 text-emerald-700">(−{money(order.discountAmount)})</span> : null}</p>
                          {order.trackingNumber ? (
                            <span className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-800" data-testid={`order-tracking-${order.id}`}><Truck className="h-4 w-4" /> Suivi : {order.trackingNumber}</span>
                          ) : order.status !== "cancelled" && order.paymentStatus === "paid" ? (
                            <span className="text-xs text-muted-foreground">Numéro de suivi communiqué à l'expédition</span>
                          ) : null}
                        </div>
                        {(existingReturn || canReturn) && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                            {existingReturn ? (
                              <Badge className={`border-0 ${RETURN_STATUS[existingReturn.status].className}`}>{RETURN_STATUS[existingReturn.status].label}</Badge>
                            ) : <span className="text-xs text-muted-foreground">Un souci avec cette commande ?</span>}
                            {canReturn && (
                              <Button size="sm" variant="outline" onClick={() => { setReturnOrderId(order.id); setReason(""); }} data-testid={`request-return-${order.id}`}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Demander un retour
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={returnOrderId !== null} onOpenChange={open => { if (!open) setReturnOrderId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander un retour — commande #{returnOrderId}</DialogTitle>
            <DialogDescription>Expliquez la raison du retour. Notre équipe traitera votre demande et vous informera par e-mail.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex : article endommagé, taille incorrecte…" data-testid="return-reason-input" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOrderId(null)}>Annuler</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" disabled={reason.trim().length < 5 || requestReturn.isPending} onClick={() => returnOrderId && requestReturn.mutate({ orderId: returnOrderId, reason: reason.trim() })} data-testid="submit-return-request">
              {requestReturn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
