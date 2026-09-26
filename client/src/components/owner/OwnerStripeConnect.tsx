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
    case "store_plan_missing": return "MAZIGHO Studio doit attribuer l’offre BASIC, PRO ou LIFETIME avant la connexion Stripe.";
    case "store_plan_unsupported": return "L’offre attribuée doit être revue par MAZIGHO Studio avant l’encaissement.";
    case "connect_account_missing": return "Créez le compte Stripe Connect Test de la boutique pour commencer.";
    case "connect_onboarding_incomplete": return "Terminez les informations demandées par Stripe puis actualisez le statut.";
    default: return "La boutique est prête pour le checkout Stripe Connect Test.";
  }
}

export default function OwnerStripeConnect({ canManage }: { canManage: boolean }) {
  const [countryCode, setCountryCode] = useState<(typeof countryOptions)[number]["code"]>("CH");
  const setup = trpc.owner.getStripeConnectSetup.useQuery(undefined, { refetchOnWindowFocus: false });
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

  const data = setup.data;
  const active = data?.paymentReadiness.enabled === true;
  const blockingReason = data && data.paymentReadiness.enabled === false ? data.paymentReadiness.reason : undefined;
  const account = data?.account;
  const canCreate = canManage && Boolean(data?.schemaReady && data?.plan) && !createOnboarding.isPending;

  return <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50">
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-700" /> Encaissement Stripe Connect</CardTitle><CardDescription className="mt-2 max-w-3xl">Configuration par boutique, en <strong>mode Test uniquement</strong>. Les paiements de clients sont des Direct Charges : la boutique est le vendeur, et MAZIGHO applique seulement la commission prévue par son offre.</CardDescription></div><Badge variant="outline" className={active ? "w-fit border-emerald-200 bg-emerald-50 text-emerald-800" : "w-fit border-amber-200 bg-amber-50 text-amber-800"}>{active ? "Test prêt" : "Non prêt"}</Badge></div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className={active ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950" : "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"}>
        <p className="font-semibold">{active ? "Checkout Test disponible" : "Étape à finaliser"}</p><p className="mt-1">{active ? "Les cartes de test Stripe peuvent être utilisées ; aucun paiement Live ni prélèvement d’abonnement n’est activé." : readinessMessage(blockingReason)}</p>
      </div>
      {data?.plan ? <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Offre attribuée</p><div className="mt-2 flex flex-wrap items-center gap-2"><p className="text-lg font-bold text-slate-950">{data.plan.name}</p><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">Commission MAZIGHO : {(data.plan.commissionRateBps / 100).toFixed(1).replace(".", ",")} %</Badge></div><p className="mt-2 text-xs leading-5 text-slate-600">La commission est calculée côté serveur sur le total réellement encaissé, en centimes. Elle ne peut pas être modifiée depuis ce panneau.</p></div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">Aucune offre officielle n’est attribuée. Demandez à MAZIGHO Studio de choisir BASIC, PRO ou LIFETIME avant de connecter Stripe.</div>}
      {account && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Compte Test</p><p className="mt-1 break-all text-sm font-bold text-slate-950">{account.accountId}</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Informations Stripe</p><p className="mt-1 text-sm font-bold text-slate-950">{account.detailsSubmitted ? "Transmises" : "À compléter"}</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Encaissement</p><p className="mt-1 text-sm font-bold text-slate-950">{account.chargesEnabled ? "Autorisé" : "Non autorisé"}</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Versements</p><p className="mt-1 text-sm font-bold text-slate-950">{account.payoutsEnabled ? "Autorisé" : "Non autorisé"}</p></div></div>}
      {!canManage ? <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Seul le propriétaire de cette boutique peut ouvrir ou actualiser sa configuration Stripe Connect. Aucun membre délégué ne peut modifier cet accès sensible.</p></div> : <div className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-white p-4 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="stripe-connect-country">Pays d’enregistrement de la boutique</Label><Select value={countryCode} onValueChange={value => setCountryCode(value as typeof countryCode)}><SelectTrigger id="stripe-connect-country" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>{countryOptions.map(country => <SelectItem key={country.code} value={country.code}>{country.label}</SelectItem>)}</SelectContent></Select><p className="text-xs leading-5 text-slate-500">Utilisez le pays de l’activité indiquée à Stripe. Stripe peut demander une vérification complémentaire.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11 border-violet-200 text-violet-800 hover:bg-violet-50" disabled={!account || refresh.isPending} onClick={() => refresh.mutate()}>{refresh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Actualiser</Button><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={!canCreate} onClick={() => createOnboarding.mutate({ countryCode })}>{createOnboarding.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}{account ? "Reprendre Stripe" : "Configurer Stripe Test"}</Button></div></div>}
      {!data?.schemaReady && <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p>La structure sécurisée Stripe Connect doit encore être appliquée par le déploiement. Aucun compte et aucun paiement ne peut être créé avant cette étape.</p></div>}
      <p className="text-xs leading-5 text-slate-500">Cette brique ne collecte ni n’affiche mot de passe, clé API Stripe, coordonnées bancaires ou données de carte. L’ouverture Live, les remboursements et les litiges seront traités séparément après validation.</p>
    </CardContent>
  </Card>;
}
