import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, RefreshCw, Search, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

const ENTITY_LABELS: Record<string, string> = {
  product: "Produit",
  category: "Catégorie",
  order: "Commande",
  user: "Utilisateur",
  design: "Personnalisation",
  promotion: "Promotion",
};

const ACTION_LABELS: Record<string, string> = {
  "product.create": "Produit créé",
  "product.update": "Produit modifié",
  "product.delete": "Produit supprimé",
  "product.import_cj": "Import CJ",
  "category.create": "Catégorie créée",
  "category.update": "Catégorie modifiée",
  "category.delete": "Catégorie supprimée",
  "order.decide": "Décision commande",
  "order.status": "Statut commande",
  "user.invite": "Invitation staff",
  "user.profile": "Profil client",
  "user.role": "Rôle modifié",
  "user.status": "Statut compte",
  "user.delete": "Compte supprimé",
  "design.update": "Personnalisation",
  "promotion.create": "Promo créée",
  "promotion.update": "Promo modifiée",
  "promotion.delete": "Promo supprimée",
};

const ENTITY_TONE: Record<string, string> = {
  product: "bg-orange-100 text-orange-800",
  category: "bg-sky-100 text-sky-800",
  order: "bg-emerald-100 text-emerald-800",
  user: "bg-violet-100 text-violet-800",
  design: "bg-pink-100 text-pink-800",
  promotion: "bg-amber-100 text-amber-800",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  catalog_editor: "Éditeur catalogue",
  order_operator: "Opérateur commandes",
  support_agent: "Support",
};

const ALL = "__all__";

function formatDateTime(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAudit() {
  const [entityType, setEntityType] = useState<string>(ALL);
  const [actorUserId, setActorUserId] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filtersQuery = trpc.admin.audit.getFilters.useQuery();
  const logsQuery = trpc.admin.audit.getLogs.useQuery({
    entityType: entityType === ALL ? undefined : entityType,
    actorUserId: actorUserId === ALL ? undefined : Number(actorUserId),
    search: search || undefined,
    page,
    pageSize,
  });

  const entries = logsQuery.data?.entries ?? [];
  const total = logsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const actors = filtersQuery.data?.actors ?? [];
  const entityTypes = useMemo(() => {
    const available = filtersQuery.data?.entityTypes ?? [];
    const known = Object.keys(ENTITY_LABELS);
    return available.length ? available.filter(t => known.includes(t)) : [];
  }, [filtersQuery.data?.entityTypes]);

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const resetFilters = () => {
    setEntityType(ALL);
    setActorUserId(ALL);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = entityType !== ALL || actorUserId !== ALL || search.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8" data-testid="admin-audit-page">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-orange-50">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-700">
                <ShieldCheck className="h-4 w-4" /> Traçabilité & sécurité
              </div>
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                <ScrollText className="h-8 w-8 text-orange-600" /> Journal d'audit
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                Historique des actions sensibles de l'équipe : produits, commandes, catégories, personnalisation et gestion des comptes.
              </p>
            </div>
            <Button
              onClick={() => logsQuery.refetch()}
              disabled={logsQuery.isFetching}
              variant="outline"
              className="border-orange-200 bg-white text-orange-700 hover:bg-orange-100"
              data-testid="audit-refresh-button"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${logsQuery.isFetching ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </section>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-5">
            <CardTitle className="text-xl text-slate-900">Filtres</CardTitle>
            <CardDescription>Affinez l'historique par type d'action, membre de l'équipe ou mot-clé.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
                <Select value={entityType} onValueChange={value => { setEntityType(value); setPage(1); }}>
                  <SelectTrigger data-testid="audit-filter-entity"><SelectValue placeholder="Tous les types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tous les types</SelectItem>
                    {entityTypes.map(type => (
                      <SelectItem key={type} value={type}>{ENTITY_LABELS[type] || type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Membre</label>
                <Select value={actorUserId} onValueChange={value => { setActorUserId(value); setPage(1); }}>
                  <SelectTrigger data-testid="audit-filter-actor"><SelectValue placeholder="Tous les membres" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tous les membres</SelectItem>
                    {actors.map(actor => (
                      <SelectItem key={actor.actorUserId} value={String(actor.actorUserId)}>{actor.actorName || `#${actor.actorUserId}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recherche</label>
                <div className="flex gap-2">
                  <Input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") applySearch(); }}
                    placeholder="Rechercher dans le détail…"
                    data-testid="audit-filter-search"
                  />
                  <Button onClick={applySearch} variant="secondary" data-testid="audit-search-button"><Search className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex items-center gap-3">
                <Badge variant="outline" className="border-orange-200 text-orange-700">{total} résultat(s)</Badge>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-600" data-testid="audit-reset-filters">Réinitialiser les filtres</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-5">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><ScrollText className="h-5 w-5 text-orange-600" /> Activité de l'équipe</CardTitle>
            <CardDescription>{total} action(s) enregistrée(s) au total.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {logsQuery.isLoading ? (
              <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
            ) : entries.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center" data-testid="audit-empty-state">
                <div className="rounded-full bg-slate-100 p-4 text-slate-400"><ScrollText className="h-7 w-7" /></div>
                <p className="mt-4 font-semibold text-slate-800">Aucune action enregistrée</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Les actions du staff apparaîtront ici dès qu'un produit, une commande ou un compte sera modifié.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-testid="audit-log-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Date</TableHead>
                      <TableHead className="w-44">Membre</TableHead>
                      <TableHead className="w-40">Action</TableHead>
                      <TableHead>Détail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(entry => (
                      <TableRow key={entry.id} data-testid={`audit-log-row-${entry.id}`}>
                        <TableCell className="whitespace-nowrap text-sm text-slate-600">{formatDateTime(entry.createdAt)}</TableCell>
                        <TableCell>
                          <p className="font-semibold text-slate-900">{entry.actorName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{ROLE_LABELS[entry.actorRole || ""] || entry.actorRole || ""}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border-0 ${ENTITY_TONE[entry.entityType] || "bg-slate-100 text-slate-700"}`}>
                            {ACTION_LABELS[entry.action] || entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{entry.summary}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} data-testid="audit-prev-page">
                <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} data-testid="audit-next-page">
                Suivant <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
