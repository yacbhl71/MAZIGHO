import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Ban, RefreshCw, ShieldCheck, ShieldAlert, Users, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type PartnerRow = { id: number; name: string; email: string | false; phone: string | false; city: string | false };

const ORDER_STATE_LABELS: Record<string, string> = {
  draft: "Devis", sent: "Devis envoyé", sale: "Confirmée", done: "Terminée", cancel: "Annulée",
};

export default function AdminOdoo() {
  const utils = trpc.useUtils();
  const statusQuery = trpc.admin.odoo.status.useQuery();
  const partnersQuery = trpc.admin.odoo.partners.useQuery();
  const ordersQuery = trpc.admin.odoo.orders.useQuery();

  const [verified, setVerified] = useState<boolean | null>(null);
  const verify = trpc.admin.odoo.verify.useMutation({
    onSuccess: (result) => { setVerified(result.verified); result.verified ? toast.success("Connexion Odoo vérifiée.") : toast.message(result.message); },
    onError: () => { setVerified(false); toast.error("Vérification Odoo impossible."); },
  });

  const [partnerDialog, setPartnerDialog] = useState<{ mode: "create" | "edit"; row?: PartnerRow } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  useEffect(() => {
    if (partnerDialog?.mode === "edit" && partnerDialog.row) {
      setForm({ name: partnerDialog.row.name || "", email: partnerDialog.row.email || "", phone: partnerDialog.row.phone || "" });
    } else if (partnerDialog?.mode === "create") {
      setForm({ name: "", email: "", phone: "" });
    }
  }, [partnerDialog]);

  const createPartner = trpc.admin.odoo.createPartner.useMutation({
    onSuccess: async () => { toast.success("Client créé dans Odoo."); setPartnerDialog(null); await utils.admin.odoo.partners.invalidate(); },
    onError: (e) => toast.error(e.message === "ODOO_NOT_CONFIGURED" ? "Odoo n'est pas configuré (variables ODOO_* manquantes)." : e.message),
  });
  const updatePartner = trpc.admin.odoo.updatePartner.useMutation({
    onSuccess: async () => { toast.success("Client mis à jour dans Odoo."); setPartnerDialog(null); await utils.admin.odoo.partners.invalidate(); },
    onError: (e) => toast.error(e.message === "ODOO_NOT_CONFIGURED" ? "Odoo n'est pas configuré (variables ODOO_* manquantes)." : e.message),
  });
  const cancelOrder = trpc.admin.odoo.cancelOrder.useMutation({
    onSuccess: async () => { toast.success("Commande annulée dans Odoo."); await utils.admin.odoo.orders.invalidate(); },
    onError: (e) => toast.error(e.message === "ODOO_NOT_CONFIGURED" ? "Odoo n'est pas configuré (variables ODOO_* manquantes)." : e.message),
  });

  const configured = statusQuery.data?.configured ?? false;
  const isConnected = verified === true || (verified === null && configured);
  const savePartner = () => {
    if (!form.name.trim()) { toast.error("Le nom est requis."); return; }
    if (partnerDialog?.mode === "edit" && partnerDialog.row) {
      updatePartner.mutate({ id: partnerDialog.row.id, name: form.name, email: form.email, phone: form.phone });
    } else {
      createPartner.mutate({ name: form.name, email: form.email || undefined, phone: form.phone || undefined });
    }
  };

  const partners = partnersQuery.data?.partners ?? [];
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="odoo-tracking-page">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Suivi Odoo</h1>
          <p className="text-muted-foreground">Supervisez la synchronisation ERP : statut de connexion, clients et commandes Odoo, et actions directes depuis MAZIGHO.</p>
        </div>

        {/* Connection status */}
        <section className={`rounded-2xl border p-5 shadow-sm ${isConnected ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60"}`} data-testid="odoo-connection-status">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${isConnected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {isConnected ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`} data-testid="odoo-status-dot" />
                  <span className="font-semibold text-slate-900" data-testid="odoo-status-text">{isConnected ? "Connecté à Odoo" : configured ? "Configuré — connexion à vérifier" : "Déconnecté — variables ODOO_* manquantes"}</span>
                </div>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">{verify.data?.message || statusQuery.data?.message || "Lecture du statut…"}</p>
                {statusQuery.data?.url && <p className="mt-1 text-xs text-slate-500">{statusQuery.data.url}{statusQuery.data.db ? ` · base ${statusQuery.data.db}` : ""}</p>}
              </div>
            </div>
            <Button onClick={() => verify.mutate()} disabled={verify.isPending} className={isConnected ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} data-testid="odoo-verify-btn">
              {verify.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Tester la connexion
            </Button>
          </div>
        </section>

        {/* Partners */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Users className="h-5 w-5 text-emerald-600" /> Clients synchronisés ({partners.length})</h2>
            <Button onClick={() => setPartnerDialog({ mode: "create" })} className="bg-emerald-600 hover:bg-emerald-700" data-testid="odoo-add-partner-btn"><Plus className="mr-2 h-4 w-4" /> Ajouter un client</Button>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nom</TableHead><TableHead>E-mail</TableHead><TableHead>Téléphone</TableHead><TableHead>Ville</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {partnersQuery.isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                ) : partners.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground" data-testid="odoo-partners-empty">{configured ? "Aucun client Odoo pour le moment." : "Odoo non configuré : ajoutez les variables ODOO_* dans Vercel pour voir les clients."}</TableCell></TableRow>
                ) : partners.map((p) => (
                  <TableRow key={p.id} data-testid={`odoo-partner-row-${p.id}`}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.email || "—"}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell>{p.city || "—"}</TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setPartnerDialog({ mode: "edit", row: p })} data-testid={`odoo-edit-partner-${p.id}`}><Pencil className="mr-1 h-4 w-4" /> Modifier</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Orders */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShoppingCart className="h-5 w-5 text-emerald-600" /> Commandes synchronisées ({orders.length})</h2>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Référence</TableHead><TableHead>Client</TableHead><TableHead>Réf. MAZIGHO</TableHead><TableHead>Montant</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {ordersQuery.isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground" data-testid="odoo-orders-empty">{configured ? "Aucune commande Odoo pour le moment." : "Odoo non configuré : les commandes payées apparaîtront ici une fois les variables ODOO_* ajoutées."}</TableCell></TableRow>
                ) : orders.map((o) => (
                  <TableRow key={o.id} data-testid={`odoo-order-row-${o.id}`}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>{Array.isArray(o.partner_id) ? o.partner_id[1] : "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{o.client_order_ref || "—"}</TableCell>
                    <TableCell>{(o.amount_total ?? 0).toFixed(2)} CHF</TableCell>
                    <TableCell><Badge variant={o.state === "cancel" ? "destructive" : o.state === "sale" || o.state === "done" ? "default" : "secondary"}>{ORDER_STATE_LABELS[o.state] || o.state}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={o.state === "cancel" || cancelOrder.isPending} onClick={() => cancelOrder.mutate({ id: o.id })} data-testid={`odoo-cancel-order-${o.id}`}><Ban className="mr-1 h-4 w-4" /> Annuler</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <Dialog open={Boolean(partnerDialog)} onOpenChange={(open) => !open && setPartnerDialog(null)}>
        <DialogContent className="sm:max-w-md" data-testid="odoo-partner-dialog">
          <DialogHeader><DialogTitle>{partnerDialog?.mode === "edit" ? "Modifier le client Odoo" : "Ajouter un client Odoo"}</DialogTitle><DialogDescription>Les modifications sont appliquées directement dans Odoo (res.partner).</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="odoo-name">Nom *</Label><Input id="odoo-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="odoo-partner-name" /></div>
            <div className="space-y-2"><Label htmlFor="odoo-email">E-mail</Label><Input id="odoo-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="odoo-partner-email" /></div>
            <div className="space-y-2"><Label htmlFor="odoo-phone">Téléphone</Label><Input id="odoo-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="odoo-partner-phone" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPartnerDialog(null)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={savePartner} disabled={createPartner.isPending || updatePartner.isPending} data-testid="odoo-partner-save">
              {(createPartner.isPending || updatePartner.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
