import { useMemo, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpRight, Edit, Eye, EyeOff, Image as ImageIcon, LayoutTemplate, Loader2, MonitorUp, Plus, Trash2 } from "lucide-react";
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

  const summary = useMemo(() => ({
    total: banners.length,
    active: banners.filter(banner => Boolean(banner.active)).length,
    drafts: banners.filter(banner => !banner.active).length,
  }), [banners]);

  const createBanner = trpc.admin.content.create.useMutation({
    onSuccess: async () => { toast.success("Bannière créée"); setIsOpen(false); await bannersQuery.refetch(); },
    onError: error => toast.error(`Erreur : ${error.message}`),
  });
  const updateBanner = trpc.admin.content.update.useMutation({
    onSuccess: async () => { toast.success("Bannière mise à jour"); setIsOpen(false); await bannersQuery.refetch(); },
    onError: error => toast.error(`Erreur : ${error.message}`),
  });
  const deleteBanner = trpc.admin.content.delete.useMutation({
    onSuccess: async () => { toast.success("Bannière supprimée"); await bannersQuery.refetch(); },
    onError: error => toast.error(`Erreur : ${error.message}`),
  });
  const toggleBanner = trpc.admin.content.toggle.useMutation({
    onSuccess: async () => { toast.success("Visibilité mise à jour"); await bannersQuery.refetch(); },
    onError: error => toast.error(`Erreur : ${error.message}`),
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

  const updateField = <K extends keyof BannerForm>(key: K, value: BannerForm[K]) => setForm(current => ({ ...current, [key]: value }));

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
    if (editingId === null) createBanner.mutate(payload);
    else updateBanner.mutate({ id: editingId, ...payload });
  };

  const isSaving = createBanner.isPending || updateBanner.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-700"><LayoutTemplate className="h-4 w-4" /> Studio de contenu</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Bannières de la boutique</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Préparez les visuels de la page d’accueil, vérifiez leur aperçu et choisissez lesquels seront visibles pour les clients.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="border-violet-200 bg-white text-violet-700 hover:bg-violet-100"><Link href="/"><MonitorUp className="mr-2 h-4 w-4" /> Voir la boutique <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button><Button className="bg-orange-500 hover:bg-orange-600" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nouvelle bannière</Button></div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visuels enregistrés</p><p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p><p className="mt-1 text-xs text-muted-foreground">Bibliothèque de bannières</p></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visibles</p><p className="mt-1 text-2xl font-bold text-emerald-700">{summary.active}</p><p className="mt-1 text-xs text-muted-foreground">Affichées selon leur ordre</p></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">En préparation</p><p className="mt-1 text-2xl font-bold text-amber-700">{summary.drafts}</p><p className="mt-1 text-xs text-muted-foreground">Conservées hors de la boutique</p></div>
        </section>

        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-sm text-slate-700"><strong>Conseil visuel :</strong> privilégiez une image large, nette et libre de droits. L’ordre le plus bas s’affiche en premier sur la page d’accueil.</div>

        {bannersQuery.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : bannersQuery.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">Impossible de charger les bannières : {bannersQuery.error.message}</div>
        ) : banners.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border bg-white p-8 text-center"><div className="rounded-full bg-violet-50 p-5 text-violet-600"><ImageIcon className="h-8 w-8" /></div><p className="mt-5 text-lg font-semibold text-slate-900">Aucune bannière configurée</p><p className="mt-2 max-w-md text-sm text-muted-foreground">Créez votre premier visuel pour mettre en avant une collection, une promotion ou une nouveauté.</p><Button onClick={openCreate} className="mt-5 bg-orange-500 hover:bg-orange-600"><Plus className="mr-2 h-4 w-4" /> Créer une bannière</Button></div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...banners].sort((a, b) => a.displayOrder - b.displayOrder).map(banner => (
              <article key={banner.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="relative aspect-[16/8] overflow-hidden bg-slate-100">
                  {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon className="h-8 w-8" /></div>}
                  <div className="absolute left-3 top-3 flex gap-2"><Badge className={banner.active ? "border-0 bg-emerald-600" : "border-0 bg-slate-700"}>{banner.active ? "Visible" : "En préparation"}</Badge><Badge variant="secondary">Ordre {banner.displayOrder}</Badge></div>
                </div>
                <div className="p-5"><h2 className="line-clamp-1 text-lg font-bold text-slate-900">{banner.title}</h2><p className="mt-1 min-h-10 line-clamp-2 text-sm text-muted-foreground">{banner.subtitle || "Aucune accroche ajoutée."}</p><div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => toggleBanner.mutate({ id: banner.id, active: banner.active ? 0 : 1 })} disabled={toggleBanner.isPending}>{banner.active ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}{banner.active ? "Masquer" : "Afficher"}</Button><Button variant="outline" size="sm" onClick={() => openEdit(banner)}><Edit className="mr-1.5 h-4 w-4" /> Modifier</Button><Button variant="outline" size="icon" className="text-red-600 hover:text-red-700" title="Supprimer" onClick={() => { if (window.confirm(`Supprimer « ${banner.title} » ?`)) deleteBanner.mutate(banner.id); }} disabled={deleteBanner.isPending}><Trash2 className="h-4 w-4" /></Button></div></div>
              </article>
            ))}
          </section>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>{editingId === null ? "Nouvelle bannière" : "Modifier la bannière"}</DialogTitle><DialogDescription>Renseignez les éléments qui seront présentés à l’accueil de MAZIGHO.</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="banner-title">Titre *</Label><Input id="banner-title" value={form.title} onChange={event => updateField("title", event.target.value)} placeholder="Collection printemps" /></div><div className="grid gap-2"><Label htmlFor="banner-order">Ordre d'affichage</Label><Input id="banner-order" type="number" min={0} value={form.displayOrder} onChange={event => updateField("displayOrder", Number(event.target.value))} /></div></div>
              <div className="grid gap-2"><Label htmlFor="banner-subtitle">Sous-titre</Label><Textarea id="banner-subtitle" value={form.subtitle} onChange={event => updateField("subtitle", event.target.value)} placeholder="Une courte accroche commerciale" rows={3} /></div>
              <div className="grid gap-2"><Label htmlFor="banner-image">URL de l'image *</Label><Input id="banner-image" type="url" value={form.imageUrl} onChange={event => updateField("imageUrl", event.target.value)} placeholder="https://…" /></div>
              <div className="grid gap-2"><Label htmlFor="banner-link">Lien de destination</Label><Input id="banner-link" value={form.linkUrl} onChange={event => updateField("linkUrl", event.target.value)} placeholder="/boutique ou https://…" /></div>
              <div className="rounded-xl border bg-slate-50 p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aperçu</p><div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-slate-200">{form.imageUrl ? <img src={form.imageUrl} alt="Aperçu de la bannière" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Ajoutez une URL d’image pour visualiser la bannière.</div>}<div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/25 to-transparent" /><div className="absolute bottom-4 left-4 max-w-[75%] text-white"><p className="font-bold">{form.title || "Titre de votre bannière"}</p><p className="mt-1 text-xs text-white/80">{form.subtitle || "Votre accroche apparaîtra ici."}</p></div></div></div>
              <div className="flex items-center justify-between rounded-xl border p-3"><div><Label>Visible sur la boutique</Label><p className="text-xs text-muted-foreground">Désactivez pour conserver la bannière en préparation.</p></div><Button type="button" variant={form.active ? "default" : "outline"} onClick={() => updateField("active", form.active ? 0 : 1)}>{form.active ? "Visible" : "Masquée"}</Button></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
