import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Globe2, Link2, Loader2, Search, ShieldCheck, Wrench } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import type { StudioCustomDomainConnectionFilter, StudioCustomDomainConnectionStatus } from "@shared/studioCustomDomainRegistry";

const connectionPresentation: Record<StudioCustomDomainConnectionStatus, { label: string; className: string }> = {
  recovery_only: { label: "Adresse MAZIGHO", className: "border-slate-200 bg-slate-50 text-slate-700" },
  requested: { label: "Domaine demandé", className: "border-amber-200 bg-amber-50 text-amber-900" },
  guide_ready: { label: "Guide prêt", className: "border-sky-200 bg-sky-50 text-sky-900" },
  client_acknowledged: { label: "Client prêt", className: "border-violet-200 bg-violet-50 text-violet-900" },
  linked: { label: "Rattaché", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  recovery_active: { label: "Secours actif", className: "border-rose-200 bg-rose-50 text-rose-800" },
  legacy_custom_domain: { label: "À inventorier", className: "border-slate-200 bg-slate-50 text-slate-700" },
};

const filterOptions: Array<{ value: "" | StudioCustomDomainConnectionFilter; label: string }> = [
  { value: "", label: "Tous les états" },
  { value: "needs_attention", label: "À traiter" },
  { value: "requested", label: "Domaine demandé" },
  { value: "guide_ready", label: "Guide prêt" },
  { value: "client_acknowledged", label: "Client prêt" },
  { value: "linked", label: "Rattaché" },
  { value: "recovery_active", label: "Secours actif" },
];

export default function AdminStudioCustomDomains() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | StudioCustomDomainConnectionFilter>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const registryQuery = trpc.admin.studio.getCustomDomainRegistry.useQuery({
    query: query.trim() || undefined,
    status: status || undefined,
    page,
    pageSize,
  }, { refetchOnWindowFocus: false });
  const data = registryQuery.data;

  useEffect(() => { setPage(1); }, [query, status, pageSize]);

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge><Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-900">Registre opérateur</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Domaines personnalisés</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Suivez les domaines de centaines de boutiques, de la demande jusqu’au rattachement confirmé. Le DNS client et Vercel restent sous contrôle séparé ; aucune ouverture de boutique n’est automatique.</p></div><Button asChild variant="outline" className="min-h-11 border-sky-200 text-sky-900 hover:bg-sky-50"><a href="https://vercel.com/mazigho/mazigho-shop/settings/domains" target="_blank" rel="noreferrer"><Globe2 className="mr-2 h-4 w-4" /> Domaines Vercel</a></Button></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Globe2} label="Boutiques clientes" value={data?.summary.total ?? 0} tone="slate" /><Metric icon={Wrench} label="À traiter" value={data?.summary.needsAttention ?? 0} tone="amber" /><Metric icon={Link2} label="Domaines rattachés" value={data?.summary.linked ?? 0} tone="emerald" /><Metric icon={ShieldCheck} label="Secours actif" value={data?.summary.recoveryActive ?? 0} tone="rose" /></section>

    <Card className="border-slate-200"><CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-sky-700" /> Rechercher et filtrer</CardTitle><CardDescription>Recherche par boutique, sous-domaine MAZIGHO ou domaine personnalisé. La liste est paginée côté serveur pour rester fluide à grande échelle.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_140px]"><div className="space-y-2"><Label htmlFor="custom-domain-search">Rechercher</Label><Input id="custom-domain-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom, domaine ou identifiant de boutique" /></div><div className="space-y-2"><Label htmlFor="custom-domain-status">État du raccordement</Label><select id="custom-domain-status" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={status} onChange={event => setStatus(event.target.value as "" | StudioCustomDomainConnectionFilter)}>{filterOptions.map(option => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="custom-domain-page-size">Par page</Label><select id="custom-domain-page-size" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={pageSize} onChange={event => setPageSize(Number(event.target.value) as 20 | 50 | 100)}><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></div></CardContent></Card>

    <Card className="border-slate-200"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>Portefeuille de domaines</CardTitle><CardDescription className="mt-1">Un domaine ne peut être rattaché qu’à une seule boutique. Chaque ligne donne accès au guide DNS, au contrôle public et au rattachement confirmé.</CardDescription></div>{data && <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{data.pagination.total} résultat{data.pagination.total > 1 ? "s" : ""}</Badge>}</div></CardHeader><CardContent>{registryQuery.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" /> : registryQuery.isError || !data ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-950">Le registre de domaines est temporairement indisponible. Aucun domaine n’a été modifié.</div> : data.stores.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm leading-6 text-slate-600">Aucune boutique ne correspond à ces critères.</div> : <><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Boutique</th><th className="px-4 py-3 font-semibold">Domaine actuel</th><th className="px-4 py-3 font-semibold">Demande client</th><th className="px-4 py-3 font-semibold">État</th><th className="px-4 py-3 font-semibold">Dernier contrôle</th><th className="px-4 py-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{data.stores.map(store => { const presentation = connectionPresentation[store.connectionStatus]; return <tr key={store.id} className="bg-white"><td className="px-4 py-3"><p className="font-semibold text-slate-950">{store.displayName}</p><p className="mt-1 font-mono text-xs text-slate-500">{store.slug}</p></td><td className="px-4 py-3"><p className="max-w-56 break-all font-mono text-xs text-slate-700">{store.primaryDomain}</p><p className="mt-1 max-w-56 break-all text-xs text-slate-500">Secours : {store.recoveryDomain || "—"}</p></td><td className="px-4 py-3"><p className="max-w-56 break-all font-mono text-xs text-slate-700">{store.requestedDomain || "—"}</p>{store.clientAcknowledgedAt && <p className="mt-1 text-xs text-violet-700">Guide lu par le client</p>}</td><td className="px-4 py-3"><Badge variant="outline" className={presentation.className}>{presentation.label}</Badge></td><td className="px-4 py-3 text-xs text-slate-600">{store.lastDnsCheckAt ? new Date(store.lastDnsCheckAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" }) : "Non contrôlé"}</td><td className="px-4 py-3 text-right"><Button asChild size="sm" variant="outline" className="min-h-10 border-sky-200 text-sky-900 hover:bg-sky-50"><a href={`/admin/studio/gestion-boutique/${store.id}`}>Gérer</a></Button></td></tr>; })}</tbody></table></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-600">Affichage {data.pagination.from}–{data.pagination.to} sur {data.pagination.total}</p><div className="flex gap-2"><Button type="button" variant="outline" className="min-h-11" disabled={data.pagination.page <= 1 || registryQuery.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))}><ChevronLeft className="mr-1 h-4 w-4" /> Précédent</Button><Button type="button" variant="outline" className="min-h-11" disabled={data.pagination.page >= data.pagination.totalPages || registryQuery.isFetching} onClick={() => setPage(current => current + 1)}>Suivant <ChevronRight className="ml-1 h-4 w-4" /></Button></div></div></>}</CardContent></Card>

    <section className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Garde-fous :</strong> cette vue ne connaît ni identifiants registrar, ni clés Vercel, ni données client. Le DNS est uniquement observé publiquement. Le rattachement exige une confirmation explicite dans la fiche de boutique ; il ne publie pas la vitrine et n’active aucun paiement.</p></section>
  </main></DashboardLayout>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Globe2; label: string; value: number; tone: "slate" | "amber" | "emerald" | "rose" }) {
  const classes = { slate: "border-slate-200 bg-slate-50 text-slate-950", amber: "border-amber-200 bg-amber-50 text-amber-950", emerald: "border-emerald-200 bg-emerald-50 text-emerald-950", rose: "border-rose-200 bg-rose-50 text-rose-950" }[tone];
  return <Card className={classes}><CardContent className="flex items-center gap-3 p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/80"><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{value}</p><p className="text-xs font-semibold leading-5 opacity-80">{label}</p></div></CardContent></Card>;
}
