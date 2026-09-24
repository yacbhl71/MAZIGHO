import { AlertTriangle, CheckCircle2, CircleDollarSign, ClipboardCheck, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OwnerModuleTarget = "vitrine" | "catalogue" | "stock" | "operations" | "legal" | "markets" | "public_view";
type ReadinessItem = { id: OwnerModuleTarget; label: string; ready: boolean; detail: string };
type CommercialReadiness = {
  store: { displayName: string; status: string; primaryDomain: string };
  summary: { completed: number; total: number; baseCommerciallyPrepared: boolean; paymentStatus: "not_activated" };
  inventory: { totalProducts: number; activeProducts: number; sellableProducts: number; productsWithoutImages: number; productsWithoutStock: number; activeVariants: number; outOfStockVariants: number; productsWithVariants: number };
  items: readonly ReadinessItem[];
};

const actionLabels: Record<OwnerModuleTarget, string> = {
  vitrine: "Ouvrir la vitrine",
  catalogue: "Ouvrir le catalogue",
  stock: "Gérer le stock",
  operations: "Configurer la livraison",
  legal: "Compléter le légal",
  markets: "Choisir les marchés",
  public_view: "Voir la vitrine",
};

const statusLabel: Record<string, string> = {
  setup: "en préparation",
  active: "ouverte publiquement",
  limited: "accès limité",
  suspended: "suspendue",
  closed: "fermée",
};

export default function OwnerCommercialReadiness({ readiness, loading, onNavigate, onRefresh }: { readiness?: CommercialReadiness; loading: boolean; onNavigate: (module: OwnerModuleTarget) => void; onRefresh: () => void }) {
  if (loading && !readiness) return <Card className="border-teal-100"><CardContent className="grid min-h-56 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-teal-700" /></CardContent></Card>;
  if (!readiness) return <Card className="border-rose-200"><CardContent className="p-5 text-sm leading-6 text-rose-900">Le contrôle de préparation est momentanément indisponible. Actualisez la page avant de modifier votre boutique.</CardContent></Card>;

  const { inventory, items, summary } = readiness;
  return <div className="space-y-5">
    <Card className="border-teal-100"><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-teal-700" /> Préparation à la vente</CardTitle><CardDescription className="mt-1 max-w-3xl">Vérifiez ce qui est déjà prêt avant de demander l’activation future des paiements. Ce contrôle est informatif : il ne publie pas la boutique, n’encaisse rien et ne change aucun statut.</CardDescription></div><div className="flex items-center gap-2"><Badge variant="outline" className={summary.baseCommerciallyPrepared ? "border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800" : "border-amber-200 bg-amber-50 px-3 py-1 text-amber-900"}>{summary.completed}/{summary.total} prérequis renseignés</Badge><Button type="button" size="icon" variant="outline" aria-label="Actualiser le contrôle" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button></div></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ReadinessMetric label="Produits actifs" value={inventory.activeProducts} detail={`${inventory.sellableProducts} avec stock`} /><ReadinessMetric label="Variantes suivies" value={inventory.activeVariants} detail={inventory.outOfStockVariants ? `${inventory.outOfStockVariants} en rupture` : "Aucune rupture signalée"} /><ReadinessMetric label="Images manquantes" value={inventory.productsWithoutImages} detail={inventory.productsWithoutImages ? "À ajouter avant vente" : "Toutes les fiches actives sont illustrées"} warn={inventory.productsWithoutImages > 0} /><ReadinessMetric label="État boutique" value={statusLabel[readiness.store.status] || readiness.store.status} detail={readiness.store.primaryDomain || "Domaine à définir"} text /></div></CardContent></Card>

    <div className="grid gap-3">{items.map(item => <div key={`${item.id}-${item.label}`} className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${item.ready ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}><div className="flex items-start gap-3"><div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.ready ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"}`}>{item.ready ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-4 w-4" />}</div><div><p className="font-semibold text-slate-950">{item.label}</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{item.detail}</p></div></div><Button type="button" variant={item.ready ? "outline" : "default"} className={item.ready ? "min-h-11 border-emerald-300 text-emerald-800 hover:bg-emerald-100" : "min-h-11 bg-teal-700 hover:bg-teal-800"} onClick={() => onNavigate(item.id)}>{item.ready ? "Consulter" : actionLabels[item.id]}{item.id === "public_view" && <ExternalLink className="ml-2 h-4 w-4" />}</Button></div>)}</div>

    <Card className="border-amber-200 bg-amber-50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-950"><CircleDollarSign className="h-5 w-5" /> Encaissement réel : pas encore activé</CardTitle><CardDescription className="mt-1 max-w-3xl text-amber-900">Votre catalogue peut être préparé, affiché et testé, mais aucun moyen de paiement réel n’est actuellement connectable depuis cette boutique.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-amber-950"><div className="rounded-xl border border-amber-200 bg-white/65 p-4"><p className="font-semibold">Ce qu’il faudra décider avant d’encaisser</p><p className="mt-1">Une connexion de paiement sécurisée par boutique, les informations légales et bancaires de l’exploitant, des essais contrôlés, les confirmations de commande et la procédure de remboursement. Cette activation ne sera jamais automatique.</p></div><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white/65 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" /><p><strong>Protection conservée :</strong> aucune carte bancaire, donnée bancaire, clé Stripe, fournisseur, commande fournisseur ou campagne e-mail n’est collecté ou déclenché par ce contrôle.</p></div></CardContent></Card>
  </div>;
}

function ReadinessMetric({ label, value, detail, warn = false, text = false }: { label: string; value: string | number; detail: string; warn?: boolean; text?: boolean }) {
  return <div className={`rounded-xl border p-4 ${warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 font-bold text-slate-950 ${text ? "text-base" : "text-2xl"}`}>{value}</p><p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p></div>;
}
