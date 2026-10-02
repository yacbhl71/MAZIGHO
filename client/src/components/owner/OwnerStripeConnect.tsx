import { useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const countryOptions = [
  { code: "CH", label: "Suisse" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Allemagne" },
  { code: "IT", label: "Italie" },
  { code: "BE", label: "Belgique" },
  { code: "ES", label: "Espagne" },
  { code: "NL", label: "Pays-Bas" },
  { code: "AT", label: "Autriche" },
] as const;

function readinessMessage(reason: string | undefined) {
  switch (reason) {
    case "platform_test_mode_disabled": return "MAZIGHO Studio n’a pas encore ouvert le mode Stripe Connect Test.";
    case "platform_test_key_missing": return "La configuration Stripe Test de la plateforme est indisponible.";
    case "store_plan_missing": return "MAZIGHO Studio doit attribuer l’offre FREE, BASIC, PRO ou LIFETIME avant la connexion Stripe.";
    case "store_plan_unsupported": return "L’offre attribuée doit être revue par MAZIGHO Studio avant l’encaissement.";
    case "store_commission_invalid": return "Le taux de commission de cette boutique doit être vérifié dans MAZIGHO Studio avant l’encaissement.";
    case "connect_account_missing": return "Créez le compte Stripe Connect Test de la boutique pour commencer.";
    case "connect_onboarding_incomplete": return "Terminez les informations demandées par Stripe puis actualisez le statut.";
    case "connect_payouts_incomplete": return "Stripe doit également confirmer les versements du compte vendeur avant la validation complète du checkout.";
    case "platform_live_mode_disabled": return "La voie Stripe Production est préparée mais reste désactivée côté plateforme.";
    case "platform_live_key_missing": return "Les identifiants Stripe Production dédiés ne sont pas encore configurés par MAZIGHO Studio.";
    default: return "La boutique est prête pour le checkout Stripe Connect Test.";
  }
}

export default function OwnerStripeConnect({ canManage }: { canManage: boolean }) {
  const [countryCode, setCountryCode] = useState<(typeof countryOptions)[number]["code"]>("CH");
  const setup = trpc.owner.getStripeConnectSetup.useQuery(undefined, { refetchOnWindowFocus: false });
  const liveSetup = trpc.owner.getStripeConnectLiveSetup.useQuery(undefined, { refetchOnWindowFocus: false });
  const createOnboarding = trpc.owner.createStripeConnectOnboarding.useMutation({
    onSuccess: data => {
      toast.success("Lien Stripe Connect Test préparé. La configuration se poursuit chez Stripe.");
      window.location.assign(data.onboardingUrl);
    },
    onError: error => toast.error(error.message || "Le lien Stripe Connect n’a pas pu être préparé."),
  });
  const refresh = trpc.owner.refreshStripeConnectSetup.useMutation({
    onSuccess: async () => { await setup.refetch(); toast.success("Statut Stripe Connect actualisé."); },
    onError: error => toast.error(error.message || "Le statut n’a pas pu être actualisé."),
  });
  const createLiveOnboarding = trpc.owner.createStripeConnectLiveOnboarding.useMutation({
    onSuccess: data => {
      toast.success("Lien Stripe Production préparé. La vérification se poursuit chez Stripe.");
      window.location.assign(data.onboardingUrl);
    },
    onError: error => toast.error(error.message || "Le lien Stripe Production n’a pas pu être préparé."),
  });
  const refreshLive = trpc.owner.refreshStripeConnectLiveSetup.useMutation({
    onSuccess: async () => { await liveSetup.refetch(); toast.success("Statut Stripe Production actualisé."); },
    onError: error => toast.error(error.message || "Le statut Stripe Production n’a pas pu être actualisé."),
  });

  const data = setup.data;
  const account = data?.account;
  const active = data?.paymentReadiness.enabled === true && Boolean(account?.payoutsEnabled);
  const blockingReason = data?.paymentReadiness.enabled === false
    ? data.paymentReadiness.reason
    : account && !account.payoutsEnabled
      ? "connect_payouts_incomplete"
      : undefined;
  const canCreate = canManage && Boolean(data?.schemaReady && data?.plan) && !createOnboarding.isPending;
  const liveData = liveSetup.data;
  const liveAccount = liveData?.account;
  const liveActive = liveData?.paymentReadiness.enabled === true && Boolean(liveAccount?.payoutsEnabled);
  const liveReason = liveData?.paymentReadiness.enabled === false
    ? liveData.paymentReadiness.reason
    : liveAccount && !liveAccount.payoutsEnabled
      ? "connect_payouts_incomplete"
      : undefined;
  const livePlatformBlocked = liveReason === "platform_live_mode_disabled" || liveReason === "platform_live_key_missing";
  const canCreateLive = canManage
    && Boolean(liveData?.schemaReady && liveData?.plan)
    && !["platform_live_mode_disabled", "platform_live_key_missing"].includes(liveReason || "")
    && !createLiveOnboarding.isPending;

  return <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50">
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-700" /> Encaissement Stripe Connect</CardTitle><CardDescription className="mt-2 max-w-3xl">Configuration par boutique pour avancer vers l’encaissement. La première étape valide les Direct Charges Stripe Connect dans un environnement de préparation : la boutique est le vendeur, et MAZIGHO applique seulement la commission prévue par son offre.</CardDescription></div><Badge variant="outline" className={active ? "w-fit border-emerald-200 bg-emerald-50 text-emerald-800" : "w-fit border-amber-200 bg-amber-50 text-amber-800"}>{active ? "Validation prête" : "À préparer"}</Badge></div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className={active ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950" : "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"}>
        <p className="font-semibold">{active ? "Checkout de préparation disponible" : "Étape à finaliser"}</p><p className="mt-1">{active ? "Les cartes de préparation Stripe peuvent être utilisées pour vérifier le checkout, la commande et le webhook avant la revue de passage aux paiements réels." : readinessMessage(blockingReason)}</p>
      </div>
      {data?.plan ? <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Offre attribuée</p><div className="mt-2 flex flex-wrap items-center gap-2"><p className="text-lg font-bold text-slate-950">{data.plan.name}</p><Badge variant="outline" className={data.plan.commissionOverride ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-violet-200 bg-violet-50 text-violet-800"}>{data.plan.commissionOverride ? "Dérogation Studio" : "Commission MAZIGHO"} : {(data.plan.commissionRateBps / 100).toFixed(2).replace(".", ",")} %</Badge></div>{data.plan.commissionOverride ? <p className="mt-2 text-xs leading-5 text-slate-600">Le taux officiel de l’offre est {(data.plan.officialCommissionRateBps / 100).toFixed(2).replace(".", ",")} %. MAZIGHO Studio a accordé ce taux exceptionnel pour les futurs encaissements ; le propriétaire ne peut pas le modifier ici.</p> : <p className="mt-2 text-xs leading-5 text-slate-600">La commission est calculée côté serveur sur le total réellement encaissé, en centimes. Elle ne peut pas être modifiée depuis ce panneau.</p>}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">Aucune offre officielle n’est attribuée. Demandez à MAZIGHO Studio de choisir FREE, BASIC, PRO ou LIFETIME avant de connecter Stripe.</div>}
      {account && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Compte Test</p><p className="mt-1 break-all text-sm font-bold text-slate-950">{account.accountId}</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Informations Stripe</p><p className="mt-1 text-sm font-bold text-slate-950">{account.detailsSubmitted ? "Transmises" : "À compléter"}</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Encaissement</p><p className="mt-1 text-sm font-bold text-slate-950">{account.chargesEnabled ? "Autorisé" : "Non autorisé"}</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Versements</p><p className="mt-1 text-sm font-bold text-slate-950">{account.payoutsEnabled ? "Autorisé" : "Non autorisé"}</p></div></div>}
      <div className={liveActive ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4" : "rounded-xl border border-sky-200 bg-sky-50/70 p-4"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-slate-950">Passage à la production</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">Un compte Production est distinct du compte Test. Il ne sera créé qu’après la configuration serveur dédiée, puis Stripe vérifiera l’activité et les coordonnées de versement du propriétaire.</p></div><Badge variant="outline" className={liveActive ? "w-fit border-emerald-200 bg-white text-emerald-800" : "w-fit border-sky-200 bg-white text-sky-800"}>{liveActive ? "Prêt pour l’ouverture" : "Préparation Production"}</Badge></div>
        <p className="mt-3 text-sm font-medium text-slate-800">{liveActive ? "Compte vendeur Production vérifié. La disponibilité du checkout dépend encore de l’activation serveur contrôlée." : readinessMessage(liveReason)}</p>
        {livePlatformBlocked && <div className="mt-4 rounded-xl border border-sky-200 bg-white/80 p-4 text-sm leading-6 text-sky-950"><p className="font-semibold">Pourquoi le propriétaire ne peut pas encore cliquer sur « Configurer Production »</p><p className="mt-1">Le propriétaire possède bien ce droit pour <strong>sa</strong> boutique, mais MAZIGHO doit d’abord rendre disponible son environnement Stripe Production commun. Cela protège toutes les boutiques et évite qu’une clé Test soit utilisée par erreur en réel.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-sky-100 bg-sky-50 p-3"><p className="font-semibold">Rôle de MAZIGHO Studio</p><p className="mt-1 text-xs leading-5">Préparer la configuration serveur Production et le webhook sécurisé ; vérifier l’offre et la commission applicables. Studio ne demande ni coordonnées bancaires ni identité du vendeur.</p></div><div className="rounded-lg border border-sky-100 bg-white p-3"><p className="font-semibold">Rôle du propriétaire</p><p className="mt-1 text-xs leading-5">Dès le déverrouillage, ouvrir le lien Stripe, compléter directement son identité d’activité et ses versements, puis actualiser le statut. Le checkout réel reste séparément fermé jusqu’à sa mise en service contrôlée.</p></div></div></div>}
        {liveAccount && <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="text-slate-500">Compte :</span> <span className="font-semibold text-slate-900">{liveAccount.accountId}</span></p><p><span className="text-slate-500">Encaissement :</span> <span className="font-semibold text-slate-900">{liveAccount.chargesEnabled ? "autorisé" : "à confirmer"}</span></p><p><span className="text-slate-500">Versements :</span> <span className="font-semibold text-slate-900">{liveAccount.payoutsEnabled ? "autorisés" : "à confirmer"}</span></p></div>}
        {canManage && <div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-10 border-sky-300 bg-white text-sky-900 hover:bg-sky-100" disabled={!liveAccount || refreshLive.isPending} onClick={() => refreshLive.mutate()}>{refreshLive.isPending ? <Loader2 className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}Actualiser Production</Button><Button type="button" className="min-h-10 bg-sky-700 hover:bg-sky-800" disabled={!canCreateLive} onClick={() => createLiveOnboarding.mutate({ countryCode })}>{createLiveOnboarding.isPending ? <Loader2 className="mr-2 h-4 w-4" /> : <ExternalLink className="mr-2 h-4 w-4" />}{liveAccount ? "Reprendre Production" : "Configurer Production"}</Button></div>}
      </div>
      {!canManage ? <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Seul le propriétaire de cette boutique peut ouvrir ou actualiser sa configuration Stripe Connect. Aucun membre délégué ne peut modifier cet accès sensible.</p></div> : <div className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-white p-4 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="stripe-connect-country">Pays d’enregistrement de la boutique</Label><Select value={countryCode} onValueChange={value => setCountryCode(value as typeof countryCode)}><SelectTrigger id="stripe-connect-country" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>{countryOptions.map(country => <SelectItem key={country.code} value={country.code}>{country.label}</SelectItem>)}</SelectContent></Select><p className="text-xs leading-5 text-slate-500">Utilisez le pays de l’activité indiquée à Stripe. Stripe peut demander une vérification complémentaire.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11 border-violet-200 text-violet-800 hover:bg-violet-50" disabled={!account || refresh.isPending} onClick={() => refresh.mutate()}>{refresh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Actualiser</Button><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={!canCreate} onClick={() => createOnboarding.mutate({ countryCode })}>{createOnboarding.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}{account ? "Reprendre Stripe" : "Configurer Stripe Test"}</Button></div></div>}
      {!data?.schemaReady && <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p>La structure sécurisée Stripe Connect doit encore être appliquée par le déploiement. Aucun compte et aucun paiement ne peut être créé avant cette étape.</p></div>}
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><p><strong>Algérie :</strong> elle peut être choisie comme marché, langue et destination de livraison dans la boutique. En revanche, Stripe ne propose pas actuellement l’onboarding Connect Express pour un vendeur établi en Algérie : ce pays n’apparaît donc pas dans le sélecteur Stripe. Cela n’empêche pas de préparer la vitrine ou la livraison ; un encaissement local devra reposer sur un moyen de paiement et un cadre vendeur validés séparément, sans contourner Stripe avec un faux pays.</p></div>
      <p className="text-xs leading-5 text-slate-500">Cette brique ne collecte ni n’affiche mot de passe, clé API Stripe, coordonnées bancaires ou données de carte. Le passage aux paiements réels, ainsi que les procédures de remboursements et litiges, seront revus puis activés séparément.</p>
    </CardContent>
  </Card>;
}
