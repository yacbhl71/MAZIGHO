import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock3, Gavel, Loader2, PackageCheck, RotateCcw, Save, ShieldAlert, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusPresentation: Record<string, { label: string; className: string }> = {
  requested: { label: "À traiter", className: "border-amber-200 bg-amber-50 text-amber-900" },
  approved: { label: "Instructions enregistrées", className: "border-sky-200 bg-sky-50 text-sky-900" },
  return_received: { label: "Retour réceptionné", className: "border-violet-200 bg-violet-50 text-violet-900" },
  closed: { label: "Dossier clôturé", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  rejected: { label: "Refusé", className: "border-rose-200 bg-rose-50 text-rose-900" },
  refunded: { label: "Ancien remboursement déclaré", className: "border-slate-200 bg-slate-100 text-slate-700" },
};

const eventLabels: Record<string, string> = {
  requested: "Demande envoyée",
  approve: "Instructions enregistrées",
  reject: "Demande refusée",
  mark_received: "Retour réceptionné",
  close: "Dossier clôturé",
  external_case_updated: "Dossier externe mis à jour",
};

const caseTypeLabels: Record<string, string> = { none: "Aucun dossier externe", refund: "Remboursement", dispute: "Litige / contestation", other: "Autre dossier" };
const caseStatusLabels: Record<string, string> = { not_started: "À préparer", action_required: "Action requise", submitted: "Transmis au prestataire", resolved: "Résolu" };
const providerLabels: Record<string, string> = { not_specified: "À préciser", stripe: "Stripe", chargily: "Chargily", carrier: "Transporteur", other: "Autre" };

type CaseDraft = { type: "none" | "refund" | "dispute" | "other"; status: "not_started" | "action_required" | "submitted" | "resolved"; provider: "not_specified" | "stripe" | "chargily" | "carrier" | "other"; reference: string; deadlineAt: string; note: string };

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
}

function formatDateTimeInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatMoney(value: number | null | undefined, currencyCode = "CHF") {
  return `${(Number(value || 0) / 100).toFixed(2)} ${currencyCode}`;
}

function describeOptions(value: string | null) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(option => `${option?.name || "Option"} : ${option?.value || option?.label || "—"}`).join(" · ");
    if (typeof parsed === "object" && parsed) return Object.entries(parsed).map(([name, option]) => `${name} : ${String(option)}`).join(" · ");
  } catch {
    // Keep the source snapshot visible when it is not JSON.
  }
  return value;
}

function draftFromEntry(entry: any): CaseDraft {
  return {
    type: entry.externalCaseType || "none",
    status: entry.externalCaseStatus || "not_started",
    provider: entry.externalCaseProvider || "not_specified",
    reference: entry.externalCaseReference || "",
    deadlineAt: formatDateTimeInput(entry.externalCaseDeadlineAt),
    note: entry.externalCaseNote || "",
  };
}

export default function OwnerReturnsCenter() {
  const returns = trpc.owner.getReturnRequests.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [caseDrafts, setCaseDrafts] = useState<Record<number, CaseDraft>>({});
  const update = trpc.owner.updateReturnRequest.useMutation({
    onSuccess: async result => {
      toast.success(result.label);
      await returns.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const saveExternalCase = trpc.owner.saveReturnExternalCase.useMutation({
    onSuccess: async () => {
      toast.success("Dossier externe enregistré. Aucune transaction n’a été exécutée.");
      await returns.refetch();
    },
    onError: error => toast.error(error.message),
  });

  const submit = (id: number, action: "approve" | "reject" | "mark_received" | "close") => {
    const note = (notes[id] || "").trim();
    if ((action === "approve" || action === "reject") && note.length < 2) {
      toast.error(action === "approve" ? "Ajoutez les instructions de retour pour le client." : "Expliquez clairement le refus.");
      return;
    }
    update.mutate({ id, action, note: note || undefined });
  };

  const patchCase = (id: number, entry: any, patch: Partial<CaseDraft>) => {
    setCaseDrafts(current => ({ ...current, [id]: { ...(current[id] || draftFromEntry(entry)), ...patch } }));
  };

  const submitExternalCase = (id: number, entry: any) => {
    const draft = caseDrafts[id] || draftFromEntry(entry);
    const deadline = draft.deadlineAt ? new Date(draft.deadlineAt) : null;
    if (deadline && Number.isNaN(deadline.getTime())) {
      toast.error("Choisissez une échéance valide.");
      return;
    }
    saveExternalCase.mutate({
      id,
      type: draft.type,
      status: draft.type === "none" ? "not_started" : draft.status,
      provider: draft.type === "none" ? "not_specified" : draft.provider,
      reference: draft.reference.trim() || null,
      deadlineAt: deadline ? deadline.toISOString() : null,
      note: draft.note.trim() || null,
    });
  };

  const entries = returns.data ?? [];
  const pending = entries.filter(entry => entry.status === "requested").length;
  const urgentCases = entries.filter(entry => entry.externalCaseStatus === "action_required").length;

  return <div className="space-y-5">
    <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-sky-700" /> Retours & service après-vente</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">Traitez les demandes liées à cette boutique : fournissez des instructions, enregistrez la réception et clôturez le dossier. Les articles, quantités et décisions restent isolés de toute autre boutique.</CardDescription>
          </div>
          <Button type="button" variant="outline" className="min-h-11 border-sky-200 bg-white text-sky-950 hover:bg-sky-100" onClick={() => returns.refetch()} disabled={returns.isFetching}>
            {returns.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />} Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="À traiter" value={pending} tone="amber" />
          <Metric label="En attente de retour" value={entries.filter(entry => entry.status === "approved").length} tone="sky" />
          <Metric label="Réceptionnés" value={entries.filter(entry => entry.status === "return_received").length} tone="violet" />
          <Metric label="Dossiers urgents" value={urgentCases} tone="rose" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-violet-200 bg-violet-50/60">
      <CardHeader><CardTitle className="flex items-center gap-2 text-violet-950"><ClipboardCheck className="h-5 w-5 text-violet-700" /> Remboursements et litiges : procédure contrôlée</CardTitle><CardDescription className="mt-1 max-w-3xl text-violet-900">Pour les Direct Charges, la boutique est le vendeur. Elle décide, justifie et traite le remboursement ou la réponse au litige dans son propre compte Stripe ; MAZIGHO ne prélève, ne rembourse et ne conteste rien à sa place.</CardDescription></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2"><article className="rounded-xl border border-violet-200 bg-white p-4 text-sm leading-6 text-slate-700"><p className="font-semibold text-slate-950">Remboursement demandé par un client</p><ol className="mt-3 list-decimal space-y-2 pl-5"><li>Vérifiez la commande, les conditions publiées et le dossier de retour.</li><li>Conservez la décision et les éléments utiles dans le dossier opérationnel de la boutique.</li><li>Le propriétaire exécute ensuite le remboursement dans Stripe pour son compte vendeur, après sa propre validation.</li><li>Actualisez le dossier seulement après confirmation dans Stripe et conservez la référence dans votre comptabilité.</li></ol></article><article className="rounded-xl border border-violet-200 bg-white p-4 text-sm leading-6 text-slate-700"><p className="font-semibold text-slate-950">Litige ou contestation de paiement</p><ol className="mt-3 list-decimal space-y-2 pl-5"><li>Consultez l’alerte et l’échéance directement dans le compte du prestataire du vendeur.</li><li>Rassemblez les preuves pertinentes : commande, conditions acceptées, livraison, suivi et échanges autorisés.</li><li>Répondez dans le prestataire avant l’échéance et suivez la décision du réseau de paiement.</li><li>Documentez le résultat ici, sans copier de carte, de compte bancaire ou de données inutiles.</li></ol></article><div className="lg:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><p><strong>Limite volontaire :</strong> ce panneau conserve un dossier de suivi. Il ne déclenche aucun remboursement, aucune réponse au litige, aucun e-mail ni aucune écriture comptable.</p></div></CardContent>
    </Card>

    {returns.isLoading ? <div className="h-72 animate-pulse rounded-2xl bg-slate-100" /> : returns.isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm leading-6 text-rose-950">Les demandes de retour sont temporairement indisponibles. Aucun dossier n’a été modifié.</CardContent></Card> : entries.length === 0 ? <Card className="border-dashed border-slate-300"><CardContent className="flex min-h-52 flex-col items-center justify-center p-6 text-center"><RotateCcw className="h-8 w-8 text-slate-400" /><p className="mt-3 font-semibold text-slate-900">Aucune demande de retour</p><p className="mt-1 max-w-md text-sm leading-6 text-slate-600">Les demandes clients apparaîtront ici avec leur sélection d’articles et leur historique.</p></CardContent></Card> : <div className="space-y-4">
      {entries.map(entry => {
        const presentation = statusPresentation[entry.status] || statusPresentation.requested;
        const note = notes[entry.id] || "";
        const caseDraft = caseDrafts[entry.id] || draftFromEntry(entry);
        const hasExternalCase = caseDraft.type !== "none";
        return <Card key={entry.id} className="border-slate-200" data-testid={`owner-return-${entry.id}`}>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">Retour #{entry.id} · commande #{entry.orderId}</p><Badge variant="outline" className={presentation.className}>{presentation.label}</Badge>{hasExternalCase && <Badge variant="outline" className={caseDraft.status === "action_required" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-violet-200 bg-violet-50 text-violet-900"}>{caseTypeLabels[caseDraft.type]} · {caseStatusLabels[caseDraft.status]}</Badge>}</div>
                <p className="mt-1 text-xs text-slate-500">Demandé le {formatDate(entry.createdAt)}{entry.order ? ` · ${formatMoney(entry.order.totalAmount, entry.order.currencyCode)}` : ""}</p>
              </div>
              <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 text-slate-700">{entry.items.reduce((total, item) => total + item.quantity, 0)} article{entry.items.reduce((total, item) => total + item.quantity, 0) > 1 ? "s" : ""}</Badge>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Motif du client</p><p className="mt-2">{entry.reason}</p></div>

            <div><p className="text-sm font-semibold text-slate-950">Articles demandés</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{entry.items.map(item => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3"><p className="font-medium text-slate-900">{item.productNameSnapshot}</p>{describeOptions(item.selectedOptionsSnapshot) && <p className="mt-1 text-xs leading-5 text-slate-600">{describeOptions(item.selectedOptionsSnapshot)}</p>}<p className="mt-2 text-xs font-semibold text-sky-800">Quantité demandée : {item.quantity}</p></div>)}</div></div>

            {entry.instructions && <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><p className="font-semibold">Instructions communiquées</p><p className="mt-1">{entry.instructions}</p></div>}
            {entry.resolutionNote && entry.status !== "approved" && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800"><p className="font-semibold">Note de traitement</p><p className="mt-1">{entry.resolutionNote}</p></div>}

            <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-semibold text-violet-950"><Gavel className="h-4 w-4" /> Dossier prestataire — propriétaire uniquement</p><p className="mt-1 max-w-2xl text-xs leading-5 text-violet-900">Suivez un remboursement ou litige décidé par la boutique. La référence, l’échéance et la note restent internes : aucun client, paiement ou prestataire n’est contacté par MAZIGHO.</p></div>{caseDraft.deadlineAt && <Badge variant="outline" className="w-fit border-violet-200 bg-white text-violet-900"><Clock3 className="mr-1 h-3.5 w-3.5" /> Échéance {formatDate(caseDraft.deadlineAt)}</Badge>}</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-1.5"><Label htmlFor={`case-type-${entry.id}`}>Nature</Label><select id={`case-type-${entry.id}`} value={caseDraft.type} onChange={event => patchCase(entry.id, entry, { type: event.target.value as CaseDraft["type"] })} className="min-h-11 w-full rounded-md border border-violet-200 bg-white px-3 text-sm text-slate-950"><option value="none">Aucun dossier externe</option><option value="refund">Remboursement</option><option value="dispute">Litige / contestation</option><option value="other">Autre dossier</option></select></div>
                <div className="space-y-1.5"><Label htmlFor={`case-status-${entry.id}`}>État</Label><select id={`case-status-${entry.id}`} disabled={!hasExternalCase} value={caseDraft.status} onChange={event => patchCase(entry.id, entry, { status: event.target.value as CaseDraft["status"] })} className="min-h-11 w-full rounded-md border border-violet-200 bg-white px-3 text-sm text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"><option value="not_started">À préparer</option><option value="action_required">Action requise</option><option value="submitted">Transmis au prestataire</option><option value="resolved">Résolu</option></select></div>
                <div className="space-y-1.5"><Label htmlFor={`case-provider-${entry.id}`}>Prestataire concerné</Label><select id={`case-provider-${entry.id}`} disabled={!hasExternalCase} value={caseDraft.provider} onChange={event => patchCase(entry.id, entry, { provider: event.target.value as CaseDraft["provider"] })} className="min-h-11 w-full rounded-md border border-violet-200 bg-white px-3 text-sm text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"><option value="not_specified">À préciser</option><option value="stripe">Stripe</option><option value="chargily">Chargily</option><option value="carrier">Transporteur</option><option value="other">Autre</option></select></div>
                <div className="space-y-1.5"><Label htmlFor={`case-reference-${entry.id}`}>Référence externe</Label><Input id={`case-reference-${entry.id}`} disabled={!hasExternalCase} value={caseDraft.reference} maxLength={120} onChange={event => patchCase(entry.id, entry, { reference: event.target.value })} placeholder="Ex. re_… ou identifiant prestataire" className="min-h-11 bg-white disabled:opacity-60" /></div>
                <div className="space-y-1.5"><Label htmlFor={`case-deadline-${entry.id}`}>Échéance</Label><Input id={`case-deadline-${entry.id}`} disabled={!hasExternalCase} type="datetime-local" value={caseDraft.deadlineAt} onChange={event => patchCase(entry.id, entry, { deadlineAt: event.target.value })} className="min-h-11 bg-white disabled:opacity-60" /></div>
                <div className="space-y-1.5 md:col-span-2 xl:col-span-1"><Label htmlFor={`case-note-${entry.id}`}>Note interne</Label><Textarea id={`case-note-${entry.id}`} disabled={!hasExternalCase} rows={2} maxLength={1000} value={caseDraft.note} onChange={event => patchCase(entry.id, entry, { note: event.target.value })} placeholder="Décision, preuve à vérifier ou suite manuelle…" className="bg-white disabled:opacity-60" /></div>
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-violet-200 pt-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex gap-2 text-xs leading-5 text-violet-900"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />Ne saisissez ni numéro de carte, ni compte bancaire, ni clé API. Pour Stripe ou Chargily, l’action financière se fait dans le compte marchand correspondant.</p><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={saveExternalCase.isPending} onClick={() => submitExternalCase(entry.id, entry)}>{saveExternalCase.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer le dossier</Button></div>
            </section>

            {(entry.status === "requested" || entry.status === "approved" || entry.status === "return_received") && <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
              <Label htmlFor={`owner-return-note-${entry.id}`} className="text-sm font-semibold text-violet-950">{entry.status === "requested" ? "Instructions au client ou motif du refus" : entry.status === "approved" ? "Note de réception facultative" : "Note de clôture facultative"}</Label>
              <Textarea id={`owner-return-note-${entry.id}`} rows={3} maxLength={1000} value={note} onChange={event => setNotes(current => ({ ...current, [entry.id]: event.target.value }))} className="mt-2 bg-white" placeholder={entry.status === "requested" ? "Ex. Renvoyez les articles à l’adresse indiquée dans vos conditions, avec le numéro de commande." : "Ajoutez un constat interne visible dans l’historique client."} />
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.status === "requested" && <><Button type="button" className="min-h-11 bg-sky-700 hover:bg-sky-800" disabled={update.isPending} onClick={() => submit(entry.id, "approve")}><CheckCircle2 className="mr-2 h-4 w-4" /> Enregistrer les instructions</Button><Button type="button" variant="outline" className="min-h-11 border-rose-200 bg-white text-rose-800 hover:bg-rose-50" disabled={update.isPending} onClick={() => submit(entry.id, "reject")}><XCircle className="mr-2 h-4 w-4" /> Refuser</Button></>}
                {entry.status === "approved" && <Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={update.isPending} onClick={() => submit(entry.id, "mark_received")}><PackageCheck className="mr-2 h-4 w-4" /> Marquer réceptionné</Button>}
                {entry.status === "return_received" && <Button type="button" className="min-h-11 bg-emerald-700 hover:bg-emerald-800" disabled={update.isPending} onClick={() => submit(entry.id, "close")}><ClipboardCheck className="mr-2 h-4 w-4" /> Clôturer le dossier</Button>}
              </div>
            </section>}

            <div className="border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Historique</p><ol className="mt-3 space-y-2">{entry.events.map(event => <li key={event.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700"><span className="font-semibold text-slate-900">{eventLabels[event.action] || event.action}</span>{event.note && <span> · {event.note}</span>}<span className="ml-2 text-slate-500">{formatDate(event.createdAt)}</span></li>)}</ol></div>
          </CardContent>
        </Card>;
      })}
    </div>}

    <Card className="border-dashed border-slate-300"><CardContent className="p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Limites volontairement conservées</p><p className="mt-1">Ce centre n’envoie aucun e-mail, n’active aucun transporteur, ne déclenche aucun remboursement Stripe ou Chargily et ne modifie ni le paiement ni le statut de la commande. Les actions financières restent réalisées et validées dans le compte vendeur du prestataire.</p></CardContent></Card>
  </div>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "amber" | "sky" | "violet" | "rose" }) {
  const classes = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : tone === "sky" ? "border-sky-200 bg-sky-50 text-sky-950" : tone === "violet" ? "border-violet-200 bg-violet-50 text-violet-950" : "border-rose-200 bg-rose-50 text-rose-950";
  return <div className={`rounded-xl border p-4 ${classes}`}><p className="text-xs font-bold uppercase tracking-wide opacity-75">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}
