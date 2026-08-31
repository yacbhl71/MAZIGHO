import { useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Mail,
  Languages,
  ListChecks,
  PencilLine,
  Package,
  Truck,
  PackagePlus,
  RefreshCw,
  ShoppingBag,
  Tags,
  TrendingUp,
  Users,
  BarChart3,
  ChartNoAxesCombined,
  PieChart as PieChartIcon,
  ReceiptText,
  ShoppingCart,
  Trophy,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function formatMoney(value: unknown) {
  return `${(Number(value || 0) / 100).toFixed(2)} CHF`;
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const chartColors = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"];

function EmptyChart({ icon: Icon, title, detail }: { icon: typeof ChartNoAxesCombined; title: string; detail: string }) {
  return <div className="flex h-[280px] flex-col items-center justify-center rounded-xl bg-slate-50 px-6 text-center"><div className="rounded-2xl bg-white p-3 text-slate-400 shadow-sm"><Icon className="h-7 w-7" /></div><p className="mt-4 font-semibold text-slate-800">{title}</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{detail}</p></div>;
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone,
  loading,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: typeof TrendingUp;
  tone: string;
  loading: boolean;
}) {
  return (
    <Card className="border-border/70 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
            {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className={`rounded-xl p-3 ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, title, detail, icon: Icon }: { href: string; title: string; detail: string; icon: typeof PackagePlus }) {
  return (
    <Link href={href}>
      <div className="group flex min-h-24 cursor-pointer items-center gap-3 border-b border-border/70 px-5 py-4 last:border-0 hover:bg-orange-50/60">
        <div className="rounded-xl bg-orange-100 p-2.5 text-orange-700 group-hover:bg-orange-500 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-700" />
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch, isFetching } = trpc.admin.getStats.useQuery();
  const currentYear = new Date().getFullYear();
  const accountingOverviewQuery = trpc.admin.accounting.getOverview.useQuery({ year: currentYear });
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const recentOrders = stats?.recentOrders ?? [];
  const productsWithoutDeliveryProfiles = stats?.catalogReadiness?.productsWithoutDeliveryProfiles ?? [];
  const productsNeedingTranslations = stats?.catalogReadiness?.productsNeedingTranslations ?? [];
  const monthlyData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("fr-CH", { month: "short" });
    const months = Array.from({ length: 12 }, (_, month) => ({ month: formatter.format(new Date(currentYear, month, 1)), sales: 0, expenses: 0 }));
    for (const sale of accountingOverviewQuery.data?.sales ?? []) {
      const month = new Date(sale.createdAt).getMonth();
      if (month >= 0 && month < 12) months[month].sales += Number(sale.totalAmount);
    }
    for (const entry of accountingOverviewQuery.data?.entries ?? []) {
      const month = new Date(entry.occurredAt).getMonth();
      if (month >= 0 && month < 12) months[month].expenses += Number(entry.amount);
    }
    return months;
  }, [accountingOverviewQuery.data?.entries, accountingOverviewQuery.data?.sales, currentYear]);
  const hasMonthlyData = monthlyData.some(item => item.sales > 0 || item.expenses > 0);
  const orderStatusData = (stats?.orderStatusCounts ?? []).filter(item => item.value > 0).map(item => ({ name: statusLabels[item.status] || item.status, value: item.value }));
  const categoryData = (stats?.catalogCategoryCounts ?? []).filter(item => item.value > 0).map(item => ({ name: item.categoryName, value: item.value }));
  const readinessChecks = [
    {
      title: "Profils de livraison",
      value: productsWithoutDeliveryProfiles.length,
      detail: "produit(s) actif(s) sans devis pays validé",
      empty: "Tous les produits actifs ont au moins un profil de livraison.",
      href: "/admin/produits",
      icon: Truck,
      tone: "bg-amber-100 text-amber-700",
      priority: productsWithoutDeliveryProfiles.length > 0,
    },
    {
      title: "Traductions catalogue",
      value: productsNeedingTranslations.length,
      detail: "produit(s) actif(s) incomplets hors français",
      empty: "Toutes les traductions requises sont prêtes.",
      href: "/admin/traductions",
      icon: Languages,
      tone: "bg-sky-100 text-sky-700",
      priority: productsNeedingTranslations.length > 0,
    },
    {
      title: "Stock à surveiller",
      value: lowStockProducts.length,
      detail: "produit(s) actif(s) à 5 unités ou moins",
      empty: "Aucun stock bas parmi les produits actifs.",
      href: "/admin/produits",
      icon: Boxes,
      tone: "bg-violet-100 text-violet-700",
      priority: lowStockProducts.length > 0,
    },
  ];

  const metrics = [
    {
      title: "Ventes encaissées",
      value: formatMoney(stats?.revenue),
      helper: "Commandes réglées",
      icon: TrendingUp,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Panier moyen",
      value: formatMoney(stats?.averageCart),
      helper: "Sur commandes payées",
      icon: ShoppingCart,
      tone: "bg-teal-100 text-teal-700",
    },
    {
      title: "CA 30 derniers jours",
      value: formatMoney(stats?.revenueLast30Days),
      helper: "Ventes réglées récentes",
      icon: ChartNoAxesCombined,
      tone: "bg-sky-100 text-sky-700",
    },
    {
      title: "Commandes à traiter",
      value: stats?.pendingOrders ?? 0,
      helper: `${stats?.orders ?? 0} commande(s) au total`,
      icon: ShoppingBag,
      tone: "bg-amber-100 text-amber-700",
    },
    {
      title: "Produits actifs",
      value: stats?.activeProducts ?? 0,
      helper: `${stats?.draftProducts ?? 0} brouillon(s) à vérifier`,
      icon: Package,
      tone: "bg-orange-100 text-orange-700",
    },
    {
      title: "Clients inscrits",
      value: stats?.users ?? 0,
      helper: "Comptes MAZIGHO",
      icon: Users,
      tone: "bg-violet-100 text-violet-700",
    },
    {
      title: "Messages non lus",
      value: stats?.unreadMessages ?? 0,
      helper: `${stats?.pendingReviews ?? 0} avis en attente`,
      icon: Mail,
      tone: "bg-pink-100 text-pink-700",
    },
  ];

  const topProducts = stats?.topProducts ?? [];
  const revenueTrend = (stats?.revenueTrend ?? []).map(point => ({
    ...point,
    label: new Date(point.date).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit" }),
  }));
  const hasRevenueTrend = revenueTrend.some(point => point.revenue > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Boutique opérationnelle
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Tableau de bord MAZIGHO</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">Vos indicateurs essentiels, vos alertes et vos prochaines actions réunis au même endroit.</p>
            </div>
            <Button onClick={() => refetch()} disabled={isFetching} variant="outline" className="border-orange-200 bg-white text-orange-700 hover:bg-orange-100">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {metrics.map(metric => <MetricCard key={metric.title} {...metric} loading={isLoading} />)}
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3 border-slate-200 shadow-sm" data-testid="revenue-trend-card">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><ChartNoAxesCombined className="h-5 w-5 text-emerald-600" /> Chiffre d'affaires — 30 derniers jours</CardTitle>
              <CardDescription>Ventes réellement encaissées, jour par jour.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {isLoading ? <Skeleton className="h-[260px] w-full" /> : hasRevenueTrend ? (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrend} margin={{ top: 14, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={4} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${Math.round(Number(value) / 100)}`} />
                      <Tooltip formatter={(value: number | string) => [formatMoney(value), "Ventes"]} labelStyle={{ color: "#0f172a" }} />
                      <Line type="monotone" dataKey="revenue" name="Ventes encaissées" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyChart icon={ChartNoAxesCombined} title="Aucune vente sur 30 jours" detail="La courbe se remplira dès qu'une commande payée sera enregistrée sur la période." />}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2 border-slate-200 shadow-sm" data-testid="top-products-card">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><Trophy className="h-5 w-5 text-amber-500" /> Top 5 des ventes</CardTitle>
              <CardDescription>Produits les plus vendus (commandes payées).</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
              ) : topProducts.length === 0 ? (
                <EmptyChart icon={Trophy} title="Aucune vente enregistrée" detail="Le classement s'affichera dès les premières commandes payées." />
              ) : (
                <div className="divide-y divide-border/70">
                  {topProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center gap-3 px-5 py-4" data-testid={`top-product-${product.productId}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${index === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantitySold} vendu(s)</p>
                      </div>
                      <p className="ml-auto font-semibold text-emerald-700">{formatMoney(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3 border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><ChartNoAxesCombined className="h-5 w-5 text-sky-600" /> Flux mensuel</CardTitle>
              <CardDescription>Ventes encaissées et dépenses réellement saisies en {currentYear}.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {isLoading || accountingOverviewQuery.isLoading ? <Skeleton className="h-[280px] w-full" /> : hasMonthlyData ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyData} margin={{ top: 14, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${Math.round(Number(value) / 100)} CHF`} /><Tooltip formatter={(value: number | string) => formatMoney(value)} labelStyle={{ color: "#0f172a" }} /><Line type="monotone" dataKey="sales" name="Ventes encaissées" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3, fill: "#0ea5e9" }} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="expenses" name="Achats et frais" stroke="#f97316" strokeWidth={3} dot={{ r: 3, fill: "#f97316" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div> : <EmptyChart icon={ReceiptText} title="Aucun flux financier à tracer" detail="Le graphique apparaîtra dès qu’une commande payée, un achat ou un frais sera enregistré." />}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><BarChart3 className="h-5 w-5 text-violet-600" /> Commandes par statut</CardTitle>
              <CardDescription>Répartition actuelle, sans projection.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {isLoading ? <Skeleton className="h-[280px] w-full" /> : orderStatusData.length > 0 ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={orderStatusData} margin={{ top: 16, right: 2, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} /><Tooltip formatter={(value: number | string) => [`${value}`, "Commandes"]} labelStyle={{ color: "#0f172a" }} /><Bar dataKey="value" radius={[7, 7, 0, 0]}>{orderStatusData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={chartColors[index % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyChart icon={ShoppingBag} title="Aucune commande enregistrée" detail="Les statuts apparaîtront ici lorsque des commandes seront réellement créées." />}
            </CardContent>
          </Card>

          <Card className="xl:col-span-3 border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><PieChartIcon className="h-5 w-5 text-pink-600" /> Répartition du catalogue</CardTitle>
              <CardDescription>Produits actuellement enregistrés, regroupés par catégorie.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {isLoading ? <Skeleton className="h-[280px] w-full" /> : categoryData.length > 0 ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="42%" cy="50%" innerRadius={62} outerRadius={96} paddingAngle={3}>{categoryData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value: number | string) => [`${value}`, "Produit(s)"]} labelStyle={{ color: "#0f172a" }} /><text x="42%" y="48%" textAnchor="middle" fill="#0f172a" fontSize="28" fontWeight="700">{categoryData.reduce((total, item) => total + item.value, 0)}</text><text x="42%" y="58%" textAnchor="middle" fill="#64748b" fontSize="12">produits</text></PieChart></ResponsiveContainer></div> : <EmptyChart icon={PieChartIcon} title="Aucun produit à répartir" detail="Le graphique se renseignera dès que le catalogue contiendra des produits catégorisés." />}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2 border-orange-100 bg-gradient-to-br from-orange-50 via-white to-sky-50 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-xl text-slate-900">Lecture fiable</CardTitle><CardDescription>Des graphiques utiles, sans chiffres décoratifs.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="rounded-xl border border-white bg-white/80 p-4"><p className="font-semibold text-slate-900">Source des montants</p><p className="mt-1 text-sm leading-6 text-slate-600">Seules les commandes marquées réglées alimentent les ventes ; les achats et frais viennent du suivi administratif.</p></div><div className="rounded-xl border border-white bg-white/80 p-4"><p className="font-semibold text-slate-900">Mise à jour</p><p className="mt-1 text-sm leading-6 text-slate-600">Utilisez « Actualiser » après une action pour relire les données enregistrées.</p></div></CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Card className="border-orange-200 bg-orange-50/40 shadow-sm">
            <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-orange-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><ListChecks className="h-5 w-5 text-orange-600" /> Centre de préparation</CardTitle>
                <CardDescription className="mt-1">Contrôles lecture seule avant toute mise en avant du catalogue.</CardDescription>
              </div>
              <Badge className="w-fit border-0 bg-white text-orange-800">Aucune publication automatique</Badge>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
              {readinessChecks.map(check => {
                const Icon = check.icon;
                return (
                  <Link key={check.title} href={check.href}>
                    <div className="group h-full cursor-pointer rounded-xl border border-orange-100 bg-white p-4 transition-colors hover:border-orange-300 hover:bg-orange-50">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`rounded-lg p-2 ${check.tone}`}><Icon className="h-4 w-4" /></span>
                        {isLoading ? <Skeleton className="h-6 w-8" /> : <span className={`text-2xl font-bold ${check.priority ? "text-slate-900" : "text-emerald-700"}`}>{check.value}</span>}
                      </div>
                      <p className="mt-4 font-semibold text-slate-900">{check.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{isLoading ? "Vérification…" : check.priority ? check.detail : check.empty}</p>
                      <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-orange-700">Ouvrir le contrôle <ArrowUpRight className="h-3.5 w-3.5" /></p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl"><CircleAlert className="h-5 w-5 text-amber-600" /> À suivre aujourd’hui</CardTitle>
              <CardDescription className="mt-1">Priorités opérationnelles qui demandent une décision humaine.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/70 p-0">
              <Link href="/admin/commandes" className="block px-5 py-4 transition-colors hover:bg-slate-50"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Commandes en attente</p><p className="mt-1 text-xs text-muted-foreground">À examiner avant tout traitement manuel.</p></div><Badge className="border-0 bg-amber-100 text-amber-800">{isLoading ? "…" : stats?.pendingOrders ?? 0}</Badge></div></Link>
              <Link href="/admin/messages" className="block px-5 py-4 transition-colors hover:bg-slate-50"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Messages non lus</p><p className="mt-1 text-xs text-muted-foreground">Questions clients à relire et traiter.</p></div><Badge className="border-0 bg-sky-100 text-sky-800">{isLoading ? "…" : stats?.unreadMessages ?? 0}</Badge></div></Link>
              <Link href="/admin/avis" className="block px-5 py-4 transition-colors hover:bg-slate-50"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Avis à modérer</p><p className="mt-1 text-xs text-muted-foreground">À vérifier avant publication.</p></div><Badge className="border-0 bg-violet-100 text-violet-800">{isLoading ? "…" : stats?.pendingReviews ?? 0}</Badge></div></Link>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/70 pb-5">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-orange-600" /> Commandes récentes</CardTitle>
                <CardDescription className="mt-1">Les cinq dernières commandes enregistrées dans la boutique.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-50"><Link href="/admin/commandes">Voir tout <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
              ) : recentOrders.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                  <div className="rounded-full bg-orange-50 p-4 text-orange-600"><ShoppingBag className="h-7 w-7" /></div>
                  <p className="mt-4 font-semibold text-slate-800">Aucune commande pour le moment</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Les prochaines commandes apparaîtront ici avec leur statut et leur montant.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">#{order.id}</div>
                      <div className="min-w-36 flex-1">
                        <p className="font-semibold text-slate-900">{order.userName || order.userEmail || "Client MAZIGHO"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <Badge className={`border-0 ${statusClasses[order.status] || "bg-slate-100 text-slate-700"}`}>{statusLabels[order.status] || order.status}</Badge>
                      <p className="ml-auto font-semibold text-slate-900">{formatMoney(order.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2 shadow-sm">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl"><CircleAlert className="h-5 w-5 text-amber-600" /> Alertes à traiter</CardTitle>
              <CardDescription className="mt-1">Les produits actifs dont le stock est inférieur ou égal à 5.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
              ) : lowStockProducts.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                  <div className="rounded-full bg-emerald-50 p-4 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
                  <p className="mt-4 font-semibold text-slate-800">Aucune alerte de stock</p>
                  <p className="mt-1 text-sm text-muted-foreground">Tous les produits actifs ont plus de 5 unités en stock.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="rounded-xl bg-amber-100 p-2 text-amber-700"><Boxes className="h-4 w-4" /></div>
                      <p className="min-w-0 flex-1 truncate font-medium text-slate-900">{product.name}</p>
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">{product.stock} en stock</Badge>
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="m-3 w-[calc(100%-1.5rem)] text-orange-700 hover:bg-orange-50"><Link href="/admin/produits">Gérer les stocks <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Actions rapides</CardTitle>
              <CardDescription>Les tâches les plus fréquentes pour faire avancer la boutique.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <QuickAction href="/admin/produits" title="Ajouter ou mettre à jour un produit" detail="Créer un produit, ajuster son prix et son stock." icon={PackagePlus} />
              <QuickAction href="/admin/traductions" title="Langues & traductions" detail="Voir les fiches prêtes, absentes ou à régénérer." icon={Languages} />
              <QuickAction href="/admin/editeur" title="Éditeur simple" detail="Modifier les textes et cartes visibles sans risque technique." icon={PencilLine} />
              <QuickAction href="/admin/importation" title="Importer depuis un fournisseur" detail="Préparer un produit depuis un lien fournisseur." icon={Boxes} />
              <QuickAction href="/admin/commandes" title="Traiter les commandes" detail={`${stats?.pendingOrders ?? 0} commande(s) actuellement en attente.`} icon={ShoppingBag} />
              <QuickAction href="/admin/promotions" title="Créer une offre" detail="Gérer les codes promotionnels et les réductions." icon={Tags} />
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/40 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><Package className="h-5 w-5 text-orange-600" /> État du catalogue</CardTitle>
              <CardDescription>Une vue immédiate sur ce qui est visible par les clients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-orange-100 bg-white p-4"><p className="text-xs text-muted-foreground">Produits</p><p className="mt-1 text-2xl font-bold text-slate-900">{isLoading ? "…" : stats?.products ?? 0}</p></div>
                <div className="rounded-xl border border-orange-100 bg-white p-4"><p className="text-xs text-muted-foreground">Actifs</p><p className="mt-1 text-2xl font-bold text-emerald-700">{isLoading ? "…" : stats?.activeProducts ?? 0}</p></div>
                <div className="rounded-xl border border-orange-100 bg-white p-4"><p className="text-xs text-muted-foreground">Brouillons</p><p className="mt-1 text-2xl font-bold text-amber-700">{isLoading ? "…" : stats?.draftProducts ?? 0}</p></div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-white/80 p-4 text-sm text-slate-700">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <p>Avant de publier un brouillon, vérifiez toujours les images, le prix, le stock et la catégorie du produit.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
