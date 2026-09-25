import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Save, ShieldCheck, Truck } from "lucide-react";
import type { DesignProfile } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ProductReassuranceDraft = Pick<DesignProfile, "showProductReassurance" | "productReassuranceItems">;

function toDraft(profile: DesignProfile): ProductReassuranceDraft {
  return {
    showProductReassurance: profile.showProductReassurance,
    productReassuranceItems: profile.productReassuranceItems.map(item => ({ ...item })),
  };
}

export default function OwnerProductReassuranceEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [draft, setDraft] = useState<ProductReassuranceDraft>(() => toDraft(profile));
  const save = trpc.owner.saveProductReassurance.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      toast.success("Messages de la fiche produit enregistrés.");
    },
    onError: error => toast.error(error.message || "Les messages de la fiche produit n’ont pas pu être enregistrés."),
  });

  useEffect(() => setDraft(toDraft(profile)), [profile]);

  const updateItem = (index: number, field: "title" | "text", value: string) => {
    setDraft(current => ({
      ...current,
      productReassuranceItems: current.productReassuranceItems.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const ItemIcon = ({ icon }: { icon: "shield" | "truck" }) => icon === "truck"
    ? <Truck className="h-5 w-5 text-indigo-700" />
    : <ShieldCheck className="h-5 w-5 text-indigo-700" />;

  return <Card className="border-indigo-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-700" /> Fiche produit · informations de confiance</CardTitle>
      <CardDescription>Personnalisez ou masquez les deux messages situés sous le bouton d’ajout au panier. Ils sont propres à votre boutique et ne changent ni les stocks, ni le paiement, ni la livraison.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div><p className="font-semibold text-slate-950">Afficher ces informations</p><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">Masquez-les si elles ne correspondent pas encore à vos conditions de vente réelles.</p></div>
        <Button type="button" variant={draft.showProductReassurance ? "default" : "outline"} className={draft.showProductReassurance ? "bg-indigo-700 hover:bg-indigo-800" : ""} onClick={() => setDraft(current => ({ ...current, showProductReassurance: !current.showProductReassurance }))}>{draft.showProductReassurance ? <><Eye className="mr-2 h-4 w-4" /> Visible</> : <><EyeOff className="mr-2 h-4 w-4" /> Masquée</>}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {draft.productReassuranceItems.map((item, index) => <section key={item.icon} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2"><ItemIcon icon={item.icon} /><p className="font-semibold text-slate-950">{item.icon === "shield" ? "Premier message" : "Second message"}</p></div>
          <div className="mt-4 space-y-3">
            <div className="space-y-2"><Label htmlFor={`product-trust-title-${index}`}>Titre</Label><Input id={`product-trust-title-${index}`} value={item.title} maxLength={100} onChange={event => updateItem(index, "title", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor={`product-trust-text-${index}`}>Texte</Label><Textarea id={`product-trust-text-${index}`} rows={3} value={item.text} maxLength={220} onChange={event => updateItem(index, "text", event.target.value)} /></div>
          </div>
        </section>)}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-500">Conseil : ne promettez un moyen de paiement, un délai ou une garantie que lorsque cette fonction est réellement activée et vérifiée pour votre boutique.</p><Button type="button" disabled={save.isPending} onClick={() => save.mutate(draft)} className="min-h-11 bg-indigo-700 hover:bg-indigo-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer les messages</>}</Button></div>
    </CardContent>
  </Card>;
}
