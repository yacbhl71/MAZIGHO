import { Eye, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OwnerOrderDeliveryDialogProps = {
  orderId: number | null;
  onOpenChange: (orderId: number | null) => void;
};

function unavailableMessage(reason: string | undefined) {
  if (reason === "PAYMENT_NOT_CONFIRMED") return "Le paiement de cette commande n’est pas confirmé. Aucune coordonnée de livraison ne peut être affichée.";
  if (reason === "ORDER_NOT_READY") return "Acceptez d’abord cette commande afin de la faire entrer dans la préparation manuelle.";
  if (reason === "DELIVERY_ADDRESS_MISSING") return "Aucune adresse de livraison exploitable n’a été enregistrée pour cette commande.";
  return "Les coordonnées de livraison ne sont pas disponibles pour cette commande.";
}

/** Owner-only and explicit delivery disclosure for a paid, accepted store order. */
export default function OwnerOrderDeliveryDialog({ orderId, onOpenChange }: OwnerOrderDeliveryDialogProps) {
  const reveal = trpc.owner.revealOrderDeliveryDetails.useMutation();
  const details = reveal.data;

  const close = () => {
    reveal.reset();
    onOpenChange(null);
  };

  return <Dialog open={orderId !== null} onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-950"><MapPin className="h-5 w-5 text-teal-700" /> Livraison · commande #{orderId ?? "—"}</DialogTitle>
        <DialogDescription>Les coordonnées restent masquées par défaut. Elles ne peuvent être consultées que par le propriétaire, pour préparer une commande réglée et acceptée ou une commande Algérie acceptée à encaisser à la livraison.</DialogDescription>
      </DialogHeader>

      {!details ? <section className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Consultation ponctuelle et tracée</p>
          <p className="mt-1">L’ouverture est inscrite dans le journal de cette boutique. Les coordonnées ne sont ni exportées, ni envoyées par e-mail, ni partagées automatiquement avec un transporteur ou un fournisseur.</p>
        </div>
        {reveal.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">La consultation est momentanément indisponible. Aucune coordonnée client n’a été affichée.</div> : null}
        <Button type="button" className="min-h-11 w-full bg-teal-700 hover:bg-teal-800" disabled={reveal.isPending || orderId === null} onClick={() => orderId && reveal.mutate({ orderId })}>
          {reveal.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification…</> : <><Eye className="mr-2 h-4 w-4" /> Afficher pour préparer l’expédition</>}
        </Button>
      </section> : !details.available ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{unavailableMessage(details.reason)}</div> : <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><span className="font-semibold">{details.collectionPending ? "Commande à préparer · encaissement à la livraison" : "Commande réglée et prête à préparer"}</span><Badge variant="outline" className="border-emerald-300 bg-white text-emerald-800">Propriétaire uniquement</Badge></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Destinataire</p>
          <p className="mt-1 font-semibold">{details.recipientName || "Nom non renseigné"}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Adresse de livraison</p>
          <p className="mt-1 whitespace-pre-line">{[...details.addressLines, [details.postalCode, details.city].filter(Boolean).join(" "), details.state, details.countryCode].filter(Boolean).join("\n")}</p>
          {(details.phone || details.email) ? <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contact utile à la livraison</p>{details.phone ? <p className="mt-1">Tél. {details.phone}</p> : null}{details.email ? <p className="mt-1 break-all">{details.email}</p> : null}</div> : null}
          {details.trackingNumber ? <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Suivi enregistré</p><p className="mt-1 font-mono text-xs">{details.trackingNumber}</p></div> : null}
        </div>
        {details.addressIncomplete ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">Certaines coordonnées nécessaires à l’expédition semblent incomplètes. Vérifiez-les avant toute remise à un transporteur.</p> : null}
      </section>}

      <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs leading-5 text-teal-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /><p>Utilisez ces données uniquement pour exécuter cette commande. Ne les recopiez pas dans des exports, listes clients ou outils tiers non nécessaires à la livraison.</p></div>
      <DialogFooter><Button type="button" variant="outline" className="min-h-11" onClick={close}>Fermer et masquer</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
