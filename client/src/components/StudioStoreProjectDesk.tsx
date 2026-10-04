import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Copy, FileText, Loader2, MessageSquareText, RefreshCw, Save, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildStudioStoreProjectTemplates,
  createStudioStoreProjectDesk,
  studioStoreHandoverKeys,
  studioStoreHandoverLabels,
  studioStoreProjectStageLabels,
  studioStoreProjectStages,
  type StudioStoreProjectDesk,
  type StudioStoreProjectTemplateKind,
} from "@shared/studioStoreProjectDesk";

const stagePresentation = {
  new_project: "border-slate-200 bg-slate-50 text-slate-800",
  to_analyze: "border-amber-200 bg-amber-50 text-amber-900",
  to_prepare: "border-violet-200 bg-violet-50 text-violet-900",
  ready: "border-sky-200 bg-sky-50 text-sky-900",
  handed_over: "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newReminderId() {
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-CH", { dateStyle: "medium" });
}

export default function StudioStoreProjectDesk({ storeId, storeName, domain, onRefresh }: { storeId: number; storeName: string; domain: string; onRefresh?: () => void }) {
  const utils = trpc.useUtils();
  const deskQuery = trpc.admin.studio.getStoreProjectDesk.useQuery({ storeId }, { enabled: storeId > 0, refetchOnWindowFocus: false });
  const [desk, setDesk] = useState<StudioStoreProjectDesk>(() => createStudioStoreProjectDesk());
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState(today());
  const [selectedTemplate, setSelectedTemplate] = useState<StudioStoreProjectTemplateKind | null>(null);

  useEffect(() => {
    if (deskQuery.data) setDesk(deskQuery.data.desk);
  }, [deskQuery.data]);

  const save = trpc.admin.studio.saveStoreProjectDesk.useMutation({
    onSuccess: async result => {
      setDesk(result.desk);
      toast.success("Suivi Studio enregistré. Aucun e-mail, domaine, paiement ou publication n’a été déclenché.");
      await utils.admin.studio.getStoreProjectDesk.invalidate({ storeId });
      onRefresh?.();
    },
    onError: error => toast.error(error.message || "Le suivi Studio n’a pas pu être enregistré."),
  });

  const templates = useMemo(() => buildStudioStoreProjectTemplates({ storeName, domain }), [storeName, domain]);
  const activeTemplate = templates.find(template => template.kind === selectedTemplate) ?? null;
  const handoverDone = studioStoreHandoverKeys.filter(key => desk.handover[key]).length;
  const outstandingReminders = desk.reminders.filter(reminder => !reminder.completed).length;

  const saveDesk = () => save.mutate({ storeId, desk });
  const addReminder = () => {
    const title = reminderTitle.trim();
    if (!title || !reminderDate) return;
    if (desk.reminders.length >= 12) return toast.error("La limite de 12 rappels par boutique est atteinte.");
    setDesk(current => ({
      ...current,
      reminders: [...current.reminders, { id: newReminderId(), title: title.slice(0, 160), dueDate: reminderDate, completed: false, createdAt: new Date().toISOString() }],
    }));
    setReminderTitle("");
    setReminderDate(today());
  };

  const copyTemplate = async () => {
    if (!activeTemplate) return;
    try {
      await navigator.clipboard.writeText(activeTemplate.content);
      toast.success("Brouillon copié. Il n’a été ni envoyé ni enregistré comme contrat.");
    } catch {
      toast.error("Copie impossible dans ce navigateur. Sélectionnez le texte manuellement.");
    }
  };

  if (deskQuery.isLoading && !deskQuery.data) return <Card className="border-sky-200"><CardContent className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-sky-700" /></CardContent></Card>;
  if (deskQuery.isError) return <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm leading-6 text-rose-950"><strong>Suivi Studio indisponible.</strong><p className="mt-1">Aucune note, étape ou échéance n’a été modifiée.</p></CardContent></Card>;

  return <Card className="border-violet-200 shadow-sm" data-testid="studio-store-project-desk">
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-violet-700" /> Bureau de suivi Studio</CardTitle><CardDescription className="mt-1 max-w-3xl">Pilotez la préparation de cette seule boutique : étape commerciale, notes internes, rappels manuels et remise. Les notes sont chiffrées au repos ; ce bureau ne contacte personne et ne modifie jamais la boutique.</CardDescription></div>
        <div className="flex items-center gap-2"><Badge variant="outline" className={stagePresentation[desk.stage]}>{studioStoreProjectStageLabels[desk.stage]}</Badge><Button type="button" size="icon" variant="outline" className="min-h-10 min-w-10" aria-label="Actualiser le suivi Studio" disabled={deskQuery.isFetching} onClick={() => deskQuery.refetch()}>{deskQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      <section className="overflow-x-auto pb-1"><div className="flex min-w-[690px] gap-2" role="list" aria-label="Étapes de préparation commerciale">{studioStoreProjectStages.map((stage, index) => <button key={stage} type="button" onClick={() => setDesk(current => ({ ...current, stage }))} className={`min-h-16 flex-1 rounded-xl border p-3 text-left text-sm transition ${desk.stage === stage ? "border-violet-500 bg-violet-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"}`}><span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${desk.stage === stage ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{index + 1}</span><span className="font-semibold">{studioStoreProjectStageLabels[stage]}</span></button>)}</div></section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-violet-700" /><div><p className="font-semibold text-slate-950">Notes internes</p><p className="text-xs leading-5 text-slate-600">À réserver au suivi opérateur : pas de secrets, coordonnées bancaires ou données client.</p></div></div><Textarea className="mt-4 min-h-44 resize-y bg-slate-50" aria-label="Notes internes Studio" maxLength={4_000} value={desk.notes} onChange={event => setDesk(current => ({ ...current, notes: event.target.value.slice(0, 4_000) }))} placeholder="Ex. éléments à préparer, point de décision, prochaine étape manuelle…" /><p className="mt-2 text-right text-xs text-slate-500">{desk.notes.length}/4 000</p></section>

        <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4"><div className="flex items-center gap-2"><TimerReset className="h-5 w-5 text-sky-700" /><div><p className="font-semibold text-slate-950">Rappels ciblés</p><p className="text-xs leading-5 text-slate-600">Repères internes uniquement : aucune notification automatique n’est envoyée.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_auto]"><Input aria-label="Titre du rappel" value={reminderTitle} maxLength={160} onChange={event => setReminderTitle(event.target.value)} placeholder="Ex. relire le guide DNS" /><Input aria-label="Date du rappel" type="date" value={reminderDate} onChange={event => setReminderDate(event.target.value)} /><Button type="button" variant="outline" className="min-h-10 border-sky-200 bg-white text-sky-900 hover:bg-sky-100" disabled={!reminderTitle.trim() || !reminderDate || desk.reminders.length >= 12} onClick={addReminder}>Ajouter</Button></div>{desk.reminders.length ? <div className="mt-4 space-y-2">{desk.reminders.map(reminder => <label key={reminder.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${reminder.completed ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-sky-100 bg-white text-slate-800"}`}><input type="checkbox" className="mt-1 h-4 w-4" checked={reminder.completed} onChange={() => setDesk(current => ({ ...current, reminders: current.reminders.map(item => item.id === reminder.id ? { ...item, completed: !item.completed } : item) }))} /><span className="min-w-0 flex-1"><span className={`block font-medium ${reminder.completed ? "line-through opacity-70" : ""}`}>{reminder.title}</span><span className="mt-0.5 block text-xs opacity-75">Échéance : {dateLabel(reminder.dueDate)}</span></span><button type="button" className="text-xs font-semibold text-slate-500 hover:text-rose-700" onClick={event => { event.preventDefault(); setDesk(current => ({ ...current, reminders: current.reminders.filter(item => item.id !== reminder.id) })); }}>Retirer</button></label>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-sky-200 bg-white/70 p-3 text-xs leading-5 text-slate-600">Aucun rappel local pour cette boutique.</p>}<p className="mt-3 text-xs text-sky-900">{outstandingReminders} rappel{outstandingReminders > 1 ? "s" : ""} à suivre.</p></section>
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-semibold text-emerald-950"><CheckCircle2 className="h-5 w-5 text-emerald-700" /> Checklist de remise</p><p className="mt-1 text-xs leading-5 text-emerald-900">Prépare la transmission ; elle ne remet aucun accès, n’envoie aucun message et ne change pas le statut public.</p></div><Badge variant="outline" className="border-emerald-200 bg-white text-emerald-900">{handoverDone}/{studioStoreHandoverKeys.length} préparés</Badge></div><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">{studioStoreHandoverKeys.map(key => <label key={key} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${desk.handover[key] ? "border-emerald-200 bg-white text-emerald-950" : "border-emerald-100 bg-white/70 text-slate-700"}`}><input type="checkbox" className="mt-0.5 h-4 w-4" checked={desk.handover[key]} onChange={() => setDesk(current => ({ ...current, handover: { ...current.handover, [key]: !current.handover[key] } }))} /><span>{studioStoreHandoverLabels[key]}</span></label>)}</div></section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 font-semibold text-slate-950"><FileText className="h-5 w-5 text-slate-700" /> Brouillons prêts à adapter</p><p className="mt-1 text-xs leading-5 text-slate-600">Devis, contrat de création et remise : à relire et valider par un humain avant tout partage.</p></div><div className="flex flex-wrap gap-2">{templates.map(template => <Button key={template.kind} type="button" size="sm" variant={selectedTemplate === template.kind ? "default" : "outline"} className={selectedTemplate === template.kind ? "bg-slate-900 hover:bg-slate-800" : "bg-white"} onClick={() => setSelectedTemplate(template.kind)}>{template.label}</Button>)}</div></div>{activeTemplate && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold text-slate-950">{activeTemplate.title}</p><Button type="button" size="sm" variant="outline" className="min-h-10" onClick={copyTemplate}><Copy className="mr-1.5 h-4 w-4" /> Copier le brouillon</Button></div><pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{activeTemplate.content}</pre></div>}<p className="mt-3 text-xs leading-5 text-slate-600">Les modèles ne sont ni des documents juridiques, ni des factures. Ils ne sont jamais envoyés depuis ce bureau.</p></section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-600">Enregistrer conserve uniquement cette fiche de projet Studio, isolée de toutes les autres boutiques.</p><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={save.isPending} onClick={saveDesk}>{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><Save className="mr-2 h-4 w-4" />Enregistrer le suivi</>}</Button></div>
    </CardContent>
  </Card>;
}
