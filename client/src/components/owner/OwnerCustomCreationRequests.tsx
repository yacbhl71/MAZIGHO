import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardPenLine, Eye, Loader2, MessageCircleMore, Palette, RefreshCw, Settings2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CUSTOM_CREATION_REQUEST_LIMITS,
  customCreationRequestKindLabels,
  customCreationRequestStatuses,
  getCustomCreationRequestStatusPresentation,
  type CustomCreationRequestStatus,
} from "@shared/customCreationRequests";

const toneClass = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
} as const;

function dateLabel(value: Date | string) {
  return new Date(value).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
}

export default function OwnerCustomCreationRequests({ canManage }: { canManage: boolean }) {
  const settings = trpc.customCreationRequests.owner.getSettings.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const requests = trpc.customCreationRequests.owner.list.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [enabled, setEnabled] = useState(false);
  const [visibleInNavigation, setVisibleInNavigation] = useState(true);
  const [navigationLabel, setNavigationLabel] = useState("Sur mesure");
  const [headline, setHeadline] = useState("");
  const [intro, setIntro] = useState("");
  const [drafts, setDrafts] = useState<Record<number, { status: CustomCreationRequestStatus; reply: string }>>({});

  useEffect(() => {
    if (!settings.data) return;
    setEnabled(settings.data.enabled);
    setVisibleInNavigation(settings.data.visibleInNavigation);
    setNavigationLabel(settings.data.navigationLabel);
    setHeadline(settings.data.headline);
    setIntro(settings.data.intro);
  }, [settings.data]);

  useEffect(() => {
    if (!requests.data) return;
    setDrafts(current => {
      const next = { ...current };
      for (const request of requests.data) {
        if (!next[request.id]) next[request.id] = { status: request.status, reply: request.ownerReply || "" };
      }
      return next;
    });
  }, [requests.data]);

  const saveSettings = trpc.customCreationRequests.owner.saveSettings.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.customCreationRequests.owner.getSettings.invalidate(),
        utils.customCreationRequests.getAvailability.invalidate(),
      ]);
      toast.success("Configuration des demandes sur mesure enregistrée pour cette boutique.");
    },
    onError: error => toast.error(error.message || "La configuration n’a pas pu être enregistrée."),
  });

  const update = trpc.customCreationRequests.owner.update.useMutation({
    onSuccess: async () => {
      await utils.customCreationRequests.owner.list.invalidate();
      toast.success("Demande client mise à jour. Aucun e-mail ni devis automatique n’a été envoyé.");
    },
    onError: error => toast.error(error.message || "La demande n’a pas pu être mise à jour."),
  });

  const pendingCount = useMemo(
    () => (requests.data ?? []).filter(request => request.status === "submitted" || request.status === "in_review").length,
    [requests.data],
  );
  const answeredCount = useMemo(
    () => (requests.data ?? []).filter(request => request.status === "answered").length,
    [requests.data],
  );
  const settingsChanged = Boolean(settings.data && (
    settings.data.enabled !== enabled
    || settings.data.visibleInNavigation !== visibleInNavigation
    || settings.data.navigationLabel !== navigationLabel.trim()
    || settings.data.headline !== headline.trim()
    || settings.data.intro !== intro.trim()
  ));

  const saveRequest = (requestId: number) => {
    const draft = drafts[requestId];
    if (!draft) return;
    if (draft.status === "answered" && draft.reply.trim().length < 2) {
      toast.error("Ajoutez une réponse avant de marquer la demande comme répondue.");
      return;
    }
    update.mutate({ requestId, status: draft.status, ownerReply: draft.reply.trim() || null });
  };

  return <div className="space-y-5">
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-rose-50">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-violet-700" /> Demandes de créations sur mesure</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">Activez un espace de projet pour cette boutique : les clients connectés déposent une intention, l’équipe la traite manuellement et la réponse reste dans leur espace. Il ne s’agit ni d’un devis, ni d’une messagerie libre, ni d’un paiement.</CardDescription>
          </div>
          <Button type="button" variant="outline" className="min-h-11 border-violet-200 bg-white text-violet-900 hover:bg-violet-50" onClick={() => { void settings.refetch(); void requests.refetch(); }} disabled={settings.isFetching || requests.isFetching}>
            {settings.isFetching || requests.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <Metric label="Demandes reçues" value={requests.data?.length ?? 0} tone="slate" />
        <Metric label="À étudier" value={pendingCount} tone="amber" />
        <Metric label="Réponse disponible" value={answeredCount} tone="teal" />
      </CardContent>
    </Card>

    <Card className="border-violet-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-violet-700" /> Visibilité du service</CardTitle>
        <CardDescription>Les réglages sont propres à cette boutique. Vous choisissez séparément si le service accepte des demandes et si son raccourci est visible dans le menu public.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {settings.isLoading ? <div className="h-48 animate-pulse rounded-xl bg-slate-100" /> : <>
          <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
            <input type="checkbox" checked={enabled} disabled={!canManage} onChange={event => setEnabled(event.target.checked)} className="mt-1 h-4 w-4 accent-violet-700" />
            <span>
              <span className="font-semibold text-violet-950">Accepter les demandes sur mesure</span>
              <span className="mt-1 block text-xs leading-5 text-violet-900">Le formulaire devient accessible uniquement aux clients connectés de cette boutique.</span>
            </span>
          </label>
          <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input type="checkbox" checked={visibleInNavigation} disabled={!canManage} onChange={event => setVisibleInNavigation(event.target.checked)} className="mt-1 h-4 w-4 accent-violet-700" />
            <span>
              <span className="font-semibold text-slate-950">Afficher le raccourci dans le menu</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">Vous pouvez le masquer sans désactiver le service. Le raccourci n’apparaît que lorsque les demandes sont acceptées.</span>
            </span>
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="custom-request-navigation-label">Libellé du raccourci</Label>
              <Input id="custom-request-navigation-label" value={navigationLabel} disabled={!canManage} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.navigationLabel} onChange={event => setNavigationLabel(event.target.value)} placeholder="Ex. Sur mesure" />
              <p className="text-xs leading-5 text-slate-500">Ex. « Personnaliser un article » ou « Projet déco ». Évitez « Dessin sur demande » si l’offre n’est pas artistique.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-request-headline">Titre de la page</Label>
              <Input id="custom-request-headline" value={headline} disabled={!canManage} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.headline} onChange={event => setHeadline(event.target.value)} placeholder="Une idée à transformer ?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-request-intro">Texte d’accueil</Label>
              <Textarea id="custom-request-intro" rows={3} value={intro} disabled={!canManage} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.intro} onChange={event => setIntro(event.target.value)} placeholder="Expliquez en une phrase le parcours proposé." />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="max-w-2xl text-xs leading-5 text-slate-500">Les demandes peuvent porter sur un produit, un service, une personnalisation ou tout autre besoin : chaque boutique reste libre de décider ce qu’elle accepte ensuite.</p>
            {canManage ? <Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={!settingsChanged || saveSettings.isPending} onClick={() => saveSettings.mutate({ enabled, visibleInNavigation, navigationLabel, headline, intro })}>
              {saveSettings.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Enregistrer</>}
            </Button> : <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Propriétaire requis pour configurer</Badge>}
          </div>
        </>}
      </CardContent>
    </Card>

    <Card className="border-violet-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ClipboardPenLine className="h-5 w-5 text-violet-700" /> File de projets</CardTitle>
        <CardDescription>La file affiche le contenu du projet, sans nom, e-mail, téléphone, adresse ou pièce jointe client. Répondez uniquement après étude ; la réponse est visible au client connecté dans son espace.</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" /> : (requests.data?.length ?? 0) === 0 ? <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50 p-7 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-violet-700" />
          <p className="mt-3 font-semibold text-violet-950">Aucun projet reçu pour le moment.</p>
          <p className="mt-2 text-sm leading-6 text-violet-900">La file se remplira uniquement avec les demandes réellement déposées dans cette boutique.</p>
        </div> : <div className="space-y-4">
          {requests.data?.map(request => {
            const draft = drafts[request.id] || { status: request.status, reply: request.ownerReply || "" };
            const presentation = getCustomCreationRequestStatusPresentation(request.status);
            const changed = draft.status !== request.status || draft.reply !== (request.ownerReply || "");
            return <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{request.title}</p>
                    <Badge variant="outline" className={toneClass[presentation.tone]}>{presentation.label}</Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{customCreationRequestKindLabels[request.kind]}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {request.dimensions && <span>Format : {request.dimensions}</span>}
                    {request.budget && <span>Budget indicatif : {request.budget}</span>}
                    {request.deadline && <span>Échéance : {request.deadline}</span>}
                    <span>Reçue le {dateLabel(request.createdAt)}</span>
                  </div>
                </div>
                <div className="w-full space-y-3 xl:max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor={`request-status-${request.id}`}>État de traitement</Label>
                    <select id={`request-status-${request.id}`} value={draft.status} disabled={update.isPending} onChange={event => setDrafts(current => ({ ...current, [request.id]: { ...draft, status: event.target.value as CustomCreationRequestStatus } }))} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                      {customCreationRequestStatuses.map(status => <option key={status} value={status}>{getCustomCreationRequestStatusPresentation(status).label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`request-reply-${request.id}`}>Réponse visible par le client</Label>
                    <Textarea id={`request-reply-${request.id}`} rows={4} value={draft.reply} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.ownerReply} onChange={event => setDrafts(current => ({ ...current, [request.id]: { ...draft, reply: event.target.value } }))} placeholder="Ex. Merci, votre projet est réalisable. Nous vous recontactons avec les prochaines étapes…" />
                    <p className="text-right text-xs text-slate-500">{draft.reply.length}/{CUSTOM_CREATION_REQUEST_LIMITS.ownerReply}</p>
                  </div>
                  <Button type="button" className="min-h-11 w-full bg-violet-700 hover:bg-violet-800" disabled={!changed || update.isPending} onClick={() => saveRequest(request.id)}>
                    {update.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><MessageCircleMore className="mr-2 h-4 w-4" />Enregistrer la décision</>}
                  </Button>
                </div>
              </div>
            </article>;
          })}
        </div>}
      </CardContent>
    </Card>

    <Card className="border-dashed border-slate-300">
      <CardContent className="flex gap-3 p-5 text-sm leading-6 text-slate-600">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
        <p><strong>Limites conservées :</strong> ce centre n’ouvre pas de conversation non encadrée, ne transmet pas de coordonnées, n’accepte aucun fichier, ne crée ni prix ni devis, ne réserve pas de stock, n’envoie pas d’e-mail et n’encaisse rien. Toute suite commerciale reste manuelle et confirmée.</p>
      </CardContent>
    </Card>
  </div>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "slate" | "amber" | "teal" }) {
  const classes = tone === "amber" ? "border-amber-100 bg-amber-50" : tone === "teal" ? "border-teal-100 bg-teal-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-xl border p-4 ${classes}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{value}</p></div>;
}
