import { useState } from "react";
import { Headphones, Loader2, LockKeyhole, Plus, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoreSupportTicketTopic } from "@shared/storeSupportTickets";
import { toast } from "sonner";

const topicOptions: Array<{ id: StoreSupportTicketTopic; label: string }> = [
  { id: "access", label: "Accès & équipe" },
  { id: "domain", label: "Domaine & DNS" },
  { id: "catalog", label: "Catalogue & vitrine" },
  { id: "billing", label: "Offre SaaS & facturation" },
  { id: "technical", label: "Incident technique" },
];

const statusPresentation = {
  open: { label: "Ouvert", className: "border-amber-200 bg-amber-50 text-amber-900" },
  reviewing: { label: "En cours", className: "border-sky-200 bg-sky-50 text-sky-900" },
  resolved: { label: "Résolu", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
} as const;

export default function OwnerSupportCenter() {
  const tickets = trpc.owner.getSupportTickets.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [topic, setTopic] = useState<StoreSupportTicketTopic>("technical");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const create = trpc.owner.createSupportTicket.useMutation({
    onSuccess: async () => { setSubject(""); setMessage(""); await tickets.refetch(); toast.success("Demande d’assistance enregistrée pour MAZIGHO Studio."); },
    onError: error => toast.error(error.message),
  });
  const canSubmit = subject.trim().length >= 3 && message.trim().length >= 10;

  return <div className="space-y-5">
    <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Headphones className="h-5 w-5 text-sky-700" /> Assistance MAZIGHO</CardTitle><CardDescription className="mt-2 max-w-3xl">Décrivez le besoin de votre boutique. La demande reste isolée de toutes les autres boutiques et est visible dans MAZIGHO Studio. Elle n’envoie aucun e-mail et ne donne à personne accès à votre compte.</CardDescription></div><Badge variant="outline" className="w-fit border-sky-200 bg-white text-sky-900">Support sans accès au compte</Badge></div></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.7fr)]"><div className="space-y-4"><div className="space-y-2"><Label htmlFor="owner-support-topic">Sujet</Label><select id="owner-support-topic" value={topic} onChange={event => setTopic(event.target.value as StoreSupportTicketTopic)} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">{topicOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="owner-support-subject">Titre de la demande</Label><Input id="owner-support-subject" value={subject} onChange={event => setSubject(event.target.value)} maxLength={120} placeholder="Ex. Besoin d’aide pour relier mon domaine" /></div><div className="space-y-2"><Label htmlFor="owner-support-message">Décrivez ce qui bloque</Label><Textarea id="owner-support-message" rows={6} value={message} onChange={event => setMessage(event.target.value)} maxLength={2000} placeholder="Indiquez la page concernée, ce que vous avez essayé et le résultat obtenu. Ne mettez jamais de mot de passe, clé API, code de paiement ou donnée client." /><p className="text-xs text-slate-500">{message.length}/2000 caractères</p></div><Button type="button" className="min-h-11 bg-sky-700 hover:bg-sky-800" disabled={!canSubmit || create.isPending} onClick={() => create.mutate({ topic, subject, message })}>{create.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><Send className="mr-2 h-4 w-4" />Envoyer la demande</>}</Button></div><aside className="rounded-xl border border-sky-200 bg-white/80 p-4 text-sm leading-6 text-sky-950"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-sky-800" /><div><p className="font-semibold">Aucun accès délégué</p><p className="mt-1 text-xs leading-5 text-slate-700">Le support ne peut pas se connecter « à votre place ». Une intervention sur un domaine, un paiement ou un compte nécessitera toujours une procédure séparée et explicite.</p></div></div></aside></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-slate-700" /> Mes demandes</CardTitle><CardDescription>Les réponses Studio restent dans ce panneau. Aucune notification ou automatisation commerciale n’est déclenchée.</CardDescription></CardHeader><CardContent>{tickets.isLoading ? <div className="h-40 animate-pulse rounded-xl bg-slate-100" /> : tickets.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Les demandes sont temporairement indisponibles. Aucun ticket n’a été modifié.</div> : tickets.data?.tickets.length ? <div className="space-y-3">{tickets.data.tickets.map(ticket => { const status = statusPresentation[ticket.status]; const topicLabel = topicOptions.find(option => option.id === ticket.topic)?.label || ticket.topic; return <section key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{ticket.subject}</p><Badge variant="outline" className={status.className}>{status.label}</Badge><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{topicLabel}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-700">{ticket.message}</p></div><p className="shrink-0 text-xs text-slate-500">{new Date(ticket.updatedAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}</p></div>{ticket.operatorReply && <div className="mt-4 rounded-lg border border-sky-200 bg-white p-3 text-sm leading-6 text-slate-800"><p className="text-xs font-bold uppercase tracking-wide text-sky-800">Réponse MAZIGHO Studio</p><p className="mt-1">{ticket.operatorReply}</p></div>}</section>; })}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Aucune demande pour le moment. Utilisez le formulaire ci-dessus si vous avez besoin d’aide sur cette boutique.</div>}</CardContent></Card>
  </div>;
}
