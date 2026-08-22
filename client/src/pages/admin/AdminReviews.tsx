import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, Check, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdminReviews() {
  const { data: reviews, isLoading, refetch } = trpc.admin.reviews.getAll.useQuery();
  const updateStatus = trpc.admin.reviews.updateStatus.useMutation({
    onSuccess: async () => {
      toast.success("Statut de l'avis mis à jour");
      await refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const handleStatusUpdate = (id: number, status: "approved" | "rejected") => {
    updateStatus.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      case "approved": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approuvé</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeté</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modération des Avis</h1>
          <p className="text-muted-foreground">Gérez les avis clients pour vos produits.</p>
        </div>

        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : reviews?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucun avis trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                reviews?.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.productName}</TableCell>
                    <TableCell>{review.userName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {review.rating}/5
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {review.status === "pending" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="text-green-600 hover:text-green-700"
                              disabled={updateStatus.isPending}
                              onClick={() => handleStatusUpdate(review.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="text-red-600 hover:text-red-700"
                              disabled={updateStatus.isPending}
                              onClick={() => handleStatusUpdate(review.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
