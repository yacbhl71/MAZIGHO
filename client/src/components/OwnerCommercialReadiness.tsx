import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, ClipboardCheck, ExternalLink, Loader2, RefreshCw, ShieldCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OwnerModuleTarget = "vitrine" | "catalogue" | "stock" | "operations" | "legal" | "markets" | "integrations" | "public_view" | "support";
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
type CommercialReadiness = {
  store: { displayName: string; status: string; primaryDomain: string };
  summary: { completed: number; total: number; baseCommerciallyPrepared: boolean; paymentStatus: "not_activated" };
  inventory: { totalProducts: number; activeProducts: number; sellableProducts: number; productsWithoutImages: number; productsWithoutStock: number; activeVariants: number; outOfStockVariants: number; productsWithVariants: number };
  items: readonly ReadinessItem[];
  opening: OpeningReadiness;
};

const actionLabels: Record<OwnerModuleTarget, string> = {
  vitrine: "Ouvrir la vitrine",
  catalogue: "Ouvrir le catalogue",
  stock: "Gérer le stock",
  operations: "Configurer la livraison",
  legal: "Compléter le légal et fiscal",
  markets: "Choisir les marchés",
  integrations: "Ouvrir les intégrations",
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

  const { inventory, items, summary, opening } = readiness;
  const tone = openingTone[opening.state];
  const OpeningIcon = tone.icon;

  return <div className="space-y-5">
    <Card className="border-teal-100"><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-teal-700" /> Préparation à la vente</CardTitle><CardDescription className="mt-1 max-w-3xl">Vérifiez les éléments de votre boutique avant une éventuelle revue d’ouverture par MAZIGHO Studio. Ce contrôle est informatif : il ne publie pas la boutique, n’encaisse rien et ne change aucun statut.</CardDescription></div><div className="flex items-center gap-2"><Badge variant="outline" className={summary.baseCommerciallyPrepared ? "border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800" : "border-amber-200 bg-amber-50 px-3 py-1 text-amber-900"}>{opening.preOpeningCompleted}/{opening.preOpeningTotal} prérequis d’ouverture</Badge><Button type="button" size="icon" variant="outline" aria-label="Actualiser le contrôle" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button></div></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><ReadinessMetric label="Produits actifs" value={inventory.activeProducts} detail={`${inventory.sellableProducts} avec stock`} /><ReadinessMetric label="Produits sans stock" value={inventory.productsWithoutStock} detail={inventory.productsWithoutStock ? "À corriger avant la vente" : "Tous les produits actifs sont disponibles"} warn={inventory.productsWithoutStock > 0} /><ReadinessMetric label="Variantes suivies" value={inventory.activeVariants} detail={inventory.outOfStockVariants ? `${inventory.outOfStockVariants} en rupture` : "Aucune rupture signalée"} /><ReadinessMetric label="Images manquantes" value={inventory.productsWithoutImages} detail={inventory.productsWithoutImages ? "À ajouter avant vente" : "Toutes les fiches actives sont illustrées"} warn={inventory.productsWithoutImages > 0} /><ReadinessMetric label="État boutique" value={statusLabel[readiness.store.status] || readiness.store.status} detail={readiness.store.primaryDomain || "Domaine à définir"} text /></div></CardContent></Card>

    <Card className={tone.card}><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><OpeningIcon className="mt-0.5 h-5 w-5 shrink-0" /><div><CardTitle className="text-lg">Jalon d’ouverture</CardTitle><CardDescription className="mt-1 max-w-3xl text-inherit opacity-85">{opening.detail}</CardDescription></div></div><Badge variant="outline" className={tone.badge}>{opening.label}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-current/15 bg-white/65 p-4 text-sm leading-6 text-slate-700"><p><strong className="text-slate-950">Ce que ce statut signifie :</strong> {opening.state === "ready_for_studio_review" ? "vous avez terminé les contrôles locaux. MAZIGHO Studio doit ensuite vérifier le domaine et confirmer l’ouverture manuellement." : opening.state === "opened" ? "la vitrine est active ; son encaissement réel reste séparé et fermé tant qu’une décision Live n’a pas été validée." : opening.state === "action_required" ? "les points listés ci-dessous bloquent encore la revue d’ouverture." : "une revue par MAZIGHO Studio est nécessaire avant toute nouvelle étape."}</p></div>{opening.incompleteItems.length > 0 && <div className="flex flex-wrap gap-2">{opening.incompleteItems.map(item => <Badge key={`${item.id}-${item.label}`} variant="outline" className="border-amber-200 bg-white text-amber-950">{item.label}</Badge>)}</div>}{opening.state === "ready_for_studio_review" && <Button type="button" variant="outline" className="min-h-11 border-violet-300 bg-white text-violet-950 hover:bg-violet-100" onClick={() => onNavigate("support")}>Préparer une demande à Studio <ArrowRight className="ml-2 h-4 w-4" /></Button>}{opening.state === "opened" && <Button type="button" variant="outline" className="min-h-11 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100" onClick={() => onNavigate("public_view")}>Revoir la vitrine publique <ExternalLink className="ml-2 h-4 w-4" /></Button>}{opening.state === "unavailable" && <Button type="button" variant="outline" className="min-h-11 border-slate-300 bg-white text-slate-800 hover:bg-slate-100" onClick={() => onNavigate("support")}>Contacter MAZIGHO Studio <ArrowRight className="ml-2 h-4 w-4" /></Button>}<p className="text-xs leading-5 text-slate-600">Aucun ticket, changement de domaine, publication ou ouverture n’est créé par cet encart.</p></CardContent></Card>

    <div className="grid gap-3">{items.map(item => <div key={`${item.id}-${item.label}`} className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${item.ready ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}><div className="flex items-start gap-3"><div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.ready ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"}`}>{item.ready ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-4 w-4" />}</div><div><p className="font-semibold text-slate-950">{item.label}</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{item.detail}</p></div></div><Button type="button" variant={item.ready ? "outline" : "default"} className={item.ready ? "min-h-11 border-emerald-300 text-emerald-800 hover:bg-emerald-100" : "min-h-11 bg-teal-700 hover:bg-teal-800"} onClick={() => onNavigate(item.id)}>{item.ready ? "Consulter" : actionLabels[item.id]}{item.id === "public_view" && <ExternalLink className="ml-2 h-4 w-4" />}</Button></div>)}</div>

    <Card className="border-amber-200 bg-amber-50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-950"><CircleDollarSign className="h-5 w-5" /> Paiement client : Test préparé, Live fermé</CardTitle><CardDescription className="mt-1 max-w-3xl text-amber-900">Stripe Connect peut être préparé en environnement Test depuis les intégrations lorsque MAZIGHO Studio a activé cette configuration. Aucun encaissement Live, prélèvement d’abonnement ou versement réel n’est ouvert à cette étape.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-amber-950"><div className="rounded-xl border border-amber-200 bg-white/65 p-4"><p className="font-semibold">Essai sécurisé par boutique</p><p className="mt-1">Stripe Connect Test associe le compte de la boutique à ses essais de checkout. Les cartes Test ne débitent personne ; les confirmations sont contrôlées côté serveur avant toute commande.</p><Button type="button" variant="outline" className="mt-3 min-h-10 border-amber-300 bg-white text-amber-950 hover:bg-amber-100" onClick={() => onNavigate("integrations")}>Voir Stripe Connect Test</Button></div><div className="rounded-xl border border-amber-200 bg-white/65 p-4"><p className="font-semibold">Avant une éventuelle ouverture Live</p><p className="mt-1">Il faudra une décision explicite, des essais complets, les informations légales et bancaires de l’exploitant, ainsi que les procédures de remboursement et de litige. Cette activation ne sera jamais automatique.</p></div><div className="rounded-xl border border-amber-200 bg-white/65 p-4"><p className="font-semibold">Facturation de la plateforme séparée</p><p className="mt-1">L’abonnement MAZIGHO est suivi séparément via Lemon Squeezy Test. Il ne touche jamais les clients ni les commandes de cette boutique.</p></div><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white/65 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" /><p><strong>Protection conservée :</strong> aucune carte bancaire, donnée bancaire, clé Stripe, fournisseur, commande fournisseur ou campagne e-mail n’est collecté ou déclenché par ce contrôle.</p></div></CardContent></Card>
  </div>;
}

function ReadinessMetric({ label, value, detail, warn = false, text = false }: { label: string; value: string | number; detail: string; warn?: boolean; text?: boolean }) {
  return <div className={`rounded-xl border p-4 ${warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 font-bold text-slate-950 ${text ? "text-base" : "text-2xl"}`}>{value}</p><p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p></div>;
}
