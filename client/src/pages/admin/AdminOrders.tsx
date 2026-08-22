import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingBag, Loader2, Truck, CheckCircle, XCircle } from "lucide-react";
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
import { toast } from "sonner";

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const { data: orders, isLoading, refetch } = trpc.admin.orders.getAll.useQuery();
  
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut de la commande mis à jour");
      setIsDetailsOpen(false);
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const handleOpenDetails = (order: any) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatus.mutate({
      id: selectedOrder.id,
      status: status as any,
      trackingNumber: trackingNumber || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      case "processing": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En cours</Badge>;
      case "shipped": return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Expédiée</Badge>;
      case "delivered": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Livrée</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Annulée</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Suivez et gérez les commandes de vos clients.</p>
        </div>

        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucune commande trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <ShoppingBag className="h-4 w-4 text-blue-500" />
                        </div>
                        #{order.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.userName || "Client inconnu"}</span>
                        <span className="text-xs text-muted-foreground">{order.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{(order.totalAmount / 100).toFixed(2)} €</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetails(order)}>
                        <Eye className="mr-2 h-4 w-4" /> Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedOrder && (
              <form onSubmit={handleUpdateStatus}>
                <DialogHeader>
                  <DialogTitle>Commande #{selectedOrder.id}</DialogTitle>
                  <DialogDescription>
                    Détails et mise à jour du statut de la commande.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Client</p>
                      <p className="font-medium">{selectedOrder.userName}</p>
                      <p className="text-xs">{selectedOrder.userEmail}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-muted-foreground">Montant Total</p>
                      <p className="font-bold text-lg">{(selectedOrder.totalAmount / 100).toFixed(2)} €</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Statut de la commande</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="processing">En cours</SelectItem>
                          <SelectItem value="shipped">Expédiée</SelectItem>
                          <SelectItem value="delivered">Livrée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tracking">Numéro de suivi (optionnel)</Label>
                      <div className="relative">
                        <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="tracking" 
                          value={trackingNumber} 
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="ex: FR123456789"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex sm:justify-between gap-2">
                  <div className="flex gap-2">
                    {status === "delivered" && <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="mr-1 h-3 w-3" /> Livrée</Badge>}
                    {status === "cancelled" && <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="mr-1 h-3 w-3" /> Annulée</Badge>}
                  </div>
                  <Button type="submit" disabled={updateStatus.isPending}>
                    {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mettre à jour
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
