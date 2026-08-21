import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Users, Package, Star, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  const statCards = [
    { title: "Ventes Totales", value: stats ? `${(stats.revenue / 100).toFixed(2)} €` : "0.00 €", icon: TrendingUp, color: "text-green-600" },
    { title: "Commandes", value: stats?.orders || 0, icon: ShoppingBag, color: "text-blue-600" },
    { title: "Produits", value: stats?.products || 0, icon: Package, color: "text-orange-600" },
    { title: "Utilisateurs", value: stats?.users || 0, icon: Users, color: "text-purple-600" },
    { title: "Avis en attente", value: stats?.pendingReviews || 0, icon: Star, color: "text-yellow-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground">Bienvenue dans votre espace d'administration MAZIGHO.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Aperçu des Ventes (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] w-full flex items-end gap-2 px-4 pb-4">
                {[40, 60, 45, 90, 75, 55, 85].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-orange-500 rounded-t transition-all hover:bg-orange-600" 
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">Jour {i+1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Activités Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Aucune activité récente à afficher.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
