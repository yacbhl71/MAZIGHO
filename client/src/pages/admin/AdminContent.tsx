import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, ArrowUpRight, Edit, Eye, EyeOff, Image as ImageIcon, LayoutTemplate, Loader2, MonitorUp, Plus, Save, Trash2, Type } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { homeSectionMeta, type DesignProfile } from "@/hooks/useDesignProfile";
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

  const utils = trpc.useUtils();
  const designQuery = trpc.admin.design.get.useQuery();
  const updateDesign = trpc.admin.design.update.useMutation({
    onSuccess: async () => { toast.success("Disposition de l'accueil enregistrée"); await utils.admin.design.get.invalidate(); },
    onError: error => toast.error(`Erreur : ${error.message}`),
  });
  const [layout, setLayout] = useState<DesignProfile | null>(null);
  useEffect(() => { if (designQuery.data) setLayout(designQuery.data as DesignProfile); }, [designQuery.data]);

  const sectionVisibility: Record<string, "showDiscovery" | "showStory" | "showTestimonials" | "showEditorial" | "showFeatured"> = {
    discovery: "showDiscovery", story: "showStory", testimonials: "showTestimonials", editorial: "showEditorial", featured: "showFeatured",
  };
  const moveBlock = (index: number, direction: -1 | 1) => setLayout(current => {
    if (!current) return current;
    const order = [...current.homeOrder];
    const target = index + direction;
    if (target < 0 || target >= order.length) return current;
    [order[index], order[target]] = [order[target], order[index]];
    return { ...current, homeOrder: order };
  });
  const toggleBlockVisible = (key: string) => setLayout(current => {
    if (!current) return current;
    if (key.startsWith("text:")) {
      const id = key.slice(5);
      return { ...current, textBanners: current.textBanners.map(banner => banner.id === id ? { ...banner, enabled: !banner.enabled } : banner) };
    }
    const field = sectionVisibility[key];
    return field ? { ...current, [field]: !current[field] } : current;
  });
  const addTextBanner = () => setLayout(current => {
    if (!current) return current;
    const id = `tb_${Date.now().toString(36)}`;
    return { ...current, textBanners: [...current.textBanners, { id, eyebrow: "Nouveau bloc", title: "Titre de la bannière texte", text: "", buttonLabel: "", buttonUrl: "", enabled: true }], homeOrder: [...current.homeOrder, `text:${id}`] };
  });
  const updateTextBanner = (id: string, patch: Partial<DesignProfile["textBanners"][number]>) => setLayout(current => current ? { ...current, textBanners: current.textBanners.map(banner => banner.id === id ? { ...banner, ...patch } : banner) } : current);
  const removeTextBanner = (id: string) => setLayout(current => current ? { ...current, textBanners: current.textBanners.filter(banner => banner.id !== id), homeOrder: current.homeOrder.filter(key => key !== `text:${id}`) } : current);
  const saveLayout = () => { if (layout) updateDesign.mutate(layout); };

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

        {layout && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm" data-testid="home-layout-studio">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><LayoutTemplate className="h-5 w-5 text-violet-600" /> Disposition dynamique de l’accueil</h2><p className="mt-1 text-sm text-muted-foreground">Réorganisez les blocs, masquez-les ou ajoutez des bannières texte. L’ordre choisi s’applique directement à la page d’accueil.</p></div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={addTextBanner} data-testid="add-text-banner"><Plus className="mr-2 h-4 w-4" /> Bannière texte</Button><Button onClick={saveLayout} disabled={updateDesign.isPending} className="bg-violet-600 hover:bg-violet-700" data-testid="save-layout">{updateDesign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer la disposition</Button></div>
          </div>
          <div className="mt-4 space-y-2">
            {layout.homeOrder.map((key, index) => {
              const isText = key.startsWith("text:");
              const banner = isText ? layout.textBanners.find(item => `text:${item.id}` === key) : null;
              if (isText && !banner) return null;
              const meta = isText ? { label: banner!.title || "Bannière texte", description: "Bloc de texte personnalisé" } : homeSectionMeta[key];
              if (!meta) return null;
              const visible = isText ? banner!.enabled : Boolean(layout[sectionVisibility[key]]);
              return (
                <div key={key} className="rounded-xl border border-slate-200 p-3" data-testid={`layout-block-${key}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="text-slate-400 hover:text-violet-600 disabled:opacity-30" aria-label="Monter" data-testid={`move-up-${key}`}><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === layout.homeOrder.length - 1} className="text-slate-400 hover:text-violet-600 disabled:opacity-30" aria-label="Descendre" data-testid={`move-down-${key}`}><ArrowDown className="h-4 w-4" /></button>
                    </div>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">{isText ? <Type className="h-4 w-4" /> : <LayoutTemplate className="h-4 w-4" />}</div>
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{meta.label}</p><p className="truncate text-xs text-muted-foreground">{meta.description}</p></div>
                    <Badge variant="secondary" className="hidden sm:inline-flex">#{index + 1}</Badge>
                    <Button type="button" variant={visible ? "default" : "outline"} size="sm" className={visible ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => toggleBlockVisible(key)} data-testid={`toggle-block-${key}`}>{visible ? <><Eye className="mr-1.5 h-4 w-4" /> Visible</> : <><EyeOff className="mr-1.5 h-4 w-4" /> Masqué</>}</Button>
                    {isText && <Button type="button" variant="outline" size="icon" className="text-red-600 hover:text-red-700" onClick={() => removeTextBanner(banner!.id)} data-testid={`remove-block-${key}`}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                  {isText && (
                    <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                      <div className="grid gap-1.5"><Label className="text-xs">Petit libellé</Label><Input value={banner!.eyebrow} onChange={event => updateTextBanner(banner!.id, { eyebrow: event.target.value })} /></div>
                      <div className="grid gap-1.5"><Label className="text-xs">Titre *</Label><Input value={banner!.title} onChange={event => updateTextBanner(banner!.id, { title: event.target.value })} /></div>
                      <div className="grid gap-1.5 sm:col-span-2"><Label className="text-xs">Texte</Label><Textarea rows={2} value={banner!.text} onChange={event => updateTextBanner(banner!.id, { text: event.target.value })} /></div>
                      <div className="grid gap-1.5"><Label className="text-xs">Libellé du bouton</Label><Input value={banner!.buttonLabel} onChange={event => updateTextBanner(banner!.id, { buttonLabel: event.target.value })} placeholder="Découvrir" /></div>
                      <div className="grid gap-1.5"><Label className="text-xs">Lien du bouton</Label><Input value={banner!.buttonUrl} onChange={event => updateTextBanner(banner!.id, { buttonUrl: event.target.value })} placeholder="/boutique" /></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        )}

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
