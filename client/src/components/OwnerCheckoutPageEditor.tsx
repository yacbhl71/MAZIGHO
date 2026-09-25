import { useEffect, useState } from "react";
import { Loader2, Save, ShoppingCart } from "lucide-react";
import type { DesignProfile } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Form = Pick<DesignProfile, "cartEyebrow" | "cartTitle" | "cartIntro" | "checkoutEyebrow" | "checkoutTitle" | "checkoutIntro" | "checkoutPaymentNotice">;

export default function OwnerCheckoutPageEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [form, setForm] = useState<Form>({
    cartEyebrow: profile.cartEyebrow,
    cartTitle: profile.cartTitle,
    cartIntro: profile.cartIntro,
    checkoutEyebrow: profile.checkoutEyebrow,
    checkoutTitle: profile.checkoutTitle,
    checkoutIntro: profile.checkoutIntro,
    checkoutPaymentNotice: profile.checkoutPaymentNotice,
  });
  useEffect(() => setForm({
    cartEyebrow: profile.cartEyebrow,
    cartTitle: profile.cartTitle,
    cartIntro: profile.cartIntro,
    checkoutEyebrow: profile.checkoutEyebrow,
    checkoutTitle: profile.checkoutTitle,
    checkoutIntro: profile.checkoutIntro,
    checkoutPaymentNotice: profile.checkoutPaymentNotice,
  }), [profile.cartEyebrow, profile.cartTitle, profile.cartIntro, profile.checkoutEyebrow, profile.checkoutTitle, profile.checkoutIntro, profile.checkoutPaymentNotice]);
  const save = trpc.owner.saveCheckoutPageCopy.useMutation({
    onSuccess: next => { onSaved(next); toast.success("Les textes du panier et de la commande sont enregistrés."); },
    onError: error => toast.error(error.message || "Les textes n’ont pas pu être enregistrés."),
  });
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(current => ({ ...current, [key]: value }));

  return <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 md:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="flex items-center gap-2 text-lg font-bold text-sky-950"><ShoppingCart className="h-5 w-5" /> Panier et commande</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-sky-900">Personnalisez les titres et explications visibles avant le paiement. Le paiement reste désactivé : ce réglage ne lance aucun encaissement, aucune commande ni aucun e-mail.</p></div><Button type="button" onClick={() => save.mutate(form)} disabled={save.isPending} className="min-h-11 bg-sky-700 text-white hover:bg-sky-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer</>}</Button></div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-sky-100 bg-white p-4"><p className="font-semibold text-slate-950">Page Panier</p><div className="mt-4 space-y-3"><div className="space-y-2"><Label>Petit libellé</Label><Input value={form.cartEyebrow} maxLength={120} onChange={event => set("cartEyebrow", event.target.value)} placeholder="Ex. Votre sélection" /></div><div className="space-y-2"><Label>Titre</Label><Input value={form.cartTitle} maxLength={120} onChange={event => set("cartTitle", event.target.value)} /></div><div className="space-y-2"><Label>Introduction</Label><textarea value={form.cartIntro} maxLength={360} onChange={event => set("cartIntro", event.target.value)} placeholder="Utilisez {country} pour le pays choisi." className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div></div></div><div className="rounded-xl border border-sky-100 bg-white p-4"><p className="font-semibold text-slate-950">Page Commande</p><div className="mt-4 space-y-3"><div className="space-y-2"><Label>Petit libellé</Label><Input value={form.checkoutEyebrow} maxLength={120} onChange={event => set("checkoutEyebrow", event.target.value)} /></div><div className="space-y-2"><Label>Titre</Label><Input value={form.checkoutTitle} maxLength={120} onChange={event => set("checkoutTitle", event.target.value)} /></div><div className="space-y-2"><Label>Introduction</Label><textarea value={form.checkoutIntro} maxLength={420} onChange={event => set("checkoutIntro", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div><div className="space-y-2"><Label>Information de paiement</Label><textarea value={form.checkoutPaymentNotice} maxLength={420} onChange={event => set("checkoutPaymentNotice", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /><p className="text-xs leading-5 text-slate-500">Ne faites aucune promesse de paiement réel tant qu’un fournisseur de paiement n’est pas activé séparément.</p></div></div></div></div>
  </section>;
}
