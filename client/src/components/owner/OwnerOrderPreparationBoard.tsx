import { Banknote, ClipboardList, FileText, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getOwnerOrderNextAction,
  getOwnerOrderPaymentLabel,
  ownerOrderStatusLabels,
  type OwnerOrderActionRow,
} from "@shared/ownerOrderPreparationPresentation";

type OwnerOrderPreparationBoardProps = {
  orders: OwnerOrderActionRow[];
  canRevealDelivery: boolean;
  pendingDecision: boolean;
  pendingTracking: boolean;
  pendingCollection: boolean;
  trackingDrafts: Record<number, string>;
  onTrackingDraftChange: (orderId: number, value: string) => void;
  onOpenItems: (orderId: number) => void;
  onOpenDelivery: (orderId: number) => void;
  onOpenPackingSlip: (orderId: number) => void;
  onDecide: (order: OwnerOrderActionRow, action: "accepted" | "rejected") => void;
  onUpdateTracking: (order: OwnerOrderActionRow, status: "shipped" | "delivered") => void;
  onConfirmCashOnDeliveryCollection: (orderId: number) => void;
};

function paymentBadgeClass(order: OwnerOrderActionRow) {
  return order.paymentMethod === "cash_on_delivery_dz"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-slate-200 bg-slate-50 text-slate-700";
}

/**
 * Touch-first order cards. The table view is deliberately kept for wide desktop
 * screens; tablets and phones get the same store-scoped actions without a
 * horizontal data-grid or hidden controls.
 */
export default function OwnerOrderPreparationBoard({
  orders,
  canRevealDelivery,
  pendingDecision,
  pendingTracking,
  pendingCollection,
  trackingDrafts,
  onTrackingDraftChange,
  onOpenItems,
  onOpenDelivery,
  onOpenPackingSlip,
  onDecide,
  onUpdateTracking,
  onConfirmCashOnDeliveryCollection,
}: OwnerOrderPreparationBoardProps) {
  return <div className="grid gap-4 xl:hidden" aria-label="Commandes à traiter, vue tactile">
    {orders.map(order => {
      const nextAction = getOwnerOrderNextAction(order);
      const canPrepare = (order.paymentStatus === "paid" || order.paymentMethod === "cash_on_delivery_dz")
        && ["processing", "shipped", "delivered"].includes(order.status);
      const trackingValue = trackingDrafts[order.id] ?? order.trackingNumber ?? "";

      return <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <p className="text-base font-bold text-slate-950">Commande #{order.id}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <p className="text-lg font-bold text-slate-950">{(Number(order.totalAmount || 0) / 100).toFixed(2)} {order.currencyCode || "CHF"}</p>
        </header>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">{ownerOrderStatusLabels[order.status] || order.status}</Badge>
            <Badge variant="outline" className={paymentBadgeClass(order)}>{getOwnerOrderPaymentLabel(order)}</Badge>
            {order.paymentMethod === "cash_on_delivery_dz" ? <span className="self-center text-xs text-slate-500">Algérie · sans carte</span> : null}
          </div>

          <section className={`rounded-xl border p-4 ${nextAction.tone === "ready" ? "border-teal-200 bg-teal-50" : nextAction.tone === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-start gap-3">
              <PackageCheck className={`mt-0.5 h-5 w-5 shrink-0 ${nextAction.tone === "ready" ? "text-teal-700" : nextAction.tone === "warning" ? "text-amber-700" : "text-slate-600"}`} />
              <div>
                <p className="font-semibold text-slate-950">{nextAction.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-700">{nextAction.description}</p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="min-h-11 flex-1 border-teal-200 text-teal-800 hover:bg-teal-50 sm:flex-none" onClick={() => onOpenItems(order.id)}><ClipboardList className="mr-2 h-4 w-4" /> Articles & historique</Button>
            {canRevealDelivery && canPrepare ? <>
              <Button type="button" variant="outline" className="min-h-11 flex-1 border-violet-200 text-violet-800 hover:bg-violet-50 sm:flex-none" onClick={() => onOpenDelivery(order.id)}><Truck className="mr-2 h-4 w-4" /> Livraison</Button>
              <Button type="button" variant="outline" className="min-h-11 flex-1 border-slate-200 text-slate-800 hover:bg-slate-100 sm:flex-none" onClick={() => onOpenPackingSlip(order.id)}><FileText className="mr-2 h-4 w-4" /> Bon</Button>
            </> : null}
          </div>

          {order.status === "pending" && (order.paymentStatus === "paid" || order.paymentMethod === "cash_on_delivery_dz") ? <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" className="min-h-12 bg-teal-700 hover:bg-teal-800" disabled={pendingDecision} onClick={() => onDecide(order, "accepted")}>Accepter pour préparer</Button>
            <Button type="button" variant="outline" className="min-h-12 border-rose-200 text-rose-700 hover:bg-rose-50" disabled={pendingDecision} onClick={() => onDecide(order, "rejected")}>Refuser la commande</Button>
          </div> : null}

          {order.status === "processing" ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label htmlFor={`tracking-card-${order.id}`} className="text-sm font-semibold text-slate-900">Numéro de suivi <span className="font-normal text-slate-500">(facultatif)</span></label>
            <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input id={`tracking-card-${order.id}`} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={trackingValue} onChange={event => onTrackingDraftChange(order.id, event.target.value)} placeholder="Ex. CH123456789" />
              <Button type="button" className="min-h-11 bg-teal-700 hover:bg-teal-800" disabled={pendingTracking} onClick={() => onUpdateTracking(order, "shipped")}><Truck className="mr-2 h-4 w-4" /> Marquer expédiée</Button>
            </div>
          </div> : null}

          {order.status === "shipped" ? <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-slate-900">{order.trackingNumber || "Sans numéro de suivi"}</p><p className="mt-1 text-xs text-slate-500">Confirmez uniquement après remise effective au client ou au transporteur.</p></div>
            <Button type="button" variant="outline" className="min-h-11 border-teal-200 text-teal-800 hover:bg-teal-50" disabled={pendingTracking} onClick={() => onUpdateTracking(order, "delivered")}>Marquer livrée</Button>
          </div> : null}

          {order.status === "delivered" && order.paymentMethod === "cash_on_delivery_dz" && order.paymentStatus === "unpaid" && canRevealDelivery ? <Button type="button" className="min-h-12 w-full bg-emerald-700 hover:bg-emerald-800" disabled={pendingCollection} onClick={() => onConfirmCashOnDeliveryCollection(order.id)}><Banknote className="mr-2 h-4 w-4" /> Confirmer l’encaissement à la livraison</Button> : null}
        </div>
      </article>;
    })}
  </div>;
}
