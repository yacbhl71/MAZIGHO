import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RotateCcw, RefreshCw, Check, X, CreditCard, Clock, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const STATUS: Record<string, { label: string; className: string }> = {
  requested: { label: "À traiter", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Approuvé", className: "bg-blue-100 text-blue-800" },
  rejected: { label: "Refusé", className: "bg-rose-100 text-rose-800" },
  refunded: { label: "Remboursé", className: "bg-emerald-100 text-emerald-800" },
};

function money(cents: number | null | undefined) { return `${(Number(cents || 0) / 100).toFixed(2)} CHF`; }
function dt(value: Date | string) { return new Date(value).toLocaleString("fr-CH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }

function TimelineDialog({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const query = trpc.admin.orders.getTimeline.useQuery({ orderId });
  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent data-testid="timeline-dialog">
        <DialogHeader><DialogTitle>Historique — commande #{orderId}</DialogTitle><DialogDescription>Chronologie des événements enregistrés.</DialogDescription></DialogHeader>
        {query.isLoading ? <Skeleton className="h-40 w-full" /> : (
          <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5">
            {(query.data ?? []).map((event, i) => (
              <li key={i} className="relative" data-testid={`timeline-event-${i}`}>
                <CircleDot className="absolute -left-[26px] top-0.5 h-4 w-4 text-orange-500" />
                <p className="font-semibold text-slate-900">{event.label}</p>
                {event.detail && <p className="text-sm text-slate-600">{event.detail}</p>}
                <p className="text-xs text-muted-foreground">{dt(event.at)}</p>
              </li>
            ))}
            {(query.data ?? []).length === 0 && <li className="text-sm text-muted-foreground">Aucun événement.</li>}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminReturns() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const query = trpc.admin.returns.getAll.useQuery();
  const [timelineOrder, setTimelineOrder] = useState<number | null>(null);
  const [refundOrder, setRefundOrder] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const updateStatus = trpc.admin.returns.updateStatus.useMutation({
    onSuccess: async () => { toast.success("Retour mis à jour"); await query.refetch(); },
    onError: e => toast.error(e.message),
  });
  const refund = trpc.admin.orders.refund.useMutation({
    onSuccess: async () => { toast.success("Remboursement effectué"); setRefundOrder(null); setConfirmText(""); await query.refetch(); },
    onError: e => toast.error(e.message),
  });

  const returns = query.data ?? [];
  const pending = returns.filter(r => r.status === "requested").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8" data-testid="admin-returns-page">
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-700"><RotateCcw className="h-4 w-4" /> Service après-vente</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Retours & remboursements</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Traitez les demandes de retour, consultez l'historique des commandes et déclenchez un remboursement Stripe en un clic.</p>
            </div>
            <Button onClick={() => query.refetch()} disabled={query.isFetching} variant="outline" className="border-orange-200 bg-white text-orange-700 hover:bg-orange-100" data-testid="returns-refresh"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Actualiser</Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demandes à traiter</p><p className="mt-1 text-2xl font-bold text-amber-700">{pending}</p></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total demandes</p><p className="mt-1 text-2xl font-bold text-slate-900">{returns.length}</p></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remboursées</p><p className="mt-1 text-2xl font-bold text-emerald-700">{returns.filter(r => r.status === "refunded").length}</p></div>
        </section>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-5"><CardTitle className="text-xl text-slate-900">Demandes de retour</CardTitle><CardDescription>Chaque demande est liée à une commande payée.</CardDescription></CardHeader>
          <CardContent className="p-0">
            {query.isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div> : returns.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center" data-testid="returns-empty"><div className="rounded-full bg-slate-100 p-4 text-slate-400"><RotateCcw className="h-7 w-7" /></div><p className="mt-4 font-semibold text-slate-800">Aucune demande de retour</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Les demandes des clients apparaîtront ici.</p></div>
            ) : (
              <div className="divide-y divide-border/70">
                {returns.map(r => (
                  <div key={r.id} className="p-5" data-testid={`return-row-${r.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-56 flex-1">
                        <div className="flex items-center gap-2"><p className="font-semibold text-slate-900">Commande #{r.orderId}</p><Badge className={`border-0 ${STATUS[r.status].className}`}>{STATUS[r.status].label}</Badge>{r.orderPaymentStatus === "refunded" && <Badge className="border-0 bg-emerald-100 text-emerald-800">Payée remboursée</Badge>}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{r.userName || r.userEmail} · {dt(r.createdAt)} · {money(r.orderTotal)}</p>
                        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><span className="font-medium">Motif :</span> {r.reason}</p>
                        {r.resolutionNote && <p className="mt-1 text-xs text-slate-500">Note : {r.resolutionNote}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setTimelineOrder(r.orderId)} data-testid={`view-timeline-${r.id}`}><Clock className="mr-2 h-4 w-4" /> Historique</Button>
                        {r.status === "requested" && <>
                          <Button size="sm" variant="outline" className="text-emerald-700" onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })} data-testid={`approve-return-${r.id}`}><Check className="mr-2 h-4 w-4" /> Approuver</Button>
                          <Button size="sm" variant="outline" className="text-rose-700" onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })} data-testid={`reject-return-${r.id}`}><X className="mr-2 h-4 w-4" /> Refuser</Button>
                        </>}
                        {r.status === "approved" && isAdmin && r.orderPaymentStatus === "paid" && <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => { setRefundOrder(r.orderId); setConfirmText(""); }} data-testid={`refund-return-${r.id}`}><CreditCard className="mr-2 h-4 w-4" /> Rembourser</Button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {timelineOrder !== null && <TimelineDialog orderId={timelineOrder} onClose={() => setTimelineOrder(null)} />}

      <Dialog open={refundOrder !== null} onOpenChange={o => { if (!o) setRefundOrder(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rembourser la commande #{refundOrder}</DialogTitle><DialogDescription>Action irréversible. Le montant sera remboursé via Stripe et la commande marquée « remboursée ».</DialogDescription></DialogHeader>
          <p className="text-sm text-slate-600">Pour confirmer, saisissez <code className="rounded bg-slate-100 px-1 font-mono">REMBOURSER #{refundOrder}</code></p>
          <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={`REMBOURSER #${refundOrder}`} data-testid="refund-confirm-input" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOrder(null)}>Annuler</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" disabled={refund.isPending || confirmText !== `REMBOURSER #${refundOrder}`} onClick={() => refundOrder && refund.mutate({ orderId: refundOrder, confirmation: confirmText })} data-testid="confirm-refund-button">{refund.isPending ? "…" : "Confirmer le remboursement"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
