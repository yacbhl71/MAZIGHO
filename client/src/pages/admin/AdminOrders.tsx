import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  CheckCircle,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Loader2,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
  ShieldAlert,
  RotateCcw,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";

const statuses = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = Exclude<(typeof statuses)[number], "all">;

const decisionMeta = {
  accepted: { label: "Acceptée pour traitement", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  rejected: { label: "Refusée", className: "border-rose-200 bg-rose-50 text-rose-800" },
  refund_requested: { label: "Remboursement à traiter", className: "border-amber-200 bg-amber-50 text-amber-800" },
} as const;

type DecisionAction = keyof typeof decisionMeta;

const fulfillmentMeta: Record<string, { label: string; className: string }> = {
  not_eligible: { label: "Hors circuit CJ", className: "border-slate-200 bg-slate-50 text-slate-700" },
  awaiting_supplier_preparation: { label: "Prête pour test CJ", className: "border-sky-200 bg-sky-50 text-sky-800" },
  supplier_order_draft: { label: "Test CJ préparé", className: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  supplier_payment_review: { label: "Paiement à examiner", className: "border-amber-200 bg-amber-50 text-amber-800" },
  supplier_payment_pending: { label: "Paiement fournisseur en attente", className: "border-amber-200 bg-amber-50 text-amber-800" },
  supplier_paid: { label: "Fournisseur réglé", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  supplier_exception: { label: "Exception fournisseur", className: "border-rose-200 bg-rose-50 text-rose-800" },
  shipped: { label: "Expédition fournisseur", className: "border-purple-200 bg-purple-50 text-purple-800" },
  delivered: { label: "Livraison fournisseur", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  cancelled: { label: "Circuit annulé", className: "border-rose-200 bg-rose-50 text-rose-800" },
  refunded: { label: "Circuit remboursé", className: "border-rose-200 bg-rose-50 text-rose-800" },
};

const statusMeta: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "border-amber-200 bg-amber-50 text-amber-800" },
  processing: { label: "En préparation", className: "border-blue-200 bg-blue-50 text-blue-800" },
  shipped: { label: "Expédiée", className: "border-purple-200 bg-purple-50 text-purple-800" },
  delivered: { label: "Livrée", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  cancelled: { label: "Annulée", className: "border-rose-200 bg-rose-50 text-rose-800" },
};

function getStatusBadge(status: string) {
  const meta = statusMeta[status as OrderStatus];
  return <Badge variant="outline" className={meta?.className || "bg-slate-50 text-slate-700"}>{meta?.label || status}</Badge>;
}

function getFulfillmentBadge(status?: string | null) {
  const meta = fulfillmentMeta[status || "not_eligible"];
  return <Badge variant="outline" className={meta?.className || "bg-slate-50 text-slate-700"}>{meta?.label || status || "—"}</Badge>;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("fr-CH", { day: "2-digit", month: "short", year: "numeric" });
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <Card className="border-border/70 bg-white shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></CardContent></Card>;
}

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("all");
  const [decisionTarget, setDecisionTarget] = useState<{ action: DecisionAction; orderId: number } | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionConfirmation, setDecisionConfirmation] = useState("");
  const [sandboxOrderId, setSandboxOrderId] = useState<number | null>(null);
  const [sandboxConfirmation, setSandboxConfirmation] = useState("");

  const { data: orders, isLoading, refetch } = trpc.admin.orders.getAll.useQuery();
  const { data: orderItems, isLoading: isLoadingItems } = trpc.admin.orders.getItems.useQuery(
    { orderId: selectedOrder?.id ?? 0 },
    { enabled: Boolean(selectedOrder?.id && isDetailsOpen) }
  );
  const { data: orderDecisions, isLoading: isLoadingDecisions, refetch: refetchDecisions } = trpc.admin.orders.getDecisions.useQuery(
    { orderId: selectedOrder?.id ?? 0 },
    { enabled: Boolean(selectedOrder?.id && isDetailsOpen) }
  );
  const { data: fulfillment, isLoading: isLoadingFulfillment, refetch: refetchFulfillment } = trpc.admin.orders.getFulfillment.useQuery(
    { orderId: selectedOrder?.id ?? 0 },
    { enabled: Boolean(selectedOrder?.id && isDetailsOpen) }
  );
  const { data: cjSafety } = trpc.admin.orders.getCjSafetyStatus.useQuery();

  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: async () => {
      toast.success("Commande mise à jour");
      setIsDetailsOpen(false);
      await refetch();
    },
    onError: error => toast.error(error.message || "Mise à jour impossible."),
  });

  const prepareCjSandbox = trpc.admin.orders.prepareCjSandbox.useMutation({
    onSuccess: async (result) => {
      toast.success(result.prepared ? "Test CJ préparé sans débit fournisseur." : "Aucun test CJ supplémentaire n’a été exécuté.");
      setSandboxOrderId(null);
      setSandboxConfirmation("");
      await Promise.all([refetch(), refetchFulfillment()]);
    },
    onError: error => toast.error(error.message || "Préparation CJ impossible."),
  });

  const decide = trpc.admin.orders.decide.useMutation({
    onSuccess: async (_, variables) => {
      toast.success(variables.action === "accepted" ? "Commande acceptée pour traitement manuel." : variables.action === "rejected" ? "Commande refusée. Aucun fournisseur n’a été contacté." : "Demande de remboursement enregistrée. Aucun remboursement n’a été envoyé automatiquement.");
      setDecisionTarget(null);
      setDecisionReason("");
      setDecisionConfirmation("");
      setIsDetailsOpen(false);
      await Promise.all([refetch(), refetchDecisions()]);
    },
    onError: error => toast.error(error.message || "Décision impossible."),
  });

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (orders ?? []).filter(order => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = !query || [String(order.id), order.userName || "", order.userEmail || "", order.trackingNumber || ""]
        .some(value => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(() => ({
    total: orders?.length ?? 0,
    pending: orders?.filter(order => order.status === "pending").length ?? 0,
    processing: orders?.filter(order => order.status === "processing").length ?? 0,
    shipped: orders?.filter(order => order.status === "shipped").length ?? 0,
  }), [orders]);

  const handleOpenDetails = (order: any) => {
    setSelectedOrder(order);
    setStatus(order.status as OrderStatus);
    setTrackingNumber(order.trackingNumber || "");
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOrder) return;
    updateStatus.mutate({
      id: selectedOrder.id,
      status,
      trackingNumber: trackingNumber.trim() || undefined,
    });
  };

  const openDecision = (action: DecisionAction) => {
    if (!selectedOrder) return;
    setDecisionReason("");
    setDecisionConfirmation("");
    setDecisionTarget({ action, orderId: selectedOrder.id });
  };

  const submitDecision = () => {
    if (!decisionTarget) return;
    decide.mutate({
      orderId: decisionTarget.orderId,
      action: decisionTarget.action,
      reason: decisionReason.trim() || undefined,
      confirmation: decisionConfirmation.trim() || undefined,
    });
  };

  const submitSandboxPreparation = () => {
    if (!sandboxOrderId) return;
    prepareCjSandbox.mutate({ orderId: sandboxOrderId, confirmation: sandboxConfirmation.trim() });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700"><PackageCheck className="h-4 w-4" /> Suivi opérationnel</div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Gestion des commandes</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Suivez chaque commande, son règlement, sa préparation et son expédition depuis une seule page.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700"><CircleDollarSign className="h-5 w-5 text-blue-600" /> Tous les montants sont affichés en CHF.</div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total" value={summary.total} tone="text-slate-900" />
          <SummaryCard label="À traiter" value={summary.pending} tone="text-amber-700" />
          <SummaryCard label="En préparation" value={summary.processing} tone="text-blue-700" />
          <SummaryCard label="Expédiées" value={summary.shipped} tone="text-purple-700" />
        </section>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Rechercher par n°, client, e-mail ou suivi…" /></div>
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as (typeof statuses)[number])}>
              <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statuses.filter(value => value !== "all").map(value => <SelectItem key={value} value={value}>{statusMeta[value as OrderStatus].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Réinitialiser</Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Règlement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Suivi</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}>{Array.from({ length: 8 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-16 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><div className="rounded-full bg-blue-50 p-4 text-blue-600"><ShoppingBag className="h-7 w-7" /></div><p className="mt-4 font-semibold text-slate-800">Aucune commande trouvée</p><p className="mt-1 text-sm text-muted-foreground">Modifiez votre recherche ou attendez les premières commandes de la boutique.</p></div></TableCell></TableRow>
                ) : filteredOrders.map(order => (
                  <TableRow key={order.id} className="hover:bg-slate-50/70">
                    <TableCell><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><ShoppingBag className="h-4 w-4" /></div><div><p className="font-semibold text-slate-900">#{order.id}</p><p className="text-xs text-muted-foreground">{formatPrice(order.totalAmount)}</p></div></div></TableCell>
                    <TableCell><p className="font-medium text-slate-900">{order.userName || "Client MAZIGHO"}</p><p className="text-xs text-muted-foreground">{order.userEmail || "—"}</p></TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-sm text-slate-700"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{formatDate(order.createdAt)}</div></TableCell>
                    <TableCell><Badge variant="outline" className={order.paymentStatus === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}>{order.paymentStatus === "paid" ? "Payée" : order.paymentStatus === "refunded" ? "Remboursée" : "À régler"}</Badge></TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getFulfillmentBadge(order.fulfillmentState)}</TableCell>
                    <TableCell className="max-w-36 truncate text-sm text-slate-600">{order.trackingNumber || "—"}</TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleOpenDetails(order)}><Eye className="mr-1.5 h-4 w-4" /> Ouvrir <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            {selectedOrder && <form onSubmit={handleUpdateStatus}>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2"><DialogTitle>Commande #{selectedOrder.id}</DialogTitle>{getStatusBadge(selectedOrder.status)}<Badge variant="outline" className={selectedOrder.paymentStatus === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200"}>{selectedOrder.paymentStatus === "paid" ? "Payée" : selectedOrder.paymentStatus}</Badge></div>
                <DialogDescription>Créée le {formatDate(selectedOrder.createdAt)}. Mettez à jour le statut et le numéro de suivi dès que nécessaire.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-5">
                <div className="grid gap-4 rounded-xl border bg-slate-50/70 p-4 sm:grid-cols-2">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</p><p className="mt-1 font-semibold text-slate-900">{selectedOrder.userName || "Client MAZIGHO"}</p><p className="text-sm text-muted-foreground">{selectedOrder.userEmail || "—"}</p></div>
                  <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatPrice(selectedOrder.totalAmount)}</p><p className="text-sm text-muted-foreground">{selectedOrder.paymentMethod || "Méthode non renseignée"}</p></div>
                </div>

                <div className="rounded-xl border p-4"><div className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><ShoppingBag className="h-4 w-4 text-orange-600" /> Articles commandés</div>{isLoadingItems ? <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : orderItems?.length ? <div className="divide-y">{orderItems.map(item => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium text-slate-900">{item.productName || "Produit supprimé"}</p><p className="text-sm text-muted-foreground">Quantité : {item.quantity}</p></div><p className="font-semibold text-slate-900">{formatPrice(Number(item.priceAtPurchase) * item.quantity)}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Aucun article détaillé n’est enregistré pour cette commande.</p>}</div>

                <div className="rounded-xl border p-4"><div className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-4 w-4 text-orange-600" /> Adresse de livraison</div><p className="whitespace-pre-line text-sm text-slate-700">{selectedOrder.shippingAddress || "Adresse non renseignée"}</p></div>

                {selectedOrder.notes && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Note interne</p><p className="mt-1 whitespace-pre-line">{selectedOrder.notes}</p></div>}

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><FlaskConical className="h-4 w-4 text-indigo-700" /> Préparation fournisseur CJ</div><p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">Zone interne. Le test crée uniquement une commande sandbox CJ avec <code>payType=3</code> : aucun débit, aucune commande réelle et aucune expédition ne peuvent être déclenchés.</p></div>{getFulfillmentBadge(fulfillment?.order.fulfillmentState || selectedOrder.fulfillmentState)}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs"><Badge variant="outline" className="border-indigo-200 bg-white text-indigo-800">{cjSafety?.sandboxOnly ? "Sandbox uniquement" : "Mode à vérifier"}</Badge><Badge variant="outline" className="border-indigo-200 bg-white text-indigo-800">Paiement CJ désactivé</Badge>{fulfillment?.order.odooSaleOrderId ? <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-800">Odoo #{fulfillment.order.odooSaleOrderId}</Badge> : <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">Odoo : non synchronisé</Badge>}</div>
                  {isLoadingFulfillment ? <Skeleton className="mt-4 h-16 w-full" /> : <><div className="mt-4 grid gap-3 sm:grid-cols-2">{fulfillment?.supplierOrders?.length ? fulfillment.supplierOrders.map(supplierOrder => { const supplierTotal = Number(supplierOrder.supplierTotalAmount || 0); const estimateChf = Math.round(supplierTotal * 0.9); const margin = Number(supplierOrder.customerSaleAmount || 0) - estimateChf; return <div key={supplierOrder.id} className="rounded-lg border border-indigo-100 bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{supplierOrder.externalReference}</p><Badge variant="outline" className="border-indigo-200 text-indigo-800">{supplierOrder.state}</Badge></div><p className="mt-1 text-xs text-slate-600">CJ #{supplierOrder.providerOrderId || "en attente"} · test sandbox</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span className="text-slate-500">Coût CJ</span><strong className="text-right text-slate-900">${(supplierTotal / 100).toFixed(2)} USD</strong><span className="text-slate-500">Estimation CHF</span><strong className="text-right text-slate-900">{formatPrice(estimateChf)}</strong><span className="text-slate-500">Marge estimée</span><strong className={`text-right ${margin >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{formatPrice(margin)}</strong></div></div>; }) : <p className="text-xs text-slate-600">Aucune commande CJ n’a été créée. Les commandes existantes avant cette mise à jour restent volontairement manuelles.</p>}</div>
                  {fulfillment?.order.fulfillmentLastError && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900"><strong>Contrôle requis :</strong> {fulfillment.order.fulfillmentLastError}</div>}
                  {fulfillment?.jobs?.[0] && <p className="mt-3 text-xs text-slate-500">Tâche interne : {fulfillment.jobs[0].state === "queued" ? "en attente de lancement" : fulfillment.jobs[0].state === "completed" ? "terminée" : fulfillment.jobs[0].state === "failed" ? "en exception" : fulfillment.jobs[0].state}.</p>}
                  <Button type="button" className="mt-4 border-indigo-300 bg-white text-indigo-800 hover:bg-indigo-100" variant="outline" disabled={selectedOrder.paymentStatus !== "paid" || fulfillment?.order.fulfillmentState !== "awaiting_supplier_preparation"} onClick={() => { setSandboxOrderId(selectedOrder.id); setSandboxConfirmation(""); }}><FlaskConical className="mr-2 h-4 w-4" /> Préparer chez CJ (test)</Button></>}</div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><ShieldAlert className="h-4 w-4 text-blue-700" /> Validation avant fournisseur</div><p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">Aucune décision ci-dessous ne crée une commande CJ, ne transmet l’adresse client ou n’effectue un remboursement réel. Ces actions restent manuelles pendant la phase de test.</p></div><Badge variant="outline" className="border-blue-200 bg-white text-blue-800">Sas actif</Badge></div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3"><Button type="button" variant="outline" className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50" disabled={selectedOrder.status !== "pending" || selectedOrder.paymentStatus !== "paid"} onClick={() => openDecision("accepted")}><CheckCircle className="mr-2 h-4 w-4" /> Accepter</Button><Button type="button" variant="outline" className="border-rose-200 bg-white text-rose-800 hover:bg-rose-50" disabled={selectedOrder.status === "shipped" || selectedOrder.status === "delivered"} onClick={() => openDecision("rejected")}><XCircle className="mr-2 h-4 w-4" /> Refuser</Button><Button type="button" variant="outline" className="border-amber-200 bg-white text-amber-900 hover:bg-amber-50" disabled={selectedOrder.paymentStatus !== "paid" || selectedOrder.paymentStatus === "refunded"} onClick={() => openDecision("refund_requested")}><RotateCcw className="mr-2 h-4 w-4" /> Demander remboursement</Button></div>
                  {selectedOrder.paymentStatus !== "paid" && <p className="mt-3 text-xs text-slate-500">L’acceptation est disponible uniquement après la confirmation d’un paiement réel. Les paiements ne sont pas encore activés sur MAZIGHO.</p>}
                  <div className="mt-4 border-t border-blue-100 pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Historique des décisions</p>{isLoadingDecisions ? <Skeleton className="h-8 w-full" /> : orderDecisions?.length ? <div className="space-y-2">{orderDecisions.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs"><div className="flex min-w-0 items-center gap-2"><Badge variant="outline" className={decisionMeta[item.action as DecisionAction].className}>{decisionMeta[item.action as DecisionAction].label}</Badge>{item.reason && <span className="truncate text-slate-600">{item.reason}</span>}</div><span className="text-slate-500">{formatDate(item.createdAt)}</span></div>)}</div> : <p className="text-xs text-slate-500">Aucune décision enregistrée.</p>}</div>
                </div>

                <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                  <div className="grid gap-2"><Label htmlFor="status">Statut de la commande</Label><Select value={status} onValueChange={value => setStatus(value as OrderStatus)} disabled={selectedOrder.status === "pending"}><SelectTrigger id="status"><SelectValue /></SelectTrigger><SelectContent>{statuses.filter(value => value !== "all").map(value => <SelectItem key={value} value={value}>{statusMeta[value as OrderStatus].label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid gap-2"><Label htmlFor="tracking">Numéro de suivi</Label><div className="relative"><Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="tracking" value={trackingNumber} onChange={event => setTrackingNumber(event.target.value)} placeholder="Ex. CH123456789" className="pl-9" /></div></div>
                </div>
              </div>

              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)}>Fermer</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={updateStatus.isPending || selectedOrder.status === "pending"}>{updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer le suivi</Button></DialogFooter>
            </form>}
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(sandboxOrderId)} onOpenChange={open => { if (!open) { setSandboxOrderId(null); setSandboxConfirmation(""); } }}>
          <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Préparer chez CJ en environnement de test</DialogTitle><DialogDescription>MAZIGHO revalidera le stock, la variante, le transport et l’adresse avant de créer une commande CJ sandbox sans débit. Aucun paiement fournisseur et aucune expédition réelle ne peuvent être déclenchés.</DialogDescription></DialogHeader><div className="grid gap-4 py-3"><div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950"><ShieldCheck className="mr-2 inline h-4 w-4" /> Vérification humaine obligatoire avant le test.</div><div className="grid gap-2"><Label htmlFor="sandbox-confirmation">Pour confirmer, saisissez exactement :</Label><code className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-900">{sandboxOrderId ? `TEST CJ #${sandboxOrderId}` : ""}</code><Input id="sandbox-confirmation" value={sandboxConfirmation} onChange={event => setSandboxConfirmation(event.target.value)} autoComplete="off" placeholder="Texte de confirmation" /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setSandboxOrderId(null)}>Annuler</Button><Button type="button" disabled={prepareCjSandbox.isPending || sandboxConfirmation !== (sandboxOrderId ? `TEST CJ #${sandboxOrderId}` : "")} className="bg-indigo-700 hover:bg-indigo-800" onClick={submitSandboxPreparation}>{prepareCjSandbox.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lancer le test sans débit</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={Boolean(decisionTarget)} onOpenChange={open => { if (!open) { setDecisionTarget(null); setDecisionReason(""); setDecisionConfirmation(""); } }}>
          <DialogContent className="sm:max-w-md">{decisionTarget && <><DialogHeader><DialogTitle>{decisionMeta[decisionTarget.action].label} — commande #{decisionTarget.orderId}</DialogTitle><DialogDescription>{decisionTarget.action === "accepted" ? "La commande passera en préparation interne. Aucun fournisseur ne sera contacté et aucun paiement CJ ne sera exécuté." : decisionTarget.action === "rejected" ? "La commande sera annulée dans MAZIGHO. Aucun fournisseur ne sera contacté." : "Une demande interne sera enregistrée. Aucun remboursement réel ne sera exécuté tant que le prestataire de paiement n’est pas connecté."}</DialogDescription></DialogHeader><div className="grid gap-4 py-3"><div className="grid gap-2"><Label htmlFor="decision-reason">Motif interne (facultatif)</Label><Input id="decision-reason" value={decisionReason} maxLength={500} onChange={event => setDecisionReason(event.target.value)} placeholder="Ex. stock non confirmé" /></div>{decisionTarget.action !== "accepted" && <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><Label htmlFor="decision-confirmation">Pour confirmer, saisissez exactement :</Label><code className="rounded bg-white px-2 py-1 text-sm text-slate-900">{decisionTarget.action === "rejected" ? `REFUSER #${decisionTarget.orderId}` : `REMBOURSER #${decisionTarget.orderId}`}</code><Input id="decision-confirmation" value={decisionConfirmation} onChange={event => setDecisionConfirmation(event.target.value)} autoComplete="off" placeholder="Texte de confirmation" /></div>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => setDecisionTarget(null)}>Annuler</Button><Button type="button" disabled={decide.isPending || (decisionTarget.action !== "accepted" && decisionConfirmation !== (decisionTarget.action === "rejected" ? `REFUSER #${decisionTarget.orderId}` : `REMBOURSER #${decisionTarget.orderId}`))} className={decisionTarget.action === "accepted" ? "bg-emerald-600 hover:bg-emerald-700" : decisionTarget.action === "rejected" ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"} onClick={submitDecision}>{decide.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{decisionTarget.action === "accepted" ? "Confirmer l’acceptation" : decisionTarget.action === "rejected" ? "Confirmer le refus" : "Enregistrer la demande"}</Button></DialogFooter></>}</DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
