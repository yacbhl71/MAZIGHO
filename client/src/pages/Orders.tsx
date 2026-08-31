import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, ArrowLeft, Package, Truck, RotateCcw, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
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

function money(cents: number) {
  return `${(Number(cents || 0) / 100).toFixed(2)} CHF`;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("fr-CH", { day: "2-digit", month: "long", year: "numeric" });
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const ordersQuery = trpc.shop.orders.getMyOrders.useQuery(undefined, { enabled: Boolean(user) });
  const returnsQuery = trpc.shop.orders.getMyReturns.useQuery(undefined, { enabled: Boolean(user) });
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const requestReturn = trpc.shop.orders.requestReturn.useMutation({
    onSuccess: async () => { toast.success("Demande de retour envoyée"); setReturnOrderId(null); setReason(""); await returnsQuery.refetch(); },
    onError: error => toast.error(error.message),
  });

  const orders = ordersQuery.data ?? [];
  const returns = returnsQuery.data ?? [];
  const returnByOrder = new Map(returns.map(r => [r.orderId, r]));

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
