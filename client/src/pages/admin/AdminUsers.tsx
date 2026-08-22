import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { User, Shield, UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = trpc.admin.users.getAll.useQuery();
  const updateRole = trpc.admin.users.updateRole.useMutation({
    onSuccess: async () => { toast.success("Rôle mis à jour"); await refetch(); },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const handleToggleRole = (id: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (confirm(`Voulez-vous changer le rôle de cet utilisateur en ${newRole} ?`)) {
      updateRole.mutate({ id, role: newRole as "user" | "admin" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les comptes et les permissions de vos utilisateurs.</p>
        </div>

        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded">
                          <User className="h-4 w-4 text-purple-500" />
                        </div>
                        {user.name || "Utilisateur sans nom"}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Administrateur
                          </div>
                        ) : "Client"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.lastSignedIn).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled={updateRole.isPending} onClick={() => handleToggleRole(user.id, user.role)}>{updateRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <UserCog className="mr-2 h-4 w-4" /> Changer Rôle
                      </Button>
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
