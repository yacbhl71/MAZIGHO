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
import { designPalettes, type DesignProfile, type StoreNavigationItem } from "@/hooks/useDesignProfile";
import { hasReadableTextContrast } from "@/lib/colorContrast";
import { storefrontThemeCatalog } from "@shared/storefrontThemeCatalog";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, ImagePlus, LayoutPanelTop, Loader2, Palette, Plus, Save, Trash2, Upload, WandSparkles } from "lucide-react";

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

const navigationSystemLabels: Record<string, string> = {
  home: "Accueil",
  shop: "Boutique",
  categories: "Catégories",
  creations: "Créations",
  new: "Nouveautés",
  "best-sellers": "Best-sellers",
  promos: "Promotions",
  contact: "Contact",
};

const storefrontThemeCards = storefrontThemeCatalog.map(theme => ({
  id: theme.id,
  title: theme.label,
  label: theme.eyebrow,
  description: theme.description,
  cardClass: theme.palette.card,
  labelClass: theme.palette.label,
  titleClass: theme.palette.title,
  textClass: theme.palette.text,
  buttonClass: theme.palette.button,
}));

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
  // The parent reconstructs this object on every render. Depending on the object
  // identity would discard local banner edits as soon as an image upload toggles.
  useEffect(() => setForm(value), [value.active, value.displayOrder, value.id, value.imageUrl, value.linkUrl, value.subtitle, value.title]);
  const canSave = form.title.trim().length >= 2 && form.imageUrl.trim().length > 0 && !pending;
  return <Card className="border-slate-200"><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base">{value.id ? "Bannière enregistrée" : "Nouvelle bannière"}</CardTitle><CardDescription className="mt-1">Cette bannière ne concerne que cette boutique.</CardDescription></div>{value.id && onDelete && <Button type="button" variant="outline" size="sm" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={onDelete}><Trash2 className="mr-1.5 h-4 w-4" /> Retirer</Button>}</div></CardHeader><CardContent className="grid gap-4">
    <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Titre</Label><Input value={form.title} maxLength={180} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Ex. Des sorties plus sereines" /></div><div className="space-y-2"><Label>Lien du bouton</Label><Input value={form.linkUrl} maxLength={300} onChange={event => setForm(current => ({ ...current, linkUrl: event.target.value }))} placeholder="/boutique" /></div></div>
    <div className="space-y-2"><Label>Sous-titre</Label><Textarea value={form.subtitle} maxLength={600} onChange={event => setForm(current => ({ ...current, subtitle: event.target.value }))} placeholder="Une phrase simple pour présenter votre univers." className="min-h-[76px]" /></div>
    <ImageField label="Image de bannière" value={form.imageUrl} onChange={imageUrl => setForm(current => ({ ...current, imageUrl }))} onUpload={file => onUpload(file, url => setForm(current => ({ ...current, imageUrl: url })))} uploading={pending} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(form.active)} onChange={event => setForm(current => ({ ...current, active: event.target.checked ? 1 : 0 }))} /> Visible sur l’accueil</label><Button type="button" disabled={!canSave} onClick={() => onSave(form)} className="min-h-11 bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" /> {pending ? "Enregistrement…" : "Enregistrer la bannière"}</Button></div>
  </CardContent></Card>;
}

export default function AdminStudioOwnerPublicStorefrontContent({ storeIdOverride, params: routeParams }: { storeIdOverride?: number; params?: { storeId?: string } } = {}) {
  const [, setLocation] = useLocation();
  const [, matchedParams] = useRoute("/admin/studio/contenu-public/:storeId");
  const storeId = storeIdOverride ?? Number(routeParams?.storeId ?? matchedParams?.storeId);
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
  const applyStorefrontTheme = trpc.admin.studio.applyStorefrontTheme.useMutation({ onSuccess: async ({ profile: saved }) => { setProfile(saved as DesignProfile); setNotice("Modèle appliqué. Chaque texte, image, carrousel, carte et onglet reste modifiable ou masquable ensuite."); await refresh(); }, onError: error => setNotice(error.message || "Le modèle n’a pas pu être appliqué.") });
  const saveBanner = trpc.admin.studio.saveOwnerPublicStorefrontBanner.useMutation({ onSuccess: async () => { setNotice("Bannière enregistrée pour cette boutique."); setDraftBanner(null); await refresh(); }, onError: error => setNotice(error.message || "Bannière impossible à enregistrer.") });
  const deleteBanner = trpc.admin.studio.deleteOwnerPublicStorefrontBanner.useMutation({ onSuccess: async () => { setNotice("Bannière retirée de cette boutique."); await refresh(); }, onError: error => setNotice(error.message || "Suppression impossible.") });
  const uploadImage = trpc.admin.studio.uploadOwnerPublicStorefrontImage.useMutation({ onError: error => setNotice(error.message || "Téléversement impossible.") });

  const applyVioletFuchsiaDuo = () => {
    if (!profile) return;
    const updated = {
      ...profile,
      paletteId: "violet" as const,
      customColorsEnabled: true,
      customPrimary: "#6D28D9",
      customAccent: "#C80AFF",
      customSoft: "#F7F3FF",
    };
    setProfile(updated);
    // A preset must be useful on a tablet in one action. Saving it here avoids
    // losing the selection when the owner does not need to edit other fields.
    saveProfile.mutate({ storeId, profile: updated });
  };

  const updateNavigationItem = (id: string, changes: Partial<StoreNavigationItem>) => {
    setProfile(current => current ? { ...current, navigationItems: current.navigationItems.map(item => item.id === id ? { ...item, ...changes } : item) } : current);
  };
  const moveNavigationItem = (id: string, offset: -1 | 1) => {
    setProfile(current => {
      if (!current) return current;
      const index = current.navigationItems.findIndex(item => item.id === id);
      const destination = index + offset;
      if (index < 0 || destination < 0 || destination >= current.navigationItems.length) return current;
      const navigationItems = [...current.navigationItems];
      [navigationItems[index], navigationItems[destination]] = [navigationItems[destination], navigationItems[index]];
      return { ...current, navigationItems };
    });
  };
  const addCustomNavigationItem = () => {
    setProfile(current => current ? {
      ...current,
      navigationItems: [...current.navigationItems, { id: `custom-lien-${Date.now()}`, label: "Nouvel onglet", href: "/boutique", visible: true, kind: "custom" }],
    } : current);
  };
  const removeNavigationItem = (id: string) => {
    setProfile(current => current ? {
      ...current,
      navigationItems: current.navigationItems.filter(item => item.id !== id).map(item => item.parentId === id ? { ...item, parentId: undefined } : item),
    } : current);
  };

  const upload = async (file: File, apply: (url: string) => void) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadImage.mutateAsync({ storeId, dataUrl, fileName: file.name });
      apply(result.url);
      setNotice("Visuel téléversé ; enregistrez ensuite le bloc concerné.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Téléversement impossible."); }
  };

  const banners = contentQuery.data?.banners ?? [];
  const isSaving = saveProfile.isPending || applyStorefrontTheme.isPending || saveBanner.isPending || deleteBanner.isPending || uploadImage.isPending;
  const storefrontUrl = useMemo(() => contentQuery.data?.store.primaryDomain ? `https://${contentQuery.data.store.primaryDomain}` : "", [contentQuery.data?.store.primaryDomain]);
  const footerBackgroundColor = profile?.footerBackgroundColor || (profile?.customColorsEnabled ? profile.customPrimary : profile ? designPalettes[profile.paletteId].primary : "#0f766e");
  const footerTextColor = profile?.footerTextColor || "#ffffff";
  const footerContrastIsReadable = hasReadableTextContrast(footerBackgroundColor, footerTextColor);

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge><Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-950">Contenu storefront isolé</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Bannières, images et textes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Personnalisez la vitrine de cette boutique sans modifier MAZIGHO principal. Les contenus enregistrés s’appliquent uniquement à son domaine.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/publication-catalogue/${storeId}`)} className="w-fit min-h-11"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au lancement</Button></header>
    {!isValidStoreId ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-950">Boutique non sélectionnée.</CardContent></Card> : contentQuery.isLoading || !profile ? <div className="grid gap-5"><div className="h-52 animate-pulse rounded-2xl bg-slate-100" /><div className="h-80 animate-pulse rounded-2xl bg-slate-100" /></div> : contentQuery.isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-950">Contenu indisponible : {contentQuery.error.message}</CardContent></Card> : <>
      <section className="grid gap-4 md:grid-cols-3"><Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Boutique</p><p className="mt-2 font-semibold text-emerald-950">{contentQuery.data?.store.displayName}</p><p className="mt-1 text-sm text-emerald-800">Statut : {contentQuery.data?.store.status}</p></CardContent></Card><Card className="md:col-span-2"><CardContent className="flex h-full flex-col justify-center p-5"><p className="font-semibold text-slate-950">Aperçu et publication maîtrisés</p><p className="mt-1 text-sm leading-6 text-slate-600">Vous pouvez modifier les contenus ci-dessous puis ouvrir le domaine dans un onglet séparé pour les vérifier.</p>{storefrontUrl && <a href={storefrontUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-fit items-center text-sm font-semibold text-slate-900 underline"><Eye className="mr-1.5 h-4 w-4" /> Voir le storefront</a>}</CardContent></Card></section>
      <section className="grid gap-4 xl:grid-cols-3">{storefrontThemeCards.map(theme => <Card key={theme.id} className={theme.cardClass}><CardContent className="flex h-full flex-col gap-4 p-5"><div><p className={`text-xs font-bold uppercase tracking-[0.14em] ${theme.labelClass}`}>{theme.label}</p><p className={`mt-2 text-lg font-semibold ${theme.titleClass}`}>{theme.title}</p><p className={`mt-1 text-sm leading-6 ${theme.textClass}`}>{theme.description}</p></div><Button type="button" disabled={isSaving} onClick={() => applyStorefrontTheme.mutate({ storeId, themeId: theme.id })} className={`mt-auto min-h-11 w-full ${theme.buttonClass}`}><WandSparkles className="mr-2 h-4 w-4" />{applyStorefrontTheme.isPending ? "Application…" : "Appliquer ce modèle"}</Button><p className={`text-xs leading-5 ${theme.textClass}`}>Modèle de départ optionnel : chaque élément reste personnalisable par la suite.</p></CardContent></Card>)}</section>
      <Card><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700"><Palette className="h-5 w-5" /></div><div><CardDescription>Identité et blocs éditoriaux</CardDescription><CardTitle className="mt-1">Un univers visuel propre à la boutique</CardTitle></div></div></CardHeader><CardContent className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Nom de marque</Label><Input value={profile.brandName} onChange={event => setProfile(current => current ? { ...current, brandName: event.target.value } : current)} /></div><div className="space-y-2"><Label>Message de marque</Label><Input value={profile.brandMessage} onChange={event => setProfile(current => current ? { ...current, brandMessage: event.target.value } : current)} /></div></div>
        <ImageField label="Logo de marque" value={profile.brandLogoUrl} onChange={brandLogoUrl => setProfile(current => current ? { ...current, brandLogoUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, brandLogoUrl: url } : current))} uploading={uploadImage.isPending} />
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Palette</Label><select value={profile.paletteId} onChange={event => setProfile(current => current ? { ...current, paletteId: event.target.value as DesignProfile["paletteId"] } : current)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="sage">Sauge naturel</option><option value="terracotta">Terracotta</option><option value="midnight">Bleu nuit</option><option value="rose">Rose</option><option value="violet">Violet atelier</option></select></div><div className="space-y-2"><Label>Typographie</Label><select value={profile.typographyId} onChange={event => setProfile(current => current ? { ...current, typographyId: event.target.value as DesignProfile["typographyId"] } : current)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="editorial">Éditoriale</option><option value="modern">Moderne</option><option value="classic">Classique</option></select></div></div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-semibold text-violet-950">Couleurs personnalisées</p><p className="mt-1 max-w-2xl text-sm leading-6 text-violet-900">Un duo harmonieux : une couleur principale pour la structure, une couleur d’accent pour les boutons et détails, puis un fond très clair. Chaque boutique garde sa propre palette.</p></div><Button type="button" size="sm" variant="outline" disabled={isSaving} className="min-h-11 border-fuchsia-300 text-fuchsia-800 hover:bg-fuchsia-50" onClick={applyVioletFuchsiaDuo}>Duo violet + fuchsia</Button></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="studio-custom-primary">Couleur principale</Label><Input id="studio-custom-primary" maxLength={7} value={profile.customPrimary} placeholder="#6D28D9" onChange={event => setProfile(current => current ? { ...current, customColorsEnabled: true, customPrimary: event.target.value } : current)} /></div><div className="space-y-2"><Label htmlFor="studio-custom-accent">Accent lumineux</Label><Input id="studio-custom-accent" maxLength={7} value={profile.customAccent} placeholder="#C80AFF" onChange={event => setProfile(current => current ? { ...current, customColorsEnabled: true, customAccent: event.target.value } : current)} /></div><div className="space-y-2"><Label htmlFor="studio-custom-soft">Fond doux</Label><Input id="studio-custom-soft" maxLength={7} value={profile.customSoft} placeholder="#F7F3FF" onChange={event => setProfile(current => current ? { ...current, customColorsEnabled: true, customSoft: event.target.value } : current)} /></div></div><div className="mt-3 flex items-center gap-2" aria-label="Aperçu de la palette"><span className="h-8 w-8 rounded-full border border-slate-200" style={{ backgroundColor: profile.customPrimary }} /><span className="h-8 w-8 rounded-full border border-slate-200" style={{ backgroundColor: profile.customAccent }} /><span className="h-8 w-8 rounded-full border border-slate-200" style={{ backgroundColor: profile.customSoft }} /><span className="text-xs text-violet-900">Le duo s’enregistre immédiatement. Pour vos réglages manuels, utilisez le bouton d’enregistrement ci-dessous.</span></div></div>
        <div className="grid gap-5 xl:grid-cols-3"><div className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="font-semibold">Bloc inspiration</p><Input value={profile.highlightEyebrow} onChange={event => setProfile(current => current ? { ...current, highlightEyebrow: event.target.value } : current)} placeholder="Petit libellé" /><Input value={profile.highlightTitle} onChange={event => setProfile(current => current ? { ...current, highlightTitle: event.target.value } : current)} placeholder="Titre" /><Textarea value={profile.highlightText} onChange={event => setProfile(current => current ? { ...current, highlightText: event.target.value } : current)} className="min-h-[110px]" /><ImageField label="Image" value={profile.highlightImageUrl} onChange={highlightImageUrl => setProfile(current => current ? { ...current, highlightImageUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, highlightImageUrl: url } : current))} uploading={uploadImage.isPending} /></div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="font-semibold">Histoire de marque</p><Input value={profile.storyTitle} onChange={event => setProfile(current => current ? { ...current, storyTitle: event.target.value } : current)} placeholder="Titre" /><Textarea value={profile.storyText} onChange={event => setProfile(current => current ? { ...current, storyText: event.target.value } : current)} className="min-h-[164px]" /><ImageField label="Image" value={profile.storyImageUrl} onChange={storyImageUrl => setProfile(current => current ? { ...current, storyImageUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, storyImageUrl: url } : current))} uploading={uploadImage.isPending} /></div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="font-semibold">Encart éditorial</p><Input value={profile.editorialEyebrow} onChange={event => setProfile(current => current ? { ...current, editorialEyebrow: event.target.value } : current)} placeholder="Petit libellé" /><Input value={profile.editorialTitle} onChange={event => setProfile(current => current ? { ...current, editorialTitle: event.target.value } : current)} placeholder="Titre" /><ImageField label="Image" value={profile.editorialImageUrl} onChange={editorialImageUrl => setProfile(current => current ? { ...current, editorialImageUrl } : current)} onUpload={file => upload(file, url => setProfile(current => current ? { ...current, editorialImageUrl: url } : current))} uploading={uploadImage.isPending} /></div></div>
        <Button type="button" disabled={isSaving} onClick={() => profile && saveProfile.mutate({ storeId, profile })} className="min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"><Save className="mr-2 h-4 w-4" /> {saveProfile.isPending ? "Enregistrement…" : "Enregistrer les textes et images"}</Button>
      </CardContent></Card>
      <StorefrontMenuEditor
        profile={profile}
        isSaving={isSaving}
        onAdd={addCustomNavigationItem}
        onMove={moveNavigationItem}
        onRemove={removeNavigationItem}
        onSave={() => saveProfile.mutate({ storeId, profile })}
        onUpdate={updateNavigationItem}
        onLayoutChange={headerLayout => setProfile(current => current ? { ...current, headerLayout } : current)}
      />
      <Card><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><LayoutPanelTop className="h-5 w-5" /></div><div><CardDescription>Footer de la boutique</CardDescription><CardTitle className="mt-1">Pied de page, couleurs et informations</CardTitle><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Réglez le fond, la couleur du texte, les colonnes, le contact et les réseaux sans affecter les autres boutiques.</p></div></div></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{([ ["footerShowNavigation", "Menu visible", "Reprend les onglets configurés ci-dessus."], ["footerShowCategories", "Catégories visibles", "Affiche uniquement les catégories de cette boutique."], ["footerShowHelp", "Aide et contact", "Affiche FAQ et votre lien de contact."], ["footerShowReassurance", "Réassurance visible", "Affiche les trois messages de fin de page."], ] as Array<["footerShowNavigation" | "footerShowCategories" | "footerShowHelp" | "footerShowReassurance", string, string]>).map(([field, label, description]) => <label key={field} className="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><input type="checkbox" checked={profile[field]} onChange={event => setProfile(current => current ? { ...current, [field]: event.target.checked } : current)} className="mt-1 h-5 w-5 accent-indigo-700" /><span><span className="block text-sm font-semibold text-slate-950">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span></span></label>)}</div><div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-indigo-950">Couleurs du footer</p><p className="mt-1 text-xs leading-5 text-indigo-900">Le contrôle de contraste évite un texte blanc sur fond clair ou toute autre combinaison difficile à lire.</p></div><Button type="button" size="sm" variant="outline" disabled={isSaving} className="min-h-10 border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100" onClick={() => setProfile(current => current ? { ...current, footerBackgroundColor: "", footerTextColor: "" } : current)}>Utiliser la couleur de marque</Button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="studio-footer-background-color">Fond du footer</Label><div className="flex items-center gap-2"><input id="studio-footer-background-color" type="color" value={footerBackgroundColor} onChange={event => setProfile(current => current ? { ...current, footerBackgroundColor: event.target.value } : current)} className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-1" /><Input value={profile.footerBackgroundColor} maxLength={7} placeholder={footerBackgroundColor} onChange={event => setProfile(current => current ? { ...current, footerBackgroundColor: event.target.value } : current)} className="font-mono uppercase" /></div></div><div className="space-y-2"><Label htmlFor="studio-footer-text-color">Texte du footer</Label><div className="flex items-center gap-2"><input id="studio-footer-text-color" type="color" value={footerTextColor} onChange={event => setProfile(current => current ? { ...current, footerTextColor: event.target.value } : current)} className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-1" /><Input value={profile.footerTextColor} maxLength={7} placeholder={footerTextColor} onChange={event => setProfile(current => current ? { ...current, footerTextColor: event.target.value } : current)} className="font-mono uppercase" /></div></div></div><div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: footerBackgroundColor, color: footerTextColor, borderColor: footerTextColor }}><p className="font-semibold">Aperçu du footer</p><p className="mt-1 text-sm opacity-80">Les titres, textes et liens utilisent la couleur de texte sélectionnée.</p></div>{!footerContrastIsReadable && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"><strong>Contraste insuffisant :</strong> choisissez un texte plus foncé ou un fond plus sombre avant d’enregistrer.</p>}</div><div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2"><div className="space-y-2"><Label>Description courte de la marque</Label><Textarea rows={3} value={profile.footerDescription} maxLength={420} onChange={event => setProfile(current => current ? { ...current, footerDescription: event.target.value } : current)} /></div><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Titre du menu</Label><Input value={profile.footerNavigationTitle} maxLength={60} onChange={event => setProfile(current => current ? { ...current, footerNavigationTitle: event.target.value } : current)} /></div><div className="space-y-2"><Label>Titre catégories</Label><Input value={profile.footerCategoriesTitle} maxLength={60} onChange={event => setProfile(current => current ? { ...current, footerCategoriesTitle: event.target.value } : current)} /></div><div className="space-y-2"><Label>Titre aide</Label><Input value={profile.footerHelpTitle} maxLength={60} onChange={event => setProfile(current => current ? { ...current, footerHelpTitle: event.target.value } : current)} /></div></div></div><div className="grid gap-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 md:grid-cols-2"><div className="space-y-2"><Label>Message de contact</Label><Input value={profile.footerContactText} maxLength={160} onChange={event => setProfile(current => current ? { ...current, footerContactText: event.target.value } : current)} placeholder="Écrivez-nous…" /></div><div className="space-y-2"><Label>Lien de contact</Label><Input value={profile.footerContactUrl} maxLength={300} onChange={event => setProfile(current => current ? { ...current, footerContactUrl: event.target.value } : current)} placeholder="/contact ou https://…" /></div></div><div className="grid gap-4 md:grid-cols-3">{([ ["footerDeliveryTitle", "footerDeliveryText", "Livraison"], ["footerSecureTitle", "footerSecureText", "Sécurité"], ["footerServiceTitle", "footerServiceText", "Service"], ] as Array<["footerDeliveryTitle" | "footerSecureTitle" | "footerServiceTitle", "footerDeliveryText" | "footerSecureText" | "footerServiceText", string]>).map(([titleField, textField, label]) => <div key={titleField} className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-900">{label}</p><Input value={profile[titleField]} maxLength={80} onChange={event => setProfile(current => current ? { ...current, [titleField]: event.target.value } : current)} placeholder="Titre" /><Textarea rows={3} value={profile[textField]} maxLength={220} onChange={event => setProfile(current => current ? { ...current, [textField]: event.target.value } : current)} placeholder="Texte court" /></div>)}</div><div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4"><p className="font-semibold text-violet-950">Réseaux sociaux</p><p className="mt-1 text-xs leading-5 text-violet-900">Laissez un champ vide pour ne pas afficher le réseau. Seuls les liens publics https:// sont acceptés.</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{profile.footerSocialLinks.map(link => <div key={link.id} className="space-y-2"><Label htmlFor={`studio-footer-social-${link.id}`}>{link.id[0].toUpperCase()}{link.id.slice(1)}</Label><Input id={`studio-footer-social-${link.id}`} value={link.url} maxLength={500} onChange={event => setProfile(current => current ? { ...current, footerSocialLinks: current.footerSocialLinks.map(candidate => candidate.id === link.id ? { ...candidate, url: event.target.value } : candidate) } : current)} placeholder="https://…" /></div>)}</div></div><div className="grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-[1fr_auto]"><div className="space-y-2"><Label>Droits réservés</Label><Input value={profile.footerCopyrightText} maxLength={160} onChange={event => setProfile(current => current ? { ...current, footerCopyrightText: event.target.value } : current)} /><p className="text-xs leading-5 text-slate-500">Les pages légales restent disponibles ; leur contenu se règle dans les outils de la boutique.</p></div><Button type="button" disabled={isSaving} onClick={() => saveProfile.mutate({ storeId, profile })} className="min-h-11 self-end bg-indigo-700 text-white hover:bg-indigo-800"><Save className="mr-2 h-4 w-4" /> {saveProfile.isPending ? "Enregistrement…" : "Enregistrer le footer"}</Button></div></CardContent></Card>
      <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">Bannières d’accueil</p><p className="mt-1 text-sm text-slate-600">Elles remplacent la bannière générique MAZIGHO sur ce domaine.</p></div><Button type="button" variant="outline" className="min-h-11" onClick={() => setDraftBanner(emptyBanner(banners.length))}><Plus className="mr-2 h-4 w-4" /> Ajouter une bannière</Button></div>
        {banners.map(banner => <BannerEditor key={banner.id} value={{ id: banner.id, title: banner.title, subtitle: banner.subtitle || "", imageUrl: banner.imageUrl, linkUrl: banner.linkUrl || "/boutique", active: banner.active, displayOrder: banner.displayOrder }} pending={isSaving} onUpload={upload} onSave={value => saveBanner.mutate({ storeId, ...value })} onDelete={() => deleteBanner.mutate({ storeId, bannerId: banner.id })} />)}
        {draftBanner && <BannerEditor value={draftBanner} pending={isSaving} onUpload={upload} onSave={value => saveBanner.mutate({ storeId, ...value })} />}
        {banners.length === 0 && !draftBanner && <Card className="border-dashed border-slate-300"><CardContent className="p-6 text-sm text-slate-600"><ImagePlus className="mb-2 h-5 w-5 text-slate-500" /> Aucune bannière propre n’est enregistrée : ajoutez-en une pour remplacer le visuel générique.</CardContent></Card>}
      </section>
      {notice && <p className={`rounded-xl border px-4 py-3 text-sm ${notice.includes("impossible") || notice.includes("Erreur") ? "border-rose-200 bg-rose-50 text-rose-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>{notice}</p>}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><WandSparkles className="mr-2 inline h-4 w-4" /> Les contenus de cette page sont enregistrés par boutique. Ils ne modifient ni les bannières, ni les images, ni les textes de MAZIGHO principal.</div>
    </>}</main></DashboardLayout>;
}

function StorefrontMenuEditor({
  profile,
  isSaving,
  onAdd,
  onMove,
  onRemove,
  onSave,
  onUpdate,
  onLayoutChange,
}: {
  profile: DesignProfile;
  isSaving: boolean;
  onAdd: () => void;
  onMove: (id: string, offset: -1 | 1) => void;
  onRemove: (id: string) => void;
  onSave: () => void;
  onUpdate: (id: string, changes: Partial<StoreNavigationItem>) => void;
  onLayoutChange: (value: DesignProfile["headerLayout"]) => void;
}) {
  return <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><LayoutPanelTop className="h-5 w-5" /></div><div><CardDescription>Navigation storefront</CardDescription><CardTitle className="mt-1">Menu de la boutique</CardTitle><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Réorganisez les onglets et créez des sous-menus d’un seul niveau. Les liens restent limités à cette boutique, pour un menu sûr et agréable sur tablette comme sur téléphone.</p></div></div><Button type="button" variant="outline" className="min-h-11 shrink-0" disabled={profile.navigationItems.length >= 16 || isSaving} onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Ajouter un onglet</Button></div></CardHeader><CardContent className="space-y-4">
    <div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="studio-header-layout">Disposition du menu</Label><select id="studio-header-layout" value={profile.headerLayout} onChange={event => onLayoutChange(event.target.value as DesignProfile["headerLayout"])} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="inline">Compacte — une ligne</option><option value="split">Éditoriale — deux lignes</option><option value="searchFirst">Catalogue — recherche prioritaire</option><option value="gallery">Galerie premium — identité centrée</option><option value="market">Maison de commerce — bande menu</option></select></div><div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs leading-5 text-teal-950"><p className="font-semibold">Conseil</p><p className="mt-1">La disposition « Maison de commerce » met le menu sur une ligne dédiée, comme une maison de thé.</p></div></div>
    <div className="space-y-3">{profile.navigationItems.map((item, index) => {
      const availableParents = profile.navigationItems.filter(candidate => candidate.kind === "custom" && candidate.visible && candidate.id !== item.id && !candidate.parentId);
      const children = profile.navigationItems.filter(candidate => candidate.parentId === item.id).length;
      return <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{item.kind === "system" ? navigationSystemLabels[item.id] || item.id : item.label || "Onglet personnalisé"}{item.parentId && <span className="ml-2 text-xs font-normal text-teal-700">· sous-menu</span>}{children > 0 && <span className="ml-2 text-xs font-normal text-slate-500">· {children} sous-onglet{children > 1 ? "s" : ""}</span>}</p><div className="flex items-center gap-2"><label className="flex min-h-9 items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={item.visible} onChange={event => onUpdate(item.id, { visible: event.target.checked })} /> Visible</label><Button type="button" size="icon" variant="outline" aria-label="Monter l’onglet" disabled={index === 0} onClick={() => onMove(item.id, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" aria-label="Descendre l’onglet" disabled={index === profile.navigationItems.length - 1} onClick={() => onMove(item.id, 1)}><ArrowDown className="h-4 w-4" /></Button>{item.kind === "custom" && <Button type="button" size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onRemove(item.id)}>Retirer</Button>}</div></div><div className="mt-3 grid gap-3 md:grid-cols-3"><div className="space-y-2"><Label>Libellé</Label><Input value={item.label} maxLength={40} placeholder={navigationSystemLabels[item.id] || "Nom de l’onglet"} onChange={event => onUpdate(item.id, { label: event.target.value })} /></div><div className="space-y-2"><Label>Destination</Label><Input value={item.href} disabled={item.kind === "system"} maxLength={300} placeholder="/boutique" onChange={event => onUpdate(item.id, { href: event.target.value })} /></div>{item.kind === "custom" ? <div className="space-y-2"><Label>Rattacher sous</Label><select value={item.parentId || ""} onChange={event => onUpdate(item.id, { parentId: event.target.value || undefined })} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Menu principal</option>{availableParents.map(parent => <option key={parent.id} value={parent.id}>{parent.label || "Onglet personnalisé"}</option>)}</select></div> : <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">Onglet système : destination verrouillée.</div>}</div></article>;
    })}</div>
    <Button type="button" disabled={isSaving} onClick={onSave} className="min-h-11 w-full bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"><Save className="mr-2 h-4 w-4" /> {isSaving ? "Enregistrement…" : "Enregistrer le menu"}</Button>
  </CardContent></Card>;
}
