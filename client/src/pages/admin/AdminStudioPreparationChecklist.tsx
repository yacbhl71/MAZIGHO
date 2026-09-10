import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, ClipboardCheck, Eye, FileText, FolderKanban, Globe2, Image, LockKeyhole, Paintbrush, Package, ShieldCheck } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

type ChecklistItem = {
  key: "identity" | "collections" | "pages" | "media" | "catalogue" | "domain" | "private_preview" | "public_opening";
  label: string;
  state: "ready" | "action" | "optional" | "manual";
  detail: string;
  action: "builder" | "collections" | "pages" | "storefront_preview" | "studio" | null;
};

const itemIcons = { identity: Paintbrush, collections: FolderKanban, pages: FileText, media: Image, catalogue: Package, domain: Globe2, private_preview: Eye, public_opening: LockKeyhole };
const stateStyles = {
  ready: { badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", label: "Prêt" },
  action: { badge: "border-violet-200 bg-violet-50 text-violet-800", dot: "bg-violet-500", label: "À préparer" },
  optional: { badge: "border-slate-200 bg-slate-50 text-slate-700", dot: "bg-slate-400", label: "Optionnel" },
  manual: { badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500", label: "Étape séparée" },
};

function actionHref(action: ChecklistItem["action"], storeId: number) {
  if (action === "builder") return `/admin/studio/constructeur/${storeId}`;
  if (action === "collections") return `/admin/studio/collections/${storeId}`;
  if (action === "pages") return `/admin/studio/pages/${storeId}`;
  if (action === "storefront_preview") return `/admin/studio/apercu/${storeId}`;
  return "/admin/studio";
}

function actionLabel(action: ChecklistItem["action"]) {
  if (action === "builder") return "Ouvrir le créateur";
  if (action === "collections") return "Préparer les collections";
  if (action === "pages") return "Préparer les pages";
  if (action === "storefront_preview") return "Voir l’aperçu privé";
  return "Ouvrir MAZIGHO Studio";
}

export default function AdminStudioPreparationChecklist() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/checklist/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const checklistQuery = trpc.admin.studio.getGiftStorePreparationChecklist.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });

  if (!isValidStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8"><Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Boutique non sélectionnée.</p><p className="mt-1">Ouvrez la checklist depuis le suivi de préparation d’une boutique offerte.</p></div></CardContent></Card></main></DashboardLayout>;

  const data = checklistQuery.data;
  return <DashboardLayout><main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Checklist privée Studio</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">Aucune ouverture automatique</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Préparer votre boutique pas à pas</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Une vue simple des éléments préparés et des prochaines étapes. Chaque lien reste dans Studio et n’ouvre jamais la boutique au public.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/espace-proprietaire/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au panneau propriétaire</Button></header>

    {checklistQuery.isLoading ? <div className="space-y-5"><div className="h-36 animate-pulse rounded-3xl bg-slate-100" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-3xl bg-slate-100" />)}</div></div> : checklistQuery.isError || !data ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Checklist indisponible.</p><p className="mt-1">Cette lecture est réservée à une boutique offerte encore en état `setup`, depuis MAZIGHO Studio.</p></div></CardContent></Card> : <>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 p-6 text-white md:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">Boutique en préparation</p><h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{data.store.displayName}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Cette progression concerne uniquement les choix privés de la boutique. Le domaine, le panier, le paiement et l’activation restent des contrôles séparés.</p></div><div className="flex min-w-[180px] flex-col rounded-2xl bg-white/10 p-4"><span className="text-4xl font-bold">{data.readyEssentialCount}<span className="text-xl text-slate-300">/{data.essentialCount}</span></span><span className="mt-1 text-sm text-slate-300">étapes essentielles prêtes</span><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${(data.readyEssentialCount / data.essentialCount) * 100}%` }} /></div></div></div></section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(data.items as ChecklistItem[]).map(item => { const Icon = itemIcons[item.key]; const style = stateStyles[item.state]; const hasAction = item.action !== null; return <Card key={item.key} className={`border-slate-200 transition-none ${item.key === "public_opening" ? "bg-amber-50/50" : "bg-white"}`}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${item.state === "ready" ? "bg-emerald-100 text-emerald-800" : item.state === "action" ? "bg-violet-100 text-violet-800" : item.state === "manual" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}><Icon className="h-5 w-5" /></span><Badge variant="outline" className={style.badge}><span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${style.dot}`} />{style.label}</Badge></div><CardTitle className="mt-4 text-lg text-slate-950">{item.label}</CardTitle></CardHeader><CardContent className="flex min-h-32 flex-col"><CardDescription className="text-sm leading-6 text-slate-600">{item.detail}</CardDescription>{hasAction ? <Link href={actionHref(item.action, storeId)} className="mt-auto inline-flex w-fit items-center pt-5 text-sm font-semibold text-slate-950 hover:text-violet-800">{actionLabel(item.action)} <ArrowRight className="ml-1.5 h-4 w-4" /></Link> : <div className="mt-auto flex items-center gap-2 pt-5 text-xs font-semibold text-amber-800"><ShieldCheck className="h-4 w-4" /> Déclenchement volontaire uniquement</div>}</CardContent></Card>; })}</section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="flex items-center gap-2 text-base font-semibold text-slate-950"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Règle de sécurité</p><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette checklist n’est pas un bouton de mise en ligne. Elle ne modifie ni DNS, ni certificat, ni statut de boutique, ni panier, ni paiement, ni commande, ni fournisseur, ni compte client.</p></div><Link href={`/admin/studio/apercu/${storeId}`} className="inline-flex w-fit items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Eye className="mr-2 h-4 w-4" /> Voir la boutique privée</Link></div></section>
    </>}
  </main></DashboardLayout>;
}
