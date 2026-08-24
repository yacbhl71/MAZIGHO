import { ChangeEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  defaultDesignProfile,
  designPalettes,
  designTypography,
  type DesignProfile,
} from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  LayoutPanelTop,
  Loader2,
  MonitorUp,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";

type ImageField = "highlightImageUrl" | "storyImageUrl" | "editorialImageUrl";

type ImageEditorProps = {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
};

function ImageEditor({ id, label, description, value, onChange, onUpload, isUploading }: ImageEditorProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[168px_1fr] sm:p-5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
        {value ? <img src={value} alt={`Aperçu : ${label}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImagePlus className="h-7 w-7" /></div>}
      </div>
      <div className="space-y-3">
        <div><Label htmlFor={id} className="text-sm font-semibold text-slate-900">{label}</Label><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><Input id={id} value={value} onChange={event => onChange(event.target.value)} placeholder="https://… ou /manus-storage/…" /><label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Upload className="mr-2 h-4 w-4" />{isUploading ? "Envoi…" : "Téléverser"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onUpload} disabled={isUploading} /></label></div>
        <p className="text-xs text-slate-500">JPEG, PNG ou WebP, jusqu’à 5 Mo. Vous pouvez aussi coller l’URL d’une image déjà hébergée.</p>
      </div>
    </div>
  );
}

export default function AdminCustomization() {
  const [form, setForm] = useState<DesignProfile>(defaultDesignProfile);
  const designQuery = trpc.admin.design.get.useQuery();
  const updateDesign = trpc.admin.design.update.useMutation();
  const uploadImage = trpc.admin.design.uploadImage.useMutation();

  useEffect(() => {
    if (designQuery.data) setForm(designQuery.data as DesignProfile);
  }, [designQuery.data]);

  const setField = <K extends keyof DesignProfile>(field: K, value: DesignProfile[K]) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleUpload = async (field: ImageField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      toast.error("Choisissez une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L’image doit peser 5 Mo maximum.");
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture du fichier impossible"));
        reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({ dataUrl, fileName: file.name });
      setField(field, result.url);
      toast.success("Image téléversée. Enregistrez le studio pour la publier.");
    } catch (error) {
      toast.error(`Téléversement impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  const handleSave = async () => {
    const textValues = [
      form.highlightEyebrow, form.highlightTitle, form.highlightText, form.highlightImageUrl,
      form.storyTitle, form.storyText, form.storyImageUrl,
      form.editorialEyebrow, form.editorialTitle, form.editorialImageUrl,
    ];
    if (textValues.some(value => !value.trim())) {
      toast.error("Complétez chaque champ texte et chaque visuel avant publication.");
      return;
    }
    try {
      await updateDesign.mutateAsync({
        ...form,
        highlightEyebrow: form.highlightEyebrow.trim(),
        highlightTitle: form.highlightTitle.trim(),
        highlightText: form.highlightText.trim(),
        highlightImageUrl: form.highlightImageUrl.trim(),
        storyTitle: form.storyTitle.trim(),
        storyText: form.storyText.trim(),
        storyImageUrl: form.storyImageUrl.trim(),
        editorialEyebrow: form.editorialEyebrow.trim(),
        editorialTitle: form.editorialTitle.trim(),
        editorialImageUrl: form.editorialImageUrl.trim(),
      });
      await designQuery.refetch();
      toast.success("Personnalisation enregistrée et publiée sur la boutique.");
    } catch (error) {
      toast.error(`Impossible de publier : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  const palette = designPalettes[form.paletteId];
  const typography = designTypography[form.typographyId];
  const isSaving = updateDesign.isPending;
  const hashTab = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  const initialTab = ["style", "home", "images", "sections"].includes(hashTab) ? hashTab : "style";

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-700"><Palette className="h-4 w-4" /> Studio de personnalisation</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">L’apparence de votre boutique</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Choisissez une ambiance, ajustez les textes clés et placez vos images aux bons endroits. Les réglages sont volontairement guidés afin de préserver une boutique claire et professionnelle.</p>
            </div>
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-violet-600 text-white shadow-lg shadow-violet-200 md:mx-0"><Palette className="h-12 w-12" /></div>
          </div>
          <div className="border-t border-violet-100 bg-white/70 px-6 py-4 md:px-8"><div className="flex items-start gap-3 text-sm text-slate-700"><Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><p><strong>Simple et sûr :</strong> vous personnalisez les éléments visibles sans pouvoir casser la structure, les pages produit, le panier ni les informations légales.</p></div></div>
        </section>

        {designQuery.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Impossible de charger la personnalisation actuelle : {designQuery.error.message}. Les réglages de référence restent affichés.</div>}

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Aperçu de l’ambiance</p><div className="mt-4 overflow-hidden rounded-xl border" style={{ backgroundColor: palette.soft }}><div className="flex min-h-36 items-end bg-slate-900 p-5 text-white" style={{ backgroundImage: `linear-gradient(90deg, rgba(15,23,42,.90), rgba(15,23,42,.35)), url(${form.highlightImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}><div><p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.primary }}>{form.highlightEyebrow}</p><p className="mt-2 text-2xl font-semibold" style={{ fontFamily: typography.heading }}>{form.highlightTitle}</p></div></div><div className="flex items-center justify-between gap-3 p-4"><span className="text-sm font-medium text-slate-700">Bouton principal</span><span className="rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: palette.primary }}>Découvrir</span></div></div></div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="h-6 w-6 text-emerald-700" /><p className="mt-3 font-semibold text-slate-900">Recommandation</p><p className="mt-1 text-sm leading-6 text-slate-700">Conservez une seule palette par période. Changez d’abord l’image et les textes : ce sont les réglages les plus visibles pour vos visiteurs.</p><Button asChild variant="outline" className="mt-4 border-emerald-300 bg-white hover:bg-emerald-100"><Link href="/"><MonitorUp className="mr-2 h-4 w-4" /> Voir la boutique</Link></Button></div>
        </section>

        <Tabs key={initialTab} defaultValue={initialTab} className="space-y-5">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0"><TabsTrigger value="style" className="gap-2 border data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50"><Palette className="h-4 w-4" /> Style</TabsTrigger><TabsTrigger value="home" className="gap-2 border data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50"><LayoutPanelTop className="h-4 w-4" /> Accueil</TabsTrigger><TabsTrigger value="images" className="gap-2 border data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50"><ImagePlus className="h-4 w-4" /> Images</TabsTrigger><TabsTrigger value="sections" className="gap-2 border data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50"><Eye className="h-4 w-4" /> Sections</TabsTrigger></TabsList>

          <TabsContent value="style" className="space-y-5"><Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-violet-600" /> Palette de couleurs</CardTitle><CardDescription>Choisissez parmi des palettes testées pour garder une lecture confortable et des contrastes cohérents.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{(Object.entries(designPalettes) as Array<[DesignProfile["paletteId"], typeof designPalettes["terracotta"]]>).map(([id, item]) => <button type="button" key={id} onClick={() => setField("paletteId", id)} className={`rounded-2xl border p-4 text-left transition ${form.paletteId === id ? "border-violet-500 ring-2 ring-violet-200" : "border-slate-200 hover:border-violet-300"}`}><div className="flex h-16 overflow-hidden rounded-xl"><span className="flex-1" style={{ backgroundColor: item.primary }} /><span className="flex-1" style={{ backgroundColor: item.accent }} /><span className="flex-1" style={{ backgroundColor: item.soft }} /></div><p className="mt-4 font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>{form.paletteId === id && <p className="mt-3 text-xs font-semibold text-violet-700">Palette sélectionnée</p>}</button>)}</CardContent></Card><Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-violet-600" /> Typographie</CardTitle><CardDescription>La police sélectionnée s’applique aux titres et aux textes de la boutique.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">{(Object.entries(designTypography) as Array<[DesignProfile["typographyId"], typeof designTypography["editorial"]]>).map(([id, item]) => <button type="button" key={id} onClick={() => setField("typographyId", id)} className={`rounded-2xl border p-5 text-left transition ${form.typographyId === id ? "border-violet-500 ring-2 ring-violet-200" : "border-slate-200 hover:border-violet-300"}`}><p className="text-2xl text-slate-900" style={{ fontFamily: item.heading }}>{item.preview}</p><p className="mt-4 font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">Texte et titres harmonisés</p></button>)}</CardContent></Card></TabsContent>

          <TabsContent value="home" className="space-y-5"><Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-600" /> Message d’inspiration</CardTitle><CardDescription>Ce grand visuel apparaît juste après les bannières de l’accueil.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="highlightEyebrow">Petit libellé</Label><Input id="highlightEyebrow" value={form.highlightEyebrow} onChange={event => setField("highlightEyebrow", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="highlightTitle">Titre</Label><Input id="highlightTitle" value={form.highlightTitle} onChange={event => setField("highlightTitle", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="highlightText">Texte</Label><textarea id="highlightText" value={form.highlightText} onChange={event => setField("highlightText", event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div></CardContent></Card><Card className="shadow-sm"><CardHeader><CardTitle>L’histoire MAZIGHO</CardTitle><CardDescription>Modifiez la première partie éditoriale de l’histoire. La structure graphique reste cohérente sur toutes les tailles d’écran.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="storyTitle">Titre de la section</Label><Input id="storyTitle" value={form.storyTitle} onChange={event => setField("storyTitle", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="storyText">Texte de présentation</Label><textarea id="storyText" value={form.storyText} onChange={event => setField("storyText", event.target.value)} className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div></CardContent></Card><Card className="shadow-sm"><CardHeader><CardTitle>Encart éditorial</CardTitle><CardDescription>Une petite respiration visuelle entre les témoignages et les produits phares.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="editorialEyebrow">Petit libellé</Label><Input id="editorialEyebrow" value={form.editorialEyebrow} onChange={event => setField("editorialEyebrow", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="editorialTitle">Titre</Label><Input id="editorialTitle" value={form.editorialTitle} onChange={event => setField("editorialTitle", event.target.value)} /></div></CardContent></Card></TabsContent>

          <TabsContent value="images" className="space-y-5"><div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><p className="font-semibold">Conseil image</p><p className="mt-1">Préférez des images nettes, lumineuses et sans texte intégré. Un format horizontal fonctionne le mieux pour ces emplacements.</p></div><ImageEditor id="highlightImage" label="Image du message d’inspiration" description="Grande image affichée sous les bannières de l’accueil." value={form.highlightImageUrl} onChange={value => setField("highlightImageUrl", value)} onUpload={event => handleUpload("highlightImageUrl", event)} isUploading={uploadImage.isPending} /><ImageEditor id="storyImage" label="Image de l’histoire MAZIGHO" description="Illustration principale de la section narrative de l’accueil." value={form.storyImageUrl} onChange={value => setField("storyImageUrl", value)} onUpload={event => handleUpload("storyImageUrl", event)} isUploading={uploadImage.isPending} /><ImageEditor id="editorialImage" label="Image de l’encart éditorial" description="Bannière horizontale placée avant les produits phares." value={form.editorialImageUrl} onChange={value => setField("editorialImageUrl", value)} onUpload={event => handleUpload("editorialImageUrl", event)} isUploading={uploadImage.isPending} /></TabsContent>

          <TabsContent value="sections" className="space-y-5"><Card className="shadow-sm"><CardHeader><CardTitle>Visibilité des sections de l’accueil</CardTitle><CardDescription>Masquez temporairement une section sans la supprimer. Vous pourrez toujours la réactiver.</CardDescription></CardHeader><CardContent className="space-y-3">{([
            ["showDiscovery", "Découvrez nos univers", "Les cartes illustrées des grandes catégories."],
            ["showStory", "L’histoire MAZIGHO", "La section éditoriale avec votre grande image."],
            ["showTestimonials", "Parole à nos clients", "Les emplacements réservés aux futurs avis authentiques."],
            ["showEditorial", "Encart éditorial", "La bannière d’inspiration située avant les produits phares."],
          ] as Array<["showDiscovery" | "showStory" | "showTestimonials" | "showEditorial", string, string]>).map(([field, title, description]) => <div key={field} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div><Button type="button" variant={form[field] ? "default" : "outline"} className={form[field] ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => setField(field, !form[field])}>{form[field] ? <><Eye className="mr-2 h-4 w-4" /> Visible</> : "Masquée"}</Button></div>)}</CardContent></Card><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Ce que le studio protège</p><p className="mt-1">Les catégories, les produits, le panier, le paiement et les pages légales ne peuvent pas être supprimés ou altérés depuis cet écran.</p></div></TabsContent>
        </Tabs>

        <section className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="outline" onClick={() => { setForm(defaultDesignProfile); toast.message("Les réglages de référence sont replacés dans le formulaire. Enregistrez pour les publier."); }} disabled={isSaving || uploadImage.isPending}><RotateCcw className="mr-2 h-4 w-4" /> Restaurer la référence</Button><Button type="button" onClick={handleSave} disabled={isSaving || designQuery.isLoading || uploadImage.isPending} className="bg-violet-600 hover:bg-violet-700">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer et publier</Button></section>
      </div>
    </DashboardLayout>
  );
}
