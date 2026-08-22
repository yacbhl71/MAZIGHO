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

  const { data: orders, isLoading, refetch } = trpc.admin.orders.getAll.useQuery();
  const { data: orderItems, isLoading: isLoadingItems } = trpc.admin.orders.getItems.useQuery(
    { orderId: selectedOrder?.id ?? 0 },
    { enabled: Boolean(selectedOrder?.id && isDetailsOpen) }
  );

  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: async () => {
      toast.success("Commande mise à jour");
      setIsDetailsOpen(false);
      await refetch();
    },
    onError: error => toast.error(error.message || "Mise à jour impossible."),
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
                  <TableHead>Suivi</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}>{Array.from({ length: 7 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-16 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><div className="rounded-full bg-blue-50 p-4 text-blue-600"><ShoppingBag className="h-7 w-7" /></div><p className="mt-4 font-semibold text-slate-800">Aucune commande trouvée</p><p className="mt-1 text-sm text-muted-foreground">Modifiez votre recherche ou attendez les premières commandes de la boutique.</p></div></TableCell></TableRow>
                ) : filteredOrders.map(order => (
                  <TableRow key={order.id} className="hover:bg-slate-50/70">
                    <TableCell><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><ShoppingBag className="h-4 w-4" /></div><div><p className="font-semibold text-slate-900">#{order.id}</p><p className="text-xs text-muted-foreground">{formatPrice(order.totalAmount)}</p></div></div></TableCell>
                    <TableCell><p className="font-medium text-slate-900">{order.userName || "Client MAZIGHO"}</p><p className="text-xs text-muted-foreground">{order.userEmail || "—"}</p></TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-sm text-slate-700"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{formatDate(order.createdAt)}</div></TableCell>
                    <TableCell><Badge variant="outline" className={order.paymentStatus === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}>{order.paymentStatus === "paid" ? "Payée" : order.paymentStatus === "refunded" ? "Remboursée" : "À régler"}</Badge></TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
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

                <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                  <div className="grid gap-2"><Label htmlFor="status">Statut de la commande</Label><Select value={status} onValueChange={value => setStatus(value as OrderStatus)}><SelectTrigger id="status"><SelectValue /></SelectTrigger><SelectContent>{statuses.filter(value => value !== "all").map(value => <SelectItem key={value} value={value}>{statusMeta[value as OrderStatus].label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid gap-2"><Label htmlFor="tracking">Numéro de suivi</Label><div className="relative"><Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="tracking" value={trackingNumber} onChange={event => setTrackingNumber(event.target.value)} placeholder="Ex. CH123456789" className="pl-9" /></div></div>
                </div>
              </div>

              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)}>Fermer</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={updateStatus.isPending}>{updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer le suivi</Button></DialogFooter>
            </form>}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
