import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Languages, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const translatableLocales = ["de", "it", "en", "es", "nl", "ar"] as const;
type TranslationLocale = typeof translatableLocales[number];
type ContentType = "design" | "banner" | "category";
type ContentItem = {
  contentType: ContentType;
  contentId: number;
  title: string;
  fields: string[];
  translations: Array<{ locale: string; status: string; translatedAt: Date | string | null; machineGenerated: number }>;
};

const localeLabels: Record<TranslationLocale, string> = {
  de: "Allemand",
  it: "Italien",
  en: "Anglais",
  es: "Espagnol",
  nl: "Néerlandais",
  ar: "Arabe",
};

const typeLabels: Record<ContentType, string> = {
  design: "Textes d’accueil",
  banner: "Carrousel principal",
  category: "Catégories",
};

const fieldLabels: Record<string, string> = {
  brandMessage: "Surtitre du hero",
  highlightEyebrow: "Surtitre inspiration",
  highlightTitle: "Titre inspiration",
  highlightText: "Texte inspiration",
  storyTitle: "Titre histoire",
  storyText: "Texte histoire",
  editorialEyebrow: "Surtitre éditorial",
  editorialTitle: "Titre éditorial",
  discoveryAllShopLabel: "Bouton secondaire du hero",
  discoveryBrowseShopLabel: "Bouton principal du hero",
  title: "Titre",
  subtitle: "Texte secondaire",
  name: "Nom",
  description: "Description",
};

function keyOf(item: Pick<ContentItem, "contentType" | "contentId">) {
  return `${item.contentType}:${item.contentId}`;
}

function statusOf(item: ContentItem, locale: TranslationLocale) {
  return item.translations.find(translation => translation.locale === locale)?.status ?? "missing";
}

function statusPresentation(status: string) {
  if (status === "ready") return { label: "Prête", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (status === "stale") return { label: "À mettre à jour", className: "border-amber-200 bg-amber-50 text-amber-900" };
  return { label: "À créer", className: "border-slate-200 bg-slate-50 text-slate-700" };
}

function isLongField(field: string) {
  return ["highlightText", "storyText", "description", "subtitle"].includes(field);
}

export default function OwnerStorefrontTranslations() {
  const marketSettings = trpc.owner.getMarketSettings.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const overview = trpc.owner.publicContentTranslations.getOverview.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [locale, setLocale] = useState<TranslationLocale>("en");
  const [selectedKey, setSelectedKey] = useState("");
  const [payload, setPayload] = useState<Record<string, string>>({});

  const activeLocales = useMemo(() => {
    const active = marketSettings.data?.activeLanguages ?? ["fr"];
    return translatableLocales.filter(candidate => active.includes(candidate));
  }, [marketSettings.data?.activeLanguages]);
  const contentItems = (overview.data ?? []) as ContentItem[];
  const selected = useMemo(() => contentItems.find(item => keyOf(item) === selectedKey) ?? contentItems[0], [contentItems, selectedKey]);
  const selectedInput = selected ? { contentType: selected.contentType, contentId: selected.contentId } : undefined;
  const source = trpc.owner.publicContentTranslations.getSource.useQuery(selectedInput!, { enabled: Boolean(selectedInput), retry: false, refetchOnWindowFocus: false });
  const translation = trpc.owner.publicContentTranslations.get.useQuery(selectedInput ? { ...selectedInput, locale } : undefined!, { enabled: Boolean(selectedInput), retry: false, refetchOnWindowFocus: false });
  const generate = trpc.owner.publicContentTranslations.generate.useMutation();
  const save = trpc.owner.publicContentTranslations.save.useMutation();

  useEffect(() => {
    if (!activeLocales.length) return;
    if (!activeLocales.includes(locale)) setLocale(activeLocales[0]);
  }, [activeLocales, locale]);

  useEffect(() => {
    if (!selected) return;
    setPayload(Object.fromEntries(selected.fields.map(field => [field, translation.data?.payload?.[field] ?? ""])));
  }, [selected?.contentId, selected?.contentType, selected?.fields, translation.data]);

  const selectedStatus = selected ? statusPresentation(statusOf(selected, locale)) : null;
  const invalidFields = selected?.fields.filter(field => {
    const sourceValue = String(source.data?.payload?.[field] ?? "").trim();
    return Boolean(sourceValue && !String(payload[field] ?? "").trim());
  }) ?? [];

  const refresh = async () => {
    await Promise.all([overview.refetch(), source.refetch(), translation.refetch()]);
  };

  const generateCurrent = async () => {
    if (!selected) return;
    try {
      await generate.mutateAsync({ contentType: selected.contentType, contentId: selected.contentId, locales: [locale] });
      await refresh();
      toast.success(`Version ${localeLabels[locale].toLowerCase()} générée. Vérifiez-la puis enregistrez vos corrections si nécessaire.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "La génération est indisponible pour le moment.");
    }
  };

  const saveCurrent = async () => {
    if (!selected || invalidFields.length) {
      toast.error("Complétez les champs obligatoires avant l’enregistrement.");
      return;
    }
    try {
      await save.mutateAsync({ contentType: selected.contentType, contentId: selected.contentId, locale, payload });
      await refresh();
      toast.success(`Version ${localeLabels[locale].toLowerCase()} enregistrée pour cette boutique.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "L’enregistrement est impossible.");
    }
  };

  if (marketSettings.isLoading || overview.isLoading) {
    return <Card className="border-sky-100"><CardContent className="h-72 animate-pulse p-6" /></Card>;
  }

  if (!activeLocales.length) {
    return <Card className="border-dashed border-slate-300"><CardContent className="p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Aucune langue supplémentaire n’est active.</p><p className="mt-1">Ajoutez une langue dans la partie « Marchés & langues » pour préparer les textes de cette boutique dans cette langue.</p></CardContent></Card>;
  }

  return <Card className="border-sky-200">
    <CardHeader className="border-b border-sky-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sky-950"><Languages className="h-5 w-5 text-sky-700" /> Traductions de la vitrine</CardTitle>
          <CardDescription className="mt-1 max-w-3xl">Le carrousel, les textes d’accueil et les catégories disposent d’une version propre par langue. Une version non prête reste volontairement en français : elle n’est jamais remplacée par un texte générique MAZIGHO.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">{activeLocales.map(item => <Button key={item} type="button" size="sm" variant={locale === item ? "default" : "outline"} onClick={() => setLocale(item)} className={locale === item ? "bg-sky-700 hover:bg-sky-800" : "border-sky-200 text-sky-800 hover:bg-sky-50"}>{item.toUpperCase()} · {localeLabels[item]}</Button>)}</div>
      </div>
    </CardHeader>
    <CardContent className="space-y-5 pt-5">
      <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><p className="font-semibold">Pour modifier le texte principal du hero</p><p className="mt-1">Ouvrez d’abord <strong>Vitrine → Carrousel principal → Modifier</strong> pour changer l’image, le titre français, l’accroche ou le lien. Revenez ensuite ici et choisissez la langue pour rédiger ou générer sa version traduite.</p></div>
      {contentItems.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">Aucun texte public n’est encore enregistré dans cette boutique.</div> : <div className="grid gap-5 xl:grid-cols-[minmax(240px,.8fr)_minmax(0,1.2fr)]">
        <section className="max-h-[560px] space-y-2 overflow-y-auto pr-1" aria-label="Blocs à traduire">
          {contentItems.map(item => {
            const status = statusPresentation(statusOf(item, locale));
            const active = selected && keyOf(item) === keyOf(selected);
            return <button type="button" key={keyOf(item)} onClick={() => setSelectedKey(keyOf(item))} className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? "border-sky-300 bg-sky-50" : "bg-white hover:border-sky-200"}`}>
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">{typeLabels[item.contentType]}</p><p className="mt-1 truncate font-semibold text-slate-950">{item.title}</p></div><Badge variant="outline" className={status.className}>{status.label}</Badge></div>
            </button>;
          })}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          {!selected ? <p className="py-12 text-center text-sm text-slate-500">Choisissez un contenu à traduire.</p> : <>
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">{typeLabels[selected.contentType]} · {localeLabels[locale]}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{selected.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">La source française reste intacte. Cette version agit seulement quand le visiteur choisit {localeLabels[locale].toLowerCase()}.</p></div>{selectedStatus && <Badge variant="outline" className={selectedStatus.className}>{selectedStatus.label}</Badge>}</div>
            {invalidFields.length > 0 && <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><p>À compléter : {invalidFields.map(field => fieldLabels[field] || field).join(", ")}.</p></div>}
            <div className="mt-4 grid gap-4">{selected.fields.map(field => <div key={field} className="space-y-2"><Label htmlFor={`owner-translation-${field}`}>{fieldLabels[field] || field}</Label>{isLongField(field) ? <Textarea id={`owner-translation-${field}`} rows={field === "storyText" ? 5 : 3} value={payload[field] ?? ""} onChange={event => setPayload(current => ({ ...current, [field]: event.target.value }))} /> : <Input id={`owner-translation-${field}`} maxLength={1200} value={payload[field] ?? ""} onChange={event => setPayload(current => ({ ...current, [field]: event.target.value }))} />}</div>)}</div>
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-slate-500">« Générer » produit seulement ce bloc, dans la langue choisie, et reste modifiable avant validation. Aucune campagne, e-mail, pixel ou publication externe n’est déclenché.</p><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11 border-sky-200 text-sky-800 hover:bg-sky-50" disabled={generate.isPending || save.isPending} onClick={() => { if (window.confirm(`Générer la version ${localeLabels[locale].toLowerCase()} de « ${selected.title} » ? Elle restera modifiable avant utilisation.`)) void generateCurrent(); }}>{generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Générer</Button><Button type="button" className="min-h-11 bg-sky-700 hover:bg-sky-800" disabled={save.isPending || generate.isPending || invalidFields.length > 0} onClick={() => void saveCurrent()}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer</Button></div></div>
            {translation.data && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Version actuellement {translation.data.machineGenerated ? "générée" : "corrigée manuellement"}.</p>}
          </>}
        </section>
      </div>}
    </CardContent>
  </Card>;
}
