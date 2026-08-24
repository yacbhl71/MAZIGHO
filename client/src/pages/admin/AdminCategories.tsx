import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, FolderTree, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCategories() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories, isLoading, refetch } = trpc.categories.getAll.useQuery("fr");

  const createCategory = trpc.admin.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Catégorie créée avec succès");
      setIsOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const updateCategory = trpc.admin.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Catégorie mise à jour avec succès");
      setIsOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const deleteCategory = trpc.admin.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Catégorie supprimée avec succès");
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const seedCategories = trpc.admin.categories.seedDefault.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.createdCount} catégories restaurées avec succès !`);
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setEditingCategory(null);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("Le nom et le slug sont requis");
      return;
    }

    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        name,
        slug,
        description,
      });
    } else {
      createCategory.mutate({ name, slug, description });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ? Elle ne doit pas contenir de produits.")) {
      deleteCategory.mutate(id);
    }
  };

  const handleSeed = () => {
    if (confirm("Voulez-vous restaurer les catégories et bannières professionnelles par défaut ?")) {
      seedCategories.mutate();
    }
  };

  const generateSlug = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Catégories</h1>
            <p className="text-muted-foreground">Organisez vos produits par catégories pour faciliter la navigation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeed} disabled={seedCategories.isPending}>
              {seedCategories.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderTree className="mr-2 h-4 w-4" />}
              Restaurer les défauts
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle Catégorie
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations ci-dessous pour {editingCategory ? "mettre à jour" : "créer"} votre catégorie.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => generateSlug(e.target.value)}
                      placeholder="ex: Vêtements"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="ex: vetements"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description de la catégorie..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                    {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCategory ? "Enregistrer les modifications" : "Créer la catégorie"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
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
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : categories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    Aucune catégorie trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded">
                          <FolderTree className="h-4 w-4 text-orange-500" />
                        </div>
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell className="max-w-xs truncate">{category.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(category.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
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
