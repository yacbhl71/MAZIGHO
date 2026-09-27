import { FileText, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { parseCheckoutLegalAcceptanceSnapshot } from "@shared/checkoutLegalAcceptance";
import { renderCustomerOrderReceiptHtml } from "@shared/customerOrderReceipt";

type CustomerOrderReceiptDialogProps = {
  orderId: number | null;
  onOpenChange: (open: boolean) => void;
};

export default function CustomerOrderReceiptDialog({ orderId, onOpenChange }: CustomerOrderReceiptDialogProps) {
  const detail = trpc.shop.orders.getDetail.useQuery(orderId || 0, { enabled: Boolean(orderId) });
  const order = detail.data;
  const legalSnapshot = parseCheckoutLegalAcceptanceSnapshot(order?.legalAcceptanceSnapshot);
  const receiptHtml = order ? renderCustomerOrderReceiptHtml({
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    currencyCode: order.currencyCode,
    customerShippingAmount: order.customerShippingAmount,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
    })),
    legalSnapshot,
  }) : null;

  const printReceipt = () => {
    if (!receiptHtml) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  };

  return (
    <Dialog open={orderId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Récapitulatif de commande</DialogTitle>
          <DialogDescription>Un document client imprimable. Il ne remplace pas une facture fiscale lorsque celle-ci est requise.</DialogDescription>
        </DialogHeader>
        {detail.isLoading ? (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-5 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Chargement du récapitulatif…</div>
        ) : !order || !receiptHtml ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">Ce récapitulatif n’est pas accessible pour cette commande.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <iframe title={`Récapitulatif commande ${order.id}`} srcDoc={receiptHtml} className="h-[520px] w-full bg-white" sandbox="allow-same-origin" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button type="button" onClick={printReceipt} disabled={!receiptHtml} className="bg-slate-900 text-white hover:bg-slate-800"><Printer className="mr-2 h-4 w-4" /> Imprimer ou enregistrer en PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
