import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, CircleAlert, Eye, LayoutTemplate, LockKeyhole, Palette, PanelsTopLeft, Save, Sparkles, Type, WandSparkles } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

type BuilderForm = {
  brandName: string;
  brandMessage: string;
  niche: string;
  model: "commerce" | "editorial" | "catalogue";
  pages: Array<"about" | "faq" | "contact" | "lookbook">;
  paletteId: "terracotta" | "sage" | "midnight" | "rose";
  typographyId: "editorial" | "modern" | "classic";
};

const paletteOptions: Record<BuilderForm["paletteId"], { label: string; preview: string; soft: string }> = {
  terracotta: { label: "Terracotta", preview: "#C2410C", soft: "#FFF7ED" },
  sage: { label: "Sauge", preview: "#0F766E", soft: "#F0FDFA" },
  midnight: { label: "Bleu nuit", preview: "#1E3A5F", soft: "#EFF6FF" },
  rose: { label: "Rose atelier", preview: "#9A3412", soft: "#FFF1F2" },
};

function initialForm(): BuilderForm {
  return {
    brandName: "",
    brandMessage: "",
    niche: "",
    model: "commerce",
    pages: ["about", "faq", "contact"],
    paletteId: "terracotta",
    typographyId: "editorial",
  };
}

function BuilderSkeleton() {
  return <div className="space-y-5"><div className="h-28 animate-pulse rounded-3xl bg-slate-200" /><div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]"><div className="h-[640px] animate-pulse rounded-3xl bg-slate-100" /><div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" /></div></div>;
}

export default function AdminStudioOwnerBuilder() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/constructeur/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const builderQuery = trpc.admin.studio.getOwnerBuilderConfiguration.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });
  const utils = trpc.useUtils();
  const [form, setForm] = useState<BuilderForm>(initialForm);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    if (!builderQuery.data) return;
    setForm({
      brandName: builderQuery.data.identity.brandName,
      brandMessage: builderQuery.data.identity.brandMessage || "",
      niche: builderQuery.data.configuration.niche,
      model: builderQuery.data.configuration.model,
      pages: builderQuery.data.configuration.pages,
      paletteId: builderQuery.data.configuration.paletteId,
      typographyId: builderQuery.data.configuration.typographyId,
    });
  }, [builderQuery.data]);

  const saveMutation = trpc.admin.studio.saveOwnerBuilderConfiguration.useMutation({
    onSuccess: async () => {
      setSavedNotice("Préparation privée enregistrée. La boutique reste fermée au public.");
      await utils.admin.studio.getOwnerBuilderConfiguration.invalidate({ storeId });
      await utils.admin.studio.getPrivateStorefrontPreview.invalidate({ storeId });
    },
    onError: error => setSavedNotice(error.message || "Impossible d’enregistrer la préparation privée."),
  });

  const togglePage = (page: BuilderForm["pages"][number]) => {
    setForm(current => ({
      ...current,
      pages: current.pages.includes(page) ? current.pages.filter(item => item !== page) : [...current.pages, page],
    }));
  };

  const palette = paletteOptions[form.paletteId];
  const canSave = form.brandName.trim().length >= 2 && form.niche.trim().length >= 2 && !saveMutation.isPending;

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Atelier privé Studio</Badge><Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-950">Créateur de boutique · étape 1</Badge></div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Créer et personnaliser ma boutique</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Une expérience guidée inspirée des créateurs de site simples : préparez l’identité, l’univers et la structure sans ouvrir le site ni donner accès à un propriétaire.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/espace-proprietaire/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à l’aperçu</Button>
        </header>

        {!isValidStoreId ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Boutique non sélectionnée.</p><p className="mt-1">Revenez dans MAZIGHO Studio et ouvrez le créateur depuis une boutique offerte en préparation.</p></div></CardContent></Card> : builderQuery.isLoading ? <BuilderSkeleton /> : builderQuery.isError || !builderQuery.data ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Créateur temporairement indisponible.</p><p className="mt-1">Cette page est réservée à une boutique offerte en état `setup` et reste accessible uniquement dans MAZIGHO Studio.</p></div></CardContent></Card> : <>
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
            {[
              ["1", "Identité", "Nom et message"],
              ["2", "Univers", "Niche de la boutique"],
              ["3", "Structure", "Modèle et pages"],
              ["4", "Style", "Couleurs et police"],
            ].map(([number, title, detail]) => <div key={number} className="flex items-center gap-3 rounded-xl px-3 py-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">{number}</span><div><p className="text-sm font-semibold text-slate-950">{title}</p><p className="text-xs text-slate-500">{detail}</p></div></div>)}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="space-y-5">
              <Card className="border-slate-200">
                <CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700"><Sparkles className="h-5 w-5" /></div><div><CardDescription>1. L’essentiel de votre marque</CardDescription><CardTitle className="mt-1">Une identité claire dès le départ</CardTitle></div></div></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="builder-brand-name">Nom de marque</Label><Input id="builder-brand-name" value={form.brandName} maxLength={160} onChange={event => { setSavedNotice(""); setForm(current => ({ ...current, brandName: event.target.value })); }} placeholder="Ex. Pattes & Compagnie" /></div><div className="space-y-2"><Label htmlFor="builder-niche">Univers ou niche</Label><Input id="builder-niche" value={form.niche} maxLength={160} onChange={event => { setSavedNotice(""); setForm(current => ({ ...current, niche: event.target.value })); }} placeholder="Ex. Accessoires sélectionnés pour animaux" /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="builder-brand-message">Message de marque</Label><Textarea id="builder-brand-message" value={form.brandMessage} maxLength={220} onChange={event => { setSavedNotice(""); setForm(current => ({ ...current, brandMessage: event.target.value })); }} placeholder="Une phrase courte qui explique l’esprit de la boutique." className="min-h-[88px] resize-y" /><p className="text-xs text-slate-500">Ce texte est préparé dans l’identité de la boutique ; il n’est pas publié tant que la boutique reste en préparation.</p></div></CardContent>
              </Card>

              <Card className="border-slate-200"><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><LayoutTemplate className="h-5 w-5" /></div><div><CardDescription>2. La structure de départ</CardDescription><CardTitle className="mt-1">Choisissez un modèle simple</CardTitle></div></div></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3">{builderQuery.data.choices.models.map(model => <button key={model.id} type="button" onClick={() => { setSavedNotice(""); setForm(current => ({ ...current, model: model.id })); }} className={`rounded-2xl border p-4 text-left ${form.model === model.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"}`}><p className="text-sm font-semibold">{model.label}</p><p className={`mt-2 text-xs leading-5 ${form.model === model.id ? "text-slate-300" : "text-slate-500"}`}>{model.description}</p>{form.model === model.id && <Check className="mt-3 h-4 w-4" />}</button>)}</div><div className="mt-6"><Label>Pages à préparer</Label><div className="mt-3 grid gap-2 sm:grid-cols-2">{builderQuery.data.choices.pages.map(page => { const selected = form.pages.includes(page.id); return <button key={page.id} type="button" onClick={() => { setSavedNotice(""); togglePage(page.id); }} className={`flex items-start gap-3 rounded-xl border p-3 text-left ${selected ? "border-sky-300 bg-sky-50 text-sky-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><span className={`mt-0.5 grid h-4 w-4 place-items-center rounded border ${selected ? "border-sky-700 bg-sky-700 text-white" : "border-slate-300"}`}>{selected && <Check className="h-3 w-3" />}</span><span><span className="block text-sm font-semibold">{page.label}</span><span className="mt-0.5 block text-xs leading-5 opacity-75">{page.description}</span></span></button>; })}</div></div></CardContent></Card>

              <Card className="border-slate-200"><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Palette className="h-5 w-5" /></div><div><CardDescription>3. Une direction visuelle cohérente</CardDescription><CardTitle className="mt-1">Couleurs et typographie</CardTitle></div></div></CardHeader><CardContent className="grid gap-6 md:grid-cols-2"><div><Label>Palette</Label><div className="mt-3 grid grid-cols-2 gap-2">{builderQuery.data.choices.palettes.map(paletteId => { const option = paletteOptions[paletteId]; return <button key={paletteId} type="button" onClick={() => { setSavedNotice(""); setForm(current => ({ ...current, paletteId })); }} className={`flex items-center gap-2 rounded-xl border p-3 text-left ${form.paletteId === paletteId ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"}`}><span className="h-5 w-5 rounded-full border border-white/50" style={{ backgroundColor: option.preview }} /><span className="text-sm font-semibold">{option.label}</span></button>; })}</div></div><div><Label>Typographie</Label><div className="mt-3 space-y-2">{builderQuery.data.choices.typographies.map(typographyId => <button key={typographyId} type="button" onClick={() => { setSavedNotice(""); setForm(current => ({ ...current, typographyId })); }} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left ${form.typographyId === typographyId ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"}`}><span className={typographyId === "editorial" ? "font-serif text-lg" : typographyId === "classic" ? "font-serif text-base" : "font-sans text-base"}>{typographyId === "editorial" ? "Éditoriale" : typographyId === "classic" ? "Classique" : "Moderne"}</span>{form.typographyId === typographyId && <Check className="h-4 w-4" />}</button>)}</div></div></CardContent></Card>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Enregistrement sans mise en ligne</p><p className="mt-1">Cette étape prépare uniquement une configuration isolée de boutique. Elle ne publie aucune page, ne change pas le domaine, ne crée pas de client ni de membre, et ne rend ni panier ni paiement disponibles.</p></div></div></div>
              {savedNotice && <p className={`rounded-xl border px-4 py-3 text-sm ${savedNotice.startsWith("Préparation") ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}>{savedNotice}</p>}
              <Button type="button" disabled={!canSave} onClick={() => saveMutation.mutate({ storeId, ...form })} className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"><Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Enregistrement…" : "Enregistrer la préparation privée"}</Button>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-6 xl:h-fit"><Card className="overflow-hidden border-slate-200"><div className="p-5" style={{ backgroundColor: palette.soft }}><div className="flex items-center justify-between gap-3"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">Aperçu immédiat</Badge><WandSparkles className="h-5 w-5" style={{ color: palette.preview }} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Votre boutique</p><p className={`mt-2 text-2xl font-bold tracking-tight text-slate-950 ${form.typographyId === "editorial" || form.typographyId === "classic" ? "font-serif" : "font-sans"}`}>{form.brandName || "Nom de votre marque"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{form.brandMessage || "Votre message de marque apparaîtra ici une fois renseigné."}</p><div className="mt-5 rounded-2xl bg-white/90 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: palette.preview }}>{form.niche || "Univers de la boutique"}</p><p className="mt-2 text-sm font-semibold text-slate-950">{form.model === "editorial" ? "Une histoire de marque avant tout" : form.model === "catalogue" ? "Des collections mises en avant" : "Une sélection simple à découvrir"}</p><div className="mt-4 flex flex-wrap gap-2">{form.pages.length ? form.pages.map(page => <span key={page} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: palette.soft, color: palette.preview }}>{builderQuery.data.choices.pages.find(item => item.id === page)?.label}</span>) : <span className="text-xs text-slate-500">Pages optionnelles à sélectionner</span>}</div></div></div><CardContent className="p-5"><p className="flex items-center gap-2 text-sm font-semibold text-slate-950"><PanelsTopLeft className="h-4 w-4" /> Ce qui est préparé</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600"><li>Identité et message de marque.</li><li>Niche et angle de présentation.</li><li>Structure et pages envisagées.</li><li>Palette et style typographique.</li></ul><Link href={`/admin/studio/apercu/${storeId}`} className="mt-5 inline-flex items-center text-sm font-semibold text-slate-800 hover:text-slate-950"><Eye className="mr-1.5 h-4 w-4" /> Voir le storefront privé</Link></CardContent></Card><Card className="border-sky-200 bg-sky-50"><CardContent className="p-5 text-sm leading-6 text-sky-950"><Type className="mb-2 h-5 w-5" /><p className="font-semibold">Une base, pas une promesse vide</p><p className="mt-1">Les choix enregistrés sont réels et isolés par boutique. Vous pouvez maintenant préparer les textes des pages par petits blocs, toujours avant toute ouverture publique.</p><Link href={`/admin/studio/pages/${storeId}`} className="mt-4 inline-flex items-center text-sm font-semibold text-sky-950 hover:text-slate-950"><PanelsTopLeft className="mr-1.5 h-4 w-4" /> Préparer les pages</Link></CardContent></Card></aside>
          </section>
        </>}
      </main>
    </DashboardLayout>
  );
}
