import { useMemo, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { studioStoreProjectStageLabels, studioStoreProjectStages, type StudioStoreProjectStage } from "@shared/studioStoreProjectDesk";
import { studioProductionBoardPageSizes, type StudioProductionBoardPageSize } from "@shared/studioProductionBoard";
import { ArrowRight, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, ClipboardCheck, Clock3, ListChecks, Loader2, RefreshCw, Search, Store, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

const stageTone: Record<StudioStoreProjectStage, { column: string; badge: string; marker: string }> = {
  new_project: { column: "border-slate-200 bg-slate-50/70", badge: "border-slate-200 bg-white text-slate-700", marker: "bg-slate-500" },
  to_analyze: { column: "border-sky-200 bg-sky-50/60", badge: "border-sky-200 bg-sky-50 text-sky-800", marker: "bg-sky-500" },
  to_prepare: { column: "border-amber-200 bg-amber-50/70", badge: "border-amber-200 bg-amber-50 text-amber-800", marker: "bg-amber-500" },
  ready: { column: "border-emerald-200 bg-emerald-50/70", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", marker: "bg-emerald-500" },
  handed_over: { column: "border-violet-200 bg-violet-50/70", badge: "border-violet-200 bg-violet-50 text-violet-800", marker: "bg-violet-500" },
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-CH", { day: "2-digit", month: "short" }).format(date);
}

export default function AdminStudioProductionBoard() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<StudioStoreProjectStage | "all">("all");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [reminderOnly, setReminderOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StudioProductionBoardPageSize>(10);
  const boardInput = useMemo(() => ({
    query: query.trim() || undefined,
    stage: selectedStage === "all" ? undefined : selectedStage,
    needsAttention: priorityOnly || undefined,
    hasOpenReminder: reminderOnly || undefined,
    page,
    pageSize,
  }), [page, pageSize, priorityOnly, query, reminderOnly, selectedStage]);
  const boardQuery = trpc.admin.studio.getProductionBoard.useQuery(boardInput, { refetchOnWindowFocus: false });
  const updateStageMutation = trpc.admin.studio.updateStoreProjectStage.useMutation({
    onSuccess: async result => {
      toast.success(`Étape mise à jour : ${result.store.displayName}. La boutique, ses accès, son domaine et ses paiements restent inchangés.`);
      await utils.admin.studio.getProductionBoard.invalidate();
    },
    onError: error => toast.error(error.message || "L’étape de production n’a pas pu être mise à jour."),
  });
  const stores = boardQuery.data?.stores ?? [];
  const board = boardQuery.data;

  return <DashboardLayout><main className="mx-auto w-full max-w-[1680px] space-y-6 px-4 py-6 md:px-8 md:py-8" data-testid="studio-production-board">
    <header className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/30 md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2"><Badge className="border border-orange-300/35 bg-orange-400/15 text-orange-100 hover:bg-orange-400/15">MAZIGHO Studio</Badge><Badge className="border border-white/15 bg-white/10 text-slate-100 hover:bg-white/10">Pilotage opérateur</Badge></div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Tableau de production</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">Pilotez chaque boutique de la demande à la remise : étape en cours, checklist, rappel et prochaine action. Le portefeuille est paginé ; seul le déplacement d’une étape de suivi est possible ici, sans modifier la boutique, les accès, le domaine ni les paiements.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[500px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3"><p className="text-xs text-slate-400">Boutiques</p><p className="mt-1 text-2xl font-bold">{board?.summary.total ?? "–"}</p></div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3"><p className="text-xs text-amber-100">À suivre</p><p className="mt-1 text-2xl font-bold text-white">{board?.summary.needsAttention ?? "–"}</p></div>
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] p-3"><p className="text-xs text-emerald-100">Prêtes</p><p className="mt-1 text-2xl font-bold text-white">{board?.summary.readyForHandover ?? "–"}</p></div>
          <div className="rounded-xl border border-violet-300/20 bg-violet-300/[0.08] p-3"><p className="text-xs text-violet-100">Remises</p><p className="mt-1 text-2xl font-bold text-white">{board?.summary.handedOver ?? "–"}</p></div>
        </div>
      </div>
    </header>

    <Card className="border-slate-200">
      <CardHeader className="pb-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-orange-700" /> File de production</CardTitle><CardDescription className="mt-1.5 max-w-3xl">Les notes internes et les intitulés de rappels restent protégés dans chaque dossier. Ici, seules les dates, l’avancement et les indicateurs agrégés sont visibles.</CardDescription></div><Button type="button" variant="outline" className="min-h-11 border-slate-300 bg-white" onClick={() => void boardQuery.refetch()} disabled={boardQuery.isFetching}>{boardQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Actualiser</Button></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} className="min-h-11 bg-white pl-9" placeholder="Nom ou domaine de la boutique…" aria-label="Rechercher dans la production" /></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant={selectedStage === "all" && !priorityOnly && !reminderOnly ? "default" : "outline"} className={selectedStage === "all" && !priorityOnly && !reminderOnly ? "min-h-11 bg-slate-950 hover:bg-slate-800" : "min-h-11 bg-white"} onClick={() => { setSelectedStage("all"); setPriorityOnly(false); setReminderOnly(false); setPage(1); }}>Toutes <Badge className="ml-2 border-0 bg-white/15 text-current hover:bg-white/15">{board?.summary.total ?? 0}</Badge></Button><Button type="button" size="sm" variant="outline" className={`min-h-11 ${priorityOnly ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => { setPriorityOnly(current => !current); setPage(1); }}><CircleAlert className="mr-1.5 h-4 w-4" />À traiter <Badge variant="outline" className={`ml-1.5 ${priorityOnly ? "border-amber-300 bg-white text-amber-950" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{board?.summary.needsAttention ?? 0}</Badge></Button><Button type="button" size="sm" variant="outline" className={`min-h-11 ${reminderOnly ? "border-sky-300 bg-sky-50 text-sky-950" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => { setReminderOnly(current => !current); setPage(1); }}><CalendarClock className="mr-1.5 h-4 w-4" />Rappels <Badge variant="outline" className={`ml-1.5 ${reminderOnly ? "border-sky-300 bg-white text-sky-950" : "border-sky-200 bg-sky-50 text-sky-800"}`}>{board?.summary.withUpcomingReminder ?? 0}</Badge></Button>{studioStoreProjectStages.map(stage => <Button key={stage} type="button" size="sm" variant="outline" className={`min-h-11 ${selectedStage === stage ? stageTone[stage].badge : "border-slate-200 bg-white text-slate-700"}`} onClick={() => { setSelectedStage(stage); setPage(1); }}>{studioStoreProjectStageLabels[stage]} <Badge variant="outline" className={`ml-2 ${stageTone[stage].badge}`}>{board?.summary.byStage[stage] ?? 0}</Badge></Button>)}</div></div>
        {boardQuery.isLoading ? <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">{studioStoreProjectStages.map(stage => <div key={stage} className="h-72 animate-pulse rounded-2xl bg-slate-100" />)}</div> : boardQuery.isError ? <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-950"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Le tableau de production est momentanément indisponible.</p><p className="mt-1">Aucune donnée de boutique n’a été modifiée. Vous pouvez actualiser ou revenir au registre Studio.</p></div></div> : <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600"><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{board ? `${board.pagination.from}–${board.pagination.to} sur ${board.pagination.total}` : "Chargement…"}</Badge>{board?.summary.withUpcomingReminder ? <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800"><CalendarClock className="mr-1 h-3.5 w-3.5" />{board.summary.withUpcomingReminder} rappel{board.summary.withUpcomingReminder > 1 ? "s" : ""} à suivre</Badge> : null}<span>Vous pouvez déplacer une boutique entre les étapes : cette organisation reste réversible et n’ouvre rien automatiquement.</span></div>
          <div className="grid gap-4 xl:grid-cols-5">{studioStoreProjectStages.filter(stage => selectedStage === "all" || selectedStage === stage).map(stage => {
            const stageStores = stores.filter(store => store.stage === stage);
            const tone = stageTone[stage];
            return <section key={stage} className={`min-w-0 rounded-2xl border p-3 ${tone.column}`} aria-labelledby={`production-stage-${stage}`}><div className="flex items-start justify-between gap-2 border-b border-black/5 pb-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${tone.marker}`} /><h2 id={`production-stage-${stage}`} className="text-sm font-bold text-slate-950">{studioStoreProjectStageLabels[stage]}</h2></div><Badge variant="outline" className={tone.badge}>{stageStores.length}</Badge></div><div className="mt-3 space-y-3">{stageStores.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 text-xs leading-5 text-slate-600">Aucune boutique à cette étape.</p> : stageStores.map(store => <article key={store.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2"><Store className="h-4 w-4 shrink-0 text-slate-500" /><p className="truncate text-sm font-bold text-slate-950">{store.displayName}</p></div><p className="mt-1 truncate text-xs text-slate-500">{store.primaryDomain}</p></div><Badge variant="outline" className={tone.badge}>{store.handoverComplete}/{store.handoverTotal}</Badge></div>{store.attention.length > 0 ? <div className="mt-3 space-y-1.5">{store.attention.map(item => <p key={item} className="flex gap-1.5 text-xs leading-5 text-amber-950"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />{item}</p>)}</div> : <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Aucun point d’attention signalé.</p>}<div className="mt-3 border-t border-slate-100 pt-3"><label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500" htmlFor={`production-stage-select-${store.id}`}>Étape de production</label><Select value={store.stage} onValueChange={nextStage => updateStageMutation.mutate({ storeId: store.id, stage: nextStage as StudioStoreProjectStage })} disabled={updateStageMutation.isPending}><SelectTrigger id={`production-stage-select-${store.id}`} className="mt-1 min-h-10 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{studioStoreProjectStages.map(nextStage => <SelectItem key={nextStage} value={nextStage}>{studioStoreProjectStageLabels[nextStage]}</SelectItem>)}</SelectContent></Select><p className="mt-1.5 text-[11px] leading-4 text-slate-500">Réversible · uniquement le suivi Studio.</p></div><div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">{store.nextReminderDueDate ? <><Clock3 className="h-3.5 w-3.5 shrink-0 text-sky-700" />Rappel {formatDate(store.nextReminderDueDate)}</> : <><ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />Aucun rappel</>}</span><Link href={store.action.href} className="inline-flex min-h-9 shrink-0 items-center text-xs font-semibold text-slate-900 hover:text-orange-700">{store.action.label}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></div></article>)}</div></section>;
          })}</div>
          {board ? <nav className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination des boutiques de production"><div className="flex flex-wrap items-center gap-2"><p className="text-xs text-slate-600">Page <strong className="text-slate-950">{board.pagination.page}</strong> sur <strong className="text-slate-950">{board.pagination.totalPages}</strong></p><Select value={String(pageSize)} onValueChange={value => { setPageSize(Number(value) as StudioProductionBoardPageSize); setPage(1); }}><SelectTrigger className="h-9 w-40 bg-white text-xs" aria-label="Boutiques par page"><SelectValue /></SelectTrigger><SelectContent>{studioProductionBoardPageSizes.map(size => <SelectItem key={size} value={String(size)}>{size} boutiques / page</SelectItem>)}</SelectContent></Select></div><div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10 bg-white" disabled={board.pagination.page <= 1 || boardQuery.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Précédente</Button><Button type="button" size="sm" variant="outline" className="min-h-10 bg-white" disabled={board.pagination.page >= board.pagination.totalPages || boardQuery.isFetching} onClick={() => setPage(current => Math.min(board.pagination.totalPages, current + 1))}>Suivante<ChevronRight className="ml-1 h-4 w-4" /></Button></div></nav> : null}
        </>}
      </CardContent>
    </Card>

    <section className="grid gap-4 lg:grid-cols-3"><Card className="border-sky-200 bg-sky-50/60"><CardContent className="p-5"><CalendarClock className="h-5 w-5 text-sky-700" /><h2 className="mt-3 font-bold text-sky-950">Rappels contrôlés</h2><p className="mt-1 text-sm leading-6 text-sky-900">Seules les dates de rappels ouverts sont affichées. Leur contenu reste dans le bureau propre à chaque boutique ; aucune notification n’est envoyée.</p></CardContent></Card><Card className="border-emerald-200 bg-emerald-50/60"><CardContent className="p-5"><ClipboardCheck className="h-5 w-5 text-emerald-700" /><h2 className="mt-3 font-bold text-emerald-950">Remise lisible</h2><p className="mt-1 text-sm leading-6 text-emerald-900">Le compteur de remise reprend uniquement la checklist opérateur. Il ne transmet jamais d’accès, de mot de passe ou de document au client.</p></CardContent></Card><Card className="border-slate-200 bg-slate-50"><CardContent className="p-5"><Store className="h-5 w-5 text-slate-700" /><h2 className="mt-3 font-bold text-slate-950">Dossier isolé</h2><p className="mt-1 text-sm leading-6 text-slate-700">Chaque action mène vers le dossier de la boutique concernée. Les catalogues, réglages, domaines et données restent strictement isolés.</p></CardContent></Card></section>
  </main></DashboardLayout>;
}
