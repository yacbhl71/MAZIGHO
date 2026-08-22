import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { User, Shield, UserCog, Loader2, UserPlus, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminUsers() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "user" as "user" | "admin" });
  
  const { data: users, isLoading, refetch } = trpc.admin.users.getAll.useQuery();
  
  const createUser = trpc.admin.users.create.useMutation({
    onSuccess: async () => {
      toast.success("Utilisateur ajouté avec succès");
      setIsOpen(false);
      setForm({ name: "", email: "", role: "user" });
      await refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    createUser.mutate(form);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les comptes et les permissions de vos utilisateurs.</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
          </Button>
        </div>

        <div className="border rounded-lg bg-white overflow-hidden">
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
                    <TableCell>{user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "Jamais"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled={updateRole.isPending} onClick={() => handleToggleRole(user.id, user.role)}>
                        {updateRole.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2 h-4 w-4" />}
                        Changer Rôle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Créez un nouveau compte utilisateur et assignez-lui un rôle.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="name" 
                  placeholder="Jean Dupont" 
                  className="pl-10" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="jean.dupont@exemple.com" 
                  className="pl-10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle assigné</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  type="button" 
                  variant={form.role === "user" ? "default" : "outline"}
                  className={form.role === "user" ? "bg-orange-500 hover:bg-orange-600" : ""}
                  onClick={() => setForm({ ...form, role: "user" })}
                >
                  <User className="mr-2 h-4 w-4" /> Client
                </Button>
                <Button 
                  type="button" 
                  variant={form.role === "admin" ? "default" : "outline"}
                  className={form.role === "admin" ? "bg-orange-500 hover:bg-orange-600" : ""}
                  onClick={() => setForm({ ...form, role: "admin" })}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                </Button>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={createUser.isPending}
              >
                {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'utilisateur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
