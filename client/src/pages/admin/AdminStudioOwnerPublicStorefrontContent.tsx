import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { type DesignProfile } from "@/hooks/useDesignProfile";
import { ArrowLeft, Eye, ImagePlus, Loader2, Palette, Plus, Save, Trash2, Upload, WandSparkles } from "lucide-react";

type BannerDraft = {
  id?: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  active: number;
  displayOrder: number;
};

const emptyBanner = (displayOrder = 0): BannerDraft => ({ title: "", subtitle: "", imageUrl: "", linkUrl: "/boutique", active: 1, displayOrder });

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function ImageField({ label, value, onChange, onUpload, uploading }: { label: string; value: string; onChange: (value: string) => void; onUpload: (file: File) => void; uploading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input value={value} onChange={event => onChange(event.target.value)} placeholder="https://… ou /media/…" className="min-h-11" />
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} />
      <Button type="button" variant="outline" className="min-h-11 shrink-0" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Téléverser</Button>
    </div>
    {value && <img src={value} alt="Aperçu du visuel" className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 object-cover sm:w-56" />}
  </div>;
}

function BannerEditor({ value, onSave, onDelete, onUpload, pending }: { value: BannerDraft; onSave: (value: BannerDraft) => void; onDelete?: () => void; onUpload: (file: File, apply: (url: string) => void) => void; pending: boolean }) {
  const [form, setForm] = useState<BannerDraft>(value);
  useEffect(() => setForm(value), [value]);
  const canSave = form.title.trim().length >= 2 && form.imageUrl.trim().length > 0 && !pending;
  return <Card className="border-slate-200"><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base">{value.id ? "Bannière enregistrée" : "Nouvelle bannière"}</CardTitle><CardDescription className="mt-1">Cette bannière ne concerne que cette boutique.</CardDescription></div>{value.id && onDelete && <Button type="button" variant="outline" size="sm" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={onDelete}><Trash2 className="mr-1.5 h-4 w-4" /> Retirer</Button>}</div></CardHeader><CardContent className="grid gap-4">
    <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Titre</Label><Input value={form.title} maxLength={180} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Ex. Des sorties plus sereines" /></div><div className="space-y-2"><Label>Lien du bouton</Label><Input value={form.linkUrl} maxLength={300} onChange={event => setForm(current => ({ ...current, linkUrl: event.target.value }))} placeholder="/boutique" /></div></div>
    <div className="space-y-2"><Label>Sous-titre</Label><Textarea value={form.subtitle} maxLength={600} onChange={event => setForm(current => ({ ...current, subtitle: event.target.value }))} placeholder="Une phrase simple pour présenter votre univers." className="min-h-[76px]" /></div>
    <ImageField label="Image de bannière" value={form.imageUrl} onChange={imageUrl => setForm(current => ({ ...current, imageUrl }))} onUpload={file => onUpload(file, url => setForm(current => ({ ...current, imageUrl: url })))} uploading={pending} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(form.active)} onChange={event => setForm(current => ({ ...current, active: event.target.checked ? 1 : 0 }))} /> Visible sur l’accueil</label><Button type="button" disabled={!canSave} onClick={() => onSave(form)} className="min-h-11 bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" /> {pending ? "Enregistrement…" : "Enregistrer la bannière"}</Button></div>
  </CardContent></Card>;
}

export default function AdminStudioOwnerPublicStorefrontContent() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/contenu-public/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const contentQuery = trpc.admin.studio.getOwnerPublicStorefrontContent.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });
  const utils = trpc.useUtils();
  const [profile, setProfile] = useState<DesignProfile | null>(null);
  const [draftBanner, setDraftBanner] = useState<BannerDraft | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => { if (contentQuery.data) setProfile(contentQuery.data.profile as DesignProfile); }, [contentQuery.data]);

  const refresh = async () => {
    await Promise.all([
      utils.admin.studio.getOwnerPublicStorefrontContent.invalidate({ storeId }),
      utils.admin.studio.getPrivateStorefrontPreview.invalidate({ storeId }),
    ]);
  };
  const saveProfile = trpc.admin.studio.saveOwnerPublicStorefrontProfile.useMutation({ onSuccess: async () => { setNotice("Contenu storefront enregistré pour cette boutique."); await refresh(); }, onError: error => setNotice(error.message || "Enregistrement impossible.") });
  const saveBanner = trpc.admin.studio.saveOwnerPublicStorefrontBanner.useMutation({ onSuccess: async () => { setNotice("Bannière enregistrée pour cette boutique."); setDraftBanner(null); await refresh(); }, onError: error => setNotice(error.message || "Bannière impossible à enregistrer.") });
  const deleteBanner = trpc.admin.studio.deleteOwnerPublicStorefrontBanner.useMutation({ onSuccess: async () => { setNotice("Bannière retirée de cette boutique."); await refresh(); }, onError: error => setNotice(error.message || "Suppression impossible.") });
  const uploadImage = trpc.admin.studio.uploadOwnerPublicStorefrontImage.useMutation({ onError: error => setNotice(error.message || "Téléversement impossible.") });

  const upload = async (file: File, apply: (url: string) => void) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadImage.mutateAsync({ storeId, dataUrl, fileName: file.name });
      apply(result.url);
      setNotice("Visuel téléversé ; enregistrez ensuite le bloc concerné.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Téléversement impossible."); }
  };

  const banners = contentQuery.data?.banners ?? [];
  const isSaving = saveProfile.isPending || saveBanner.isPending || deleteBanner.isPending || uploadImage.isPending;
  const storefrontUrl = useMemo(() => contentQuery.data?.store.primaryDomain ? `https://${contentQuery.data.store.primaryDomain}` : "", [contentQuery.data?.store.primaryDomain]);

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge><Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-950">Contenu storefront isolé</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Bannières, images et textes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Personnalisez la vitrine de cette boutique sans modifier MAZIGHO principal. Les contenus enregistrés s’appliquent uniquement à son domaine.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/publication-catalogue/${storeId}`)} className="w-fit min-h-11"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au lancement</Button></header>
    {!isValidStoreId ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-950">Boutique non sélectionnée.</CardContent></Card> : contentQuery.isLoading || !profile ? <div className="grid gap-5"><div className="h-52 animate-pulse rounded-2xl bg-slate-100" /><div className="h-80 animate-pulse rounded-2xl bg-slate-100" /></div> : contentQuery.isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-950">Contenu indisponible : {contentQuery.error.message}</CardContent></Card> : <>
      <section className="grid gap-4 md:grid-cols-3"><Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Boutique</p><p className="mt-2 font-semibold text-emerald-950">{contentQuery.data?.store.displayName}</p><p className="mt-1 text-sm text-emerald-800">Statut : {contentQuery.data?.store.status}</p></CardContent></Card><Card className="md:col-span-2"><CardContent className="flex h-full flex-col justify-center p-5"><p className="font-semibold text-slate-950">Aperçu et publication maîtrisés</p><p className="mt-1 text-sm leading-6 text-slate-600">Vous pouvez modifier les contenus ci-dessous puis ouvrir le domaine dans un onglet séparé pour les vérifier.</p>{storefrontUrl && <a href={storefrontUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-fit items-center text-sm font-semibold text-slate-900 underline"><Eye className="mr-1.5 h-4 w-4" /> Voir le storefront</a>}</CardContent></Card></section>
      <Card><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700"><Palette className="h-5 w-5" /></div><div><CardDescription>Identité et blocs éditoriaux</CardDescription><CardTitle className="mt-1">Un univers visuel propre à la boutique</CardTitle></div></div></CardHeader><CardContent className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Nom de marque</Label><Input value={profile.brandName} onChange={event => setProfile(current => current ? { ...current, brandName: event.target.value } : current)} /></div><div className="space-y-2"><Label>Message de marque</Label><Input value={profile.brandMessage} onChange={event => setProfile(current => current ? { ...current, brandMessage: event.target.value } : current)} /></div></div>
        <ImageField label="Logo de marque" value={profile.brandLogoUrl} onChange={brandLogoUrl => setProfile(current => current ? { ...current, brandLogoUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, brandLogoUrl: url } : current))} uploading={uploadImage.isPending} />
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Palette</Label><select value={profile.paletteId} onChange={event => setProfile(current => current ? { ...current, paletteId: event.target.value as DesignProfile["paletteId"] } : current)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="sage">Sauge naturel</option><option value="terracotta">Terracotta</option><option value="midnight">Bleu nuit</option><option value="rose">Rose</option></select></div><div className="space-y-2"><Label>Typographie</Label><select value={profile.typographyId} onChange={event => setProfile(current => current ? { ...current, typographyId: event.target.value as DesignProfile["typographyId"] } : current)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="editorial">Éditoriale</option><option value="modern">Moderne</option><option value="classic">Classique</option></select></div></div>
        <div className="grid gap-5 xl:grid-cols-3"><div className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="font-semibold">Bloc inspiration</p><Input value={profile.highlightEyebrow} onChange={event => setProfile(current => current ? { ...current, highlightEyebrow: event.target.value } : current)} placeholder="Petit libellé" /><Input value={profile.highlightTitle} onChange={event => setProfile(current => current ? { ...current, highlightTitle: event.target.value } : current)} placeholder="Titre" /><Textarea value={profile.highlightText} onChange={event => setProfile(current => current ? { ...current, highlightText: event.target.value } : current)} className="min-h-[110px]" /><ImageField label="Image" value={profile.highlightImageUrl} onChange={highlightImageUrl => setProfile(current => current ? { ...current, highlightImageUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, highlightImageUrl: url } : current))} uploading={uploadImage.isPending} /></div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="font-semibold">Histoire de marque</p><Input value={profile.storyTitle} onChange={event => setProfile(current => current ? { ...current, storyTitle: event.target.value } : current)} placeholder="Titre" /><Textarea value={profile.storyText} onChange={event => setProfile(current => current ? { ...current, storyText: event.target.value } : current)} className="min-h-[164px]" /><ImageField label="Image" value={profile.storyImageUrl} onChange={storyImageUrl => setProfile(current => current ? { ...current, storyImageUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, storyImageUrl: url } : current))} uploading={uploadImage.isPending} /></div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="font-semibold">Encart éditorial</p><Input value={profile.editorialEyebrow} onChange={event => setProfile(current => current ? { ...current, editorialEyebrow: event.target.value } : current)} placeholder="Petit libellé" /><Input value={profile.editorialTitle} onChange={event => setProfile(current => current ? { ...current, editorialTitle: event.target.value } : current)} placeholder="Titre" /><ImageField label="Image" value={profile.editorialImageUrl} onChange={editorialImageUrl => setProfile(current => current ? { ...current, editorialImageUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, editorialImageUrl: url } : current))} uploading={uploadImage.isPending} /></div></div>
        <Button type="button" disabled={isSaving} onClick={() => profile && saveProfile.mutate({ storeId, profile })} className="min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"><Save className="mr-2 h-4 w-4" /> {saveProfile.isPending ? "Enregistrement…" : "Enregistrer les textes et images"}</Button>
      </CardContent></Card>
      <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">Bannières d’accueil</p><p className="mt-1 text-sm text-slate-600">Elles remplacent la bannière générique MAZIGHO sur ce domaine.</p></div><Button type="button" variant="outline" className="min-h-11" onClick={() => setDraftBanner(emptyBanner(banners.length))}><Plus className="mr-2 h-4 w-4" /> Ajouter une bannière</Button></div>
        {banners.map(banner => <BannerEditor key={banner.id} value={{ id: banner.id, title: banner.title, subtitle: banner.subtitle || "", imageUrl: banner.imageUrl, linkUrl: banner.linkUrl || "/boutique", active: banner.active, displayOrder: banner.displayOrder }} pending={isSaving} onUpload={upload} onSave={value => saveBanner.mutate({ storeId, ...value })} onDelete={() => deleteBanner.mutate({ storeId, bannerId: banner.id })} />)}
        {draftBanner && <BannerEditor value={draftBanner} pending={isSaving} onUpload={upload} onSave={value => saveBanner.mutate({ storeId, ...value })} />}
        {banners.length === 0 && !draftBanner && <Card className="border-dashed border-slate-300"><CardContent className="p-6 text-sm text-slate-600"><ImagePlus className="mb-2 h-5 w-5 text-slate-500" /> Aucune bannière propre n’est enregistrée : ajoutez-en une pour remplacer le visuel générique.</CardContent></Card>}
      </section>
      {notice && <p className={`rounded-xl border px-4 py-3 text-sm ${notice.includes("impossible") || notice.includes("Erreur") ? "border-rose-200 bg-rose-50 text-rose-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>{notice}</p>}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><WandSparkles className="mr-2 inline h-4 w-4" /> Les contenus de cette page sont enregistrés par boutique. Ils ne modifient ni les bannières, ni les images, ni les textes de MAZIGHO principal.</div>
    </>}</main></DashboardLayout>;
}
