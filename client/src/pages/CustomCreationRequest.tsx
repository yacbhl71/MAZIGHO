import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { ClipboardPenLine, Clock3, FileText, Loader2, LogIn, MessageCircleMore, Palette, Send, ShieldCheck, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { CUSTOM_CREATION_REQUEST_LIMITS, customCreationRequestKindLabels, customCreationRequestKinds, getCustomCreationRequestStatusPresentation, type CustomCreationRequestKind } from "@shared/customCreationRequests";
import { toast } from "sonner";

const toneClass = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
} as const;

const emptyForm = {
  kind: "portrait" as CustomCreationRequestKind,
  title: "",
  description: "",
  dimensions: "",
  budget: "",
  deadline: "",
};

function dateLabel(value: Date | string) {
  return new Date(value).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
}

export default function CustomCreationRequest() {
  const { user, loading: authLoading } = useAuth();
  const { profile, palette } = useDesignProfile();
  const availability = trpc.customCreationRequests.getAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const mine = trpc.customCreationRequests.getMine.useQuery(undefined, { enabled: Boolean(user) && availability.data?.enabled === true, retry: false, refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [form, setForm] = useState(emptyForm);
  const create = trpc.customCreationRequests.create.useMutation({
    onSuccess: async () => {
      setForm(emptyForm);
      await utils.customCreationRequests.getMine.invalidate();
      toast.success("Votre demande a été enregistrée dans votre espace client.", { description: "La boutique l’étudiera manuellement ; aucun devis, paiement ou engagement n’a été créé." });
    },
    onError: error => toast.error(error.message || "La demande n’a pas pu être enregistrée."),
  });

  const canSubmit = useMemo(() => form.title.trim().length >= 3 && form.description.trim().length >= 10, [form.description, form.title]);
  useEffect(() => {
    document.title = `Demande sur mesure | ${profile.brandName || "Boutique"}`;
  }, [profile.brandName]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Ajoutez un titre et une description suffisamment précis.");
      return;
    }
    create.mutate({
      kind: form.kind,
      title: form.title.trim(),
      description: form.description.trim(),
      dimensions: form.dimensions.trim() || undefined,
      budget: form.budget.trim() || undefined,
      deadline: form.deadline.trim() || undefined,
    });
  };

  const settings = availability.data;
  return <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-4 py-14 text-white sm:py-20">
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: `${palette.primary}55` }} />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="container relative mx-auto grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/90"><Palette className="h-4 w-4" /> Création à votre idée</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{settings?.headline || "Une idée à transformer ?"}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">{settings?.intro || "Décrivez votre projet. La boutique vous répondra après étude, sans devis ni commande automatiques."}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><ShieldCheck className="h-5 w-5 text-teal-200" /><p className="mt-3 text-sm font-semibold">Un parcours simple et contrôlé</p><p className="mt-1 text-xs leading-5 text-slate-300">Votre demande reste dans votre espace client. La réponse de la boutique ne crée ni devis, ni commande, ni paiement sans votre accord.</p></div>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.78fr)] lg:py-16">
        <div>
          {availability.isLoading || authLoading ? <Card className="border-slate-200"><CardContent className="h-72 animate-pulse p-6" /></Card> : !settings?.enabled ? <Card className="border-amber-200 bg-amber-50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-950"><Clock3 className="h-5 w-5" /> Service en préparation</CardTitle><CardDescription className="text-amber-900">Cette boutique n’accepte pas encore les demandes de créations sur mesure. Aucun formulaire n’est ouvert tant que le propriétaire ne l’active pas.</CardDescription></CardHeader><CardContent><Button asChild variant="outline" className="min-h-11 border-amber-300 bg-white text-amber-950 hover:bg-amber-100"><Link href="/creations">Découvrir les créations</Link></Button></CardContent></Card> : !user ? <Card className="border-teal-200 bg-teal-50"><CardHeader><CardTitle className="flex items-center gap-2 text-teal-950"><LogIn className="h-5 w-5" /> Connectez-vous avant de décrire votre projet</CardTitle><CardDescription className="text-teal-900">La connexion permet de garder votre demande et la réponse de la boutique dans votre espace personnel. Nous ne créons pas de contact public à partir de ce formulaire.</CardDescription></CardHeader><CardContent><Button asChild className="min-h-11 text-white" style={{ backgroundColor: palette.accent }}><Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Se connecter</Link></Button></CardContent></Card> : <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardPenLine className="h-5 w-5" style={{ color: palette.primary }} /> Décrire votre projet</CardTitle><CardDescription>Donnez assez de contexte pour permettre une première étude. Les champs budget et délai sont facultatifs et n’engagent personne.</CardDescription></CardHeader><CardContent><form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="custom-kind">Type de projet</Label><select id="custom-kind" value={form.kind} onChange={event => setForm(current => ({ ...current, kind: event.target.value as CustomCreationRequestKind }))} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{customCreationRequestKinds.map(kind => <option key={kind} value={kind}>{customCreationRequestKindLabels[kind]}</option>)}</select></div><div className="space-y-2"><Label htmlFor="custom-title">Titre de votre idée *</Label><Input id="custom-title" value={form.title} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.title} placeholder="Ex. Portrait de famille au crayon" onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></div></div>
            <div className="space-y-2"><Label htmlFor="custom-description">Votre description *</Label><Textarea id="custom-description" rows={7} value={form.description} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.description} placeholder="Expliquez le sujet, le style recherché, les couleurs, les éléments importants et toute contrainte utile…" onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /><p className="text-right text-xs text-slate-500">{form.description.length}/{CUSTOM_CREATION_REQUEST_LIMITS.description}</p></div>
            <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="custom-dimensions">Format ou dimensions</Label><Input id="custom-dimensions" value={form.dimensions} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.dimensions} placeholder="Ex. A4, cadre 30 × 40" onChange={event => setForm(current => ({ ...current, dimensions: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="custom-budget">Budget indicatif</Label><Input id="custom-budget" value={form.budget} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.budget} placeholder="Ex. jusqu’à 80 CHF" onChange={event => setForm(current => ({ ...current, budget: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="custom-deadline">Échéance souhaitée</Label><Input id="custom-deadline" value={form.deadline} maxLength={CUSTOM_CREATION_REQUEST_LIMITS.deadline} placeholder="Ex. avant fin juin" onChange={event => setForm(current => ({ ...current, deadline: event.target.value }))} /></div></div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-slate-500">Sans fichier joint à cette étape : échangez les références sensibles avec la boutique uniquement si elle vous le demande après étude.</p><Button type="submit" className="min-h-11 shrink-0 text-white" style={{ backgroundColor: palette.accent }} disabled={!canSubmit || create.isPending}>{create.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : <><Send className="mr-2 h-4 w-4" /> Envoyer ma demande</>}</Button></div>
          </form></CardContent></Card>}
        </div>
        <aside className="space-y-5">
          <Card className="border-slate-200"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5" style={{ color: palette.primary }} /> Mes demandes</CardTitle><CardDescription>Suivez ici les demandes créées avec votre compte sur cette boutique.</CardDescription></CardHeader><CardContent>{!user ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Après connexion, vos demandes et les réponses reçues apparaîtront ici.</div> : mine.isLoading ? <div className="h-44 animate-pulse rounded-xl bg-slate-100" /> : (mine.data?.length ?? 0) === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Vous n’avez encore envoyé aucune demande à cette boutique.</div> : <div className="space-y-3">{mine.data?.map(request => { const presentation = getCustomCreationRequestStatusPresentation(request.status); return <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-950">{request.title}</p><p className="mt-1 text-xs text-slate-500">{customCreationRequestKindLabels[request.kind]} · {dateLabel(request.updatedAt)}</p></div><Badge variant="outline" className={toneClass[presentation.tone]}>{presentation.label}</Badge></div>{request.ownerReply && <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm leading-6 text-teal-950"><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-800"><MessageCircleMore className="h-3.5 w-3.5" /> Réponse de la boutique</p><p className="mt-1 whitespace-pre-wrap">{request.ownerReply}</p></div>}<p className="mt-3 text-xs leading-5 text-slate-500">{presentation.detail}</p></article>; })}</div>}</CardContent></Card>
          <Card className="border-violet-100 bg-violet-50/60"><CardContent className="p-5 text-sm leading-6 text-violet-950"><Sparkles className="h-5 w-5 text-violet-700" /><p className="mt-3 font-semibold">Ce que cette demande ne fait pas</p><p className="mt-1 text-violet-900">Elle ne commande rien, ne bloque aucun stock et ne demande aucun paiement. Un projet devient une vente uniquement après un échange et une décision explicites.</p></CardContent></Card>
        </aside>
      </section>
    </main>
    <Footer />
  </div>;
}
