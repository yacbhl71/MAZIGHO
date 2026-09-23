import { useEffect, useState } from "react";
import { ArrowRight, Check, ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";
import type { DesignProfile, ReassuranceItem } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type HomepageDraft = Pick<DesignProfile,
  | "showReassurance" | "reassuranceItems"
  | "showDiscovery" | "discoveryEyebrow" | "discoveryTitle" | "discoveryText" | "discoveryAllShopLabel" | "discoveryAllShopUrl" | "discoveryBrowseShopLabel" | "discoveryBrowseShopUrl"
  | "showStory" | "showTestimonials" | "testimonialsEyebrow" | "testimonialsTitle" | "testimonialsText" | "testimonialsCtaLabel" | "testimonialsCtaUrl"
  | "showEditorial" | "showFeatured"
  | "showClosing" | "closingEyebrow" | "closingTitle" | "closingText" | "closingShopCtaLabel" | "closingShopCtaUrl" | "closingContactCtaLabel" | "closingContactCtaUrl" | "closingVisualValue" | "closingVisualText" | "closingImageUrl"
>;

function toDraft(profile: DesignProfile): HomepageDraft {
  return {
    showReassurance: profile.showReassurance,
    reassuranceItems: profile.reassuranceItems.map(item => ({ ...item })),
    showDiscovery: profile.showDiscovery,
    discoveryEyebrow: profile.discoveryEyebrow,
    discoveryTitle: profile.discoveryTitle,
    discoveryText: profile.discoveryText,
    discoveryAllShopLabel: profile.discoveryAllShopLabel,
    discoveryAllShopUrl: profile.discoveryAllShopUrl,
    discoveryBrowseShopLabel: profile.discoveryBrowseShopLabel,
    discoveryBrowseShopUrl: profile.discoveryBrowseShopUrl,
    showStory: profile.showStory,
    showTestimonials: profile.showTestimonials,
    testimonialsEyebrow: profile.testimonialsEyebrow,
    testimonialsTitle: profile.testimonialsTitle,
    testimonialsText: profile.testimonialsText,
    testimonialsCtaLabel: profile.testimonialsCtaLabel,
    testimonialsCtaUrl: profile.testimonialsCtaUrl,
    showEditorial: profile.showEditorial,
    showFeatured: profile.showFeatured,
    showClosing: profile.showClosing,
    closingEyebrow: profile.closingEyebrow,
    closingTitle: profile.closingTitle,
    closingText: profile.closingText,
    closingShopCtaLabel: profile.closingShopCtaLabel,
    closingShopCtaUrl: profile.closingShopCtaUrl,
    closingContactCtaLabel: profile.closingContactCtaLabel,
    closingContactCtaUrl: profile.closingContactCtaUrl,
    closingVisualValue: profile.closingVisualValue,
    closingVisualText: profile.closingVisualText,
    closingImageUrl: profile.closingImageUrl,
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

const iconOptions: Array<{ value: ReassuranceItem["icon"]; label: string }> = [
  { value: "sparkles", label: "Étincelles" },
  { value: "check", label: "Validation" },
  { value: "arrow", label: "Flèche" },
];

function SectionToggle({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (next: boolean) => void }) {
  return <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50">
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-teal-700" />
    <span><span className="block text-sm font-semibold text-slate-950">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span></span>
  </label>;
}

export default function OwnerHomepageSectionsEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [draft, setDraft] = useState<HomepageDraft>(() => toDraft(profile));
  const save = trpc.owner.saveHomepageSections.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      toast.success("Sections d’accueil enregistrées pour cette boutique.");
    },
    onError: error => toast.error(error.message || "Les sections d’accueil n’ont pas pu être enregistrées."),
  });
  const upload = trpc.owner.uploadImage.useMutation({ onError: error => toast.error(error.message || "L’image n’a pas pu être téléversée.") });

  useEffect(() => setDraft(toDraft(profile)), [profile]);

  const updateReassurance = (index: number, changes: Partial<ReassuranceItem>) => setDraft(current => ({
    ...current,
    reassuranceItems: current.reassuranceItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item),
  }));

  const uploadClosingImage = async (file: File) => {
    try {
      const result = await upload.mutateAsync({ dataUrl: await fileToDataUrl(file), fileName: file.name });
      setDraft(current => ({ ...current, closingImageUrl: result.url }));
      toast.success("Image de la section finale prête à enregistrer.");
    } catch {
      // The upload mutation already exposes a concise message.
    }
  };

  return <Card className="border-violet-200">
    <CardHeader>
      <CardTitle>Sections de la page d’accueil</CardTitle>
      <CardDescription>Chaque bloc peut être affiché, masqué et adapté à votre boutique. Les textes MAZIGHO visibles ici ne sont que des modèles modifiables.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-slate-950">Bande de réassurance</p><p className="mt-1 text-xs leading-5 text-slate-600">Trois messages courts sous le carrousel. Désactivez-la si vous ne souhaitez faire aucune promesse.</p></div><SectionToggle checked={draft.showReassurance} label={draft.showReassurance ? "Visible" : "Masquée"} description="" onChange={showReassurance => setDraft(current => ({ ...current, showReassurance }))} /></div>
        <div className="grid gap-3 lg:grid-cols-3">{draft.reassuranceItems.map((item, index) => <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-teal-800">{item.icon === "sparkles" ? <Sparkles className="h-4 w-4" /> : item.icon === "check" ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}<p className="text-xs font-bold uppercase tracking-wide">Message {index + 1}</p></div>
          <Input aria-label={`Titre du message ${index + 1}`} value={item.title} maxLength={100} onChange={event => updateReassurance(index, { title: event.target.value })} placeholder="Titre" />
          <Textarea aria-label={`Texte du message ${index + 1}`} rows={3} value={item.text} maxLength={220} onChange={event => updateReassurance(index, { text: event.target.value })} placeholder="Texte court" />
          <select aria-label={`Icône du message ${index + 1}`} value={item.icon} onChange={event => updateReassurance(index, { icon: event.target.value as ReassuranceItem["icon"] })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{iconOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </div>)}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4"><p className="font-semibold text-slate-950">Découvrir les catégories</p><p className="mt-1 text-xs leading-5 text-slate-600">Cette section affiche uniquement les catégories créées dans votre propre catalogue. Ajoutez leurs visuels dans Catalogue.</p></div>
        <div className="mb-4"><SectionToggle checked={draft.showDiscovery} label={draft.showDiscovery ? "Section visible" : "Section masquée"} description="Le masquage ne supprime ni catégories ni produits." onChange={showDiscovery => setDraft(current => ({ ...current, showDiscovery }))} /></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Surtitre</Label><Input value={draft.discoveryEyebrow} maxLength={120} onChange={event => setDraft(current => ({ ...current, discoveryEyebrow: event.target.value }))} /></div><div className="space-y-2"><Label>Titre</Label><Input value={draft.discoveryTitle} maxLength={180} onChange={event => setDraft(current => ({ ...current, discoveryTitle: event.target.value }))} /></div></div>
        <div className="mt-4 space-y-2"><Label>Texte</Label><Textarea rows={3} value={draft.discoveryText} maxLength={600} onChange={event => setDraft(current => ({ ...current, discoveryText: event.target.value }))} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Libellé du lien supérieur</Label><Input value={draft.discoveryAllShopLabel} maxLength={60} onChange={event => setDraft(current => ({ ...current, discoveryAllShopLabel: event.target.value }))} /></div><div className="space-y-2"><Label>Destination du lien supérieur</Label><Input value={draft.discoveryAllShopUrl} maxLength={300} onChange={event => setDraft(current => ({ ...current, discoveryAllShopUrl: event.target.value }))} placeholder="/boutique ou https://…" /></div><div className="space-y-2"><Label>Libellé du bouton</Label><Input value={draft.discoveryBrowseShopLabel} maxLength={60} onChange={event => setDraft(current => ({ ...current, discoveryBrowseShopLabel: event.target.value }))} /></div><div className="space-y-2"><Label>Destination du bouton</Label><Input value={draft.discoveryBrowseShopUrl} maxLength={300} onChange={event => setDraft(current => ({ ...current, discoveryBrowseShopUrl: event.target.value }))} placeholder="/boutique ou https://…" /></div></div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SectionToggle checked={draft.showStory} label={draft.showStory ? "Histoire visible" : "Histoire masquée"} description="Son texte et son image se règlent dans Identité et textes." onChange={showStory => setDraft(current => ({ ...current, showStory }))} />
        <SectionToggle checked={draft.showEditorial} label={draft.showEditorial ? "Bannière éditoriale visible" : "Bannière éditoriale masquée"} description="Son image et ses textes se règlent dans Identité et textes." onChange={showEditorial => setDraft(current => ({ ...current, showEditorial }))} />
        <SectionToggle checked={draft.showFeatured} label={draft.showFeatured ? "Produits vedettes visibles" : "Produits vedettes masqués"} description="Affiche exclusivement les produits de cette boutique marqués vedettes." onChange={showFeatured => setDraft(current => ({ ...current, showFeatured }))} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4"><p className="font-semibold text-slate-950">Message ou témoignage</p><p className="mt-1 text-xs leading-5 text-slate-600">N’affichez jamais de faux avis. Vous pouvez écrire un message de votre boutique ou masquer entièrement ce bloc.</p></div>
        <div className="mb-4"><SectionToggle checked={draft.showTestimonials} label={draft.showTestimonials ? "Section visible" : "Section masquée"} description="Masquée tant que vous ne souhaitez pas communiquer ce message." onChange={showTestimonials => setDraft(current => ({ ...current, showTestimonials }))} /></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Surtitre</Label><Input value={draft.testimonialsEyebrow} maxLength={120} onChange={event => setDraft(current => ({ ...current, testimonialsEyebrow: event.target.value }))} /></div><div className="space-y-2"><Label>Titre</Label><Input value={draft.testimonialsTitle} maxLength={180} onChange={event => setDraft(current => ({ ...current, testimonialsTitle: event.target.value }))} /></div></div>
        <div className="mt-4 space-y-2"><Label>Texte</Label><Textarea rows={4} value={draft.testimonialsText} maxLength={900} onChange={event => setDraft(current => ({ ...current, testimonialsText: event.target.value }))} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Libellé du bouton</Label><Input value={draft.testimonialsCtaLabel} maxLength={60} onChange={event => setDraft(current => ({ ...current, testimonialsCtaLabel: event.target.value }))} /></div><div className="space-y-2"><Label>Destination</Label><Input value={draft.testimonialsCtaUrl} maxLength={300} onChange={event => setDraft(current => ({ ...current, testimonialsCtaUrl: event.target.value }))} placeholder="/boutique ou https://…" /></div></div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white">
        <div className="mb-4"><p className="font-semibold">Bloc final</p><p className="mt-1 text-xs leading-5 text-slate-300">Une dernière invitation à explorer ou à contacter votre boutique. La devise affichée est celle de la boutique si vous laissez le grand texte vide.</p></div>
        <div className="mb-4"><SectionToggle checked={draft.showClosing} label={draft.showClosing ? "Bloc final visible" : "Bloc final masqué"} description="Ne modifie ni le footer ni les pages de contact." onChange={showClosing => setDraft(current => ({ ...current, showClosing }))} /></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label className="text-slate-200">Surtitre</Label><Input value={draft.closingEyebrow} maxLength={120} onChange={event => setDraft(current => ({ ...current, closingEyebrow: event.target.value }))} className="border-slate-600 bg-white/10 text-white" /></div><div className="space-y-2"><Label className="text-slate-200">Titre</Label><Input value={draft.closingTitle} maxLength={180} onChange={event => setDraft(current => ({ ...current, closingTitle: event.target.value }))} className="border-slate-600 bg-white/10 text-white" /></div></div>
        <div className="mt-4 space-y-2"><Label className="text-slate-200">Texte</Label><Textarea rows={4} value={draft.closingText} maxLength={900} onChange={event => setDraft(current => ({ ...current, closingText: event.target.value }))} className="border-slate-600 bg-white/10 text-white" /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label className="text-slate-200">Bouton principal</Label><Input value={draft.closingShopCtaLabel} maxLength={60} onChange={event => setDraft(current => ({ ...current, closingShopCtaLabel: event.target.value }))} className="border-slate-600 bg-white/10 text-white" /></div><div className="space-y-2"><Label className="text-slate-200">Lien principal</Label><Input value={draft.closingShopCtaUrl} maxLength={300} onChange={event => setDraft(current => ({ ...current, closingShopCtaUrl: event.target.value }))} placeholder="/boutique ou https://…" className="border-slate-600 bg-white/10 text-white placeholder:text-slate-400" /></div><div className="space-y-2"><Label className="text-slate-200">Bouton secondaire</Label><Input value={draft.closingContactCtaLabel} maxLength={60} onChange={event => setDraft(current => ({ ...current, closingContactCtaLabel: event.target.value }))} className="border-slate-600 bg-white/10 text-white" /></div><div className="space-y-2"><Label className="text-slate-200">Lien secondaire</Label><Input value={draft.closingContactCtaUrl} maxLength={300} onChange={event => setDraft(current => ({ ...current, closingContactCtaUrl: event.target.value }))} placeholder="/contact ou https://…" className="border-slate-600 bg-white/10 text-white placeholder:text-slate-400" /></div></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label className="text-slate-200">Grand texte visuel</Label><Input value={draft.closingVisualValue} maxLength={40} onChange={event => setDraft(current => ({ ...current, closingVisualValue: event.target.value }))} placeholder="Vide = devise de la boutique" className="border-slate-600 bg-white/10 text-white placeholder:text-slate-400" /></div><div className="space-y-2"><Label className="text-slate-200">Légende du visuel</Label><Input value={draft.closingVisualText} maxLength={280} onChange={event => setDraft(current => ({ ...current, closingVisualText: event.target.value }))} className="border-slate-600 bg-white/10 text-white" /></div></div>
        <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-3"><Label className="text-slate-200">Image du bloc final (facultative)</Label><div className="mt-2 flex items-center gap-3"><div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/15 bg-white/10 text-slate-300">{draft.closingImageUrl ? <img src={draft.closingImageUrl} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><Input value={draft.closingImageUrl} maxLength={1000} onChange={event => setDraft(current => ({ ...current, closingImageUrl: event.target.value }))} placeholder="https://… ou téléverser" className="border-slate-600 bg-white/10 text-white placeholder:text-slate-400" /><label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-violet-200"><Upload className="h-4 w-4" /> Téléverser<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadClosingImage(file); }} /></label></div></div></div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-500">Les modifications concernent uniquement la boutique actuellement ouverte. Elles n’ouvrent pas la boutique, n’envoient aucun e-mail et ne modifient ni MAZIGHO Studio ni une autre boutique.</p><Button type="button" disabled={save.isPending || upload.isPending} onClick={() => save.mutate(draft)} className="min-h-11 bg-teal-700 hover:bg-teal-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : "Enregistrer les sections"}</Button></div>
    </CardContent>
  </Card>;
}
