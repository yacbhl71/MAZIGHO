import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StaffWorkspaceLayout from "@/components/StaffWorkspaceLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";

const statusLabels = { processing: "En préparation", shipped: "Expédiée" } as const;

export default function StaffOrders() {
  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.staff.operations.getOrders.useQuery();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: items = [] } = trpc.staff.operations.getOrderItems.useQuery({ orderId: selectedOrderId || 0 }, { enabled: Boolean(selectedOrderId) });
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const updateTracking = trpc.staff.operations.updateTracking.useMutation({
    onSuccess: async () => { toast.success("Suivi opérationnel enregistré."); await utils.staff.operations.getOrders.invalidate(); },
    onError: error => toast.error(error.message || "Mise à jour impossible."),
  });

  return <StaffWorkspaceLayout role="order_operator"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-orange-600" />Commandes à suivre</CardTitle><CardDescription>Seules les commandes déjà acceptées par l’administrateur apparaissent ici. Les montants, paiements, adresses et décisions restent masqués.</CardDescription></CardHeader><CardContent className="space-y-4">{isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : orders.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">Aucune commande opérationnelle à suivre.</p> : orders.map(order => <article key={order.id} className="rounded-xl border p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">Commande #{order.id}</p><Badge variant={order.status === "shipped" ? "default" : "secondary"}>{statusLabels[order.status as keyof typeof statusLabels]}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Dernière mise à jour : {new Date(order.updatedAt).toLocaleDateString("fr-CH")}</p>{order.trackingNumber && <p className="mt-1 text-sm text-slate-700">Suivi : {order.trackingNumber}</p>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}><PackageCheck className="mr-2 h-4 w-4" />{selectedOrderId === order.id ? "Masquer les articles" : "Voir les articles"}</Button>{order.status === "processing" && <div className="flex items-end gap-2"><div><Label className="text-xs">Numéro de suivi</Label><Input value={tracking[order.id] ?? order.trackingNumber ?? ""} onChange={event => setTracking({ ...tracking, [order.id]: event.target.value })} className="mt-1 h-9 w-44" placeholder="Optionnel" /></div><Button size="sm" className="bg-orange-600 hover:bg-orange-700" disabled={updateTracking.isPending} onClick={() => updateTracking.mutate({ id: order.id, status: "shipped", trackingNumber: tracking[order.id] ?? order.trackingNumber ?? undefined })}><Truck className="mr-2 h-4 w-4" />Marquer expédiée</Button></div>}{order.status === "shipped" && <Button size="sm" variant="outline" disabled={updateTracking.isPending} onClick={() => updateTracking.mutate({ id: order.id, status: "delivered" })}>Marquer livrée</Button>}</div></div>{selectedOrderId === order.id && <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="mb-2 text-sm font-medium">Articles de la commande</p>{items.length === 0 ? <p className="text-sm text-muted-foreground">Aucun article disponible.</p> : <ul className="space-y-1 text-sm text-slate-700">{items.map(item => <li key={item.id}>{item.quantity} × {item.productName || "Produit"}</li>)}</ul>}</div>}</article>)}</CardContent></Card></StaffWorkspaceLayout>;
}
