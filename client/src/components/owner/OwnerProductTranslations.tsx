import { useEffect, useMemo, useState } from "react";
import { Languages, Loader2, PencilLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const languages = [
  { code: "en", label: "English", flag: "EN" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "it", label: "Italiano", flag: "IT" },
  { code: "es", label: "Español", flag: "ES" },
  { code: "nl", label: "Nederlands", flag: "NL" },
  { code: "ar", label: "العربية", flag: "AR" },
] as const;

type Locale = (typeof languages)[number]["code"];
type Draft = { name: string; description: string; longDescription: string };
const emptyDraft: Draft = { name: "", description: "", longDescription: "" };

type Props = { productId?: number; productName: string };

export default function OwnerProductTranslations({ productId, productName }: Props) {
  const utils = trpc.useUtils();
  const [locale, setLocale] = useState<Locale>("en");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const translations = trpc.owner.productTranslations.list.useQuery({ productId: productId || 0 }, { enabled: Boolean(productId), retry: false });
  const selected = useMemo(() => translations.data?.find(item => item.locale === locale), [translations.data, locale]);

  useEffect(() => {
    setDraft(selected ? {
      name: selected.name || "",
      description: selected.description || "",
      longDescription: selected.longDescription || "",
    } : emptyDraft);
  }, [selected, locale, productId]);

  const refresh = () => productId ? utils.owner.productTranslations.list.invalidate({ productId }) : Promise.resolve();
  const translate = trpc.owner.productTranslations.translate.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Traduction générée : relisez-la avant de publier la fiche."); },
    onError: error => toast.error(error.message || "La traduction n’a pas pu être générée."),
  });
  const save = trpc.owner.productTranslations.save.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Traduction enregistrée pour cette boutique."); },
    onError: error => toast.error(error.message || "La traduction n’a pas pu être enregistrée."),
  });

  if (!productId) return <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5"><div className="flex gap-3"><Languages className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><p className="font-semibold text-sky-950">Traductions de la fiche</p><p className="mt-1 text-sm leading-6 text-sky-900">Enregistrez d’abord le produit. Vous pourrez ensuite générer, relire et corriger ses textes en anglais, allemand, italien, espagnol, néerlandais ou arabe.</p></div></div></section>;

  return <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="flex items-center gap-2 text-sm font-bold text-sky-950"><Languages className="h-4 w-4" /> Traductions de la fiche</p><p className="mt-1 max-w-3xl text-xs leading-5 text-sky-900">Les visiteurs voient la version traduite dans la langue choisie. La fiche française reste votre source ; toute modification de son texte marque les traductions à actualiser.</p></div>
      <span className="inline-flex w-fit rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-sky-800">{translations.data?.filter(item => item.status === "ready").length || 0}/6 prêtes</span>
    </div>

    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Langues de la fiche">
      {languages.map(language => {
        const status = translations.data?.find(item => item.locale === language.code)?.status;
        const active = locale === language.code;
        return <button key={language.code} type="button" role="tab" aria-selected={active} onClick={() => setLocale(language.code)} className={`min-h-11 shrink-0 rounded-lg border px-3 text-sm font-semibold transition-colors ${active ? "border-sky-700 bg-sky-700 text-white" : status === "ready" ? "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50" : status === "stale" ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100" : "border-sky-200 bg-white text-slate-700 hover:bg-sky-100"}`}>{language.flag}<span className="ml-1.5 hidden sm:inline">{language.label}</span>{status === "stale" ? <span className="ml-1 text-[10px]">à revoir</span> : null}</button>;
      })}
    </div>

    {translations.isLoading ? <div className="mt-5 h-40 animate-pulse rounded-xl bg-white" /> : <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,.45fr)]">
      <div className="space-y-4 rounded-xl border border-sky-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">{languages.find(item => item.code === locale)?.label}</p><p className="mt-1 text-xs text-slate-500">{selected?.machineGenerated ? "Traduction assistée — à relire" : selected ? "Traduction révisée manuellement" : "Aucune version enregistrée"}</p></div><Button type="button" variant="outline" className="min-h-10 border-sky-300 text-sky-800 hover:bg-sky-50" disabled={translate.isPending} onClick={() => translate.mutate({ productId, locales: [locale] })}>{translate.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}{selected ? "Regénérer" : "Générer"}</Button></div>
        <div className="space-y-2"><Label htmlFor={`owner-product-translation-name-${locale}`}>Titre</Label><Input id={`owner-product-translation-name-${locale}`} value={draft.name} maxLength={200} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder={productName} /></div>
        <div className="space-y-2"><Label htmlFor={`owner-product-translation-description-${locale}`}>Accroche</Label><Textarea id={`owner-product-translation-description-${locale}`} rows={3} maxLength={2000} value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor={`owner-product-translation-long-${locale}`}>Description détaillée</Label><Textarea id={`owner-product-translation-long-${locale}`} rows={5} maxLength={10000} value={draft.longDescription} onChange={event => setDraft(current => ({ ...current, longDescription: event.target.value }))} /></div>
        <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="button" className="min-h-11 bg-sky-700 hover:bg-sky-800" disabled={save.isPending || !draft.name.trim()} onClick={() => save.mutate({ productId, locale, name: draft.name, description: draft.description || null, longDescription: draft.longDescription || null })}>{save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PencilLine className="mr-1.5 h-4 w-4" />}Enregistrer cette langue</Button></div>
      </div>
      <aside className="rounded-xl border border-sky-200 bg-white/80 p-4 text-sm leading-6 text-sky-950"><p className="font-semibold">Contrôle avant publication</p><ul className="mt-3 space-y-2 text-xs leading-5 text-sky-900"><li>• Vérifiez les unités, tailles, prix et délais.</li><li>• N’ajoutez aucune promesse, caractéristique ou disponibilité non confirmée.</li><li>• Les options structurées restent conservées afin de ne pas casser les variantes.</li><li>• Les modifications ne créent ni produit, ni publicité, ni action externe.</li></ul></aside>
    </div>}
  </section>;
}
