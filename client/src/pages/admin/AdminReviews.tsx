import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, CheckCircle2, Eye, MessageSquareText, Search, Star, ThumbsDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const statusMeta = {
  pending: { label: "En attente", className: "border-amber-200 bg-amber-50 text-amber-800" },
  approved: { label: "Publié", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  rejected: { label: "Masqué", className: "border-rose-200 bg-rose-50 text-rose-800" },
} as const;

type ReviewStatus = keyof typeof statusMeta;

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status as ReviewStatus];
  return <Badge variant="outline" className={meta?.className || "bg-slate-50 text-slate-700"}>{meta?.label || status}</Badge>;
}

function Stars({ rating }: { rating: number }) {
  return <div className="flex items-center gap-0.5" aria-label={`${rating} sur 5`}>{[1, 2, 3, 4, 5].map(value => <Star key={value} className={`h-3.5 w-3.5 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div>;
}

export default function AdminReviews() {
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const { data: reviews, isLoading, refetch } = trpc.admin.reviews.getAll.useQuery();
  const updateStatus = trpc.admin.reviews.updateStatus.useMutation({
    onSuccess: async () => { await refetch(); },
    onError: error => toast.error(error.message || "Mise à jour impossible."),
  });

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (reviews ?? []).filter(review => {
      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      const matchesSearch = !query || [review.productName || "", review.userName || "", review.comment || ""].some(value => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [reviews, search, statusFilter]);

  const summary = useMemo(() => {
    const list = reviews ?? [];
    return {
      total: list.length,
      pending: list.filter(review => review.status === "pending").length,
      approved: list.filter(review => review.status === "approved").length,
      average: list.length ? (list.reduce((total, review) => total + review.rating, 0) / list.length).toFixed(1) : "—",
    };
  }, [reviews]);

  const setReviewStatus = (id: number, status: ReviewStatus, successMessage: string) => {
    updateStatus.mutate({ id, status }, { onSuccess: async () => { toast.success(successMessage); await refetch(); } });
  };

  const openReview = (review: any) => { setSelectedReview(review); setIsOpen(true); };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-6 md:p-8"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-700"><MessageSquareText className="h-4 w-4" /> Qualité et confiance</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Modération des avis</h1><p className="mt-2 max-w-2xl text-slate-600">Vérifiez les retours clients avant publication et conservez un espace boutique fiable et utile.</p></div><div className="rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm text-slate-700"><Star className="mr-2 inline h-4 w-4 fill-amber-400 text-amber-400" /> Note moyenne : {summary.average} / 5</div></div></section>

        <section className="grid gap-4 sm:grid-cols-4"><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tous les avis</p><p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">À modérer</p><p className="mt-1 text-2xl font-bold text-amber-700">{summary.pending}</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Publiés</p><p className="mt-1 text-2xl font-bold text-emerald-700">{summary.approved}</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note moyenne</p><p className="mt-1 text-2xl font-bold text-amber-700">{summary.average}</p></CardContent></Card></section>

        <Card className="shadow-sm"><CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un produit, client ou commentaire…" /></div><Select value={statusFilter} onValueChange={value => setStatusFilter(value as "all" | ReviewStatus)}><SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="pending">À modérer</SelectItem><SelectItem value="approved">Publiés</SelectItem><SelectItem value="rejected">Masqués</SelectItem></SelectContent></Select><Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Réinitialiser</Button></CardContent></Card>

        <Card className="overflow-hidden shadow-sm"><div className="overflow-x-auto"><Table className="min-w-[920px]"><TableHeader><TableRow className="bg-slate-50/80"><TableHead>Produit</TableHead><TableHead>Client</TableHead><TableHead>Note</TableHead><TableHead>Commentaire</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Décision</TableHead></TableRow></TableHeader><TableBody>
          {isLoading ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}>{Array.from({ length: 6 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) : filteredReviews.length === 0 ? <TableRow><TableCell colSpan={6} className="py-16 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><div className="rounded-full bg-amber-50 p-4 text-amber-600"><Star className="h-7 w-7" /></div><p className="mt-4 font-semibold text-slate-900">Aucun avis trouvé</p><p className="mt-1 text-sm text-muted-foreground">Les prochains avis clients arriveront ici pour validation.</p></div></TableCell></TableRow> : filteredReviews.map(review => <TableRow key={review.id} className={review.status === "pending" ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-slate-50/70"}><TableCell className="max-w-52 truncate font-semibold text-slate-900">{review.productName || "Produit supprimé"}</TableCell><TableCell>{review.userName || "Client MAZIGHO"}</TableCell><TableCell><div className="flex items-center gap-2"><Stars rating={review.rating} /><span className="text-xs text-muted-foreground">{review.rating}/5</span></div></TableCell><TableCell className="max-w-xs truncate text-sm text-muted-foreground">{review.comment || "Sans commentaire"}</TableCell><TableCell><StatusBadge status={review.status} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openReview(review)}><Eye className="mr-1.5 h-4 w-4" /> Voir</Button>{review.status !== "approved" && <Button variant="outline" size="icon" className="text-emerald-700" title="Publier" disabled={updateStatus.isPending} onClick={() => setReviewStatus(review.id, "approved", "Avis publié")}><Check className="h-4 w-4" /></Button>}{review.status !== "rejected" && <Button variant="outline" size="icon" className="text-rose-700" title="Masquer" disabled={updateStatus.isPending} onClick={() => setReviewStatus(review.id, "rejected", "Avis masqué")}><X className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}
        </TableBody></Table></div></Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="sm:max-w-2xl">{selectedReview && <><DialogHeader><DialogTitle>Avis sur {selectedReview.productName || "un produit"}</DialogTitle><DialogDescription>Publié par {selectedReview.userName || "Client MAZIGHO"}</DialogDescription></DialogHeader><div className="space-y-5 py-3"><div className="flex items-center justify-between rounded-xl border bg-slate-50 p-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note attribuée</p><div className="mt-2"><Stars rating={selectedReview.rating} /></div></div><StatusBadge status={selectedReview.status} /></div><div className="whitespace-pre-wrap rounded-xl border p-5 leading-7 text-slate-800">{selectedReview.comment || "Le client n’a laissé aucun commentaire."}</div></div><DialogFooter><Button variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button>{selectedReview.status !== "approved" && <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setReviewStatus(selectedReview.id, "approved", "Avis publié"); setIsOpen(false); }}><CheckCircle2 className="mr-2 h-4 w-4" /> Publier</Button>}{selectedReview.status !== "rejected" && <Button type="button" variant="outline" className="text-rose-700" onClick={() => { setReviewStatus(selectedReview.id, "rejected", "Avis masqué"); setIsOpen(false); }}><ThumbsDown className="mr-2 h-4 w-4" /> Masquer</Button>}</DialogFooter></>}</DialogContent></Dialog>
      </div>
    </DashboardLayout>
  );
}
