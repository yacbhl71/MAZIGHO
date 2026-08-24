import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Eye, FileText, Languages, Loader2, Save, Sparkles, WandSparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const locales = ["de", "it", "en", "es", "nl", "ar"] as const;
type TranslationLocale = typeof locales[number];
type ContentType = "design" | "banner" | "category";
type ContentItem = { contentType: ContentType; contentId: number; title: string; fields: string[]; translations: Array<{ locale: string; status: string; translatedAt: Date | string | null; machineGenerated: number }> };
const localeLabels: Record<TranslationLocale, string> = { de: "Allemand", it: "Italien", en: "Anglais", es: "Espagnol", nl: "Néerlandais", ar: "Arabe" };
const typeLabels: Record<ContentType, string> = { design: "Accueil", banner: "Bannières", category: "Catégories" };
const fieldLabels: Record<string, string> = { highlightEyebrow: "Surtitre inspiration", highlightTitle: "Titre inspiration", highlightText: "Texte inspiration", storyTitle: "Titre histoire", storyText: "Texte histoire", editorialEyebrow: "Surtitre éditorial", editorialTitle: "Titre éditorial", title: "Titre", subtitle: "Accroche", name: "Nom", description: "Description" };

function keyOf(item: Pick<ContentItem, "contentType" | "contentId">) { return `${item.contentType}:${item.contentId}`; }
function statusOf(item: ContentItem, locale: TranslationLocale) { return item.translations.find(translation => translation.locale === locale)?.status ?? "missing"; }
function statusLabel(status: string) { return status === "ready" ? "Prête" : status === "stale" ? "À régénérer" : "À générer"; }
function statusClass(status: string) { return status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "stale" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"; }
function isLongField(field: string) { return ["highlightText", "storyText", "description", "subtitle"].includes(field); }
function formatDate(value: Date | string | null | undefined) { return value ? new Intl.DateTimeFormat("fr-CH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }

export default function PublicContentTranslationWorkbench() {
  const overviewQuery = trpc.admin.publicContentTranslations.getOverview.useQuery();
  const generate = trpc.admin.publicContentTranslations.generate.useMutation();
  const save = trpc.admin.publicContentTranslations.save.useMutation();
  const [locale, setLocale] = useState<TranslationLocale>("de");
  const [filter, setFilter] = useState<"all" | "attention" | ContentType>("attention");
  const [selectedKey, setSelectedKey] = useState("design:1");
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [isBatching, setIsBatching] = useState(false);
  const contentItems = (overviewQuery.data || []) as ContentItem[];
  const selected = useMemo(() => contentItems.find(item => keyOf(item) === selectedKey) || contentItems[0], [contentItems, selectedKey]);
  const selectedInput = selected || { contentType: "design" as const, contentId: 1 };
  const sourceQuery = trpc.admin.publicContentTranslations.getSource.useQuery(selectedInput);
  const translationQuery = trpc.admin.publicContentTranslations.get.useQuery({ ...selectedInput, locale });

  useEffect(() => {
    if (!selected) return;
    setPayload(Object.fromEntries(selected.fields.map(field => [field, translationQuery.data?.payload?.[field] || ""])));
  }, [selected?.contentId, selected?.contentType, selected?.fields, locale, translationQuery.data]);

  const statusCounts = useMemo(() => contentItems.reduce((counts, item) => {
    const status = statusOf(item, locale);
    counts[status === "ready" ? "ready" : status === "stale" ? "stale" : "missing"] += 1;
    return counts;
  }, { ready: 0, stale: 0, missing: 0 }), [contentItems, locale]);
  const filteredItems = useMemo(() => contentItems.filter(item => filter === "all" ? true : filter === "attention" ? statusOf(item, locale) !== "ready" : item.contentType === filter).sort((a, b) => (statusOf(a, locale) === "ready" ? 1 : 0) - (statusOf(b, locale) === "ready" ? 1 : 0) || a.title.localeCompare(b.title, "fr")), [contentItems, filter, locale]);
  const batchItems = useMemo(() => filteredItems.filter(item => statusOf(item, locale) !== "ready"), [filteredItems, locale]);
  const sourcePayload = sourceQuery.data?.payload || {};
  const fieldWarnings = useMemo(() => selected?.fields.flatMap(field => {
    const source = String(sourcePayload[field] || "").trim();
    const value = String(payload[field] || "").trim();
    if (source && !value) return [`${fieldLabels[field] || field} est vide.`];
    if (value.length > 1000) return [`${fieldLabels[field] || field} dépasse 1 000 caractères.`];
    return [];
  }) || [], [selected?.fields, sourcePayload, payload]);
  const lastVersion = translationQuery.data;

  const choose = (item: ContentItem) => {
    setSelectedKey(keyOf(item));
    setFilter(item.contentType);
  };
  const generateOne = async () => {
    if (!selected) return;
    try {
      await generate.mutateAsync({ contentType: selected.contentType, contentId: selected.contentId, locales: [locale] });
      await Promise.all([overviewQuery.refetch(), translationQuery.refetch()]);
      toast.success(`Version ${localeLabels[locale].toLowerCase()} générée : vérifiez-la avant de l’enregistrer.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Traduction indisponible."); }
  };
  const saveOne = async () => {
    if (!selected || fieldWarnings.length) { toast.error("Corrigez les champs signalés avant l’enregistrement."); return; }
    try {
      await save.mutateAsync({ contentType: selected.contentType, contentId: selected.contentId, locale, payload });
      await Promise.all([overviewQuery.refetch(), translationQuery.refetch()]);
      toast.success(`Version ${localeLabels[locale].toLowerCase()} enregistrée.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Enregistrement impossible."); }
  };
  const generateBatch = async () => {
    setIsBatching(true);
    let completed = 0;
    try {
      for (const item of batchItems) {
        await generate.mutateAsync({ contentType: item.contentType, contentId: item.contentId, locales: [locale] });
        completed += 1;
      }
      await Promise.all([overviewQuery.refetch(), translationQuery.refetch()]);
      toast.success(`${completed} contenu(s) généré(s) en ${localeLabels[locale].toLowerCase()}.`);
      setBatchDialogOpen(false);
    } catch (error) {
      toast.error(`${completed} contenu(s) généré(s). ${error instanceof Error ? error.message : "La suite a été arrêtée."}`);
      await overviewQuery.refetch();
    } finally { setIsBatching(false); }
  };

  return <Card className="border-sky-100 shadow-sm"><CardHeader className="border-b border-sky-100"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><CardTitle className="flex items-center gap-2 text-xl"><Languages className="h-5 w-5 text-sky-700" /> Pilotage des contenus publics</CardTitle><CardDescription className="mt-1 max-w-3xl">Suivez les textes client par langue, allez directement au bloc à corriger et gardez chaque génération sous contrôle.</CardDescription></div><div className="flex flex-wrap gap-2">{locales.map(item => <Button key={item} size="sm" variant={locale === item ? "default" : "outline"} onClick={() => setLocale(item)} className={locale === item ? "bg-sky-700 hover:bg-sky-800" : "border-sky-200 text-sky-800 hover:bg-sky-50"}>{item.toUpperCase()}</Button>)}</div></div></CardHeader><CardContent className="space-y-5 pt-5">{overviewQuery.isLoading ? <Skeleton className="h-[520px] w-full" /> : <><section className="grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => setFilter("all")} className={`rounded-xl border p-4 text-left ${filter === "all" ? "border-sky-300 bg-sky-50" : "bg-white"}`}><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p><p className="mt-1 text-2xl font-bold text-slate-900">{contentItems.length}</p><p className="mt-1 text-xs text-muted-foreground">Blocs administrables</p></button><button type="button" onClick={() => setFilter("attention")} className={`rounded-xl border p-4 text-left ${filter === "attention" ? "border-amber-300 bg-amber-50" : "bg-white"}`}><p className="text-xs font-semibold uppercase tracking-wider text-amber-700">À traiter</p><p className="mt-1 text-2xl font-bold text-amber-800">{statusCounts.stale + statusCounts.missing}</p><p className="mt-1 text-xs text-amber-800">{statusCounts.stale} à régénérer · {statusCounts.missing} absents</p></button><button type="button" onClick={() => setFilter("all")} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Prêtes</p><p className="mt-1 text-2xl font-bold text-emerald-800">{statusCounts.ready}</p><p className="mt-1 text-xs text-emerald-800">Versions utilisables côté client</p></button></section>

  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"><div className="flex flex-wrap gap-2"><Select value={filter} onValueChange={value => setFilter(value as typeof filter)}><SelectTrigger className="w-[190px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="attention">À traiter</SelectItem><SelectItem value="all">Tous les contenus</SelectItem><SelectItem value="design">Accueil</SelectItem><SelectItem value="banner">Bannières</SelectItem><SelectItem value="category">Catégories</SelectItem></SelectContent></Select><Badge variant="outline" className="h-10 border-slate-200 bg-white px-3 text-slate-600">{filteredItems.length} bloc(s) affiché(s)</Badge></div><Button type="button" size="sm" onClick={() => setBatchDialogOpen(true)} disabled={batchItems.length === 0} className="bg-violet-700 hover:bg-violet-800"><WandSparkles className="mr-2 h-4 w-4" /> Générer les {batchItems.length} à traiter</Button></div>

  <div className="grid gap-5 xl:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.2fr)]"><section className="max-h-[620px] space-y-2 overflow-y-auto pr-1">{filteredItems.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" /> Tout est prêt dans cette vue.</div> : filteredItems.map(item => { const status = statusOf(item, locale); const active = selected && keyOf(selected) === keyOf(item); return <button type="button" key={keyOf(item)} onClick={() => choose(item)} className={`w-full rounded-xl border p-3 text-left ${active ? "border-sky-300 bg-sky-50" : "bg-white hover:border-sky-200"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">{typeLabels[item.contentType]}</p><p className="mt-1 truncate font-semibold text-slate-900">{item.title}</p></div><Badge variant="outline" className={statusClass(status)}>{statusLabel(status)}</Badge></div><div className="mt-2 flex flex-wrap gap-1">{item.translations.filter(translation => translation.status === "ready").map(translation => <span key={translation.locale} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{translation.locale.toUpperCase()}</span>)}</div></button>; })}</section>

  <section className="space-y-4 rounded-xl border bg-white p-4">{!selected ? <p className="py-16 text-center text-sm text-muted-foreground">Choisissez un bloc à gauche.</p> : <><div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">{typeLabels[selected.contentType]} · {localeLabels[locale]}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{selected.title}</h3><p className="mt-1 text-xs text-muted-foreground">Dernière version : {lastVersion ? `${lastVersion.machineGenerated ? "générée" : "corrigée manuellement"} le ${formatDate(lastVersion.translatedAt)}` : "aucune"}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={generateOne} disabled={generate.isPending || isBatching} className="border-sky-200 text-sky-800 hover:bg-sky-50">{generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Générer</Button><Button type="button" size="sm" onClick={saveOne} disabled={save.isPending || fieldWarnings.length > 0} className="bg-sky-700 hover:bg-sky-800">{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer</Button></div></div>
  {fieldWarnings.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><div className="flex items-center gap-1.5 font-semibold"><CircleAlert className="h-4 w-4" /> Contrôle qualité</div><ul className="mt-1 list-disc space-y-1 pl-5">{fieldWarnings.map(warning => <li key={warning}>{warning}</li>)}</ul></div>}
  <div className="grid gap-4">{selected.fields.map(field => <div key={field} className="grid gap-2"><Label htmlFor={`content-field-${field}`}>{fieldLabels[field] || field}</Label>{isLongField(field) ? <Textarea id={`content-field-${field}`} rows={field === "storyText" ? 5 : 3} value={payload[field] || ""} onChange={event => setPayload(current => ({ ...current, [field]: event.target.value }))} /> : <Input id={`content-field-${field}`} maxLength={1200} value={payload[field] || ""} onChange={event => setPayload(current => ({ ...current, [field]: event.target.value }))} />}</div>)}</div>
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-sky-700" /><p className="text-sm font-semibold text-slate-900">Aperçu client {locale.toUpperCase()}</p></div><div dir={locale === "ar" ? "rtl" : "ltr"} className="rounded-lg bg-white p-4 text-slate-800"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">MAZIGHO · {typeLabels[selected.contentType]}</p><div className="mt-3 space-y-3">{selected.fields.map(field => <div key={field}><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{fieldLabels[field] || field}</p><p className={isLongField(field) ? "mt-1 whitespace-pre-wrap text-sm leading-6" : "mt-1 font-semibold"}>{payload[field] || <span className="italic text-slate-400">Texte à générer</span>}</p></div>)}</div></div></div></>}</section></div></>}
  <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}><DialogContent><DialogHeader><DialogTitle>Générer {batchItems.length} contenu(s) ?</DialogTitle><DialogDescription>Cette action générera uniquement les blocs visibles à traiter pour la langue {localeLabels[locale].toLowerCase()}. Chaque résultat restera modifiable avant utilisation client.</DialogDescription></DialogHeader><div className="rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm text-violet-950"><strong>Contrôle des crédits :</strong> la génération se fera un bloc après l’autre et s’arrêtera en cas d’erreur.</div><DialogFooter><Button type="button" variant="outline" onClick={() => setBatchDialogOpen(false)} disabled={isBatching}>Annuler</Button><Button type="button" onClick={generateBatch} disabled={isBatching} className="bg-violet-700 hover:bg-violet-800">{isBatching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmer la génération</Button></DialogFooter></DialogContent></Dialog></CardContent></Card>;
}
