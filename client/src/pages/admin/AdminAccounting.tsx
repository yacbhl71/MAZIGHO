import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { centsToChfInput, parseChfToCents } from "@/lib/moneyInput";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Download,
  FileText,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Upload,
  WalletCards,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AccountingKind = "inventory_purchase" | "shipping" | "platform" | "advertising" | "payment_fee" | "other_expense" | "refund";
type EntryForm = {
  id?: number;
  kind: AccountingKind;
  description: string;
  amountChf: string;
  occurredAt: string;
  supplier: string;
  notes: string;
  receiptUrl?: string | null;
  receiptKey?: string | null;
  receiptFileName?: string | null;
};

const categoryLabels: Record<AccountingKind, string> = {
  inventory_purchase: "Achat de marchandises",
  shipping: "Livraison / transport",
  platform: "Site et abonnements",
  advertising: "Publicité",
  payment_fee: "Frais de paiement",
  other_expense: "Autre frais professionnel",
  refund: "Remboursement client",
};

const categoryStyles: Record<AccountingKind, string> = {
  inventory_purchase: "bg-orange-100 text-orange-800",
  shipping: "bg-sky-100 text-sky-800",
  platform: "bg-violet-100 text-violet-800",
  advertising: "bg-pink-100 text-pink-800",
  payment_fee: "bg-amber-100 text-amber-800",
  other_expense: "bg-slate-100 text-slate-700",
  refund: "bg-rose-100 text-rose-800",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): EntryForm {
  return {
    kind: "inventory_purchase",
    description: "",
    amountChf: "",
    occurredAt: todayIso(),
    supplier: "",
    notes: "",
    receiptUrl: null,
    receiptKey: null,
    receiptFileName: null,
  };
}

function formatChf(amountCents: number) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(amountCents / 100);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-CH", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function AdminAccounting() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>(emptyForm);
  const utils = trpc.useUtils();
  const overviewQuery = trpc.admin.accounting.getOverview.useQuery({ year });
  const createEntry = trpc.admin.accounting.create.useMutation();
  const updateEntry = trpc.admin.accounting.update.useMutation();
  const deleteEntry = trpc.admin.accounting.delete.useMutation();
  const uploadReceipt = trpc.admin.accounting.uploadReceipt.useMutation();

  const overview = overviewQuery.data;
  const isSaving = createEntry.isPending || updateEntry.isPending;
  const isBusy = isSaving || uploadReceipt.isPending;

  const filteredEntries = useMemo(() => {
    const entries = overview?.entries ?? [];
    if (activeTab === "all") return entries;
    return entries.filter(entry => entry.kind === activeTab);
  }, [activeTab, overview?.entries]);

  const openCreate = () => {
    setForm(emptyForm());
    setIsDialogOpen(true);
  };

  const openEdit = (entry: any) => {
    setForm({
      id: entry.id,
      kind: entry.kind,
      description: entry.description,
      amountChf: centsToChfInput(entry.amount),
      occurredAt: new Date(entry.occurredAt).toISOString().slice(0, 10),
      supplier: entry.supplier ?? "",
      notes: entry.notes ?? "",
      receiptUrl: entry.receiptUrl,
      receiptKey: entry.receiptKey,
      receiptFileName: entry.receiptFileName,
    });
    setIsDialogOpen(true);
  };

  const updateForm = <K extends keyof EntryForm>(field: K, value: EntryForm[K]) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleReceiptUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const accepted = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (!accepted.has(file.type)) {
      toast.error("Choisissez un PDF, JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le justificatif doit peser 10 Mo maximum.");
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture impossible"));
        reader.onerror = () => reject(new Error("Lecture impossible"));
        reader.readAsDataURL(file);
      });
      const result = await uploadReceipt.mutateAsync({ dataUrl, fileName: file.name });
      setForm(current => ({ ...current, receiptUrl: result.url, receiptKey: result.key, receiptFileName: result.fileName }));
      toast.success("Justificatif ajouté. Enregistrez la ligne pour le rattacher.");
    } catch (error) {
      toast.error(`Téléversement impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = parseChfToCents(form.amountChf);
    if (!form.description.trim() || amount == null || amount <= 0) {
      toast.error("Indiquez une description et un montant supérieur à zéro.");
      return;
    }
    const data = {
      kind: form.kind,
      description: form.description.trim(),
      amount,
      occurredAt: new Date(`${form.occurredAt}T12:00:00`),
      supplier: form.supplier.trim() || null,
      notes: form.notes.trim() || null,
      receiptUrl: form.receiptUrl || null,
      receiptKey: form.receiptKey || null,
      receiptFileName: form.receiptFileName || null,
    };
    try {
      if (form.id) {
        await updateEntry.mutateAsync({ id: form.id, ...data });
        toast.success("Ligne administrative modifiée.");
      } else {
        await createEntry.mutateAsync(data);
        toast.success("Ligne administrative ajoutée.");
      }
      await utils.admin.accounting.getOverview.invalidate({ year });
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(`Enregistrement impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette ligne administrative ? Le justificatif ne sera plus rattaché au tableau.")) return;
    try {
      await deleteEntry.mutateAsync({ id });
      await utils.admin.accounting.getOverview.invalidate({ year });
      toast.success("Ligne supprimée.");
    } catch (error) {
      toast.error(`Suppression impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  const summary = overview?.summary ?? { sales: 0, refunds: 0, netSales: 0, purchases: 0, otherExpenses: 0, totalExpenses: 0, estimatedProfit: 0 };

  const monthlyData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("fr-CH", { month: "short" });
    const months = Array.from({ length: 12 }, (_, month) => ({
      month: formatter.format(new Date(year, month, 1)),
      sales: 0,
      expenses: 0,
    }));
    for (const sale of overview?.sales ?? []) {
      const month = new Date(sale.createdAt).getMonth();
      if (month >= 0 && month < 12) months[month].sales += Number(sale.totalAmount);
    }
    for (const entry of overview?.entries ?? []) {
      const month = new Date(entry.occurredAt).getMonth();
      if (month >= 0 && month < 12) months[month].expenses += Number(entry.amount);
    }
    return months;
  }, [overview?.entries, overview?.sales, year]);

  const expenseBreakdown = useMemo(() => {
    const totals = new Map<AccountingKind, number>();
    for (const entry of overview?.entries ?? []) {
      totals.set(entry.kind as AccountingKind, (totals.get(entry.kind as AccountingKind) ?? 0) + Number(entry.amount));
    }
    return Array.from(totals.entries()).map(([kind, amount]) => ({ kind, amount })).sort((a, b) => b.amount - a.amount);
  }, [overview?.entries]);

  const hasChartData = monthlyData.some(item => item.sales > 0 || item.expenses > 0);
  const expenseTotal = expenseBreakdown.reduce((total, item) => total + item.amount, 0);

  const exportCsv = () => {
    if (!overview) return;
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Date", "Type", "Nature", "Description", "Fournisseur", "Montant CHF", "Référence", "Justificatif"],
      ...overview.sales.map((sale: any) => [new Date(sale.createdAt).toISOString().slice(0, 10), "Vente site", "Commande payée", `Commande #${sale.id}`, "", (Number(sale.totalAmount) / 100).toFixed(2), `#${sale.id}`, ""]),
      ...overview.entries.map((entry: any) => [new Date(entry.occurredAt).toISOString().slice(0, 10), "Dépense", categoryLabels[entry.kind as AccountingKind], entry.description, entry.supplier ?? "", `-${(Number(entry.amount) / 100).toFixed(2)}`, "", entry.receiptUrl ?? ""]),
    ];
    const csv = `\uFEFF${rows.map(row => row.map(escape).join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mazigho-suivi-${year}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Rapport ${year} exporté en CSV.`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><ReceiptText className="h-4 w-4" /> Suivi administratif</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Vos ventes, achats et bénéfices</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Centralisez les commandes réellement payées du site, vos achats de marchandises, vos frais et leurs justificatifs. Les chiffres servent de suivi de pilotage ; ils ne remplacent pas une comptabilité ou une déclaration fiscale.</p>
            </div>
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-emerald-600 text-white shadow-lg shadow-emerald-200 md:mx-0"><WalletCards className="h-12 w-12" /></div>
          </div>
          <div className="flex flex-col gap-3 border-t border-emerald-100 bg-white/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div className="flex items-center gap-2 text-sm text-slate-700"><CalendarDays className="h-4 w-4 text-emerald-600" /> Période de suivi</div>
            <div className="flex items-center gap-2"><select value={year} onChange={event => setYear(Number(event.target.value))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
              {[currentYear, currentYear - 1, currentYear - 2].map(option => <option key={option} value={option}>{option}</option>)}
            </select><Button type="button" onClick={exportCsv} variant="outline" size="sm" className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50" disabled={!overview}><Download className="mr-2 h-4 w-4" /> Exporter CSV</Button></div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-emerald-100 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Ventes encaissées</p><p className="mt-2 text-2xl font-bold text-emerald-700">{formatChf(summary.sales)}</p><p className="mt-1 text-xs text-slate-500">Commandes payées du site</p></div><span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><ArrowUpRight className="h-5 w-5" /></span></div></CardContent></Card>
          <Card className="border-orange-100 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Achats marchandises</p><p className="mt-2 text-2xl font-bold text-orange-700">{formatChf(summary.purchases)}</p><p className="mt-1 text-xs text-slate-500">Coût des produits fournisseurs</p></div><span className="rounded-xl bg-orange-100 p-2 text-orange-700"><PackageCheck className="h-5 w-5" /></span></div></CardContent></Card>
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Autres frais</p><p className="mt-2 text-2xl font-bold text-slate-800">{formatChf(summary.otherExpenses + summary.refunds)}</p><p className="mt-1 text-xs text-slate-500">Frais et remboursements</p></div><span className="rounded-xl bg-slate-100 p-2 text-slate-600"><ArrowDownRight className="h-5 w-5" /></span></div></CardContent></Card>
          <Card className={`shadow-sm ${summary.estimatedProfit >= 0 ? "border-violet-100" : "border-rose-100"}`}><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Bénéfice estimé</p><p className={`mt-2 text-2xl font-bold ${summary.estimatedProfit >= 0 ? "text-violet-700" : "text-rose-700"}`}>{formatChf(summary.estimatedProfit)}</p><p className="mt-1 text-xs text-slate-500">Ventes nettes − achats − frais</p></div><span className={`rounded-xl p-2 ${summary.estimatedProfit >= 0 ? "bg-violet-100 text-violet-700" : "bg-rose-100 text-rose-700"}`}><Banknote className="h-5 w-5" /></span></div></CardContent></Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
          <Card className="shadow-sm"><CardHeader><CardTitle>Évolution mensuelle</CardTitle><CardDescription>Ventes réellement encaissées comparées à vos dépenses et achats saisis.</CardDescription></CardHeader><CardContent>{hasChartData ? <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => {
              const amount = Number(value) / 100;
              return `${amount.toLocaleString("fr-CH", { minimumFractionDigits: amount > 0 && amount < 10 ? 2 : 0, maximumFractionDigits: 2 })} CHF`;
            }} /><Tooltip formatter={(value: number) => formatChf(Number(value))} labelStyle={{ color: "#0f172a" }} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="sales" name="Ventes encaissées" fill="#059669" radius={[5, 5, 0, 0]} /><Bar dataKey="expenses" name="Achats et frais" fill="#f97316" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : <div className="flex h-[300px] flex-col items-center justify-center rounded-xl bg-slate-50 text-center"><ReceiptText className="h-9 w-9 text-slate-400" /><p className="mt-3 font-semibold text-slate-800">Le graphique apparaîtra avec vos premières données</p><p className="mt-1 max-w-md text-sm text-slate-500">Les commandes payées, achats et frais saisis alimentent automatiquement cette vue.</p></div>}</CardContent></Card>
          <Card className="shadow-sm"><CardHeader><CardTitle>Répartition des dépenses</CardTitle><CardDescription>Où part votre budget sur {year}.</CardDescription></CardHeader><CardContent>{expenseBreakdown.length === 0 ? <div className="flex h-[220px] items-center justify-center rounded-xl bg-slate-50 px-5 text-center text-sm text-slate-500">Aucune dépense saisie pour le moment.</div> : <div className="space-y-4">{expenseBreakdown.map(item => <div key={item.kind}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-700">{categoryLabels[item.kind]}</span><span className="font-semibold text-slate-900">{formatChf(item.amount)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${expenseTotal > 0 ? Math.max(4, Math.round((item.amount / expenseTotal) * 100)) : 0}%` }} /></div></div>)}</div>}</CardContent></Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="shadow-sm"><CardHeader><CardTitle className="text-lg">Comment lire ce tableau</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3"><p><strong className="text-slate-900">1. Ventes :</strong> les commandes marquées payées sont ajoutées automatiquement.</p><p><strong className="text-slate-900">2. Dépenses :</strong> ajoutez vos commandes fournisseurs, transports, abonnements et frais.</p><p><strong className="text-slate-900">3. Preuves :</strong> joignez un PDF ou une image de facture à chaque dépense.</p></CardContent></Card>
          <Card className="border-emerald-200 bg-emerald-50 shadow-sm"><CardContent className="p-5"><p className="font-semibold text-emerald-950">Bon réflexe</p><p className="mt-2 text-sm leading-6 text-emerald-900">Ajoutez une dépense dès qu’elle est payée. Vous disposerez ainsi d’un historique clair pour préparer l’AVS et vos impôts.</p><Button onClick={openCreate} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" /> Ajouter une dépense</Button></CardContent></Card>
        </section>

        <Card className="shadow-sm"><CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Achats, frais et remboursements</CardTitle><CardDescription>Les lignes ajoutées manuellement sont conservées avec leurs justificatifs.</CardDescription></div><Button onClick={openCreate} variant="outline" className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"><Plus className="mr-2 h-4 w-4" /> Nouvelle ligne</Button></CardHeader><CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="mb-5 h-auto flex-wrap justify-start gap-1 bg-transparent p-0"><TabsTrigger value="all" className="border">Tout</TabsTrigger><TabsTrigger value="inventory_purchase" className="border">Marchandises</TabsTrigger><TabsTrigger value="shipping" className="border">Livraison</TabsTrigger><TabsTrigger value="platform" className="border">Site</TabsTrigger><TabsTrigger value="advertising" className="border">Publicité</TabsTrigger><TabsTrigger value="other_expense" className="border">Autres</TabsTrigger></TabsList></Tabs>
          {overviewQuery.isLoading ? <div className="flex min-h-36 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement du registre…</div> : filteredEntries.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center"><ReceiptText className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-semibold text-slate-800">Aucune ligne pour cette période</p><p className="mt-1 text-sm text-slate-500">Ajoutez vos premiers achats ou frais lorsque vous les effectuez.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Nature</th><th className="px-3 py-3">Description</th><th className="px-3 py-3">Fournisseur</th><th className="px-3 py-3 text-right">Montant</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{filteredEntries.map((entry: any) => <tr key={entry.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4 text-slate-600">{formatDate(entry.occurredAt)}</td><td className="px-3 py-4"><Badge className={categoryStyles[entry.kind as AccountingKind]}>{categoryLabels[entry.kind as AccountingKind]}</Badge></td><td className="px-3 py-4"><p className="font-medium text-slate-900">{entry.description}</p>{entry.notes && <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{entry.notes}</p>}</td><td className="px-3 py-4 text-slate-600">{entry.supplier || "—"}</td><td className="px-3 py-4 text-right font-semibold text-slate-900">− {formatChf(Number(entry.amount))}</td><td className="px-3 py-4"><div className="flex justify-end gap-1">{entry.receiptUrl && <Button asChild variant="ghost" size="icon" title="Voir le justificatif"><a href={entry.receiptUrl} target="_blank" rel="noreferrer"><FileText className="h-4 w-4 text-emerald-700" /></a></Button>}<Button onClick={() => openEdit(entry)} variant="ghost" size="icon" title="Modifier"><Pencil className="h-4 w-4" /></Button><Button onClick={() => handleDelete(entry.id)} variant="ghost" size="icon" title="Supprimer" disabled={deleteEntry.isPending}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div></td></tr>)}</tbody></table></div>}
        </CardContent></Card>

        <Card className="shadow-sm"><CardHeader><CardTitle>Ventes encaissées automatiquement</CardTitle><CardDescription>Seules les commandes marquées « payées » sont comptabilisées ici. Vous n’avez pas besoin de les saisir une deuxième fois.</CardDescription></CardHeader><CardContent>{overviewQuery.isLoading ? <div className="text-sm text-slate-500">Chargement…</div> : (overview?.sales.length ?? 0) === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">Aucune commande payée pour {year}. Les premières ventes apparaîtront ici automatiquement.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="border-b text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Commande</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Paiement</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3 text-right">Vente</th></tr></thead><tbody>{overview?.sales.map((sale: any) => <tr key={sale.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4 font-semibold text-slate-900">#{sale.id}</td><td className="px-3 py-4 text-slate-600">{formatDate(sale.createdAt)}</td><td className="px-3 py-4 text-slate-600">{sale.paymentMethod || "—"}</td><td className="px-3 py-4"><Badge variant="secondary">{sale.status}</Badge></td><td className="px-3 py-4 text-right font-semibold text-emerald-700">+ {formatChf(Number(sale.totalAmount))}</td></tr>)}</tbody></table></div>}</CardContent></Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{form.id ? "Modifier une ligne" : "Ajouter un achat ou un frais"}</DialogTitle><DialogDescription>Enregistrez le montant réellement payé. Les ventes clients sont récupérées automatiquement depuis les commandes payées.</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="kind">Nature</Label><select id="kind" value={form.kind} onChange={event => updateForm("kind", event.target.value as AccountingKind)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="occurredAt">Date</Label><Input id="occurredAt" type="date" value={form.occurredAt} onChange={event => updateForm("occurredAt", event.target.value)} required /></div></div><div className="grid gap-4 sm:grid-cols-[1fr_180px]"><div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" value={form.description} onChange={event => updateForm("description", event.target.value)} placeholder="Ex. Commande de 10 accessoires" required /></div><div className="space-y-2"><Label htmlFor="amount">Montant payé (CHF)</Label><Input id="amount" type="text" inputMode="decimal" value={form.amountChf} onChange={event => updateForm("amountChf", event.target.value)} placeholder="0,00" required /></div></div><div className="space-y-2"><Label htmlFor="supplier">Fournisseur ou bénéficiaire</Label><Input id="supplier" value={form.supplier} onChange={event => updateForm("supplier", event.target.value)} placeholder="Ex. AliExpress, La Poste, hébergeur…" /></div><div className="space-y-2"><Label htmlFor="notes">Note facultative</Label><textarea id="notes" value={form.notes} onChange={event => updateForm("notes", event.target.value)} placeholder="Référence, numéro de commande fournisseur, précision utile…" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-slate-900">Justificatif</p><p className="mt-1 text-xs text-slate-500">PDF, JPEG, PNG ou WebP, jusqu’à 10 Mo.</p>{form.receiptUrl && <a href={form.receiptUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:underline"><FileText className="mr-1 h-3.5 w-3.5" /> {form.receiptFileName || "Voir le justificatif"}</a>}</div><label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"><Upload className="mr-2 h-4 w-4" />{uploadReceipt.isPending ? "Envoi…" : form.receiptUrl ? "Remplacer" : "Ajouter"}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={handleReceiptUpload} disabled={isBusy} /></label></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isBusy}>Annuler</Button><Button type="submit" disabled={isBusy} className="bg-emerald-600 hover:bg-emerald-700">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}{form.id ? "Enregistrer les modifications" : "Ajouter au registre"}</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}
