import { ClipboardCheck, Eye, Loader2, Printer, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { renderOwnerPackingSlipHtml } from "@shared/orderPackingSlip";

type OwnerOrderPackingSlipDialogProps = {
  orderId: number | null;
  storeName: string;
  onOpenChange: (orderId: number | null) => void;
};

function unavailableMessage(reason: string | undefined) {
  if (reason === "PAYMENT_NOT_CONFIRMED") return "Le paiement de cette commande n’est pas confirmé. Aucun bon de préparation ne peut être créé.";
  if (reason === "ORDER_NOT_READY") return "Acceptez d’abord cette commande afin de la faire entrer dans la préparation manuelle.";
  if (reason === "DELIVERY_ADDRESS_MISSING") return "Aucune adresse de livraison exploitable n’a été enregistrée pour cette commande.";
  return "Le bon de préparation n’est pas disponible pour cette commande.";
}

/** User-triggered printable preparation sheet. It never creates a carrier label or invoice. */
export default function OwnerOrderPackingSlipDialog({ orderId, storeName, onOpenChange }: OwnerOrderPackingSlipDialogProps) {
  const reveal = trpc.owner.revealOrderDeliveryDetails.useMutation();
  const items = trpc.owner.getOrderItemSummaries.useQuery(
    { orderId: orderId || 0 },
    { enabled: orderId !== null && Boolean(reveal.data?.available), retry: false, refetchOnWindowFocus: false },
  );
  const details = reveal.data;

  const close = () => {
    reveal.reset();
    onOpenChange(null);
  };

  const print = () => {
    if (!details?.available || items.isLoading) return;
    const printableWindow = window.open("", "_blank", "popup=yes,width=900,height=900");
    if (!printableWindow) return;
    printableWindow.opener = null;
    printableWindow.document.write(renderOwnerPackingSlipHtml({
      storeName,
      preparedAt: new Date().toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" }),
      delivery: details,
      items: (items.data || []).map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions,
      })),
    }));
    printableWindow.document.close();
    printableWindow.focus();
    printableWindow.print();
  };

  return <Dialog open={orderId !== null} onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-950"><ClipboardCheck className="h-5 w-5 text-teal-700" /> Bon de préparation · commande #{orderId ?? "—"}</DialogTitle>
        <DialogDescription>Un document de préparation interne, créé uniquement à votre demande. Ce n’est ni une facture, ni une étiquette transporteur, ni une transmission à un tiers.</DialogDescription>
      </DialogHeader>

      {!details ? <section className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Coordonnées protégées avant préparation</p>
          <p className="mt-1">La commande doit être réglée et acceptée. L’adresse est consultée seulement pour cette préparation et son ouverture est journalisée dans la boutique.</p>
        </div>
        {reveal.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Le contrôle de préparation est momentanément indisponible. Aucun document ni coordonnée n’a été généré.</div> : null}
        <Button type="button" className="min-h-11 w-full bg-teal-700 hover:bg-teal-800" disabled={reveal.isPending || orderId === null} onClick={() => orderId && reveal.mutate({ orderId })}>
          {reveal.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification…</> : <><Eye className="mr-2 h-4 w-4" /> Vérifier et afficher le bon</>}
        </Button>
      </section> : !details.available ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{unavailableMessage(details.reason)}</div> : <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><span className="font-semibold">Commande réglée et acceptée</span><Badge variant="outline" className="border-emerald-300 bg-white text-emerald-800">Document interne</Badge></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900"><p className="font-semibold">Le document imprimable contient</p><ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600"><li>numéro de commande, destinataire et adresse nécessaire ;</li><li>articles, quantités et variantes à préparer ;</li><li>numéro de suivi déjà enregistré, si présent ;</li><li>checklist d’emballage manuelle.</li></ul><p className="mt-3 text-xs leading-5 text-slate-500">Il exclut les prix, la TVA, les montants, les détails de paiement et tout historique client.</p></div>
        {items.isLoading ? <div className="grid min-h-20 place-items-center rounded-xl bg-slate-50"><Loader2 className="h-5 w-5 animate-spin text-teal-700" /></div> : items.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Les articles ne sont pas disponibles. Aucun bon ne peut être imprimé.</div> : <Button type="button" className="min-h-11 w-full bg-slate-950 hover:bg-slate-800" onClick={print}><Printer className="mr-2 h-4 w-4" /> Ouvrir et imprimer le bon</Button>}
      </section>}

      <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs leading-5 text-teal-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /><p>Utilisez ce document uniquement pour exécuter cette commande. L’impression est volontaire : elle ne crée aucun envoi, transporteur, remboursement, facture ou transmission fournisseur.</p></div>
      <DialogFooter><Button type="button" variant="outline" className="min-h-11" onClick={close}>Fermer et masquer</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
