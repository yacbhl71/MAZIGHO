import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Loader2, Percent, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { centsToChfInput, parseChfToCents } from "@/lib/moneyInput";

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

function promotionState(promotion: { active: number; startsAt: Date | string | null; expiresAt: Date | string | null; maxUses: number | null; usedCount: number }) {
  const now = new Date();
  if (!promotion.active) return { label: "Désactivé", className: "bg-slate-100 text-slate-700" };
  if (promotion.expiresAt && new Date(promotion.expiresAt) < now) return { label: "Expiré", className: "bg-rose-100 text-rose-800" };
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return { label: "Planifié", className: "bg-blue-100 text-blue-800" };
  if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) return { label: "Épuisé", className: "bg-amber-100 text-amber-800" };
  return { label: "Actif", className: "bg-emerald-100 text-emerald-800" };
}

export default function AdminPromotions() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const promotionsQuery = trpc.admin.promotions.getAll.useQuery();
  const promotions = promotionsQuery.data ?? [];
  const promotionSummary = useMemo(() => ({
    active: promotions.filter(promotion => promotionState(promotion).label === "Actif").length,
    scheduled: promotions.filter(promotion => promotionState(promotion).label === "Planifié").length,
    uses: promotions.reduce((total, promotion) => total + promotion.usedCount, 0),
  }), [promotions]);

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
      value: promotion.type === "fixed" ? centsToChfInput(promotion.value) : String(promotion.value),
      minOrderAmount: promotion.minOrderAmount == null ? "" : centsToChfInput(promotion.minOrderAmount),
      maxUses: promotion.maxUses == null ? "" : String(promotion.maxUses),
      active: promotion.active,
      startsAt: dateForInput(promotion.startsAt),
      expiresAt: dateForInput(promotion.expiresAt),
    });
    setIsOpen(true);
  };

  const buildPayload = () => {
    const value = form.type === "fixed" ? parseChfToCents(form.value) : Number(form.value);
    const minOrderAmount = form.minOrderAmount.trim() ? parseChfToCents(form.minOrderAmount) : undefined;
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : undefined;
    if (!form.code.trim() || value == null || !Number.isInteger(value) || value <= 0 || (form.type === "percent" && value > 100)) {
      toast.error(form.type === "percent" ? "Saisissez un pourcentage entre 1 et 100" : "Saisissez une remise fixe valide en CHF");
      return null;
    }
    if (minOrderAmount !== undefined && (minOrderAmount == null || !Number.isInteger(minOrderAmount) || minOrderAmount < 0)) { toast.error("Le minimum de commande est invalide"); return null; }
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
        <section className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-700"><Ticket className="h-4 w-4" /> Marketing et fidélisation</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Codes promo</h1><p className="mt-2 text-slate-600">Créez, planifiez et contrôlez vos offres destinées aux clients MAZIGHO.</p></div>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nouveau code</Button>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offres actives</p><p className="mt-1 text-2xl font-bold text-emerald-700">{promotionSummary.active}</p><p className="mt-1 text-xs text-muted-foreground">Disponibles actuellement</p></div><div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offres planifiées</p><p className="mt-1 text-2xl font-bold text-blue-700">{promotionSummary.scheduled}</p><p className="mt-1 text-xs text-muted-foreground">Démarreront à une date définie</p></div><div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilisations</p><p className="mt-1 text-2xl font-bold text-orange-700">{promotionSummary.uses}</p><p className="mt-1 text-xs text-muted-foreground">Toutes les offres confondues</p></div></section>
        <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-sm text-slate-700"><strong>Règle de saisie :</strong> une remise fixe est exprimée en CHF (ex. 5,00 ou 5.00), tandis qu'une remise en pourcentage est saisie directement (ex. 10 = 10 %).</div>
        <div className="overflow-hidden rounded-lg border bg-white">
          <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Remise</TableHead><TableHead>Minimum</TableHead><TableHead>Performance</TableHead><TableHead>Validité</TableHead><TableHead>Statut réel</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {promotionsQuery.isLoading ? <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow> : promotionsQuery.error ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-red-600">Impossible de charger les codes : {promotionsQuery.error.message}</TableCell></TableRow> : promotions.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Aucun code promo configuré.</TableCell></TableRow> : promotions.map((promotion) => <TableRow key={promotion.id}><TableCell className="font-mono font-semibold">{promotion.code}</TableCell><TableCell>{promotion.type === "percent" ? `${promotion.value} %` : `${(promotion.value / 100).toFixed(2)} CHF`}</TableCell><TableCell>{promotion.minOrderAmount == null ? "—" : `${(promotion.minOrderAmount / 100).toFixed(2)} CHF`}</TableCell><TableCell><div><p className="font-medium">{promotion.usedCount}{promotion.maxUses == null ? " utilisation(s)" : ` / ${promotion.maxUses}`}</p>{promotion.maxUses !== null && <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (promotion.usedCount / promotion.maxUses) * 100)}%` }} /></div>}</div></TableCell><TableCell className="text-sm">{formatDate(promotion.startsAt)} → {formatDate(promotion.expiresAt)}</TableCell><TableCell>{(() => { const state = promotionState(promotion); return <Badge className={`border-0 ${state.className}`}>{state.label}</Badge>; })()}</TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => updatePromotion.mutate({ id: promotion.id, code: promotion.code, type: promotion.type, value: promotion.value, minOrderAmount: promotion.minOrderAmount ?? undefined, maxUses: promotion.maxUses ?? undefined, active: promotion.active ? 0 : 1, startsAt: promotion.startsAt ?? undefined, expiresAt: promotion.expiresAt ?? undefined })}> {promotion.active ? "Désactiver" : "Activer"}</Button><Button variant="outline" size="icon" title="Modifier" onClick={() => openEdit(promotion)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="text-red-600" title="Supprimer" onClick={() => { if (window.confirm(`Supprimer le code ${promotion.code} ?`)) deletePromotion.mutate(promotion.id); }}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingId === null ? "Nouveau code promo" : "Modifier le code promo"}</DialogTitle><DialogDescription>Définissez les conditions de la remise. Les montants sont en CHF ; vous pouvez utiliser une virgule ou un point.</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="promo-code">Code *</Label><Input id="promo-code" value={form.code} onChange={(event) => updateField("code", event.target.value)} placeholder="BIENVENUE" /></div><div className="space-y-2"><Label htmlFor="promo-type">Type</Label><select id="promo-type" className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={form.type} onChange={(event) => updateField("type", event.target.value as PromotionForm["type"])}><option value="percent">Pourcentage</option><option value="fixed">Montant fixe</option></select></div></div><div className="space-y-2"><Label htmlFor="promo-value">Valeur {form.type === "percent" ? "(%)" : "(CHF)"} *</Label><Input id="promo-value" type={form.type === "percent" ? "number" : "text"} inputMode={form.type === "percent" ? "numeric" : "decimal"} min="1" max={form.type === "percent" ? "100" : undefined} placeholder={form.type === "percent" ? "10" : "5,00"} value={form.value} onChange={(event) => updateField("value", event.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="promo-min">Minimum de commande (CHF)</Label><Input id="promo-min" type="text" inputMode="decimal" min="0" value={form.minOrderAmount} onChange={(event) => updateField("minOrderAmount", event.target.value)} placeholder="100,00" /></div><div className="space-y-2"><Label htmlFor="promo-max">Nombre maximal d'utilisations</Label><Input id="promo-max" type="number" min="1" value={form.maxUses} onChange={(event) => updateField("maxUses", event.target.value)} placeholder="Illimité" /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="promo-start">Début</Label><Input id="promo-start" type="datetime-local" value={form.startsAt} onChange={(event) => updateField("startsAt", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="promo-end">Fin</Label><Input id="promo-end" type="datetime-local" value={form.expiresAt} onChange={(event) => updateField("expiresAt", event.target.value)} /></div></div><div className="flex items-center justify-between rounded-md border p-3"><div><Label>Code actif</Label><p className="text-xs text-muted-foreground">Le code peut être conservé sans être utilisable.</p></div><Button type="button" variant={form.active ? "default" : "outline"} onClick={() => updateField("active", form.active ? 0 : 1)}><Percent className="mr-2 h-4 w-4" />{form.active ? "Actif" : "Inactif"}</Button></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}
