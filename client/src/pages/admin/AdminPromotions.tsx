import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Loader2, Percent, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

 type PromotionForm = {
  code: string;
  type: "percent" | "fixed";
  value: string;
  minOrderAmount: string;
  maxUses: string;
  active: number;
  startsAt: string;
  expiresAt: string;
};

const emptyForm: PromotionForm = {
  code: "",
  type: "percent",
  value: "10",
  minOrderAmount: "",
  maxUses: "",
  active: 1,
  startsAt: "",
  expiresAt: "",
};

function dateForInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-CH");
}

export default function AdminPromotions() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const promotionsQuery = trpc.admin.promotions.getAll.useQuery();
  const promotions = promotionsQuery.data ?? [];

  const createPromotion = trpc.admin.promotions.create.useMutation({
    onSuccess: async () => { toast.success("Code promo créé"); setIsOpen(false); await promotionsQuery.refetch(); },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });
  const updatePromotion = trpc.admin.promotions.update.useMutation({
    onSuccess: async () => { toast.success("Code promo mis à jour"); setIsOpen(false); await promotionsQuery.refetch(); },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });
  const deletePromotion = trpc.admin.promotions.delete.useMutation({
    onSuccess: async () => { toast.success("Code promo supprimé"); await promotionsQuery.refetch(); },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const updateField = <K extends keyof PromotionForm>(key: K, value: PromotionForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit = (promotion: (typeof promotions)[number]) => {
    setEditingId(promotion.id);
    setForm({
      code: promotion.code,
      type: promotion.type,
      value: String(promotion.value),
      minOrderAmount: promotion.minOrderAmount == null ? "" : String(promotion.minOrderAmount),
      maxUses: promotion.maxUses == null ? "" : String(promotion.maxUses),
      active: promotion.active,
      startsAt: dateForInput(promotion.startsAt),
      expiresAt: dateForInput(promotion.expiresAt),
    });
    setIsOpen(true);
  };

  const buildPayload = () => {
    const value = Number(form.value);
    const minOrderAmount = form.minOrderAmount.trim() ? Number(form.minOrderAmount) : undefined;
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : undefined;
    if (!form.code.trim() || !Number.isInteger(value) || value <= 0 || (form.type === "percent" && value > 100)) {
      toast.error(form.type === "percent" ? "Saisissez un pourcentage entre 1 et 100" : "Saisissez une remise fixe valide en centimes");
      return null;
    }
    if (minOrderAmount !== undefined && (!Number.isInteger(minOrderAmount) || minOrderAmount < 0)) { toast.error("Le minimum de commande est invalide"); return null; }
    if (maxUses !== undefined && (!Number.isInteger(maxUses) || maxUses <= 0)) { toast.error("Le nombre maximal d'utilisations est invalide"); return null; }
    const startsAt = form.startsAt ? new Date(form.startsAt) : undefined;
    const expiresAt = form.expiresAt ? new Date(form.expiresAt) : undefined;
    if (startsAt && Number.isNaN(startsAt.getTime())) { toast.error("La date de début est invalide"); return null; }
    if (expiresAt && Number.isNaN(expiresAt.getTime())) { toast.error("La date de fin est invalide"); return null; }
    if (startsAt && expiresAt && expiresAt <= startsAt) { toast.error("La date de fin doit être après la date de début"); return null; }
    return { code: form.code.trim().toUpperCase(), type: form.type, value, minOrderAmount, maxUses, active: form.active, startsAt, expiresAt };
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    if (editingId === null) createPromotion.mutate(payload);
    else updatePromotion.mutate({ id: editingId, ...payload });
  };

  const isSaving = createPromotion.isPending || updatePromotion.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-medium text-orange-600">Marketing et fidélisation</p><h1 className="text-3xl font-bold tracking-tight">Codes promo</h1><p className="text-muted-foreground">Créez des remises en pourcentage ou en CHF pour vos clients.</p></div>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nouveau code</Button>
        </div>
        <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground"><strong>Règle de saisie :</strong> une remise fixe est exprimée en centimes CHF (ex. 500 = 5,00 CHF), tandis qu'une remise en pourcentage est saisie directement (ex. 10 = 10 %).</div>
        <div className="overflow-hidden rounded-lg border bg-white">
          <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Remise</TableHead><TableHead>Minimum</TableHead><TableHead>Utilisations</TableHead><TableHead>Validité</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {promotionsQuery.isLoading ? <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow> : promotionsQuery.error ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-red-600">Impossible de charger les codes : {promotionsQuery.error.message}</TableCell></TableRow> : promotions.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Aucun code promo configuré.</TableCell></TableRow> : promotions.map((promotion) => <TableRow key={promotion.id}><TableCell className="font-mono font-semibold">{promotion.code}</TableCell><TableCell>{promotion.type === "percent" ? `${promotion.value} %` : `${(promotion.value / 100).toFixed(2)} CHF`}</TableCell><TableCell>{promotion.minOrderAmount == null ? "—" : `${(promotion.minOrderAmount / 100).toFixed(2)} CHF`}</TableCell><TableCell>{promotion.usedCount}{promotion.maxUses == null ? "" : ` / ${promotion.maxUses}`}</TableCell><TableCell className="text-sm">{formatDate(promotion.startsAt)} → {formatDate(promotion.expiresAt)}</TableCell><TableCell><Badge variant={promotion.active ? "default" : "secondary"}>{promotion.active ? "Actif" : "Inactif"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => updatePromotion.mutate({ id: promotion.id, code: promotion.code, type: promotion.type, value: promotion.value, minOrderAmount: promotion.minOrderAmount ?? undefined, maxUses: promotion.maxUses ?? undefined, active: promotion.active ? 0 : 1, startsAt: promotion.startsAt ?? undefined, expiresAt: promotion.expiresAt ?? undefined })}> {promotion.active ? "Désactiver" : "Activer"}</Button><Button variant="outline" size="icon" title="Modifier" onClick={() => openEdit(promotion)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="text-red-600" title="Supprimer" onClick={() => { if (window.confirm(`Supprimer le code ${promotion.code} ?`)) deletePromotion.mutate(promotion.id); }}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingId === null ? "Nouveau code promo" : "Modifier le code promo"}</DialogTitle><DialogDescription>Définissez les conditions de la remise. Les montants sont en centimes CHF.</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="promo-code">Code *</Label><Input id="promo-code" value={form.code} onChange={(event) => updateField("code", event.target.value)} placeholder="BIENVENUE" /></div><div className="space-y-2"><Label htmlFor="promo-type">Type</Label><select id="promo-type" className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={form.type} onChange={(event) => updateField("type", event.target.value as PromotionForm["type"])}><option value="percent">Pourcentage</option><option value="fixed">Montant fixe</option></select></div></div><div className="space-y-2"><Label htmlFor="promo-value">Valeur {form.type === "percent" ? "(%)" : "(centimes CHF)"} *</Label><Input id="promo-value" type="number" min="1" max={form.type === "percent" ? "100" : undefined} value={form.value} onChange={(event) => updateField("value", event.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="promo-min">Minimum de commande (centimes)</Label><Input id="promo-min" type="number" min="0" value={form.minOrderAmount} onChange={(event) => updateField("minOrderAmount", event.target.value)} placeholder="10000" /></div><div className="space-y-2"><Label htmlFor="promo-max">Nombre maximal d'utilisations</Label><Input id="promo-max" type="number" min="1" value={form.maxUses} onChange={(event) => updateField("maxUses", event.target.value)} placeholder="Illimité" /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="promo-start">Début</Label><Input id="promo-start" type="datetime-local" value={form.startsAt} onChange={(event) => updateField("startsAt", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="promo-end">Fin</Label><Input id="promo-end" type="datetime-local" value={form.expiresAt} onChange={(event) => updateField("expiresAt", event.target.value)} /></div></div><div className="flex items-center justify-between rounded-md border p-3"><div><Label>Code actif</Label><p className="text-xs text-muted-foreground">Le code peut être conservé sans être utilisable.</p></div><Button type="button" variant={form.active ? "default" : "outline"} onClick={() => updateField("active", form.active ? 0 : 1)}><Percent className="mr-2 h-4 w-4" />{form.active ? "Actif" : "Inactif"}</Button></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}
