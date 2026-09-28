import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, ClipboardCheck, ExternalLink, Loader2, RefreshCw, ShieldCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OwnerModuleTarget = "vitrine" | "catalogue" | "stock" | "operations" | "legal" | "markets" | "integrations" | "orders" | "returns" | "public_view" | "support";
type ReadinessItem = { id: OwnerModuleTarget; label: string; ready: boolean; detail: string };
type OpeningReadiness = {
  state: "action_required" | "ready_for_studio_review" | "opened" | "unavailable";
  label: string;
  detail: string;
  preOpeningCompleted: number;
  preOpeningTotal: number;
  incompleteItems: Array<{ id: string; label: string }>;
  localRequirementsComplete: boolean;
  publicViewReady: boolean;
  publicActivationExecuted: boolean;
  paymentActivationExecuted: false;
};
type PaymentReadiness = {
  stage: "storefront_setup_required" | "plan_required" | "stripe_schema_required" | "seller_account_required" | "seller_capabilities_required" | "test_environment_required" | "test_checkout_ready" | "test_checkout_confirmed";
  label: string;
  detail: string;
  testCheckoutReady: boolean;
  testCheckoutEvidenceConfirmed: boolean;
  testCheckoutEvidence: { confirmedOrderCount: number; latestConfirmedOrderCreatedAt: Date | string | null };
  liveReviewReady: false;
  liveActivationExecuted: false;
  checks: Array<{ id: string; label: string; state: "ready" | "attention" | "pending"; detail: string }>;
};
type CommercialReadiness = {
  store: { displayName: string; status: string; primaryDomain: string };
  summary: { completed: number; total: number; baseCommerciallyPrepared: boolean; paymentStatus: "not_activated" };
  inventory: { totalProducts: number; activeProducts: number; sellableProducts: number; productsWithoutImages: number; productsWithoutStock: number; activeVariants: number; outOfStockVariants: number; productsWithVariants: number };
  items: readonly ReadinessItem[];
  opening: OpeningReadiness;
  payment: PaymentReadiness;
};

const actionLabels: Record<OwnerModuleTarget, string> = {
  vitrine: "Ouvrir la vitrine",
  catalogue: "Ouvrir le catalogue",
  stock: "Gérer le stock",
  operations: "Configurer la livraison",
  legal: "Compléter le légal et fiscal",
  markets: "Choisir les marchés",
  integrations: "Ouvrir les intégrations",
  orders: "Voir les commandes",
  returns: "Ouvrir les retours",
  public_view: "Voir la vitrine",
  support: "Ouvrir l’assistance",
};

const statusLabel: Record<string, string> = {
  setup: "en préparation",
  active: "ouverte publiquement",
  limited: "accès limité",
  suspended: "suspendue",
  closed: "fermée",
};

const openingTone = {
  action_required: { card: "border-amber-200 bg-amber-50", badge: "border-amber-300 bg-white text-amber-950", icon: AlertTriangle },
  ready_for_studio_review: { card: "border-violet-200 bg-violet-50", badge: "border-violet-300 bg-white text-violet-950", icon: ClipboardCheck },
  opened: { card: "border-emerald-200 bg-emerald-50", badge: "border-emerald-300 bg-white text-emerald-950", icon: CheckCircle2 },
  unavailable: { card: "border-slate-200 bg-slate-50", badge: "border-slate-300 bg-white text-slate-800", icon: Store },
} as const;

export default function OwnerCommercialReadiness({ readiness, loading, onNavigate, onRefresh }: { readiness?: CommercialReadiness; loading: boolean; onNavigate: (module: OwnerModuleTarget) => void; onRefresh: () => void }) {
  if (loading && !readiness) return <Card className="border-teal-100"><CardContent className="grid min-h-56 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-teal-700" /></CardContent></Card>;
  if (!readiness) return <Card className="border-rose-200"><CardContent className="p-5 text-sm leading-6 text-rose-900">Le contrôle de préparation est momentanément indisponible. Actualisez la page avant de modifier votre boutique.</CardContent></Card>;

  const { inventory, items, summary, opening, payment } = readiness;
  const tone = openingTone[opening.state];
  const OpeningIcon = tone.icon;

  return <div className="space-y-5">
    <Card className="border-teal-100"><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-teal-700" /> Préparation à la vente</CardTitle><CardDescription className="mt-1 max-w-3xl">Vérifiez les éléments de votre boutique avant une éventuelle revue d’ouverture par MAZIGHO Studio. Ce contrôle est informatif : il ne publie pas la boutique, n’encaisse rien et ne change aucun statut.</CardDescription></div><div className="flex items-center gap-2"><Badge variant="outline" className={summary.baseCommerciallyPrepared ? "border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800" : "border-amber-200 bg-amber-50 px-3 py-1 text-amber-900"}>{opening.preOpeningCompleted}/{opening.preOpeningTotal} prérequis d’ouverture</Badge><Button type="button" size="icon" variant="outline" aria-label="Actualiser le contrôle" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button></div></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><ReadinessMetric label="Produits actifs" value={inventory.activeProducts} detail={`${inventory.sellableProducts} avec stock`} /><ReadinessMetric label="Produits sans stock" value={inventory.productsWithoutStock} detail={inventory.productsWithoutStock ? "À corriger avant la vente" : "Tous les produits actifs sont disponibles"} warn={inventory.productsWithoutStock > 0} /><ReadinessMetric label="Variantes suivies" value={inventory.activeVariants} detail={inventory.outOfStockVariants ? `${inventory.outOfStockVariants} en rupture` : "Aucune rupture signalée"} /><ReadinessMetric label="Images manquantes" value={inventory.productsWithoutImages} detail={inventory.productsWithoutImages ? "À ajouter avant vente" : "Toutes les fiches actives sont illustrées"} warn={inventory.productsWithoutImages > 0} /><ReadinessMetric label="État boutique" value={statusLabel[readiness.store.status] || readiness.store.status} detail={readiness.store.primaryDomain || "Domaine à définir"} text /></div></CardContent></Card>

    <Card className={tone.card}><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><OpeningIcon className="mt-0.5 h-5 w-5 shrink-0" /><div><CardTitle className="text-lg">Jalon d’ouverture</CardTitle><CardDescription className="mt-1 max-w-3xl text-inherit opacity-85">{opening.detail}</CardDescription></div></div><Badge variant="outline" className={tone.badge}>{opening.label}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-current/15 bg-white/65 p-4 text-sm leading-6 text-slate-700"><p><strong className="text-slate-950">Ce que ce statut signifie :</strong> {opening.state === "ready_for_studio_review" ? "vous avez terminé les contrôles locaux. MAZIGHO Studio doit ensuite vérifier le domaine et confirmer l’ouverture manuellement." : opening.state === "opened" ? "la vitrine est active ; son encaissement réel reste séparé et fermé tant qu’une décision Live n’a pas été validée." : opening.state === "action_required" ? "les points listés ci-dessous bloquent encore la revue d’ouverture." : "une revue par MAZIGHO Studio est nécessaire avant toute nouvelle étape."}</p></div>{opening.incompleteItems.length > 0 && <div className="flex flex-wrap gap-2">{opening.incompleteItems.map(item => <Badge key={`${item.id}-${item.label}`} variant="outline" className="border-amber-200 bg-white text-amber-950">{item.label}</Badge>)}</div>}{opening.state === "ready_for_studio_review" && <Button type="button" variant="outline" className="min-h-11 border-violet-300 bg-white text-violet-950 hover:bg-violet-100" onClick={() => onNavigate("support")}>Préparer une demande à Studio <ArrowRight className="ml-2 h-4 w-4" /></Button>}{opening.state === "opened" && <Button type="button" variant="outline" className="min-h-11 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100" onClick={() => onNavigate("public_view")}>Revoir la vitrine publique <ExternalLink className="ml-2 h-4 w-4" /></Button>}{opening.state === "unavailable" && <Button type="button" variant="outline" className="min-h-11 border-slate-300 bg-white text-slate-800 hover:bg-slate-100" onClick={() => onNavigate("support")}>Contacter MAZIGHO Studio <ArrowRight className="ml-2 h-4 w-4" /></Button>}<p className="text-xs leading-5 text-slate-600">Aucun ticket, changement de domaine, publication ou ouverture n’est créé par cet encart.</p></CardContent></Card>

    <div className="grid gap-3">{items.map(item => <div key={`${item.id}-${item.label}`} className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${item.ready ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}><div className="flex items-start gap-3"><div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.ready ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"}`}>{item.ready ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-4 w-4" />}</div><div><p className="font-semibold text-slate-950">{item.label}</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{item.detail}</p></div></div><Button type="button" variant={item.ready ? "outline" : "default"} className={item.ready ? "min-h-11 border-emerald-300 text-emerald-800 hover:bg-emerald-100" : "min-h-11 bg-teal-700 hover:bg-teal-800"} onClick={() => onNavigate(item.id)}>{item.ready ? "Consulter" : actionLabels[item.id]}{item.id === "public_view" && <ExternalLink className="ml-2 h-4 w-4" />}</Button></div>)}</div>

    <PaymentActivationCard payment={payment} onNavigate={onNavigate} />
    <PilotBoutiqueCard items={items} payment={payment} onNavigate={onNavigate} />
  </div>;
}

function PaymentActivationCard({ payment, onNavigate }: { payment: PaymentReadiness; onNavigate: (module: OwnerModuleTarget) => void }) {
  const tone = payment.testCheckoutReady
    ? { card: "border-emerald-200 bg-emerald-50", badge: "border-emerald-300 bg-white text-emerald-800", check: "bg-emerald-600 text-white" }
    : { card: "border-violet-200 bg-violet-50", badge: "border-violet-300 bg-white text-violet-950", check: "bg-violet-700 text-white" };

  return <Card className={tone.card}>
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-slate-950"><CircleDollarSign className="h-5 w-5 text-violet-700" /> Parcours d’encaissement Stripe Connect</CardTitle>
          <CardDescription className="mt-1 max-w-3xl text-slate-700">Préparez le compte vendeur de cette boutique, validez le checkout en environnement de préparation, puis présentez le dossier à MAZIGHO Studio pour une revue finale distincte.</CardDescription>
        </div>
        <Badge variant="outline" className={tone.badge}>{payment.label}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-xl border border-current/15 bg-white/70 p-4 text-sm leading-6 text-slate-700"><p className="font-semibold text-slate-950">Étape suivante</p><p className="mt-1">{payment.detail}</p></div>
      <div className="grid gap-2">
        {payment.checks.map(check => <div key={check.id} className={`flex items-start gap-3 rounded-xl border p-3 ${check.state === "ready" ? "border-emerald-200 bg-white/70" : check.state === "attention" ? "border-violet-200 bg-white/70" : "border-slate-200 bg-white/50"}`}>
          <div className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${check.state === "ready" ? "bg-emerald-600 text-white" : check.state === "attention" ? tone.check : "bg-slate-200 text-slate-600"}`}>{check.state === "ready" ? <CheckCircle2 className="h-4 w-4" /> : check.state === "attention" ? "•" : "–"}</div>
          <div><p className="text-sm font-semibold text-slate-950">{check.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{check.detail}</p></div>
        </div>)}
      </div>
      {payment.testCheckoutReady && <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${payment.testCheckoutEvidenceConfirmed ? "border-emerald-200 bg-white/80" : "border-violet-200 bg-white/80"}`}>
        <div><p className="font-semibold text-slate-950">Preuve locale de première vente Test</p><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">{payment.testCheckoutEvidenceConfirmed ? <><strong>{payment.testCheckoutEvidence.confirmedOrderCount}</strong> commande{payment.testCheckoutEvidence.confirmedOrderCount > 1 ? "s" : ""} Stripe Test confirmée{payment.testCheckoutEvidence.confirmedOrderCount > 1 ? "s" : ""} dans cette boutique{formatEvidenceDate(payment.testCheckoutEvidence.latestConfirmedOrderCreatedAt) ? ` · dernière créée le ${formatEvidenceDate(payment.testCheckoutEvidence.latestConfirmedOrderCreatedAt)}` : ""}.</> : "Aucune commande Stripe Test confirmée n’est encore enregistrée. Réalisez un essai, puis vérifiez son apparition dans les commandes."}</p><p className="mt-2 text-xs leading-5 text-slate-500">Cette preuve ne contient ni montant, ni identité client, ni adresse, ni carte et ne constitue pas une autorisation Production.</p></div><Button type="button" variant="outline" className="min-h-11 shrink-0 border-violet-300 bg-white text-violet-950 hover:bg-violet-100" onClick={() => onNavigate("orders")}>Voir les commandes <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>}
      <div className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-950">Compte vendeur et essai de checkout</p><p className="mt-1 text-xs leading-5 text-slate-600">Ouvrez les intégrations pour créer ou reprendre le compte Stripe Connect de cette boutique et actualiser son statut.</p></div><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" onClick={() => onNavigate("integrations")}>Ouvrir Stripe Connect <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      {payment.testCheckoutReady && <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white/75 p-4 text-sm leading-6 text-emerald-950"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p><strong>Essai prêt :</strong> réalisez un checkout de préparation, vérifiez la commande et le webhook, puis conservez le résultat pour la revue finale. Cette étape ne déclenche pas de paiement réel.</p></div>}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700"><p><strong>Passage aux paiements réels :</strong> il reste une décision explicite, les clés et événements de production, une revue des remboursements/litiges et une validation opérationnelle. Le changement ne peut pas être effectué depuis ce panneau.</p><p className="mt-2"><strong>Facturation MAZIGHO séparée :</strong> Lemon Squeezy concerne uniquement l’abonnement de la boutique, jamais ses clients ni ses commandes.</p></div>
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/65 p-4 text-xs leading-5 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Aucune carte bancaire, coordonnée bancaire, clé Stripe ou donnée de client n’est affichée dans ce contrôle.</p></div>
    </CardContent>
  </Card>;
}

function PilotBoutiqueCard({ items, payment, onNavigate }: { items: readonly ReadinessItem[]; payment: PaymentReadiness; onNavigate: (module: OwnerModuleTarget) => void }) {
  const pilotPrerequisites = items.filter(item => ["operations", "legal", "markets"].includes(item.id));
  const firstMissingPrerequisite = pilotPrerequisites.find(item => !item.ready);
  const operatingBasicsReady = pilotPrerequisites.length > 0 && !firstMissingPrerequisite;
  const completed = Number(operatingBasicsReady) + Number(payment.testCheckoutReady) + Number(payment.testCheckoutEvidenceConfirmed);
  const nextModule: OwnerModuleTarget = firstMissingPrerequisite?.id || (!payment.testCheckoutReady ? "integrations" : !payment.testCheckoutEvidenceConfirmed ? "orders" : "returns");
  const nextLabel = firstMissingPrerequisite ? actionLabels[firstMissingPrerequisite.id] : !payment.testCheckoutReady ? "Ouvrir Stripe Connect" : !payment.testCheckoutEvidenceConfirmed ? "Vérifier les commandes Test" : "Ouvrir les retours";

  return <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50">
    <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-slate-950"><ShieldCheck className="h-5 w-5 text-sky-700" /> Parcours boutique pilote</CardTitle><CardDescription className="mt-1 max-w-3xl text-slate-700">Préparez une première boutique de référence avec des contrôles réels et traçables. Ce parcours reste guidé : il n’ouvre ni paiement Production, ni remboursement, ni litige automatiquement.</CardDescription></div><Badge variant="outline" className={payment.testCheckoutEvidenceConfirmed ? "w-fit border-emerald-200 bg-white text-emerald-800" : "w-fit border-sky-200 bg-white text-sky-900"}>{completed}/3 contrôles locaux</Badge></div></CardHeader>
    <CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><PilotStep number="1" label="Conditions boutique" detail="Livraison, retours, informations légales, fiscalité affichée et marché visible sont complétés." ready={operatingBasicsReady} /><PilotStep number="2" label="Checkout Stripe Test" detail="Le vendeur Test et le checkout de préparation sont prêts, sans débit réel." ready={payment.testCheckoutReady} /><PilotStep number="3" label="Preuve de commande Test" detail="Une commande réglée est visible dans cette boutique après le flux de vérification local." ready={payment.testCheckoutEvidenceConfirmed} /></div><div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-700">Après les trois contrôles, effectuez la revue humaine : commande, stock, contenu de livraison, retours et traitement manuel. Une preuve Test prépare la décision mais ne remplace jamais les validations juridiques, fiscales ou Production.</p><Button type="button" variant="outline" className="min-h-11 shrink-0 border-sky-300 bg-white text-sky-950 hover:bg-sky-100" onClick={() => onNavigate(nextModule)}>{nextLabel} <ArrowRight className="ml-2 h-4 w-4" /></Button></div></CardContent>
  </Card>;
}

function PilotStep({ number, label, detail, ready }: { number: string; label: string; detail: string; ready: boolean }) {
  return <div className={`rounded-xl border p-4 ${ready ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white/80"}`}><div className="flex items-center gap-2"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${ready ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>{ready ? <CheckCircle2 className="h-4 w-4" /> : number}</span><p className="font-semibold text-slate-950">{label}</p></div><p className="mt-3 text-xs leading-5 text-slate-600">{detail}</p></div>;
}

function formatEvidenceDate(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
}

function ReadinessMetric({ label, value, detail, warn = false, text = false }: { label: string; value: string | number; detail: string; warn?: boolean; text?: boolean }) {
  return <div className={`rounded-xl border p-4 ${warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 font-bold text-slate-950 ${text ? "text-base" : "text-2xl"}`}>{value}</p><p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p></div>;
}
