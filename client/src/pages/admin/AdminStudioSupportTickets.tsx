import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChevronLeft, ChevronRight, Headphones, Loader2, LockKeyhole, RefreshCw, Search, Send } from "lucide-react";
import type { StoreSupportTicketStatus } from "@shared/storeSupportTickets";
import { toast } from "sonner";

type TicketFilter = "all" | StoreSupportTicketStatus;

const statusPresentation = {
  open: { label: "Ouvert", className: "border-amber-200 bg-amber-50 text-amber-900" },
  reviewing: { label: "En cours", className: "border-sky-200 bg-sky-50 text-sky-900" },
  resolved: { label: "Résolu", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
} as const;

const topicLabels: Record<string, string> = { access: "Accès & équipe", domain: "Domaine & DNS", catalog: "Catalogue & vitrine", billing: "Offre SaaS & facturation", technical: "Incident technique" };

export default function AdminStudioSupportTickets() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TicketFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const ticketsQuery = trpc.admin.studio.getStoreSupportTickets.useQuery({ query: query.trim() || undefined, status: status === "all" ? undefined : status, page, pageSize }, { refetchOnWindowFocus: false });
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => (ticketsQuery.data?.tickets ?? []).find(ticket => ticket.id === selectedId), [ticketsQuery.data?.tickets, selectedId]);
  const [nextStatus, setNextStatus] = useState<StoreSupportTicketStatus>("open");
  const [reply, setReply] = useState("");

  useEffect(() => {
    const listed = ticketsQuery.data?.tickets ?? [];
    if (!listed.length) { if (selectedId) setSelectedId(""); return; }
    if (!listed.some(ticket => ticket.id === selectedId)) setSelectedId(listed[0].id);
  }, [ticketsQuery.data?.tickets, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setNextStatus(selected.status);
    setReply(selected.operatorReply);
  }, [selected?.id]);

  const update = trpc.admin.studio.updateStoreSupportTicket.useMutation({
    onSuccess: async () => { toast.success("Ticket mis à jour. Aucun accès au compte ni e-mail n’a été déclenché."); await utils.admin.studio.getStoreSupportTickets.invalidate(); },
    onError: error => toast.error(error.message || "Le ticket n’a pas pu être mis à jour."),
  });
  const pagination = ticketsQuery.data?.pagination;

  return <DashboardLayout><main className="min-h-full bg-slate-50"><div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 lg:px-8"><div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between"><div><Link href="/admin/studio" className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au Studio</Link><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Relation boutiques</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Assistance boutiques</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Traitez les demandes venant des panneaux propriétaires. Le support reste cloisonné : aucune impersonation, aucun accès aux comptes, aucun e-mail automatique ni modification commerciale.</p></div><Button variant="outline" className="min-h-11 bg-white" disabled={ticketsQuery.isFetching} onClick={() => ticketsQuery.refetch()}>{ticketsQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Actualiser</Button></div>
    {ticketsQuery.isLoading ? <div className="grid gap-4 md:grid-cols-3"><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /></div> : ticketsQuery.isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm leading-6 text-rose-950">Les tickets sont temporairement indisponibles. Aucun ticket, accès ou compte n’a été modifié.</CardContent></Card> : <><section className="grid gap-4 md:grid-cols-3"><Metric label="Tickets ouverts" value={ticketsQuery.data?.summary.open ?? 0} tone="amber" /><Metric label="En cours" value={ticketsQuery.data?.summary.reviewing ?? 0} tone="sky" /><Metric label="Résolus" value={ticketsQuery.data?.summary.resolved ?? 0} tone="emerald" /></section>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Headphones className="h-5 w-5 text-violet-700" /> File d’assistance</CardTitle><CardDescription>Recherche et pagination permettent de suivre un grand nombre de boutiques sans charger une page interminable.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_120px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="min-h-11 bg-white pl-9" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Boutique, domaine ou sujet…" /></div><select value={status} onChange={event => { setStatus(event.target.value as TicketFilter); setPage(1); }} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">Tous les états</option><option value="open">Ouverts</option><option value="reviewing">En cours</option><option value="resolved">Résolus</option></select><select value={String(pageSize)} onChange={event => { setPageSize(Number(event.target.value) as 20 | 50 | 100); setPage(1); }} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="20">20 / page</option><option value="50">50 / page</option><option value="100">100 / page</option></select></div>
        {(ticketsQuery.data?.tickets ?? []).length ? <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,.9fr)]"><div className="space-y-3">{ticketsQuery.data?.tickets.map(ticket => { const ticketStatus = statusPresentation[ticket.status]; return <button key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedId === ticket.id ? "border-violet-400 bg-violet-50 ring-1 ring-violet-200" : "border-slate-200 bg-white hover:border-violet-200"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{ticket.subject}</p><Badge variant="outline" className={ticketStatus.className}>{ticketStatus.label}</Badge></div><p className="mt-1 text-xs font-medium text-violet-800">{ticket.store.displayName} · {ticket.store.primaryDomain}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{ticket.message}</p></div><p className="shrink-0 text-xs text-slate-500">{new Date(ticket.updatedAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}</p></div></button>; })}</div>
          {selected && <aside className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-violet-700">{selected.store.displayName}</p><p className="mt-1 font-semibold text-slate-950">{selected.subject}</p><p className="mt-1 text-xs text-slate-600">{selected.store.primaryDomain} · {topicLabels[selected.topic]}</p></div><Badge variant="outline" className={statusPresentation[selected.status].className}>{statusPresentation[selected.status].label}</Badge></div><div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800">{selected.message}</div><div className="mt-5 space-y-2"><Label htmlFor="studio-ticket-status">État</Label><select id="studio-ticket-status" value={nextStatus} onChange={event => setNextStatus(event.target.value as StoreSupportTicketStatus)} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="open">Ouvert</option><option value="reviewing">En cours</option><option value="resolved">Résolu</option></select></div><div className="mt-4 space-y-2"><Label htmlFor="studio-ticket-reply">Réponse visible par la boutique</Label><Textarea id="studio-ticket-reply" rows={7} maxLength={1600} value={reply} onChange={event => setReply(event.target.value)} placeholder="Expliquez la prochaine étape sans demander ni afficher de mot de passe ou clé API." /><p className="text-xs text-slate-500">{reply.length}/1600 caractères</p></div><Button type="button" className="mt-4 min-h-11 w-full bg-violet-700 hover:bg-violet-800" disabled={update.isPending} onClick={() => update.mutate({ storeId: selected.store.id, ticketId: selected.id, status: nextStatus, operatorReply: reply })}>{update.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><Send className="mr-2 h-4 w-4" />Enregistrer la réponse</>}</Button><div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" /><p>Cette action répond au ticket uniquement. Elle n’ouvre ni session cliente, ni accès à l’administration propriétaire, ni mot de passe, ni paiement.</p></div></aside>}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Aucun ticket ne correspond aux filtres actifs.</div>}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"><p>{pagination?.total ? <>Affichage {pagination.from}–{pagination.to} sur {pagination.total} ticket{pagination.total > 1 ? "s" : ""} · page {pagination.page} sur {pagination.totalPages}</> : "Aucun ticket affiché"}</p><div className="flex gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10 bg-white" disabled={!pagination || pagination.page <= 1 || ticketsQuery.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))}><ChevronLeft className="mr-1 h-4 w-4" /> Précédent</Button><Button type="button" size="sm" variant="outline" className="min-h-10 bg-white" disabled={!pagination || pagination.page >= pagination.totalPages || ticketsQuery.isFetching} onClick={() => setPage(current => Math.min(pagination?.totalPages ?? current, current + 1))}>Suivant <ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>
      </CardContent></Card></>}
    <Card className="border-dashed border-slate-300 bg-white"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-slate-600"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" /><p><strong className="text-slate-900">Assistance sécurisée, pas d’impersonation.</strong> Le support peut lire le ticket de la boutique concernée et répondre. Il ne peut pas se connecter comme le client, voir son mot de passe, ses clés API, ses paiements, ses adresses ou ses commandes depuis cet écran.</p></CardContent></Card>
  </div></main></DashboardLayout>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "amber" | "sky" | "emerald" }) {
  const classes = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : tone === "sky" ? "border-sky-200 bg-sky-50 text-sky-950" : "border-emerald-200 bg-emerald-50 text-emerald-950";
  return <Card className={classes}><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wide opacity-75">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs leading-5 opacity-80">Tickets isolés par boutique.</p></CardContent></Card>;
}
