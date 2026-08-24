import { Link } from "wouter";
import { CheckCircle2, CircleAlert, Languages, Loader2, Package, RefreshCw, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const locales = ["de", "it", "en", "es", "nl", "ar"] as const;
const localeLabels: Record<(typeof locales)[number], string> = {
  de: "DE", it: "IT", en: "EN", es: "ES", nl: "NL", ar: "AR",
};

type OverviewProduct = {
  id: number;
  name: string;
  status: "active" | "draft" | "archived";
  updatedAt: Date | string | null;
  translations: Array<{ locale: string; status: string; translatedAt: Date | string | null }>;
};

function getTranslationState(product: OverviewProduct) {
  const byLocale = new Map(product.translations.map(item => [item.locale, item.status]));
  const ready = locales.filter(locale => byLocale.get(locale) === "ready");
  const stale = locales.filter(locale => byLocale.get(locale) === "stale");
  const missing = locales.filter(locale => !byLocale.has(locale));
  return { ready, stale, missing, complete: ready.length === locales.length };
}

function StateBadge({ product }: { product: OverviewProduct }) {
  const state = getTranslationState(product);
  if (state.complete) return <Badge className="border-0 bg-emerald-100 text-emerald-800">Prête dans 6 langues</Badge>;
  if (state.stale.length > 0) return <Badge className="border-0 bg-amber-100 text-amber-800">À régénérer</Badge>;
  return <Badge className="border-0 bg-slate-100 text-slate-700">À générer</Badge>;
}

export default function AdminTranslations() {
  const overviewQuery = trpc.admin.products.getTranslationOverview.useQuery();
  const products = (overviewQuery.data || []) as OverviewProduct[];
  const complete = products.filter(product => getTranslationState(product).complete).length;
  const attention = products.length - complete;
  const stale = products.filter(product => getTranslationState(product).stale.length > 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-violet-50">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-700"><Languages className="h-4 w-4" /> Langues & traductions</div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Vos fiches clients dans toutes les langues</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">Vous écrivez toujours la source en français. Chaque enregistrement déclenche automatiquement les versions allemandes, italiennes, anglaises, espagnoles, néerlandaises et arabes.</p>
            </div>
            <Link href="/admin/produits"><Button className="bg-sky-700 text-white hover:bg-sky-800"><Package className="mr-2 h-4 w-4" /> Ouvrir les produits</Button></Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-sky-100 shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fiches françaises</p>{overviewQuery.isLoading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-bold text-slate-900">{products.length}</p>}<p className="mt-1 text-xs text-muted-foreground">Source unique à administrer</p></CardContent></Card>
          <Card className="border-emerald-100 shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Prêtes dans 6 langues</p>{overviewQuery.isLoading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-bold text-emerald-700">{complete}</p>}<p className="mt-1 text-xs text-muted-foreground">Versions clients complètes</p></CardContent></Card>
          <Card className="border-amber-100 shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">À vérifier</p>{overviewQuery.isLoading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-bold text-amber-700">{attention}</p>}<p className="mt-1 text-xs text-muted-foreground">{stale > 0 ? `${stale} fiche(s) à régénérer` : "Génération en attente ou absente"}</p></CardContent></Card>
        </section>

        <Card className="border-sky-100 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/70 pb-5">
            <div><CardTitle className="flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5 text-sky-700" /> État des traductions par fiche</CardTitle><CardDescription className="mt-1">Une pastille verte signifie qu’un client peut voir une version actualisée ; orange signifie qu’elle doit être régénérée après une modification française.</CardDescription></div>
            <Button onClick={() => overviewQuery.refetch()} disabled={overviewQuery.isFetching} variant="outline" className="border-sky-200 text-sky-800 hover:bg-sky-50"><RefreshCw className={`mr-2 h-4 w-4 ${overviewQuery.isFetching ? "animate-spin" : ""}`} />Actualiser</Button>
          </CardHeader>
          <CardContent className="p-0">
            {overviewQuery.isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : products.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="rounded-full bg-sky-50 p-4 text-sky-700"><Languages className="h-8 w-8" /></div><p className="mt-4 font-semibold text-slate-800">Aucune fiche à traduire pour le moment</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Dès votre premier produit français enregistré, ses six versions clients apparaîtront ici automatiquement.</p><Link href="/admin/produits"><Button className="mt-5 bg-sky-700 hover:bg-sky-800">Créer un produit</Button></Link></div> : <div className="divide-y divide-border/70">{products.map(product => { const state = getTranslationState(product); return <div key={product.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold text-slate-900">{product.name}</p><StateBadge product={product} />{product.status === "draft" && <Badge variant="outline">Brouillon</Badge>}</div><div className="mt-3 flex flex-wrap gap-1.5">{locales.map(locale => { const status = product.translations.find(item => item.locale === locale)?.status; return <span key={locale} className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "stale" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{localeLabels[locale]} · {status === "ready" ? "prête" : status === "stale" ? "à régénérer" : "absente"}</span>; })}</div>{state.stale.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700"><CircleAlert className="h-3.5 w-3.5" /> Le texte français a changé : la prochaine sauvegarde ou l’onglet Traductions relancera la mise à jour.</p>}</div><Link href="/admin/produits"><Button variant="outline" className="border-sky-200 text-sky-800 hover:bg-sky-50">Gérer la fiche</Button></Link></div>; })}</div>}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" /><p><strong>Fonctionnement simple :</strong> vous saisissez ou corrigez le produit en français, puis MAZIGHO lance les six versions clients. Pour une correction manuelle, ouvrez la fiche produit puis l’onglet <strong>Traductions</strong>.</p></div>
      </div>
    </DashboardLayout>
  );
}
