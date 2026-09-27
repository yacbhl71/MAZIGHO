import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ClipboardCheck, Loader2, PackageCheck, RefreshCw, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const STATUS: Record<string, { label: string; className: string }> = {
  requested: { label: "À traiter", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Instructions enregistrées", className: "bg-sky-100 text-sky-800" },
  return_received: { label: "Retour réceptionné", className: "bg-violet-100 text-violet-800" },
  closed: { label: "Dossier clôturé", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Refusé", className: "bg-rose-100 text-rose-800" },
  refunded: { label: "Ancien remboursement déclaré", className: "bg-slate-100 text-slate-700" },
};

const eventLabels: Record<string, string> = { requested: "Demande envoyée", approve: "Instructions enregistrées", reject: "Demande refusée", mark_received: "Retour réceptionné", close: "Dossier clôturé" };

function money(cents: number | null | undefined, currencyCode = "CHF") { return `${(Number(cents || 0) / 100).toFixed(2)} ${currencyCode}`; }
function dt(value: Date | string) { return new Date(value).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" }); }

export default function AdminReturns() {
  const query = trpc.admin.returns.getAll.useQuery();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const update = trpc.admin.returns.updateStatus.useMutation({
    onSuccess: async result => { toast.success(result.label); await query.refetch(); },
    onError: error => toast.error(error.message),
  });

  const submit = (id: number, action: "approve" | "reject" | "mark_received" | "close") => {
    const note = (notes[id] || "").trim();
    if ((action === "approve" || action === "reject") && note.length < 2) {
      toast.error(action === "approve" ? "Ajoutez les instructions de retour." : "Ajoutez le motif du refus.");
      return;
    }
    update.mutate({ id, action, note: note || undefined });
  };

  const returns = query.data ?? [];
  const pending = returns.filter(item => item.status === "requested").length;

  return <DashboardLayout>
    <div className="space-y-6 pb-8" data-testid="admin-returns-page">
      <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-violet-50">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-700"><RotateCcw className="h-4 w-4" /> Service après-vente</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Retours contrôlés</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Consultez les sélections d’articles, donnez des instructions et suivez la réception. Aucun remboursement Stripe, e-mail, transporteur ou paiement n’est déclenché ici.</p>
          </div>
          <Button onClick={() => query.refetch()} disabled={query.isFetching} variant="outline" className="border-sky-200 bg-white text-sky-800 hover:bg-sky-100"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Actualiser</Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3"><Metric label="Demandes à traiter" value={pending} tone="amber" /><Metric label="En attente de retour" value={returns.filter(item => item.status === "approved").length} tone="sky" /><Metric label="Réceptionnés" value={returns.filter(item => item.status === "return_received").length} tone="violet" /></section>

      <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100 pb-5"><CardTitle className="text-xl text-slate-900">Demandes de retour</CardTitle><CardDescription>Chaque décision est horodatée. Les informations affichées restent limitées à la demande, aux articles et au montant de la commande.</CardDescription></CardHeader><CardContent className="p-0">
        {query.isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div> : returns.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center" data-testid="returns-empty"><div className="rounded-full bg-slate-100 p-4 text-slate-400"><RotateCcw className="h-7 w-7" /></div><p className="mt-4 font-semibold text-slate-800">Aucune demande de retour</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Les demandes clients apparaîtront ici.</p></div> : <div className="divide-y divide-border/70">{returns.map(request => {
          const presentation = STATUS[request.status] || STATUS.requested;
          const note = notes[request.id] || "";
          return <article key={request.id} className="space-y-4 p-5" data-testid={`return-row-${request.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">Retour #{request.id} · commande #{request.orderId}</p><Badge className={`border-0 ${presentation.className}`}>{presentation.label}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{dt(request.createdAt)}{request.order ? ` · ${money(request.order.totalAmount, request.order.currencyCode)}` : ""}</p></div></div>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><span className="font-medium">Motif :</span> {request.reason}</div>
            <div className="grid gap-2 sm:grid-cols-2">{request.items.map(item => <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3"><p className="font-medium text-slate-900">{item.productNameSnapshot}</p><p className="mt-1 text-xs text-sky-800">Quantité : {item.quantity}</p></div>)}</div>
            {request.instructions && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950"><strong>Instructions :</strong> {request.instructions}</div>}
            {request.resolutionNote && request.status !== "approved" && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Note :</strong> {request.resolutionNote}</div>}
            {(request.status === "requested" || request.status === "approved" || request.status === "return_received") && <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4"><Label htmlFor={`admin-return-note-${request.id}`} className="text-sm font-semibold text-violet-950">{request.status === "requested" ? "Instructions ou motif du refus" : "Note facultative"}</Label><Textarea id={`admin-return-note-${request.id}`} className="mt-2 bg-white" rows={3} maxLength={1000} value={note} onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))} /> <div className="mt-3 flex flex-wrap gap-2">{request.status === "requested" && <><Button size="sm" className="min-h-10 bg-sky-700 hover:bg-sky-800" disabled={update.isPending} onClick={() => submit(request.id, "approve")}><Check className="mr-2 h-4 w-4" /> Instructions</Button><Button size="sm" variant="outline" className="min-h-10 border-rose-200 bg-white text-rose-800 hover:bg-rose-50" disabled={update.isPending} onClick={() => submit(request.id, "reject")}><X className="mr-2 h-4 w-4" /> Refuser</Button></>}{request.status === "approved" && <Button size="sm" className="min-h-10 bg-violet-700 hover:bg-violet-800" disabled={update.isPending} onClick={() => submit(request.id, "mark_received")}><PackageCheck className="mr-2 h-4 w-4" /> Réceptionné</Button>}{request.status === "return_received" && <Button size="sm" className="min-h-10 bg-emerald-700 hover:bg-emerald-800" disabled={update.isPending} onClick={() => submit(request.id, "close")}><ClipboardCheck className="mr-2 h-4 w-4" /> Clôturer</Button>}</div></div>}
            {request.events.length > 0 && <div className="border-t border-slate-100 pt-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Historique</p><div className="mt-2 space-y-1">{request.events.map(event => <p key={event.id} className="text-xs leading-5 text-slate-600"><strong className="text-slate-800">{eventLabels[event.action] || event.action}</strong>{event.note ? ` · ${event.note}` : ""} <span className="text-slate-400">· {dt(event.createdAt)}</span></p>)}</div></div>}
          </article>;
        })}</div>}
      </CardContent></Card>
    </div>
  </DashboardLayout>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "amber" | "sky" | "violet" }) {
  const classes = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : tone === "sky" ? "border-sky-200 bg-sky-50 text-sky-950" : "border-violet-200 bg-violet-50 text-violet-950";
  return <div className={`rounded-xl border p-4 shadow-sm ${classes}`}><p className="text-xs font-semibold uppercase tracking-wider opacity-75">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}
