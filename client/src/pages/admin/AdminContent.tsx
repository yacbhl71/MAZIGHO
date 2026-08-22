import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BannerForm = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  active: number;
  displayOrder: number;
};

const emptyForm: BannerForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  active: 1,
  displayOrder: 0,
};

export default function AdminContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const bannersQuery = trpc.admin.content.getAll.useQuery();
  const banners = bannersQuery.data ?? [];

  const createBanner = trpc.admin.content.create.useMutation({
    onSuccess: async () => {
      toast.success("Bannière créée");
      setIsOpen(false);
      await bannersQuery.refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const updateBanner = trpc.admin.content.update.useMutation({
    onSuccess: async () => {
      toast.success("Bannière mise à jour");
      setIsOpen(false);
      await bannersQuery.refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const deleteBanner = trpc.admin.content.delete.useMutation({
    onSuccess: async () => {
      toast.success("Bannière supprimée");
      await bannersQuery.refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const toggleBanner = trpc.admin.content.toggle.useMutation({
    onSuccess: async () => {
      toast.success("Visibilité mise à jour");
      await bannersQuery.refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, displayOrder: banners.length });
    setIsOpen(true);
  };

  const openEdit = (banner: (typeof banners)[number]) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      active: banner.active,
      displayOrder: banner.displayOrder,
    });
    setIsOpen(true);
  };

  const updateField = <K extends keyof BannerForm>(key: K, value: BannerForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("Le titre et l'URL de l'image sont obligatoires");
      return;
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim(),
      active: form.active,
      displayOrder: Number(form.displayOrder) || 0,
    };

    if (editingId === null) {
      createBanner.mutate(payload);
    } else {
      updateBanner.mutate({ id: editingId, ...payload });
    }
  };

  const isSaving = createBanner.isPending || updateBanner.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">Contenu de la boutique</p>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des bannières</h1>
            <p className="text-muted-foreground">Créez les visuels mis en avant sur la page d'accueil.</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle bannière
          </Button>
        </div>

        <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
          Les bannières actives sont affichées dans l'ordre défini ci-dessous. Utilisez une URL d'image publique HTTPS, puis vérifiez les droits d'utilisation avant publication.
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
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
              {bannersQuery.isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : bannersQuery.error ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-red-600">Impossible de charger les bannières : {bannersQuery.error.message}</TableCell></TableRow>
              ) : banners.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Aucune bannière configurée.</TableCell></TableRow>
              ) : (
                banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded bg-gray-100">
                        {banner.imageUrl ? <img src={banner.imageUrl} alt="" className="h-full w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-gray-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{banner.subtitle || "—"}</TableCell>
                    <TableCell><Badge variant={banner.active ? "default" : "secondary"}>{banner.active ? "Actif" : "Inactif"}</Badge></TableCell>
                    <TableCell>{banner.displayOrder}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" title={banner.active ? "Désactiver" : "Activer"} onClick={() => toggleBanner.mutate({ id: banner.id, active: banner.active ? 0 : 1 })} disabled={toggleBanner.isPending}>
                          {banner.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" title="Modifier" onClick={() => openEdit(banner)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="text-red-600" title="Supprimer" onClick={() => { if (window.confirm(`Supprimer « ${banner.title} » ?`)) deleteBanner.mutate(banner.id); }} disabled={deleteBanner.isPending}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId === null ? "Nouvelle bannière" : "Modifier la bannière"}</DialogTitle>
            <DialogDescription>Renseignez les informations du visuel qui sera présenté sur la page d'accueil.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2"><Label htmlFor="banner-title">Titre *</Label><Input id="banner-title" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Collection printemps" /></div>
            <div className="grid gap-2"><Label htmlFor="banner-subtitle">Sous-titre</Label><Textarea id="banner-subtitle" value={form.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} placeholder="Une courte accroche commerciale" rows={3} /></div>
            <div className="grid gap-2"><Label htmlFor="banner-image">URL de l'image *</Label><Input id="banner-image" type="url" value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} placeholder="https://..." /></div>
            <div className="grid gap-2"><Label htmlFor="banner-link">Lien de destination</Label><Input id="banner-link" type="url" value={form.linkUrl} onChange={(event) => updateField("linkUrl", event.target.value)} placeholder="https://mazigho-shop.vercel.app/..." /></div>
            <div className="grid gap-2"><Label htmlFor="banner-order">Ordre d'affichage</Label><Input id="banner-order" type="number" min={0} value={form.displayOrder} onChange={(event) => updateField("displayOrder", Number(event.target.value))} /></div>
            <div className="flex items-center justify-between rounded-md border p-3"><div><Label>Visible sur la boutique</Label><p className="text-xs text-muted-foreground">Désactivez pour conserver la bannière en préparation.</p></div><Button type="button" variant={form.active ? "default" : "outline"} onClick={() => updateField("active", form.active ? 0 : 1)}>{form.active ? "Active" : "Inactive"}</Button></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
