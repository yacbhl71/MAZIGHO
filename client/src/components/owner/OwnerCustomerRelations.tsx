import { Archive, CheckCircle2, Clipboard, Mail, MessageCircle, RotateCcw, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const reviewStatus = {
  pending: { label: "À modérer", className: "border-amber-200 bg-amber-50 text-amber-900" },
  approved: { label: "Publié", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  rejected: { label: "Masqué", className: "border-slate-200 bg-slate-50 text-slate-700" },
} as const;

const messageStatus = {
  unread: { label: "Non lu", className: "border-amber-200 bg-amber-50 text-amber-900" },
  read: { label: "Lu", className: "border-teal-200 bg-teal-50 text-teal-800" },
  archived: { label: "Archivé", className: "border-slate-200 bg-slate-50 text-slate-700" },
} as const;

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
}

export default function OwnerCustomerRelations() {
  const relations = trpc.owner.getCustomerRelations.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const updateReview = trpc.owner.updateReviewModeration.useMutation({
    onSuccess: () => {
      toast.success("Statut de l’avis enregistré pour cette boutique.");
      void utils.owner.getCustomerRelations.invalidate();
    },
    onError: error => toast.error(error.message || "L’avis n’a pas pu être mis à jour."),
  });
  const updateMessage = trpc.owner.updateContactMessageStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut du message enregistré pour cette boutique.");
      void utils.owner.getCustomerRelations.invalidate();
    },
    onError: error => toast.error(error.message || "Le message n’a pas pu être mis à jour."),
  });

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard?.writeText(email);
      toast.success("Adresse copiée. Aucun e-mail n’a été envoyé.");
    } catch {
      toast.error("La copie est indisponible dans ce navigateur.");
    }
  };

  const reviews = relations.data?.reviews ?? [];
  const messages = relations.data?.messages ?? [];

  return <div className="space-y-5">
    <Card className="border-teal-100">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-teal-700" /> Avis & messages de votre boutique</CardTitle>
            <CardDescription className="mt-1 max-w-3xl">Consultez et modérez uniquement les avis et demandes envoyés à votre boutique. Les réponses restent manuelles et externes : aucun e-mail, campagne, pixel ou automatisation n’est activé ici.</CardDescription>
          </div>
          <Button variant="outline" className="min-h-11" onClick={() => relations.refetch()} disabled={relations.isFetching}>{relations.isFetching ? "Actualisation…" : "Actualiser"}</Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Avis</p><p className="mt-2 text-2xl font-bold text-slate-950">{reviews.length}</p></div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">À modérer</p><p className="mt-2 text-2xl font-bold text-amber-950">{reviews.filter(review => review.status === "pending").length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Messages</p><p className="mt-2 text-2xl font-bold text-slate-950">{messages.length}</p></div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Non lus</p><p className="mt-2 text-2xl font-bold text-amber-950">{messages.filter(message => message.status === "unread").length}</p></div>
      </CardContent>
    </Card>

    <Card className="border-teal-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-teal-700" /> Modération des avis</CardTitle>
        <CardDescription>Les avis approuvés peuvent rester visibles sur la vitrine. Masquer ou remettre à modérer ne déclenche aucun e-mail et ne supprime pas l’historique.</CardDescription>
      </CardHeader>
      <CardContent>
        {relations.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-slate-100" /> : reviews.length === 0 ? <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50 p-6 text-center"><Star className="mx-auto h-7 w-7 text-teal-700" /><p className="mt-3 font-semibold text-teal-950">Aucun avis pour le moment.</p><p className="mt-1 text-sm leading-6 text-teal-900">Les avis de cette boutique apparaîtront ici lorsqu’ils existeront.</p></div> : <div className="space-y-3">{reviews.map(review => {
          const current = reviewStatus[review.status as keyof typeof reviewStatus] || reviewStatus.pending;
          return <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{review.productName || "Produit indisponible"}</p><Badge variant="outline" className={current.className}>{current.label}</Badge></div>
                <p className="mt-1 text-sm text-slate-600">{review.authorName || "Client"} · {"★".repeat(Math.max(0, Math.min(5, review.rating)))}{ "☆".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, review.rating))))} · {formatDate(review.createdAt)}</p>
                {review.comment && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.comment}</p>}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {review.status !== "approved" && <Button size="sm" className="min-h-10 bg-teal-700 hover:bg-teal-800" disabled={updateReview.isPending} onClick={() => updateReview.mutate({ reviewId: review.id, status: "approved" })}><CheckCircle2 className="mr-1 h-4 w-4" /> Publier</Button>}
                {review.status !== "rejected" && <Button size="sm" variant="outline" className="min-h-10 border-slate-200" disabled={updateReview.isPending} onClick={() => updateReview.mutate({ reviewId: review.id, status: "rejected" })}><Archive className="mr-1 h-4 w-4" /> Masquer</Button>}
                {review.status !== "pending" && <Button size="sm" variant="ghost" className="min-h-10 text-slate-700" disabled={updateReview.isPending} onClick={() => updateReview.mutate({ reviewId: review.id, status: "pending" })}><RotateCcw className="mr-1 h-4 w-4" /> À modérer</Button>}
              </div>
            </div>
          </article>;
        })}</div>}
      </CardContent>
    </Card>

    <Card className="border-teal-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-teal-700" /> Messages de contact</CardTitle>
        <CardDescription>Les coordonnées sont limitées aux messages adressés à votre boutique. Copiez une adresse seulement si vous devez répondre hors de MAZIGHO ; aucun envoi n’est possible depuis ce panneau.</CardDescription>
      </CardHeader>
      <CardContent>
        {relations.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-slate-100" /> : messages.length === 0 ? <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50 p-6 text-center"><Mail className="mx-auto h-7 w-7 text-teal-700" /><p className="mt-3 font-semibold text-teal-950">Aucun message pour le moment.</p><p className="mt-1 text-sm leading-6 text-teal-900">Les demandes de contact de cette boutique apparaîtront ici.</p></div> : <div className="space-y-3">{messages.map(message => {
          const current = messageStatus[message.status as keyof typeof messageStatus] || messageStatus.unread;
          return <article key={message.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{message.subject || "Message sans objet"}</p><Badge variant="outline" className={current.className}>{current.label}</Badge></div>
                <p className="mt-1 text-sm text-slate-600">{message.name} · {formatDate(message.createdAt)}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:max-w-xs sm:justify-end">
                <Button size="sm" variant="outline" className="min-h-10 border-teal-200 text-teal-800 hover:bg-teal-50" onClick={() => void copyEmail(message.email)}><Clipboard className="mr-1 h-4 w-4" /> Copier l’adresse</Button>
                {message.status !== "read" && <Button size="sm" className="min-h-10 bg-teal-700 hover:bg-teal-800" disabled={updateMessage.isPending} onClick={() => updateMessage.mutate({ messageId: message.id, status: "read" })}>Marquer lu</Button>}
                {message.status !== "archived" && <Button size="sm" variant="outline" className="min-h-10 border-slate-200" disabled={updateMessage.isPending} onClick={() => updateMessage.mutate({ messageId: message.id, status: "archived" })}><Archive className="mr-1 h-4 w-4" /> Archiver</Button>}
                {message.status === "archived" && <Button size="sm" variant="ghost" className="min-h-10 text-slate-700" disabled={updateMessage.isPending} onClick={() => updateMessage.mutate({ messageId: message.id, status: "unread" })}><RotateCcw className="mr-1 h-4 w-4" /> Restaurer</Button>}
              </div>
            </div>
          </article>;
        })}</div>}
      </CardContent>
    </Card>

    <Card className="border-dashed border-slate-300"><CardContent className="p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Limites de ce module</p><p className="mt-1">Ce centre ne crée pas de conversation client, n’envoie pas d’e-mail, n’ajoute pas de note de profil et ne réalise aucune relance. Les retours, remboursements, campagnes et automatisations restent séparés.</p></CardContent></Card>
  </div>;
}
