import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Archive, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminMessages() {
  const { data: messages, isLoading, refetch } = trpc.admin.messages.getAll.useQuery();
  const updateStatus = trpc.admin.messages.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut du message mis à jour");
      refetch();
    },
  });

  const handleStatusUpdate = (id: number, status: "read" | "archived") => {
    updateStatus.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Non lu</Badge>;
      case "read": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Lu</Badge>;
      case "archived": return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Archivé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages de Contact</h1>
          <p className="text-muted-foreground">Gérez les demandes de contact de vos clients.</p>
        </div>

        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : messages?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucun message trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                messages?.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{message.name}</span>
                        <span className="text-xs text-muted-foreground">{message.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{message.subject || "Sans sujet"}</TableCell>
                    <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                    <TableCell>{new Date(message.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {message.status === "unread" && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleStatusUpdate(message.id, "read")}
                            title="Marquer comme lu"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {message.status !== "archived" && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-gray-600 hover:text-gray-700"
                            onClick={() => handleStatusUpdate(message.id, "archived")}
                            title="Archiver"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
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
