import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { DesignProfile, FooterSocialLink } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type FooterDraft = Pick<DesignProfile,
  | "footerDescription" | "footerNavigationTitle" | "footerCategoriesTitle" | "footerHelpTitle"
  | "footerContactText" | "footerContactUrl"
  | "footerDeliveryTitle" | "footerDeliveryText" | "footerSecureTitle" | "footerSecureText" | "footerServiceTitle" | "footerServiceText"
  | "footerCopyrightText" | "footerShowNavigation" | "footerShowCategories" | "footerShowHelp" | "footerShowReassurance" | "footerSocialLinks"
>;

const socialLabels: Record<FooterSocialLink["id"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
};

function toDraft(profile: DesignProfile): FooterDraft {
  return {
    footerDescription: profile.footerDescription,
    footerNavigationTitle: profile.footerNavigationTitle,
    footerCategoriesTitle: profile.footerCategoriesTitle,
    footerHelpTitle: profile.footerHelpTitle,
    footerContactText: profile.footerContactText,
    footerContactUrl: profile.footerContactUrl,
    footerDeliveryTitle: profile.footerDeliveryTitle,
    footerDeliveryText: profile.footerDeliveryText,
    footerSecureTitle: profile.footerSecureTitle,
    footerSecureText: profile.footerSecureText,
    footerServiceTitle: profile.footerServiceTitle,
    footerServiceText: profile.footerServiceText,
    footerCopyrightText: profile.footerCopyrightText,
    footerShowNavigation: profile.footerShowNavigation,
    footerShowCategories: profile.footerShowCategories,
    footerShowHelp: profile.footerShowHelp,
    footerShowReassurance: profile.footerShowReassurance,
    footerSocialLinks: profile.footerSocialLinks.map(link => ({ ...link })),
  };
}

function FooterToggle({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50">
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-teal-700" />
    <span><span className="block text-sm font-semibold text-slate-950">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span></span>
  </label>;
}

export default function OwnerFooterSettingsEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [draft, setDraft] = useState<FooterDraft>(() => toDraft(profile));
  const save = trpc.owner.saveFooter.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      toast.success("Pied de page enregistré pour cette boutique.");
    },
    onError: error => toast.error(error.message || "Le pied de page n’a pas pu être enregistré."),
  });

  useEffect(() => setDraft(toDraft(profile)), [profile]);
  const setSocialUrl = (id: FooterSocialLink["id"], url: string) => setDraft(current => ({
    ...current,
    footerSocialLinks: current.footerSocialLinks.map(link => link.id === id ? { ...link, url } : link),
  }));

  return <Card className="border-slate-200">
    <CardHeader>
      <CardTitle>Pied de page, contact et réseaux</CardTitle>
      <CardDescription>Choisissez les blocs à afficher, vos textes, votre contact et vos réseaux. Les catégories visibles proviennent automatiquement de votre propre catalogue.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FooterToggle checked={draft.footerShowNavigation} label="Menu visible" description="Reprend les onglets configurés dans Menu." onChange={footerShowNavigation => setDraft(current => ({ ...current, footerShowNavigation }))} />
        <FooterToggle checked={draft.footerShowCategories} label="Catégories visibles" description="Affiche uniquement les catégories de votre boutique." onChange={footerShowCategories => setDraft(current => ({ ...current, footerShowCategories }))} />
        <FooterToggle checked={draft.footerShowHelp} label="Aide et contact visibles" description="Affiche FAQ et votre lien de contact." onChange={footerShowHelp => setDraft(current => ({ ...current, footerShowHelp }))} />
        <FooterToggle checked={draft.footerShowReassurance} label="Réassurance visible" description="Les trois messages de fin de page." onChange={footerShowReassurance => setDraft(current => ({ ...current, footerShowReassurance }))} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Description courte de la marque</Label><Textarea rows={3} value={draft.footerDescription} maxLength={420} onChange={event => setDraft(current => ({ ...current, footerDescription: event.target.value }))} /></div><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Titre du menu</Label><Input value={draft.footerNavigationTitle} maxLength={60} onChange={event => setDraft(current => ({ ...current, footerNavigationTitle: event.target.value }))} /></div><div className="space-y-2"><Label>Titre catégories</Label><Input value={draft.footerCategoriesTitle} maxLength={60} onChange={event => setDraft(current => ({ ...current, footerCategoriesTitle: event.target.value }))} /></div><div className="space-y-2"><Label>Titre aide</Label><Input value={draft.footerHelpTitle} maxLength={60} onChange={event => setDraft(current => ({ ...current, footerHelpTitle: event.target.value }))} /></div></div></div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 md:grid-cols-2"><div className="space-y-2"><Label>Message de contact</Label><Input value={draft.footerContactText} maxLength={160} onChange={event => setDraft(current => ({ ...current, footerContactText: event.target.value }))} placeholder="Écrivez-nous…" /></div><div className="space-y-2"><Label>Lien de contact</Label><Input value={draft.footerContactUrl} maxLength={300} onChange={event => setDraft(current => ({ ...current, footerContactUrl: event.target.value }))} placeholder="/contact ou https://…" /></div></div>

      <div className="grid gap-4 md:grid-cols-3">{([ ["footerDeliveryTitle", "footerDeliveryText", "Livraison"], ["footerSecureTitle", "footerSecureText", "Sécurité"], ["footerServiceTitle", "footerServiceText", "Service"], ] as const).map(([titleField, textField, label]) => <div key={titleField} className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-900">{label}</p><Input value={draft[titleField]} maxLength={80} onChange={event => setDraft(current => ({ ...current, [titleField]: event.target.value }))} placeholder="Titre" /><Textarea rows={3} value={draft[textField]} maxLength={220} onChange={event => setDraft(current => ({ ...current, [textField]: event.target.value }))} placeholder="Texte court" /></div>)}</div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4"><p className="text-sm font-semibold text-violet-950">Réseaux sociaux</p><p className="mt-1 text-xs leading-5 text-violet-900">Collez uniquement les liens publics en https://. Laissez un champ vide pour ne pas afficher ce réseau.</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{draft.footerSocialLinks.map(link => <div key={link.id} className="space-y-2"><Label htmlFor={`footer-social-${link.id}`}>{socialLabels[link.id]}</Label><Input id={`footer-social-${link.id}`} value={link.url} maxLength={500} onChange={event => setSocialUrl(link.id, event.target.value)} placeholder="https://…" /></div>)}</div></div>

      <div className="grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-[1fr_auto]"><div className="space-y-2"><Label>Droits réservés</Label><Input value={draft.footerCopyrightText} maxLength={160} onChange={event => setDraft(current => ({ ...current, footerCopyrightText: event.target.value }))} /><p className="text-xs leading-5 text-slate-500">Les liens vers les pages légales restent disponibles pour garder une boutique conforme, mais leur contenu se règle dans Livraison & retours et Informations légales.</p></div><Button type="button" disabled={save.isPending} onClick={() => save.mutate(draft)} className="min-h-11 self-end bg-teal-700 hover:bg-teal-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer le footer</>}</Button></div>
    </CardContent>
  </Card>;
}
