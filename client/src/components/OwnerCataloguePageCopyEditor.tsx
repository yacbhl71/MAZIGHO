import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { DesignProfile } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type CataloguePageCopyDraft = Pick<DesignProfile,
  | "promosTitle" | "promosLead" | "promosBannerTitle" | "promosBannerText" | "promosEmptyText" | "promosAllProductsLabel"
  | "newArrivalsTitle" | "newArrivalsLead" | "newArrivalsEmptyText"
  | "bestSellersTitle" | "bestSellersLead" | "bestSellersTopLabel" | "bestSellersEmptyText"
>;

function toDraft(profile: DesignProfile): CataloguePageCopyDraft {
  return {
    promosTitle: profile.promosTitle,
    promosLead: profile.promosLead,
    promosBannerTitle: profile.promosBannerTitle,
    promosBannerText: profile.promosBannerText,
    promosEmptyText: profile.promosEmptyText,
    promosAllProductsLabel: profile.promosAllProductsLabel,
    newArrivalsTitle: profile.newArrivalsTitle,
    newArrivalsLead: profile.newArrivalsLead,
    newArrivalsEmptyText: profile.newArrivalsEmptyText,
    bestSellersTitle: profile.bestSellersTitle,
    bestSellersLead: profile.bestSellersLead,
    bestSellersTopLabel: profile.bestSellersTopLabel,
    bestSellersEmptyText: profile.bestSellersEmptyText,
  };
}

function CopyField({ label, value, maxLength, onChange, description, multiline = false }: {
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  description?: string;
  multiline?: boolean;
}) {
  return <div className="space-y-2">
    <Label>{label}</Label>
    {multiline
      ? <Textarea rows={3} value={value} maxLength={maxLength} onChange={event => onChange(event.target.value)} />
      : <Input value={value} maxLength={maxLength} onChange={event => onChange(event.target.value)} />}
    {description && <p className="text-xs leading-5 text-slate-500">{description}</p>}
  </div>;
}

export default function OwnerCataloguePageCopyEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [draft, setDraft] = useState<CataloguePageCopyDraft>(() => toDraft(profile));
  const save = trpc.owner.saveCataloguePageCopy.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      toast.success("Textes des pages catalogue enregistrés pour cette boutique.");
    },
    onError: error => toast.error(error.message || "Les textes catalogue n’ont pas pu être enregistrés."),
  });

  useEffect(() => setDraft(toDraft(profile)), [profile]);
  const setField = <K extends keyof CataloguePageCopyDraft>(field: K, value: CataloguePageCopyDraft[K]) => setDraft(current => ({ ...current, [field]: value }));

  return <Card className="border-fuchsia-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-700" /> Pages catalogue</CardTitle>
      <CardDescription>Personnalisez les textes visibles sur Promotions, Nouveautés et Best-sellers. Les textes de MAZIGHO sont de simples modèles, jamais imposés à votre boutique.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <section className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/40 p-4">
        <div className="mb-4"><p className="font-semibold text-slate-950">Promotions</p><p className="mt-1 text-xs leading-5 text-slate-600">Cette page reste vide tant qu’aucun produit de votre boutique ne possède un prix promotionnel.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <CopyField label="Titre" value={draft.promosTitle} maxLength={120} onChange={value => setField("promosTitle", value)} />
          <CopyField label="Bouton de retour au catalogue" value={draft.promosAllProductsLabel} maxLength={60} onChange={value => setField("promosAllProductsLabel", value)} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CopyField label="Texte d’introduction" value={draft.promosLead} maxLength={420} multiline onChange={value => setField("promosLead", value)} description="Vous pouvez utiliser {country} pour afficher le pays sélectionné." />
          <CopyField label="Texte lorsqu’il n’y a aucune promotion" value={draft.promosEmptyText} maxLength={420} multiline onChange={value => setField("promosEmptyText", value)} description="Vous pouvez utiliser {country} pour afficher le pays sélectionné." />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CopyField label="Titre du bandeau" value={draft.promosBannerTitle} maxLength={120} onChange={value => setField("promosBannerTitle", value)} />
          <CopyField label="Texte du bandeau" value={draft.promosBannerText} maxLength={420} multiline onChange={value => setField("promosBannerText", value)} />
        </div>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
        <div className="mb-4"><p className="font-semibold text-slate-950">Nouveautés</p><p className="mt-1 text-xs leading-5 text-slate-600">Les produits restent sélectionnés automatiquement dans votre catalogue ; vous maîtrisez seulement le discours affiché.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <CopyField label="Titre" value={draft.newArrivalsTitle} maxLength={120} onChange={value => setField("newArrivalsTitle", value)} />
          <CopyField label="Texte d’introduction" value={draft.newArrivalsLead} maxLength={420} multiline onChange={value => setField("newArrivalsLead", value)} description="Vous pouvez utiliser {country} pour afficher le pays sélectionné." />
        </div>
        <div className="mt-4"><CopyField label="Texte lorsqu’il n’y a aucun produit" value={draft.newArrivalsEmptyText} maxLength={420} multiline onChange={value => setField("newArrivalsEmptyText", value)} description="Vous pouvez utiliser {country} pour afficher le pays sélectionné." /></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4"><p className="font-semibold text-slate-950">Best-sellers</p><p className="mt-1 text-xs leading-5 text-slate-600">Cette page s’appuie sur l’activité réelle de votre boutique. Aucun produit extérieur n’est ajouté.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <CopyField label="Titre" value={draft.bestSellersTitle} maxLength={120} onChange={value => setField("bestSellersTitle", value)} />
          <CopyField label="Libellé du classement" value={draft.bestSellersTopLabel} maxLength={60} onChange={value => setField("bestSellersTopLabel", value)} description="Conservez {rank} pour afficher le rang : par exemple « Top {rank} » ." />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CopyField label="Texte d’introduction" value={draft.bestSellersLead} maxLength={420} multiline onChange={value => setField("bestSellersLead", value)} description="Vous pouvez utiliser {country} pour afficher le pays sélectionné." />
          <CopyField label="Texte lorsqu’il n’y a aucun best-seller" value={draft.bestSellersEmptyText} maxLength={420} multiline onChange={value => setField("bestSellersEmptyText", value)} description="Vous pouvez utiliser {country} pour afficher le pays sélectionné." />
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-500">Ces réglages restent strictement liés à la boutique ouverte. Ils ne modifient pas MAZIGHO, une autre boutique, les produits ou le statut d’ouverture.</p><Button type="button" disabled={save.isPending} onClick={() => save.mutate(draft)} className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : "Enregistrer les pages catalogue"}</Button></div>
    </CardContent>
  </Card>;
}
