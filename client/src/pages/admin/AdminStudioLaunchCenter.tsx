import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Eye, FileText, Globe2, Image, LayoutPanelTop, LockKeyhole, PackageCheck, Palette, Rocket, ShieldCheck } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

type StageState = "ready" | "action" | "optional" | "manual";
type StageAction = "builder" | "pages" | "media" | "navigation" | "storefront_preview" | "studio" | null;
type LaunchStage = { key: string; label: string; state: StageState; detail: string; action: StageAction };

const stageIcons: Record<string, typeof Palette> = {
  identity: Palette,
  content: FileText,
  catalogue: PackageCheck,
  domain: Globe2,
  private_preview: Eye,
  public_opening: ShieldCheck,
};

function stateStyle(state: StageState) {
  if (state === "ready") return { label: "Prêt", chip: "border-emerald-200 bg-emerald-50 text-emerald-950", icon: "bg-emerald-600 text-white" };
  if (state === "manual") return { label: "Manuel", chip: "border-slate-300 bg-slate-100 text-slate-800", icon: "bg-slate-700 text-white" };
  if (state === "optional") return { label: "Optionnel", chip: "border-violet-200 bg-violet-50 text-violet-950", icon: "bg-violet-600 text-white" };
  return { label: "À préparer", chip: "border-amber-200 bg-amber-50 text-amber-950", icon: "bg-amber-500 text-white" };
}

function destinationFor(action: StageAction, storeId: number) {
  if (action === "builder") return `/admin/studio/constructeur/${storeId}`;
  if (action === "pages" || action === "media") return `/admin/studio/pages/${storeId}`;
  if (action === "navigation") return `/admin/studio/navigation/${storeId}`;
  if (action === "storefront_preview") return `/admin/studio/page-preview/${storeId}`;
  if (action === "studio") return "/admin/studio";
  return null;
}

function actionLabel(action: StageAction) {
  if (action === "builder") return "Ouvrir le créateur";
  if (action === "pages") return "Préparer les pages";
  if (action === "media") return "Gérer les médias";
  if (action === "navigation") return "Organiser le menu";
  if (action === "storefront_preview") return "Voir l’aperçu";
  if (action === "studio") return "Revenir à Studio";
  return "Aucune action";
}

export default function AdminStudioLaunchCenter() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/lancement/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const launchQuery = trpc.admin.studio.getGiftStoreLaunchCenter.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });
  const data = launchQuery.data;
  const stages = (data?.stages ?? []) as LaunchStage[];
  const progress = data ? Math.round((data.readyRequiredCount / Math.max(data.requiredStageCount, 1)) * 100) : 0;
  const nextStage = stages.find(stage => stage.key !== "public_opening" && stage.state !== "ready" && stage.action) ?? stages.find(stage => stage.key === "private_preview");
  const nextDestination = nextStage ? destinationFor(nextStage.action, storeId) : null;

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><InvalidStore /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Centre de lancement privé</Badge><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">Aucune activation automatique</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Préparer la boutique, étape par étape</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ce centre réunit les véritables états de préparation de la boutique. Il facilite le travail, mais ne publie rien et ne remplace pas la confirmation d’ouverture publique.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/espace-proprietaire/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Panneau propriétaire</Button></header>

    {launchQuery.isLoading ? <div className="space-y-4"><div className="h-44 animate-pulse rounded-3xl bg-slate-100" /><div className="h-72 animate-pulse rounded-3xl bg-slate-100" /></div> : launchQuery.isError || !data ? <InvalidStore /> : <>
      <section className="overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-sm"><div className="grid gap-7 p-6 md:grid-cols-[minmax(0,1fr)_280px] md:p-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">{data.store.displayName}</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Votre trajectoire de préparation</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{data.readyRequiredCount} étape{data.readyRequiredCount > 1 ? "s" : ""} essentielle{data.readyRequiredCount > 1 ? "s" : ""} sur {data.requiredStageCount} est/sont prête{data.readyRequiredCount > 1 ? "s" : ""}. Vous restez dans Studio tout au long du parcours.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-5"><p className="text-4xl font-bold">{progress}%</p><p className="mt-1 text-sm text-slate-300">Préparation essentielle</p><Progress value={progress} className="mt-5 h-2 bg-white/15" /><p className="mt-3 text-xs leading-5 text-slate-400">Les éléments optionnels ne bloquent pas la préparation.</p></div></div></section>

      {nextStage && nextDestination && <section className="flex flex-col gap-4 rounded-3xl border border-sky-200 bg-sky-50 p-5 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold text-sky-950">Prochaine étape recommandée : {nextStage.label}</p><p className="mt-1 text-sm leading-6 text-sky-900">{nextStage.detail}</p></div><Link href={nextDestination} className="inline-flex w-fit items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">{actionLabel(nextStage.action)} <ArrowRight className="ml-2 h-4 w-4" /></Link></section>}

      <section className="grid gap-4 lg:grid-cols-2">{stages.map(stage => { const Icon = stageIcons[stage.key] ?? Rocket; const style = stateStyle(stage.state); const destination = destinationFor(stage.action, storeId); return <article key={stage.key} className={`relative overflow-hidden rounded-3xl border bg-white p-5 ${stage.key === "public_opening" ? "border-slate-300 bg-slate-50" : "border-slate-200 shadow-sm"}`}><div className="flex items-start gap-4"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${style.icon}`}>{stage.state === "ready" ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-base font-bold text-slate-950">{stage.label}</h2><Badge variant="outline" className={style.chip}>{style.label}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-600">{stage.detail}</p>{destination ? <Link href={destination} className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900 hover:text-slate-600">{actionLabel(stage.action)} <ArrowRight className="ml-1.5 h-4 w-4" /></Link> : <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-slate-600"><LockKeyhole className="h-4 w-4" /> Décision séparée dans Studio</p>}</div></div></article>; })}</section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">L’ouverture publique est intentionnellement séparée.</p><p className="mt-1">Ce centre ne vérifie pas le DNS ou le certificat, ne modifie pas le domaine, ne crée pas de paiement et ne change jamais l’état de la boutique. Une éventuelle ouverture reste réservée à la revue d’activation explicite de MAZIGHO Studio.</p></div></div></section>
    </>}
  </main></DashboardLayout>;
}

function InvalidStore() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Centre de lancement indisponible.</p><p className="mt-1">Cette vue est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
