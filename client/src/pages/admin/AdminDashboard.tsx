import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Users, Package, Star, TrendingUp, Database, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch } = trpc.admin.getStats.useQuery();

  const statCards = [
    { title: "Ventes Totales", value: stats ? `${(Number(stats.revenue || 0) / 100).toFixed(2)} CHF` : "0.00 CHF", icon: TrendingUp, color: "text-green-600" },
    { title: "Commandes", value: stats?.orders || 0, icon: ShoppingBag, color: "text-blue-600" },
    { title: "Produits", value: stats && stats.products > 0 ? stats.products : "—", icon: Package, color: "text-orange-600" },
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
          
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activités Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Aucune activité récente à afficher.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-500" />
                  Diagnostic Système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-orange-100">
                  <span className="text-xs font-medium uppercase text-gray-500 tracking-wider">Base de données</span>
                  {stats ? (
                    <Badge className="bg-green-500 hover:bg-green-600 h-6">
                      <CheckCircle className="h-3 w-3 mr-1" /> Connecté
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="h-6">
                      <AlertCircle className="h-3 w-3 mr-1" /> Erreur
                    </Badge>
                  )}
                </div>
                <div className="p-2 bg-white rounded border border-orange-100">
                  <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-1">Total produits en base</p>
                  <p className="text-xl font-bold text-orange-600">{stats ? stats.products : "..."}</p>
                </div>
                <Button 
                  onClick={() => refetch()} 
                  variant="outline"
                  className="w-full text-xs border-orange-200 hover:bg-orange-100 text-orange-700"
                >
                  Actualiser les données
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
