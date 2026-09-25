import { ClipboardList, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OwnerOrderItemsDialogProps = {
  orderId: number | null;
  onOpenChange: (orderId: number | null) => void;
};

/** Read-only, store-scoped preparation view with no customer or supplier data. */
export default function OwnerOrderItemsDialog({ orderId, onOpenChange }: OwnerOrderItemsDialogProps) {
  const items = trpc.owner.getOrderItemSummaries.useQuery(
    { orderId: orderId || 0 },
    { enabled: orderId !== null, retry: false, refetchOnWindowFocus: false },
  );

  return <Dialog open={orderId !== null} onOpenChange={(open) => { if (!open) onOpenChange(null); }}>
    <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-950"><ClipboardList className="h-5 w-5 text-teal-700" /> Articles de la commande #{orderId ?? "—"}</DialogTitle>
        <DialogDescription>Vue de préparation limitée aux articles, quantités et variantes choisies. Elle n’affiche ni client, adresse, paiement, prix, fournisseur, note ou donnée d’une autre boutique.</DialogDescription>
      </DialogHeader>

      {items.isLoading ? <div className="grid min-h-40 place-items-center rounded-xl bg-slate-50"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div> : items.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Les articles de cette commande ne sont pas disponibles pour le moment. Aucune information supplémentaire n’a été affichée.</div> : (items.data?.length || 0) === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Aucun article n’est enregistré dans cette commande.</div> : <div className="space-y-3">{items.data?.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><p className="font-semibold text-slate-950">{item.productName}</p><Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">Quantité : {item.quantity}</Badge></div>{item.selectedOptions.length > 0 ? <div className="mt-3 border-t border-slate-200 pt-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Variante / options choisies</p><div className="mt-2 flex flex-wrap gap-2">{item.selectedOptions.map((option) => <Badge key={`${option.name}-${option.value}`} variant="outline" className="border-slate-200 bg-white text-slate-700">{option.name} : {option.value}</Badge>)}</div></div> : <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">Aucune variante ou option enregistrée.</p>}</article>)}</div>}

      <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs leading-5 text-teal-950">Cette consultation est en lecture seule. Elle ne réserve aucun stock, ne génère aucun bon, e-mail, transporteur, fournisseur, paiement, remboursement ou action automatique.</div>
      <DialogFooter><Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(null)}>Fermer</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
