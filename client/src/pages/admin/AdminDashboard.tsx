import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Mail,
  Package,
  PackagePlus,
  RefreshCw,
  ShoppingBag,
  Tags,
  TrendingUp,
  Users,
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
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const recentOrders = stats?.recentOrders ?? [];

  const metrics = [
    {
      title: "Ventes encaissées",
      value: formatMoney(stats?.revenue),
      helper: "Commandes réglées",
      icon: TrendingUp,
      tone: "bg-emerald-100 text-emerald-700",
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
      tone: "bg-sky-100 text-sky-700",
    },
  ];

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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map(metric => <MetricCard key={metric.title} {...metric} loading={isLoading} />)}
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/70 pb-5">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-orange-600" /> Commandes récentes</CardTitle>
                <CardDescription className="mt-1">Les cinq dernières commandes enregistrées dans la boutique.</CardDescription>
              </div>
              <Link href="/admin/commandes"><Button variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-50">Voir tout <ArrowUpRight className="ml-1 h-4 w-4" /></Button></Link>
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
                  <Link href="/admin/produits"><Button variant="ghost" className="m-3 w-[calc(100%-1.5rem)] text-orange-700 hover:bg-orange-50">Gérer les stocks <ArrowUpRight className="ml-1 h-4 w-4" /></Button></Link>
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
