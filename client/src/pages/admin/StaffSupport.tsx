import { trpc } from "@/lib/trpc";
import StaffWorkspaceLayout from "@/components/StaffWorkspaceLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquareText, Star } from "lucide-react";
import { toast } from "sonner";

const messageLabels = { unread: "Non lu", read: "Lu", archived: "Archivé" } as const;
const reviewLabels = { pending: "À modérer", approved: "Publié", rejected: "Refusé" } as const;

export default function StaffSupport() {
  const utils = trpc.useUtils();
  const { data: messages = [], isLoading: messagesLoading } = trpc.staff.support.getMessages.useQuery();
  const { data: reviews = [], isLoading: reviewsLoading } = trpc.staff.support.getReviews.useQuery();
  const updateMessage = trpc.staff.support.updateMessageStatus.useMutation({
    onSuccess: async () => { toast.success("Statut du message mis à jour."); await utils.staff.support.getMessages.invalidate(); },
    onError: error => toast.error(error.message || "Mise à jour impossible."),
  });
  const updateReview = trpc.staff.support.updateReviewStatus.useMutation({
    onSuccess: async () => { toast.success("Statut de l’avis mis à jour."); await utils.staff.support.getReviews.invalidate(); },
    onError: error => toast.error(error.message || "Mise à jour impossible."),
  });

  return <StaffWorkspaceLayout role="support_agent"><div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-orange-600" />Messages de contact</CardTitle><CardDescription>Vous pouvez traiter les demandes reçues via le formulaire public. Les commandes, adresses et comptes ne sont pas accessibles ici.</CardDescription></CardHeader><CardContent className="space-y-3">{messagesLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : messages.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">Aucun message.</p> : messages.map(message => <article key={message.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{message.subject || "Demande de contact"}</p><p className="mt-1 text-sm text-muted-foreground">{message.name} · {message.email}</p></div><Badge variant={message.status === "unread" ? "default" : "secondary"}>{messageLabels[message.status]}</Badge></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</p><div className="mt-4 flex justify-end"><select aria-label="Statut du message" value={message.status} onChange={event => updateMessage.mutate({ id: message.id, status: event.target.value as keyof typeof messageLabels })} disabled={updateMessage.isPending} className="h-9 rounded-md border border-input bg-background px-2 text-sm"><option value="unread">Non lu</option><option value="read">Lu</option><option value="archived">Archivé</option></select></div></article>)}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-orange-600" />Avis clients</CardTitle><CardDescription>Vérifiez les avis avant publication. La note et le texte restent visibles ; les données de compte ne sont pas exposées.</CardDescription></CardHeader><CardContent className="space-y-3">{reviewsLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : reviews.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">Aucun avis.</p> : reviews.map(review => <article key={review.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{review.productName || "Produit"}</p><p className="mt-1 text-sm text-muted-foreground">{review.userName || "Client"} · {review.rating}/5</p></div><Badge variant={review.status === "approved" ? "default" : "secondary"}>{reviewLabels[review.status]}</Badge></div>{review.comment && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.comment}</p>}<div className="mt-4 flex justify-end"><select aria-label="Statut de l’avis" value={review.status} onChange={event => updateReview.mutate({ id: review.id, status: event.target.value as keyof typeof reviewLabels })} disabled={updateReview.isPending} className="h-9 rounded-md border border-input bg-background px-2 text-sm"><option value="pending">À modérer</option><option value="approved">Publier</option><option value="rejected">Refuser</option></select></div></article>)}</CardContent></Card></div></StaffWorkspaceLayout>;
}
