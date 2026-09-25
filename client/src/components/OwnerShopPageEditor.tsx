import { ChangeEvent, useEffect, useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, Save, Store } from "lucide-react";
import type { DesignProfile } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ShopPageDraft = Pick<DesignProfile,
  | "shopEyebrow" | "shopTitle" | "shopIntro" | "shopProductsEyebrow" | "shopProductsTitle"
  | "showShopEditorial" | "shopEditorialEyebrow" | "shopEditorialTitle" | "shopEditorialImageUrl" | "showShopReassurance"
>;

function toDraft(profile: DesignProfile): ShopPageDraft {
  return {
    shopEyebrow: profile.shopEyebrow,
    shopTitle: profile.shopTitle,
    shopIntro: profile.shopIntro,
    shopProductsEyebrow: profile.shopProductsEyebrow,
    shopProductsTitle: profile.shopProductsTitle,
    showShopEditorial: profile.showShopEditorial,
    shopEditorialEyebrow: profile.shopEditorialEyebrow,
    shopEditorialTitle: profile.shopEditorialTitle,
    shopEditorialImageUrl: profile.shopEditorialImageUrl,
    showShopReassurance: profile.showShopReassurance,
  };
}

export default function OwnerShopPageEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [draft, setDraft] = useState<ShopPageDraft>(() => toDraft(profile));
  const upload = trpc.owner.uploadImage.useMutation();
  const save = trpc.owner.saveShopPageContent.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      toast.success("Page Boutique enregistrée pour votre boutique.");
    },
    onError: error => toast.error(error.message || "La page Boutique n’a pas pu être enregistrée."),
  });

  useEffect(() => setDraft(toDraft(profile)), [profile]);
  const setField = <K extends keyof ShopPageDraft>(field: K, value: ShopPageDraft[K]) => setDraft(current => ({ ...current, [field]: value }));

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
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
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture impossible"));
        reader.onerror = () => reject(new Error("Lecture impossible"));
        reader.readAsDataURL(file);
      });
      const result = await upload.mutateAsync({ dataUrl, fileName: file.name });
      setField("shopEditorialImageUrl", result.url);
      toast.success("Image ajoutée. Enregistrez la page Boutique pour la publier.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléversement impossible.");
    }
  };

  return <Card className="border-indigo-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-indigo-700" /> Page Boutique</CardTitle>
      <CardDescription>Cette page présente votre catalogue et vos catégories. Personnalisez ses textes, son visuel éditorial et les éléments que vous souhaitez afficher.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
        <p className="font-semibold text-slate-950">En-tête du catalogue</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">Utilisez <code>{"{country}"}</code> pour afficher le pays sélectionné dans les textes.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Petit libellé</Label><Input value={draft.shopEyebrow} maxLength={120} onChange={event => setField("shopEyebrow", event.target.value)} /></div>
          <div className="space-y-2"><Label>Titre</Label><Input value={draft.shopTitle} maxLength={180} onChange={event => setField("shopTitle", event.target.value)} /></div>
        </div>
        <div className="mt-4 space-y-2"><Label>Texte d’introduction</Label><Textarea rows={3} value={draft.shopIntro} maxLength={420} onChange={event => setField("shopIntro", event.target.value)} /></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold text-slate-950">Section produits</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Petit libellé</Label><Input value={draft.shopProductsEyebrow} maxLength={120} onChange={event => setField("shopProductsEyebrow", event.target.value)} /></div>
          <div className="space-y-2"><Label>Titre</Label><Input value={draft.shopProductsTitle} maxLength={180} onChange={event => setField("shopProductsTitle", event.target.value)} /></div>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-950">Encart éditorial</p><p className="mt-1 text-xs leading-5 text-slate-600">Un grand visuel entre les catégories et les informations de confiance.</p></div><Button type="button" variant={draft.showShopEditorial ? "default" : "outline"} className={draft.showShopEditorial ? "bg-violet-700 hover:bg-violet-800" : ""} onClick={() => setField("showShopEditorial", !draft.showShopEditorial)}>{draft.showShopEditorial ? <><Eye className="mr-2 h-4 w-4" /> Visible</> : <><EyeOff className="mr-2 h-4 w-4" /> Masqué</>}</Button></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Petit libellé</Label><Input value={draft.shopEditorialEyebrow} maxLength={120} onChange={event => setField("shopEditorialEyebrow", event.target.value)} /></div><div className="space-y-2"><Label>Titre</Label><Input value={draft.shopEditorialTitle} maxLength={180} onChange={event => setField("shopEditorialTitle", event.target.value)} /></div></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]"><div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-white">{draft.shopEditorialImageUrl ? <img src={draft.shopEditorialImageUrl} alt="Aperçu éditorial" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><ImagePlus className="h-7 w-7" /></div>}</div><div className="space-y-2"><Label>Image</Label><Input value={draft.shopEditorialImageUrl} placeholder="https://… ou téléverser" onChange={event => setField("shopEditorialImageUrl", event.target.value)} /><label className="inline-flex min-h-10 cursor-pointer items-center rounded-md border border-indigo-200 bg-white px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-50">{upload.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Téléversement…</> : <><ImagePlus className="mr-2 h-4 w-4" /> Téléverser une image</>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={upload.isPending} onChange={uploadImage} /></label><p className="text-xs leading-5 text-slate-500">JPEG, PNG ou WebP, jusqu’à 5 Mo.</p></div></div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"><div><p className="font-semibold text-slate-950">Informations de confiance en bas de page</p><p className="mt-1 text-xs leading-5 text-slate-600">Affiche les trois messages de réassurance existants, eux aussi modifiables dans les sections de vitrine.</p></div><Button type="button" variant={draft.showShopReassurance ? "default" : "outline"} className={draft.showShopReassurance ? "bg-emerald-700 hover:bg-emerald-800" : ""} onClick={() => setField("showShopReassurance", !draft.showShopReassurance)}>{draft.showShopReassurance ? <><Eye className="mr-2 h-4 w-4" /> Visible</> : <><EyeOff className="mr-2 h-4 w-4" /> Masquée</>}</Button></section>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-500">Ces réglages ne changent ni vos produits, ni les catégories, ni la livraison. Ils sont limités à votre vitrine et à votre boutique.</p><Button type="button" disabled={save.isPending || upload.isPending} onClick={() => save.mutate(draft)} className="min-h-11 bg-indigo-700 hover:bg-indigo-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer la page Boutique</>}</Button></div>
    </CardContent>
  </Card>;
}
