import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, LayoutTemplate, Loader2, Plus, Trash2, Upload } from "lucide-react";
import type { DesignProfile, HomeTextBanner, RoundGalleryItem } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const BASE_SECTION_KEYS = ["highlight", "reassurance", "discovery", "story", "testimonials", "editorial", "featured"];

const layoutOptions: Array<{ value: HomeTextBanner["layout"]; label: string; description: string }> = [
  { value: "banner", label: "Bannière", description: "Texte large, image optionnelle en fond." },
  { value: "split", label: "Texte + image", description: "Deux colonnes élégantes, adaptées aux produits ou services." },
  { value: "framedSplit", label: "Texte + image encadrée", description: "Deux colonnes avec un visuel entouré d’une marge de respiration." },
  { value: "spotlight", label: "Mise en avant", description: "Encart lumineux pour une nouveauté, un atelier ou une offre." },
  { value: "roundGallery", label: "Galerie ronde", description: "Texte éditorial suivi de 2 à 6 visuels ronds, sans cartes." },
];

const themeOptions: Array<{ value: HomeTextBanner["theme"]; label: string }> = [
  { value: "primary", label: "Couleur de la boutique" },
  { value: "dark", label: "Sombre" },
  { value: "soft", label: "Doux" },
  { value: "light", label: "Clair" },
];

type EditableBlock = Omit<HomeTextBanner, "imageUrl" | "imageAlt" | "layout" | "theme"> & {
  imageUrl: string;
  imageAlt: string;
  layout: "banner" | "split" | "framedSplit" | "spotlight" | "roundGallery";
  theme: "primary" | "dark" | "soft" | "light";
  galleryItems: RoundGalleryItem[];
};

function toBlock(value: HomeTextBanner): EditableBlock {
  return {
    id: value.id,
    eyebrow: value.eyebrow || "",
    title: value.title || "",
    text: value.text || "",
    buttonLabel: value.buttonLabel || "",
    buttonUrl: value.buttonUrl || "",
    imageUrl: value.imageUrl || "",
    imageAlt: value.imageAlt || "",
    layout: value.layout || "banner",
    theme: value.theme || "primary",
    galleryItems: value.galleryItems || [],
    enabled: value.enabled !== false,
  };
}

function createGalleryItem() {
  return {
    id: `circle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    label: "Nouvel univers",
    imageUrl: "",
    imageAlt: "",
    href: "/boutique",
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function labelForKey(key: string, blocks: HomeTextBanner[]) {
  if (key.startsWith("text:")) return blocks.find(block => `text:${block.id}` === key)?.title || "Bloc libre";
  return ({ highlight: "Bloc inspiration", reassurance: "Bande de réassurance", discovery: "Univers / catégories", story: "Histoire", testimonials: "Message", editorial: "Bannière éditoriale", featured: "Produits vedettes" } as Record<string, string>)[key] || key;
}

export default function OwnerCustomHomepageBlocksEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => profile.textBanners.map(toBlock));
  const [homeOrder, setHomeOrder] = useState<string[]>(() => profile.homeOrder || BASE_SECTION_KEYS);
  const upload = trpc.owner.uploadImage.useMutation({ onError: error => toast.error(error.message || "L’image n’a pas pu être téléversée.") });
  const save = trpc.owner.saveCustomHomepageBlocks.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      toast.success("Blocs libres enregistrés pour cette boutique.");
    },
    onError: error => toast.error(error.message || "Les blocs libres n’ont pas pu être enregistrés."),
  });

  useEffect(() => {
    setBlocks(profile.textBanners.map(toBlock));
    setHomeOrder(profile.homeOrder || BASE_SECTION_KEYS);
  }, [profile]);

  const orderedKeys = useMemo(() => {
    const allowed = new Set([...BASE_SECTION_KEYS, ...blocks.map(block => `text:${block.id}`)]);
    const result = homeOrder.filter(key => allowed.has(key));
    for (const key of BASE_SECTION_KEYS) if (!result.includes(key)) result.push(key);
    for (const block of blocks) {
      const key = `text:${block.id}`;
      if (!result.includes(key)) result.push(key);
    }
    return result;
  }, [blocks, homeOrder]);

  const updateBlock = (id: string, patch: Partial<EditableBlock>) => {
    setBlocks(current => current.map(block => block.id === id ? { ...block, ...patch } : block));
  };

  const updateGalleryItem = (blockId: string, itemId: string, patch: Partial<RoundGalleryItem>) => {
    setBlocks(current => current.map(block => block.id === blockId ? { ...block, galleryItems: block.galleryItems.map(item => item.id === itemId ? { ...item, ...patch } : item) } : block));
  };

  const addGalleryItem = (blockId: string) => {
    setBlocks(current => current.map(block => block.id === blockId && block.galleryItems.length < 6 ? { ...block, galleryItems: [...block.galleryItems, createGalleryItem()] } : block));
  };

  const removeGalleryItem = (blockId: string, itemId: string) => {
    setBlocks(current => current.map(block => block.id === blockId ? { ...block, galleryItems: block.galleryItems.filter(item => item.id !== itemId) } : block));
  };

  const addBlock = () => {
    if (blocks.length >= 8) {
      toast.error("Huit blocs libres maximum par boutique.");
      return;
    }
    const id = `block-${Date.now().toString(36)}`;
    const block: EditableBlock = {
      id,
      eyebrow: "Nouveau rendez-vous",
      title: "Donnez vie à cette section",
      text: "Ajoutez ici un texte, un visuel et un lien vers la page de votre choix.",
      buttonLabel: "Découvrir",
      buttonUrl: "/boutique",
      imageUrl: "",
      imageAlt: "",
      layout: "split",
      theme: "soft",
      galleryItems: [],
      enabled: true,
    };
    setBlocks(current => [...current, block]);
    setHomeOrder(current => [...current, `text:${id}`]);
  };

  const removeBlock = (id: string) => {
    setBlocks(current => current.filter(block => block.id !== id));
    setHomeOrder(current => current.filter(key => key !== `text:${id}`));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    const key = `text:${id}`;
    setHomeOrder(current => {
      const source = orderedKeys;
      const index = source.indexOf(key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= source.length) return current;
      const next = [...source];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const uploadImage = async (id: string, file: File) => {
    try {
      const result = await upload.mutateAsync({ dataUrl: await fileToDataUrl(file), fileName: file.name });
      updateBlock(id, { imageUrl: result.url });
      toast.success("Visuel prêt à enregistrer.");
    } catch {
      // The mutation already provides a concise error message.
    }
  };

  const uploadGalleryImage = async (blockId: string, itemId: string, file: File) => {
    try {
      const result = await upload.mutateAsync({ dataUrl: await fileToDataUrl(file), fileName: file.name });
      updateGalleryItem(blockId, itemId, { imageUrl: result.url });
      toast.success("Visuel rond prêt à enregistrer.");
    } catch {
      // The mutation already provides a concise error message.
    }
  };

  return <Card className="border-fuchsia-200">
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-fuchsia-700" /> Blocs libres de la page d’accueil</CardTitle>
          <CardDescription className="mt-1 max-w-3xl">Créez vos propres sections pour un atelier, une collection, un service, une promotion ou une histoire. Chaque bloc est propre à votre boutique, peut être déplacé, masqué, modifié ou supprimé à tout moment.</CardDescription>
        </div>
        <Button type="button" variant="outline" onClick={addBlock} disabled={blocks.length >= 8} className="min-h-11 shrink-0 border-fuchsia-300 bg-white text-fuchsia-800 hover:bg-fuchsia-50"><Plus className="mr-2 h-4 w-4" /> Ajouter un bloc</Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-950"><strong>Aucune contrainte de modèle :</strong> le bloc peut rester sans image, sans bouton, et être simplement masqué pendant que vous le préparez. Les textes et liens restent contrôlés côté serveur et n’affectent aucune autre boutique.</div>
      {blocks.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600"><ImagePlus className="mb-2 h-5 w-5 text-fuchsia-600" /> Aucun bloc libre pour le moment. Ajoutez-en un pour présenter une offre, une activité ou une nouvelle collection sans modifier les sections déjà en place.</div> : blocks.map(block => {
        const orderIndex = orderedKeys.indexOf(`text:${block.id}`);
        return <div key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">Bloc libre · position {orderIndex + 1}</p><p className="mt-1 truncate text-base font-semibold text-slate-950">{block.title || "Sans titre"}</p></div>
            <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => moveBlock(block.id, -1)} disabled={orderIndex <= 0} className="min-h-10"><ArrowUp className="mr-1 h-4 w-4" /> Monter</Button><Button type="button" size="sm" variant="outline" onClick={() => moveBlock(block.id, 1)} disabled={orderIndex < 0 || orderIndex >= orderedKeys.length - 1} className="min-h-10"><ArrowDown className="mr-1 h-4 w-4" /> Descendre</Button><Button type="button" size="sm" variant={block.enabled ? "default" : "outline"} onClick={() => updateBlock(block.id, { enabled: !block.enabled })} className={block.enabled ? "min-h-10 bg-emerald-700 hover:bg-emerald-800" : "min-h-10"}>{block.enabled ? <><Eye className="mr-1 h-4 w-4" /> Visible</> : <><EyeOff className="mr-1 h-4 w-4" /> Masqué</>}</Button><Button type="button" size="sm" variant="outline" onClick={() => removeBlock(block.id)} className="min-h-10 border-rose-200 text-rose-700 hover:bg-rose-50"><Trash2 className="mr-1 h-4 w-4" /> Supprimer</Button></div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Surtitre</Label><Input value={block.eyebrow} maxLength={120} onChange={event => updateBlock(block.id, { eyebrow: event.target.value })} placeholder="Ex. Atelier du week-end" /></div><div className="space-y-2"><Label>Titre</Label><Input value={block.title} maxLength={180} onChange={event => updateBlock(block.id, { title: event.target.value })} placeholder="Titre de votre section" /></div></div>
          <div className="mt-4 space-y-2"><Label>Texte</Label><Textarea rows={4} value={block.text} maxLength={600} onChange={event => updateBlock(block.id, { text: event.target.value })} placeholder="Expliquez librement ce que vous souhaitez présenter." /></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Format</Label><select value={block.layout} onChange={event => { const layout = event.target.value as EditableBlock["layout"]; updateBlock(block.id, { layout, galleryItems: layout === "roundGallery" && block.galleryItems.length === 0 ? [createGalleryItem(), createGalleryItem()] : block.galleryItems }); }} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">{layoutOptions.map(option => <option key={option.value} value={option.value}>{option.label} — {option.description}</option>)}</select></div><div className="space-y-2"><Label>Ambiance</Label><select value={block.theme} onChange={event => updateBlock(block.id, { theme: event.target.value as HomeTextBanner["theme"] })} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">{themeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Texte du bouton (facultatif)</Label><Input value={block.buttonLabel} maxLength={60} onChange={event => updateBlock(block.id, { buttonLabel: event.target.value })} placeholder="Découvrir" /></div><div className="space-y-2"><Label>Lien du bouton</Label><Input value={block.buttonUrl} maxLength={300} onChange={event => updateBlock(block.id, { buttonUrl: event.target.value })} placeholder="/boutique ou https://…" /></div></div>
          {block.layout === "roundGallery" && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-emerald-950">Visuels ronds de la galerie</p><p className="mt-1 text-xs leading-5 text-emerald-900">Ajoutez de 2 à 6 univers. Sur la vitrine, seul le visuel circulaire et son libellé apparaissent : aucune carte ni prix n’est affiché.</p></div><Button type="button" size="sm" variant="outline" disabled={block.galleryItems.length >= 6} onClick={() => addGalleryItem(block.id)} className="min-h-10 border-emerald-300 text-emerald-800 hover:bg-emerald-100"><Plus className="mr-1 h-4 w-4" /> Ajouter un visuel</Button></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{block.galleryItems.map(item => <div key={item.id} className="rounded-xl border border-emerald-100 bg-white p-3"><div className="flex items-start gap-3"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-emerald-50">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ImagePlus className="h-5 w-5 text-emerald-400" /></div>}</div><div className="min-w-0 flex-1 space-y-2"><Input aria-label="Libellé du visuel rond" value={item.label} maxLength={80} onChange={event => updateGalleryItem(block.id, item.id, { label: event.target.value })} placeholder="Ex. Rooibos nature" /><Input aria-label="URL du visuel rond" value={item.imageUrl} maxLength={1000} onChange={event => updateGalleryItem(block.id, item.id, { imageUrl: event.target.value })} placeholder="https://…" /><Input aria-label="Description du visuel rond" value={item.imageAlt} maxLength={180} onChange={event => updateGalleryItem(block.id, item.id, { imageAlt: event.target.value })} placeholder="Description de l’image" /><Input aria-label="Lien du visuel rond" value={item.href} maxLength={300} onChange={event => updateGalleryItem(block.id, item.id, { href: event.target.value })} placeholder="/boutique (facultatif)" /><div className="flex flex-wrap gap-2"><label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-semibold text-emerald-800"><Upload className="h-3.5 w-3.5" /> Téléverser<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadGalleryImage(block.id, item.id, file); }} /></label><Button type="button" size="sm" variant="ghost" onClick={() => removeGalleryItem(block.id, item.id)} className="h-9 text-rose-700 hover:bg-rose-50 hover:text-rose-800"><Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer</Button></div></div></div></div>)}</div></div>}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3"><Label>Visuel (facultatif)</Label><div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="grid h-20 w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-400 sm:w-28">{block.imageUrl ? <img src={block.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5" />}</div><div className="min-w-0 flex-1 space-y-2"><Input value={block.imageUrl} maxLength={1000} onChange={event => updateBlock(block.id, { imageUrl: event.target.value })} placeholder="https://… ou téléverser" /><Input value={block.imageAlt} maxLength={180} onChange={event => updateBlock(block.id, { imageAlt: event.target.value })} placeholder="Description courte de l’image" /><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-fuchsia-800"><Upload className="h-4 w-4" /> Téléverser<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadImage(block.id, file); }} /></label></div></div></div>
        </div>;
      })}
      {blocks.length > 0 && <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ordre d’affichage</p><div className="mt-3 flex flex-wrap gap-2">{orderedKeys.map((key, index) => <span key={`${key}-${index}`} className={key.startsWith("text:") ? "rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-medium text-fuchsia-900" : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"}>#{index + 1} {labelForKey(key, blocks)}</span>)}</div></div>}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-500">Ces blocs ne modifient ni le thème, ni le menu, ni les produits. Ils restent entièrement modifiables ou masquables dans cet espace.</p><Button type="button" disabled={save.isPending || upload.isPending} onClick={() => save.mutate({ blocks, homeOrder: orderedKeys })} className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : "Enregistrer les blocs libres"}</Button></div>
    </CardContent>
  </Card>;
}
