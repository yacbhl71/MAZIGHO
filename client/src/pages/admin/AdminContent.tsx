import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Image as ImageIcon, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminContent() {
  const banners = [
    { id: 1, title: "Collection Été 2026", subtitle: "Profitez de -30% sur toute la soie", active: 1, order: 0 },
    { id: 2, title: "Nouveautés Cosmétiques", subtitle: "Découvrez notre gamme bio", active: 1, order: 1 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion du Contenu</h1>
            <p className="text-muted-foreground">Gérez les bannières de la page d'accueil et les promotions.</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600" disabled>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Bannière
          </Button>
        </div>

        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>Module en cours de développement</AlertTitle>
          <AlertDescription>
            La gestion dynamique du contenu (bannières, pages statiques) sera disponible dans la prochaine mise à jour. Les éléments ci-dessous sont des exemples.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg bg-white overflow-hidden opacity-60 pointer-events-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aperçu</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Sous-titre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Ordre</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="w-20 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{banner.subtitle}</TableCell>
                  <TableCell>
                    <Badge variant={banner.active ? "default" : "secondary"}>
                      {banner.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{banner.order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-600" disabled>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
