import { type FormEvent, useMemo, useState } from "react";
import { CalendarClock, Edit3, Loader2, Percent, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { centsToChfInput, parseChfToCents } from "@/lib/moneyInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PromotionScope = "all" | "first_order" | "category";

type PromotionForm = {
  code: string;
  type: "percent" | "fixed";
  value: string;
  minOrderAmount: string;
  maxUses: string;
  active: 0 | 1;
  scope: PromotionScope;
  categoryId: string;
  perUserLimit: string;
  startsAt: string;
  expiresAt: string;
};

type OwnerPromotion = {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  active: number;
  scope: PromotionScope | null;
  categoryId: number | null;
  categoryName: string | null;
  perUserLimit: number | null;
  startsAt: Date | string | null;
  expiresAt: Date | string | null;
  redemptionCount: number;
};

const emptyForm: PromotionForm = {
  code: "",
  type: "percent",
  value: "10",
  minOrderAmount: "",
  maxUses: "",
  active: 1,
  scope: "all",
  categoryId: "",
  perUserLimit: "",
  startsAt: "",
  expiresAt: "",
};

const scopePresentation: Record<PromotionScope, { label: string; className: string }> = {
  all: { label: "Tout le panier", className: "border-slate-200 bg-slate-100 text-slate-700" },
  first_order: { label: "Premier achat", className: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  category: { label: "Catégorie", className: "border-teal-200 bg-teal-50 text-teal-800" },
};

function dateForInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sans limite";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-CH");
}

function promotionState(promotion: OwnerPromotion) {
  const now = Date.now();
  if (!promotion.active) return { label: "Désactivé", className: "border-slate-200 bg-slate-100 text-slate-700" };
  if (promotion.expiresAt && new Date(promotion.expiresAt).getTime() < now) return { label: "Expiré", className: "border-rose-200 bg-rose-50 text-rose-800" };
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now) return { label: "Planifié", className: "border-sky-200 bg-sky-50 text-sky-800" };
  if (promotion.maxUses !== null && promotion.redemptionCount >= promotion.maxUses) return { label: "Épuisé", className: "border-amber-200 bg-amber-50 text-amber-900" };
  return { label: "Actif", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
}

export default function OwnerPromotionCenter({ categories, canManage, currencyCode }: { categories: Array<{ id: number; name: string }>; canManage: boolean; currencyCode: string }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const promotionsQuery = trpc.owner.getPromotions.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const promotions = (promotionsQuery.data ?? []) as OwnerPromotion[];

  const createPromotion = trpc.owner.createPromotion.useMutation({
    onSuccess: async () => {
      toast.success("Code promotionnel créé pour votre boutique.");
      setOpen(false);
      await promotionsQuery.refetch();
    },
    onError: error => toast.error(error.message || "Le code promotionnel n’a pas pu être créé."),
  });
  const updatePromotion = trpc.owner.updatePromotion.useMutation({
    onSuccess: async () => {
      toast.success("Code promotionnel enregistré.");
      setOpen(false);
      await promotionsQuery.refetch();
    },
    onError: error => toast.error(error.message || "Le code promotionnel n’a pas pu être enregistré."),
  });
  const deletePromotion = trpc.owner.deletePromotion.useMutation({
    onSuccess: async () => {
      toast.success("Code promotionnel supprimé.");
      await promotionsQuery.refetch();
    },
    onError: error => toast.error(error.message || "Le code promotionnel n’a pas pu être supprimé."),
  });

  const summary = useMemo(() => ({
    active: promotions.filter(promotion => promotionState(promotion).label === "Actif").length,
    scheduled: promotions.filter(promotion => promotionState(promotion).label === "Planifié").length,
    uses: promotions.reduce((total, promotion) => total + Number(promotion.redemptionCount || 0), 0),
  }), [promotions]);

  const updateField = <Key extends keyof PromotionForm>(key: Key, value: PromotionForm[Key]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (promotion: OwnerPromotion) => {
    setEditingId(promotion.id);
    setForm({
      code: promotion.code,
      type: promotion.type,
      value: promotion.type === "fixed" ? centsToChfInput(promotion.value) : String(promotion.value),
      minOrderAmount: promotion.minOrderAmount == null ? "" : centsToChfInput(promotion.minOrderAmount),
      maxUses: promotion.maxUses == null ? "" : String(promotion.maxUses),
      active: promotion.active ? 1 : 0,
      scope: promotion.scope || "all",
      categoryId: promotion.categoryId ? String(promotion.categoryId) : "",
      perUserLimit: promotion.perUserLimit == null ? "" : String(promotion.perUserLimit),
      startsAt: dateForInput(promotion.startsAt),
      expiresAt: dateForInput(promotion.expiresAt),
    });
    setOpen(true);
  };

  const buildPayload = () => {
    const value = form.type === "fixed" ? parseChfToCents(form.value) : Number(form.value);
    const parsedMinimum = form.minOrderAmount.trim() ? parseChfToCents(form.minOrderAmount) : null;
    const minOrderAmount = parsedMinimum === null ? undefined : parsedMinimum;
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : undefined;
    const perUserLimit = form.perUserLimit.trim() ? Number(form.perUserLimit) : undefined;
    const categoryId = form.scope === "category" ? Number(form.categoryId) : undefined;
    const startsAt = form.startsAt ? new Date(form.startsAt) : undefined;
    const expiresAt = form.expiresAt ? new Date(form.expiresAt) : undefined;

    if (!form.code.trim() || value == null || !Number.isInteger(value) || value <= 0 || (form.type === "percent" && value > 100)) {
      toast.error(form.type === "percent" ? "Indiquez une remise entre 1 et 100 %." : "Indiquez une remise fixe valide.");
      return null;
    }
    if (minOrderAmount !== undefined && (!Number.isInteger(minOrderAmount) || minOrderAmount < 0)) {
      toast.error("Le minimum de commande est invalide.");
      return null;
    }
    if (maxUses !== undefined && (!Number.isInteger(maxUses) || maxUses <= 0)) {
      toast.error("Le nombre maximal d’utilisations est invalide.");
      return null;
    }
    if (perUserLimit !== undefined && (!Number.isInteger(perUserLimit) || perUserLimit <= 0)) {
      toast.error("La limite par client est invalide.");
      return null;
    }
    if (form.scope === "category" && (!categoryId || !Number.isInteger(categoryId))) {
      toast.error("Choisissez une catégorie ciblée.");
      return null;
    }
    if ((startsAt && Number.isNaN(startsAt.getTime())) || (expiresAt && Number.isNaN(expiresAt.getTime()))) {
      toast.error("Vérifiez les dates de validité.");
      return null;
    }
    if (startsAt && expiresAt && expiresAt <= startsAt) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return null;
    }
    return {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      minOrderAmount,
      maxUses,
      active: form.active,
      scope: form.scope,
      categoryId: categoryId ?? null,
      perUserLimit: perUserLimit ?? null,
      startsAt,
      expiresAt,
    };
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    if (editingId === null) createPromotion.mutate(payload);
    else updatePromotion.mutate({ id: editingId, ...payload });
  };

  const saving = createPromotion.isPending || updatePromotion.isPending;

  return <div className="space-y-5">
    <Card className="border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50">
      <CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-fuchsia-700" /> Codes promotionnels</CardTitle><CardDescription className="mt-2 max-w-3xl">Créez et planifiez des codes propres à cette boutique : pourcentage, montant fixe, minimum de commande, catégorie ou premier achat. Les codes d’une autre boutique sont inaccessibles.</CardDescription></div>{canManage ? <Button type="button" className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nouveau code</Button> : <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">Propriétaire requis pour modifier</Badge>}</div></CardHeader>
      <CardContent><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-emerald-100 bg-white/85 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Codes actifs</p><p className="mt-1 text-2xl font-bold text-emerald-700">{summary.active}</p></div><div className="rounded-xl border border-sky-100 bg-white/85 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Planifiés</p><p className="mt-1 text-2xl font-bold text-sky-700">{summary.scheduled}</p></div><div className="rounded-xl border border-violet-100 bg-white/85 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Utilisations comptées</p><p className="mt-1 text-2xl font-bold text-violet-700">{summary.uses}</p></div></div></CardContent>
    </Card>

    <Card className="border-amber-200 bg-amber-50/70"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="font-semibold">Paiement en ligne toujours désactivé</p><p className="mt-1">Les codes peuvent être préparés et testés au checkout, mais ils ne peuvent entraîner aucune vente ni aucun encaissement réel tant qu’un paiement multi-boutique sécurisé n’est pas explicitement construit et activé.</p></CardContent></Card>

    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Mes codes</CardTitle><CardDescription>Vous pouvez activer, désactiver, modifier ou supprimer vos propres codes.</CardDescription></div><Button type="button" variant="outline" className="min-h-10" onClick={() => promotionsQuery.refetch()} disabled={promotionsQuery.isFetching}>{promotionsQuery.isFetching ? "Actualisation…" : "Actualiser"}</Button></div></CardHeader><CardContent>{promotionsQuery.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-slate-100" /> : promotionsQuery.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Les codes sont temporairement indisponibles. Aucun code n’a été modifié.</div> : promotions.length === 0 ? <div className="rounded-xl border border-dashed border-fuchsia-200 bg-fuchsia-50 p-6 text-center text-sm leading-6 text-fuchsia-950"><Ticket className="mx-auto h-7 w-7 text-fuchsia-700" /><p className="mt-3 font-semibold">Aucun code promotionnel pour le moment.</p><p className="mt-1">Commencez par une offre simple, par exemple <strong>BIENVENUE10</strong>.</p></div> : <div className="space-y-3">{promotions.map(promotion => { const status = promotionState(promotion); const scope = scopePresentation[promotion.scope || "all"]; return <section key={promotion.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-lg font-bold text-slate-950">{promotion.code}</p><Badge variant="outline" className={status.className}>{status.label}</Badge><Badge variant="outline" className={scope.className}>{scope.label}{promotion.scope === "category" && promotion.categoryName ? ` · ${promotion.categoryName}` : ""}</Badge>{promotion.perUserLimit ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">{promotion.perUserLimit} / client</Badge> : null}</div><p className="mt-3 text-sm font-semibold text-slate-900">{promotion.type === "percent" ? `${promotion.value} % de remise` : `${(promotion.value / 100).toFixed(2)} ${currencyCode} de remise`}</p><p className="mt-1 text-xs leading-5 text-slate-600">Minimum : {promotion.minOrderAmount == null ? "aucun" : `${(promotion.minOrderAmount / 100).toFixed(2)} ${currencyCode}`} · Utilisations : {promotion.redemptionCount}{promotion.maxUses == null ? " (sans plafond)" : ` / ${promotion.maxUses}`} · {formatDate(promotion.startsAt)} → {formatDate(promotion.expiresAt)}</p></div><div className="flex flex-wrap gap-2">{canManage ? <><Button type="button" size="sm" variant="outline" className="min-h-10" disabled={updatePromotion.isPending} onClick={() => updatePromotion.mutate({ id: promotion.id, code: promotion.code, type: promotion.type, value: promotion.value, minOrderAmount: promotion.minOrderAmount ?? undefined, maxUses: promotion.maxUses ?? undefined, active: (promotion.active ? 0 : 1) as 0 | 1, scope: promotion.scope || "all", categoryId: promotion.categoryId ?? null, perUserLimit: promotion.perUserLimit ?? null, startsAt: promotion.startsAt ? new Date(promotion.startsAt) : undefined, expiresAt: promotion.expiresAt ? new Date(promotion.expiresAt) : undefined })}>{promotion.active ? "Désactiver" : "Activer"}</Button><Button type="button" size="sm" variant="outline" className="min-h-10" onClick={() => openEdit(promotion)}><Edit3 className="mr-1 h-4 w-4" /> Modifier</Button><Button type="button" size="sm" variant="outline" className="min-h-10 border-rose-200 text-rose-700 hover:bg-rose-50" disabled={deletePromotion.isPending} onClick={() => { if (window.confirm(`Supprimer le code ${promotion.code} ?`)) deletePromotion.mutate({ id: promotion.id }); }}><Trash2 className="mr-1 h-4 w-4" /> Supprimer</Button></> : <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Lecture seule</Badge>}</div></div></section>; })}</div>}</CardContent></Card>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editingId === null ? "Nouveau code promotionnel" : "Modifier le code promotionnel"}</DialogTitle><DialogDescription>Les remises fixes utilisent la devise de cette boutique ({currencyCode}). Définissez des limites simples afin de garder l’offre maîtrisée.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="owner-promo-code">Code</Label><Input id="owner-promo-code" value={form.code} maxLength={64} autoCapitalize="characters" onChange={event => updateField("code", event.target.value.toUpperCase())} placeholder="BIENVENUE10" /></div><div className="space-y-2"><Label htmlFor="owner-promo-type">Type de remise</Label><select id="owner-promo-type" value={form.type} onChange={event => updateField("type", event.target.value as PromotionForm["type"])} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="percent">Pourcentage</option><option value="fixed">Montant fixe</option></select></div></div><div className="space-y-2"><Label htmlFor="owner-promo-value">Valeur {form.type === "percent" ? "(%)" : `(${currencyCode})`}</Label><Input id="owner-promo-value" type={form.type === "percent" ? "number" : "text"} inputMode={form.type === "percent" ? "numeric" : "decimal"} min="1" max={form.type === "percent" ? "100" : undefined} value={form.value} onChange={event => updateField("value", event.target.value)} placeholder={form.type === "percent" ? "10" : "5,00"} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="owner-promo-min">Minimum de commande ({currencyCode})</Label><Input id="owner-promo-min" inputMode="decimal" value={form.minOrderAmount} onChange={event => updateField("minOrderAmount", event.target.value)} placeholder="Facultatif" /></div><div className="space-y-2"><Label htmlFor="owner-promo-max">Nombre maximal d’utilisations</Label><Input id="owner-promo-max" type="number" min="1" value={form.maxUses} onChange={event => updateField("maxUses", event.target.value)} placeholder="Illimité" /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="owner-promo-scope">Ciblage</Label><select id="owner-promo-scope" value={form.scope} onChange={event => updateField("scope", event.target.value as PromotionScope)} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">Tout le panier</option><option value="first_order">Premier achat</option><option value="category">Une catégorie précise</option></select></div><div className="space-y-2"><Label htmlFor="owner-promo-per-user">Limite par client</Label><Input id="owner-promo-per-user" type="number" min="1" value={form.perUserLimit} onChange={event => updateField("perUserLimit", event.target.value)} placeholder="Illimitée" /></div></div>{form.scope === "category" ? <div className="space-y-2"><Label htmlFor="owner-promo-category">Catégorie ciblée</Label><select id="owner-promo-category" value={form.categoryId} onChange={event => updateField("categoryId", event.target.value)} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Choisir une catégorie…</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div> : null}<div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="owner-promo-start">Début</Label><Input id="owner-promo-start" type="datetime-local" value={form.startsAt} onChange={event => updateField("startsAt", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="owner-promo-end">Fin</Label><Input id="owner-promo-end" type="datetime-local" value={form.expiresAt} onChange={event => updateField("expiresAt", event.target.value)} /></div></div><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><div><p className="text-sm font-semibold text-slate-950">État du code</p><p className="mt-1 text-xs leading-5 text-slate-600">Un code désactivé est conservé mais ne peut pas être appliqué.</p></div><Button type="button" variant={form.active ? "default" : "outline"} className={form.active ? "bg-fuchsia-700 hover:bg-fuchsia-800" : ""} onClick={() => updateField("active", (form.active ? 0 : 1) as 0 | 1)}><Percent className="mr-2 h-4 w-4" />{form.active ? "Actif" : "Désactivé"}</Button></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800" disabled={saving || (form.scope === "category" && !form.categoryId)}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><CalendarClock className="mr-2 h-4 w-4" />Enregistrer</>}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}
