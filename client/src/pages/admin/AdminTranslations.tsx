import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, CheckCircle2, CircleAlert, FileText, Image, Languages, LayoutPanelTop, Loader2, Package, RefreshCw, Save, Sparkles, Tags, WandSparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { NavigationLabels } from "@/hooks/useDesignProfile";

const locales = ["de", "it", "en", "es", "nl", "ar"] as const;
type TranslationLocale = (typeof locales)[number];
type PublicContentType = "design" | "banner" | "category";
type OverviewProduct = { id: number; name: string; status: "active" | "draft" | "archived"; updatedAt: Date | string | null; translations: Array<{ locale: string; status: string; translatedAt: Date | string | null }> };
type PublicContentItem = { contentType: PublicContentType; contentId: number; title: string; fields: string[]; translations: Array<{ locale: string; status: string; translatedAt: Date | string | null; machineGenerated: number }> };

const localeLabels: Record<TranslationLocale, string> = { de: "Allemand", it: "Italien", en: "Anglais", es: "Espagnol", nl: "Néerlandais", ar: "Arabe" };
const emptyNavigation: NavigationLabels = { navigationHome: "", navigationShop: "", navigationCategories: "", navigationCreations: "", navigationContact: "" };
const publicBlocks = [
  { href: "/admin/editeur", icon: FileText, title: "Menu et libellés", description: "Accueil, Boutique, Catégories, Créations et Contact." },
  { href: "/admin/contenu", icon: Image, title: "Bannières et boutons", description: "Titre, accroche, image, lien, ordre et visibilité des visuels." },
  { href: "/admin/personnalisation#home", icon: LayoutPanelTop, title: "Histoire et textes d’accueil", description: "Message d’inspiration, histoire MAZIGHO et encart éditorial." },
  { href: "/admin/categories", icon: Tags, title: "Cartes de catégories", description: "Noms, descriptions courtes et ordre des univers." },
];
const fieldLabels: Record<string, string> = {
  highlightEyebrow: "Surtitre inspiration", highlightTitle: "Titre inspiration", highlightText: "Texte inspiration",
  storyTitle: "Titre histoire", storyText: "Texte histoire", editorialEyebrow: "Surtitre éditorial", editorialTitle: "Titre éditorial",
  title: "Titre", subtitle: "Accroche", name: "Nom", description: "Description",
};

function getTranslationState(product: OverviewProduct) {
  const byLocale = new Map(product.translations.map(item => [item.locale, item.status]));
  const ready = locales.filter(locale => byLocale.get(locale) === "ready");
  const stale = locales.filter(locale => byLocale.get(locale) === "stale");
  const missing = locales.filter(locale => !byLocale.has(locale));
  return { ready, stale, missing, complete: ready.length === locales.length };
}

function StateBadge({ product }: { product: OverviewProduct }) {
  const state = getTranslationState(product);
  if (state.complete) return <Badge className="border-0 bg-emerald-100 text-emerald-800">Prête dans 6 langues</Badge>;
  if (state.stale.length > 0) return <Badge className="border-0 bg-amber-100 text-amber-800">À régénérer</Badge>;
  return <Badge className="border-0 bg-slate-100 text-slate-700">À générer</Badge>;
}

function getContentStatus(item: PublicContentItem, locale: TranslationLocale) {
  return item.translations.find(translation => translation.locale === locale)?.status ?? "missing";
}

export default function AdminTranslations() {
  const overviewQuery = trpc.admin.products.getTranslationOverview.useQuery();
  const designQuery = trpc.admin.design.get.useQuery();
  const updateDesign = trpc.admin.design.update.useMutation();
  const autoTranslateNavigation = trpc.admin.design.translateNavigation.useMutation();
  const contentOverviewQuery = trpc.admin.publicContentTranslations.getOverview.useQuery();
  const generateContent = trpc.admin.publicContentTranslations.generate.useMutation();
  const saveContent = trpc.admin.publicContentTranslations.save.useMutation();
  const [targetLocale, setTargetLocale] = useState<TranslationLocale>("de");
  const [navigation, setNavigation] = useState<NavigationLabels>(emptyNavigation);
  const [selectedContentKey, setSelectedContentKey] = useState("design:1");
  const [contentPayload, setContentPayload] = useState<Record<string, string>>({});
  const products = (overviewQuery.data || []) as OverviewProduct[];
  const contentItems = (contentOverviewQuery.data || []) as PublicContentItem[];
  const selectedContent = useMemo(() => contentItems.find(item => `${item.contentType}:${item.contentId}` === selectedContentKey) || contentItems[0], [contentItems, selectedContentKey]);
  const selectedContentInput = selectedContent || { contentType: "design" as const, contentId: 1, title: "Contenu d’accueil", fields: [] };
  const contentTranslationQuery = trpc.admin.publicContentTranslations.get.useQuery({ contentType: selectedContentInput.contentType, contentId: selectedContentInput.contentId, locale: targetLocale });
  const complete = products.filter(product => getTranslationState(product).complete).length;
  const attention = products.length - complete;
  const stale = products.filter(product => getTranslationState(product).stale.length > 0).length;

  useEffect(() => {
    const profile = designQuery.data;
    if (!profile) return;
    setNavigation(profile.navigationTranslations[targetLocale] || {
      navigationHome: profile.navigationHome, navigationShop: profile.navigationShop, navigationCategories: profile.navigationCategories,
      navigationCreations: profile.navigationCreations, navigationContact: profile.navigationContact,
    });
  }, [designQuery.data, targetLocale]);

  useEffect(() => {
    const fields = selectedContent?.fields || [];
    const translated = contentTranslationQuery.data?.payload || {};
    setContentPayload(Object.fromEntries(fields.map(field => [field, translated[field] || ""])));
  }, [selectedContent?.contentId, selectedContent?.contentType, selectedContent?.fields, targetLocale, contentTranslationQuery.data]);

  const saveNavigationTranslation = async () => {
    const profile = designQuery.data;
    if (!profile) return;
    if (Object.values(navigation).some(value => value.trim().length === 0)) { toast.error("Complétez les cinq libellés avant d’enregistrer."); return; }
    try {
      await updateDesign.mutateAsync({ ...profile, navigationTranslations: { ...profile.navigationTranslations, [targetLocale]: Object.fromEntries(Object.entries(navigation).map(([key, value]) => [key, value.trim()])) as NavigationLabels } });
      await designQuery.refetch();
      toast.success(`Libellés ${localeLabels[targetLocale].toLowerCase()} enregistrés.`);
    } catch (error) { toast.error(`Enregistrement impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`); }
  };

  const translateNavigation = async () => {
    try {
      await autoTranslateNavigation.mutateAsync({ locales: [targetLocale] });
      await designQuery.refetch();
      toast.success(`Traduction ${localeLabels[targetLocale].toLowerCase()} générée. Vérifiez-la puis corrigez-la si nécessaire.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Traduction indisponible."); }
  };

  const translateContent = async () => {
    if (!selectedContent) return;
    try {
      await generateContent.mutateAsync({ contentType: selectedContent.contentType, contentId: selectedContent.contentId, locales: [targetLocale] });
      await Promise.all([contentTranslationQuery.refetch(), contentOverviewQuery.refetch()]);
      toast.success(`Contenu ${localeLabels[targetLocale].toLowerCase()} généré. Vérifiez-le puis enregistrez vos corrections si besoin.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Traduction indisponible."); }
  };

  const saveContentTranslation = async () => {
    if (!selectedContent) return;
    try {
      await saveContent.mutateAsync({ contentType: selectedContent.contentType, contentId: selectedContent.contentId, locale: targetLocale, payload: contentPayload });
      await Promise.all([contentTranslationQuery.refetch(), contentOverviewQuery.refetch()]);
      toast.success(`Version ${localeLabels[targetLocale].toLowerCase()} enregistrée.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Enregistrement impossible."); }
  };

  return <DashboardLayout><div className="space-y-6 pb-8">
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-violet-50"><div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8"><div><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-700"><Languages className="h-4 w-4" /> Langues & traductions</div><h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Produits et contenus publics dans toutes les langues</h1><p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">Le français reste la source. Les fiches, bannières, catégories et textes d’accueil peuvent être générés, contrôlés et corrigés ici.</p></div><Link href="/admin/produits"><Button className="bg-sky-700 text-white hover:bg-sky-800"><Package className="mr-2 h-4 w-4" /> Ouvrir les produits</Button></Link></div></section>

    <Card className="border-violet-100 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-xl"><WandSparkles className="h-5 w-5 text-violet-700" /> Traduction des libellés de navigation</CardTitle><CardDescription>Choisissez une langue, générez une version à partir du français puis corrigez chaque terme avant de l’enregistrer. Le menu public utilisera cette version dans la langue concernée.</CardDescription></CardHeader><CardContent>{designQuery.isLoading ? <Skeleton className="h-44 w-full" /> : <><div className="flex flex-wrap gap-2">{locales.map(locale => <Button key={locale} type="button" variant={targetLocale === locale ? "default" : "outline"} onClick={() => setTargetLocale(locale)} className={targetLocale === locale ? "bg-violet-700 hover:bg-violet-800" : "border-violet-200 text-violet-800 hover:bg-violet-50"}>{localeLabels[locale]}</Button>)}</div><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{([ ["navigationHome", "Accueil"], ["navigationShop", "Boutique"], ["navigationCategories", "Catégories"], ["navigationCreations", "Créations"], ["navigationContact", "Contact"] ] as Array<[keyof NavigationLabels, string]>).map(([field, label]) => <div key={field} className="space-y-2"><Label htmlFor={`translation-${field}`}>{label}</Label><Input id={`translation-${field}`} maxLength={40} value={navigation[field]} onChange={event => setNavigation(current => ({ ...current, [field]: event.target.value }))} /></div>)}</div><div className="mt-5 flex flex-col gap-3 rounded-xl bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-violet-950">La génération ne modifie pas le français. Les corrections enregistrées sont immédiatement utilisées dans le menu de la langue concernée.</p><div className="flex flex-wrap gap-2"><Button onClick={translateNavigation} disabled={autoTranslateNavigation.isPending} variant="outline" className="border-violet-300 bg-white text-violet-800 hover:bg-violet-100">{autoTranslateNavigation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}Traduire</Button><Button onClick={saveNavigationTranslation} disabled={updateDesign.isPending} className="bg-violet-700 hover:bg-violet-800">{updateDesign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer</Button></div></div></>}</CardContent></Card>

    <Card className="border-sky-100 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5 text-sky-700" /> Atelier des contenus publics</CardTitle><CardDescription>Les images, liens, prix, livraisons et visibilité ne sont pas traduits ici. Cet atelier ne modifie que les textes clients des sections d’accueil, bannières et catégories.</CardDescription></CardHeader><CardContent>{contentOverviewQuery.isLoading ? <Skeleton className="h-72 w-full" /> : !selectedContent ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucun contenu public à traduire pour le moment.</p> : <div className="space-y-5"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]"><div className="space-y-2"><Label htmlFor="content-source">Bloc français à traduire</Label><select id="content-source" value={`${selectedContent.contentType}:${selectedContent.contentId}`} onChange={event => setSelectedContentKey(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><optgroup label="Accueil"><option value="design:1">Accueil, histoire et sélection éditoriale</option></optgroup><optgroup label="Bannières">{contentItems.filter(item => item.contentType === "banner").map(item => <option key={`${item.contentType}:${item.contentId}`} value={`${item.contentType}:${item.contentId}`}>{item.title}</option>)}</optgroup><optgroup label="Catégories">{contentItems.filter(item => item.contentType === "category").map(item => <option key={`${item.contentType}:${item.contentId}`} value={`${item.contentType}:${item.contentId}`}>{item.title}</option>)}</optgroup></select></div><div className="space-y-2"><Label>État dans cette langue</Label>{(() => { const status = getContentStatus(selectedContent, targetLocale); return <div className={`flex h-10 items-center rounded-md border px-3 text-sm font-semibold ${status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "stale" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{status === "ready" ? "Prête" : status === "stale" ? "À régénérer" : "À générer"}</div>; })()}</div></div><div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-sky-950">Version {localeLabels[targetLocale].toLowerCase()}</p><p className="mt-1 text-xs leading-5 text-sky-800">Générez une seule langue à la fois pour maîtriser les crédits, puis relisez les champs avant de les enregistrer.</p></div><Button type="button" onClick={translateContent} disabled={generateContent.isPending} className="bg-sky-700 hover:bg-sky-800">{generateContent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}Générer cette langue</Button></div></div><div className="grid gap-4">{selectedContent.fields.map(field => <div key={field} className="grid gap-2"><Label htmlFor={`content-${field}`}>{fieldLabels[field] || field}</Label>{["highlightText", "storyText", "description", "subtitle"].includes(field) ? <Textarea id={`content-${field}`} rows={field === "storyText" ? 5 : 3} value={contentPayload[field] || ""} onChange={event => setContentPayload(current => ({ ...current, [field]: event.target.value }))} /> : <Input id={`content-${field}`} maxLength={1200} value={contentPayload[field] || ""} onChange={event => setContentPayload(current => ({ ...current, [field]: event.target.value }))} />}</div>)}</div><div className="flex justify-end"><Button type="button" onClick={saveContentTranslation} disabled={saveContent.isPending} className="bg-sky-700 hover:bg-sky-800">{saveContent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer cette correction</Button></div></div>}</CardContent></Card>

    <section><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Sources françaises sûres</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Modifier le texte avant de le traduire</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ces cartes ouvrent l’éditeur adapté. Après une modification, la version étrangère est marquée à régénérer ; la boutique affiche alors la source française jusqu’à la prochaine version prête.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{publicBlocks.map(block => <Card key={block.href} className="border-sky-100 shadow-sm"><CardHeader><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><block.icon className="h-5 w-5" /></div><CardTitle className="pt-3 text-lg">{block.title}</CardTitle><CardDescription className="leading-6">{block.description}</CardDescription></CardHeader><CardContent><Link href={block.href}><Button variant="outline" className="w-full border-sky-200 text-sky-800 hover:bg-sky-50">Modifier la source <ArrowUpRight className="ml-2 h-4 w-4" /></Button></Link></CardContent></Card>)}</div></section>

    <section className="grid gap-4 md:grid-cols-3"><Card className="border-sky-100 shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fiches françaises</p>{overviewQuery.isLoading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-bold text-slate-900">{products.length}</p>}<p className="mt-1 text-xs text-muted-foreground">Source unique à administrer</p></CardContent></Card><Card className="border-emerald-100 shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Prêtes dans 6 langues</p>{overviewQuery.isLoading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-bold text-emerald-700">{complete}</p>}<p className="mt-1 text-xs text-muted-foreground">Versions clients complètes</p></CardContent></Card><Card className="border-amber-100 shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">À vérifier</p>{overviewQuery.isLoading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-bold text-amber-700">{attention}</p>}<p className="mt-1 text-xs text-muted-foreground">{stale > 0 ? `${stale} fiche(s) à régénérer` : "Génération en attente ou absente"}</p></CardContent></Card></section>

    <Card className="border-sky-100 shadow-sm"><CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/70 pb-5"><div><CardTitle className="flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5 text-sky-700" /> État des traductions par fiche</CardTitle><CardDescription className="mt-1">Vert : version actualisée. Orange : texte français modifié, version à régénérer.</CardDescription></div><Button onClick={() => overviewQuery.refetch()} disabled={overviewQuery.isFetching} variant="outline" className="border-sky-200 text-sky-800 hover:bg-sky-50"><RefreshCw className={`mr-2 h-4 w-4 ${overviewQuery.isFetching ? "animate-spin" : ""}`} />Actualiser</Button></CardHeader><CardContent className="p-0">{overviewQuery.isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : products.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="rounded-full bg-sky-50 p-4 text-sky-700"><Languages className="h-8 w-8" /></div><p className="mt-4 font-semibold text-slate-800">Aucune fiche à traduire pour le moment</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Dès votre premier produit français enregistré, ses six versions clients apparaîtront ici automatiquement.</p><Link href="/admin/produits"><Button className="mt-5 bg-sky-700 hover:bg-sky-800">Créer un produit</Button></Link></div> : <div className="divide-y divide-border/70">{products.map(product => { const state = getTranslationState(product); return <div key={product.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold text-slate-900">{product.name}</p><StateBadge product={product} />{product.status === "draft" && <Badge variant="outline">Brouillon</Badge>}</div><div className="mt-3 flex flex-wrap gap-1.5">{locales.map(locale => { const status = product.translations.find(item => item.locale === locale)?.status; return <span key={locale} className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "stale" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{locale.toUpperCase()} · {status === "ready" ? "prête" : status === "stale" ? "à régénérer" : "absente"}</span>; })}</div>{state.stale.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700"><CircleAlert className="h-3.5 w-3.5" /> Le texte français a changé : la prochaine sauvegarde ou l’onglet Traductions relancera la mise à jour.</p>}</div><Link href="/admin/produits"><Button variant="outline" className="border-sky-200 text-sky-800 hover:bg-sky-50">Gérer la fiche</Button></Link></div>; })}</div>}</CardContent></Card>
    <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" /><p><strong>Protégé :</strong> les prix, frais de livraison, commandes, comptes, pages légales et réglages techniques restent volontairement hors de cet espace.</p></div>
  </div></DashboardLayout>;
}
