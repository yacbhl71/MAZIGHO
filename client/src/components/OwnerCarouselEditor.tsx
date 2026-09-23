import { useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, PencilLine, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CarouselBannerForm = {
  id?: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  displayOrder: string;
};

const emptyBanner: CarouselBannerForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "/boutique",
  active: true,
  displayOrder: "0",
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OwnerCarouselEditor() {
  const bannersQuery = trpc.owner.getCarouselBanners.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const upload = trpc.owner.uploadImage.useMutation({ onError: error => toast.error(error.message || "L’image n’a pas pu être téléversée.") });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CarouselBannerForm>(emptyBanner);
  const banners = bannersQuery.data ?? [];

  const refresh = async () => {
    await bannersQuery.refetch();
  };

  const createBanner = trpc.owner.createCarouselBanner.useMutation({
    onSuccess: async () => {
      toast.success("Diapositive ajoutée à votre carrousel.");
      setOpen(false);
      setForm(emptyBanner);
      await refresh();
    },
    onError: error => toast.error(error.message || "La diapositive n’a pas pu être ajoutée."),
  });
  const updateBanner = trpc.owner.updateCarouselBanner.useMutation({
    onSuccess: async () => {
      toast.success("Diapositive du carrousel enregistrée.");
      setOpen(false);
      setForm(emptyBanner);
      await refresh();
    },
    onError: error => toast.error(error.message || "La diapositive n’a pas pu être enregistrée."),
  });
  const deleteBanner = trpc.owner.deleteCarouselBanner.useMutation({
    onSuccess: async () => {
      toast.success("Diapositive supprimée.");
      await refresh();
    },
    onError: error => toast.error(error.message || "La diapositive n’a pas pu être supprimée."),
  });

  const openCreate = () => {
    setForm({ ...emptyBanner, displayOrder: String(banners.length) });
    setOpen(true);
  };
  const openEdit = (banner: any) => {
    setForm({
      id: banner.id,
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || "/boutique",
      active: Boolean(banner.active),
      displayOrder: String(banner.displayOrder ?? 0),
    });
    setOpen(true);
  };

  const uploadImage = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await upload.mutateAsync({ dataUrl, fileName: file.name });
      setForm(current => ({ ...current, imageUrl: result.url }));
      toast.success("Image ajoutée à la diapositive. Enregistrez pour publier la modification.");
    } catch {
      // The mutation already displays a useful, scoped error message.
    }
  };

  const submit = () => {
    const displayOrder = Number(form.displayOrder);
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("Ajoutez au minimum un titre et une image.");
      return;
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 999) {
      toast.error("L’ordre doit être un nombre entier compris entre 0 et 999.");
      return;
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim(),
      active: form.active,
      displayOrder,
    };
    if (form.id) updateBanner.mutate({ id: form.id, ...payload });
    else createBanner.mutate(payload);
  };

  const saving = createBanner.isPending || updateBanner.isPending;

  return (
    <Card className="border-violet-200">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-violet-700" /> Carrousel principal</CardTitle>
            <CardDescription className="mt-1 max-w-3xl">Modifiez les diapositives visibles tout en haut de l’accueil : image, titre, texte, lien, ordre et visibilité. Ces réglages sont isolés à votre boutique.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => bannersQuery.refetch()} disabled={bannersQuery.isFetching}>{bannersQuery.isFetching ? "Actualisation…" : "Actualiser"}</Button>
            <Button onClick={openCreate} className="bg-violet-700 hover:bg-violet-800"><Plus className="mr-2 h-4 w-4" /> Ajouter une diapositive</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-5 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
          <p className="font-semibold">Ce que le visiteur voit</p>
          <p className="mt-1">Les diapositives visibles sont lues par ordre croissant. Une diapositive masquée reste conservée dans le panneau sans apparaître sur la vitrine.</p>
        </div>
        {bannersQuery.isLoading ? <div className="h-44 animate-pulse rounded-xl bg-slate-100" /> : banners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50 p-7 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-violet-700" />
            <p className="mt-3 font-semibold text-violet-950">Aucune diapositive n’est encore enregistrée.</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-violet-900">Ajoutez votre premier visuel pour remplacer le carrousel par défaut de cette boutique.</p>
            <Button onClick={openCreate} className="mt-4 bg-violet-700 hover:bg-violet-800"><Plus className="mr-2 h-4 w-4" /> Ajouter une diapositive</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...banners].sort((left: any, right: any) => Number(left.displayOrder) - Number(right.displayOrder)).map((banner: any) => (
              <article key={banner.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="relative aspect-[16/8] bg-slate-100">
                  <img src={banner.imageUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2"><Badge className={banner.active ? "border-0 bg-emerald-600" : "border-0 bg-slate-700"}>{banner.active ? "Visible" : "Masquée"}</Badge><Badge variant="secondary">Ordre {banner.displayOrder}</Badge></div>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-semibold text-slate-950">{banner.title}</h3>
                  <p className="mt-1 min-h-10 line-clamp-2 text-sm text-slate-600">{banner.subtitle || "Aucun texte secondaire."}</p>
                  <p className="mt-2 truncate text-xs text-slate-500">Lien : {banner.linkUrl || "/boutique"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(banner)}><PencilLine className="mr-1.5 h-4 w-4" /> Modifier</Button>
                    <Button size="sm" variant="outline" onClick={() => updateBanner.mutate({ id: banner.id, title: banner.title, subtitle: banner.subtitle || "", imageUrl: banner.imageUrl, linkUrl: banner.linkUrl || "", active: !Boolean(banner.active), displayOrder: Number(banner.displayOrder) })} disabled={updateBanner.isPending}>{banner.active ? <><EyeOff className="mr-1.5 h-4 w-4" /> Masquer</> : <><Eye className="mr-1.5 h-4 w-4" /> Afficher</>}</Button>
                    <Button size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" disabled={deleteBanner.isPending} onClick={() => { if (window.confirm(`Supprimer définitivement la diapositive « ${banner.title} » ?`)) deleteBanner.mutate({ id: banner.id }); }}><Trash2 className="mr-1.5 h-4 w-4" /> Supprimer</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{form.id ? "Modifier la diapositive" : "Nouvelle diapositive"}</DialogTitle><DialogDescription>L’image doit être large pour un meilleur rendu ; le texte reste lisible au-dessus de la photo.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="owner-carousel-title">Titre *</Label><Input id="owner-carousel-title" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Ex. Diamond Painting & créations" /></div>
              <div className="space-y-2"><Label htmlFor="owner-carousel-order">Ordre d’affichage</Label><Input id="owner-carousel-order" type="number" min="0" max="999" inputMode="numeric" value={form.displayOrder} onChange={event => setForm(current => ({ ...current, displayOrder: event.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="owner-carousel-subtitle">Texte secondaire</Label><Textarea id="owner-carousel-subtitle" rows={3} value={form.subtitle} onChange={event => setForm(current => ({ ...current, subtitle: event.target.value }))} placeholder="Une phrase courte pour présenter votre sélection." /></div>
            <div className="space-y-2"><Label htmlFor="owner-carousel-link">Lien du bouton</Label><Input id="owner-carousel-link" value={form.linkUrl} onChange={event => setForm(current => ({ ...current, linkUrl: event.target.value }))} placeholder="/boutique" /><p className="text-xs text-slate-500">Par exemple : <code>/boutique</code>, <code>/categorie/diamond-painting</code> ou une URL https://.</p></div>
            <div className="space-y-2"><Label htmlFor="owner-carousel-image">Image *</Label><div className="flex items-center gap-3"><div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-violet-700">{form.imageUrl ? <img src={form.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}</div><div className="min-w-0 flex-1"><Input id="owner-carousel-image" value={form.imageUrl} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} placeholder="https://… ou téléverser" /><label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-violet-800"><Upload className="h-4 w-4" /> {upload.isPending ? "Téléversement…" : "Téléverser"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={upload.isPending} onChange={async event => { const file = event.target.files?.[0]; if (file) await uploadImage(file); }} /></label></div></div></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-semibold text-slate-950">Visible sur la vitrine</p><p className="mt-1 text-xs leading-5 text-slate-600">Désactivez pour préparer la diapositive sans l’afficher.</p></div><Button type="button" variant={form.active ? "default" : "outline"} className={form.active ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => setForm(current => ({ ...current, active: !current.active }))}>{form.active ? "Visible" : "Masquée"}</Button></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving || upload.isPending} onClick={submit} className="bg-violet-700 hover:bg-violet-800">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{form.id ? "Enregistrer" : "Ajouter la diapositive"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
