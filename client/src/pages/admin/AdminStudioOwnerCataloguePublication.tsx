import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, Eye, LockKeyhole, PackageCheck, ShieldAlert, Store, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";

type PublicationPlan = {
  categories: Array<{ sourceId: string; title: string; description: string; slug: string; displayOrder: number }>;
  products: Array<{ sourceId: string; categoryTitle: string; name: string; description: string; slug: string; priceCents: number; stock: number; featured: boolean; imagesIncluded: false; variantsIncluded: false }>;
  blockers: string[];
  canPublishCatalogue: boolean;
  manualAcknowledgements: string[];
};

type ActivationCheck = { key: string; label: string; state: "ready" | "blocked" | "manual"; detail: string };

export default function AdminStudioOwnerCataloguePublication() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/publication-catalogue/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const utils = trpc.useUtils();
  const previewQuery = trpc.admin.studio.getOwnerCataloguePublicationPreview.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false, refetchOnWindowFocus: false });
  const activationQuery = trpc.admin.studio.getGiftStoreActivationPreflight.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false, refetchOnWindowFocus: false });
  const [confirmationName, setConfirmationName] = useState("");
  const [previewAcknowledged, setPreviewAcknowledged] = useState(false);
  const [mediaAcknowledged, setMediaAcknowledged] = useState(false);
  const [operationsAcknowledged, setOperationsAcknowledged] = useState(false);
  const [publishedSummary, setPublishedSummary] = useState<{ categories: number; products: number } | null>(null);
  const [activationName, setActivationName] = useState("");
  const [activationOwnerEmail, setActivationOwnerEmail] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [variantsReviewed, setVariantsReviewed] = useState(false);
  const [shippingReturnsReviewed, setShippingReturnsReviewed] = useState(false);
  const [activationAcknowledged, setActivationAcknowledged] = useState(false);
  const [activated, setActivated] = useState(false);

  const publishMutation = trpc.admin.studio.publishOwnerCatalogueFromPreview.useMutation({
    onSuccess: result => {
      setPublishedSummary({ categories: result.categoryCount, products: result.productCount });
      utils.admin.studio.getOwnerCataloguePublicationPreview.invalidate({ storeId });
      utils.admin.studio.getGiftStoreActivationPreflight.invalidate({ storeId });
    },
  });
  const activateMutation = trpc.admin.studio.activateGiftAnimalStore.useMutation({
    onSuccess: () => {
      setActivated(true);
      utils.admin.studio.getGiftStoreActivationPreflight.invalidate({ storeId });
    },
  });

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;
  const preview = previewQuery.data;
  const plan = preview?.plan as PublicationPlan | undefined;
  const storeName = preview?.store.displayName || "";
  const canConfirmPublication = Boolean(plan?.canPublishCatalogue && confirmationName.trim() === storeName && previewAcknowledged && mediaAcknowledged && operationsAcknowledged && !publishMutation.isPending);
  const activation = activationQuery.data?.activation;
  const canConfirmActivation = Boolean(activation?.locallyReadyForManualActivation && activationName.trim() === activationQuery.data?.store.displayName && activationOwnerEmail.trim() && domainVerified && variantsReviewed && shippingReturnsReviewed && activationAcknowledged && !activateMutation.isPending);

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Action protégée Studio</Badge><Badge variant="outline" className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-950">Publication avec confirmation</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Publier le catalogue, puis ouvrir séparément</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Visualisez d’abord exactement ce qui sera créé. La publication crée le catalogue réel mais laisse la boutique fermée en `setup`. L’ouverture publique exige ensuite un second prévol et une seconde confirmation.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/revue-passage/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Revue de passage</Button></header>

    {previewQuery.isLoading ? <div className="h-[620px] animate-pulse rounded-3xl bg-slate-100" /> : previewQuery.isError || !preview || !plan ? <Unavailable /> : <>
      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-sm leading-6 text-violet-950"><div className="flex gap-3"><Eye className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Aperçu privé pour {preview.store.displayName}</p><p className="mt-1">{preview.existingCatalogue.categoryCount || preview.existingCatalogue.productCount ? `Le catalogue réel contient déjà ${preview.existingCatalogue.categoryCount} catégorie(s) et ${preview.existingCatalogue.productCount} produit(s). Ce parcours refuse volontairement de l’écraser.` : "Aucun catalogue réel n’existe encore : l’aperçu ci-dessous est la liste qui serait créée après confirmation."}</p></div></div></section>

      {publishedSummary ? <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Catalogue publié : {publishedSummary.categories} catégorie(s) et {publishedSummary.products} produit(s).</p><p className="mt-1">La boutique reste fermée : aucun storefront, panier, checkout ni paiement n’est ouvert par cette publication.</p></div></div></section> : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><CardDescription>Ce qui sera créé</CardDescription><CardTitle className="mt-1 text-xl">Catégories et produits</CardTitle></CardHeader><CardContent className="space-y-5 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Catégories</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{plan.categories.map(category => <div key={category.sourceId} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="font-bold text-slate-950">{category.title}</p><p className="mt-1 text-xs text-slate-500">/{category.slug}</p><p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p></div>)}</div></div><div className="border-t border-slate-100 pt-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Produits</p><div className="mt-3 space-y-3">{plan.products.map(product => <div key={product.sourceId} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-slate-950">{product.name}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{product.categoryTitle} · /{product.slug}</p></div><div className="text-left sm:text-right"><p className="font-bold text-slate-950">{formatPrice(product.priceCents)}</p><p className="mt-1 text-xs text-slate-500">Stock : {product.stock}</p></div></div><p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">Images : à confirmer</Badge><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">Variantes : à confirmer</Badge>{product.featured ? <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">À la une</Badge> : null}</div></div>)}</div></div></CardContent></Card></div>
        <aside className="space-y-5">{plan.blockers.length ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm leading-6 text-rose-950"><p className="flex items-center gap-2 font-bold"><CircleAlert className="h-4 w-4" /> Publication bloquée</p><ul className="mt-3 list-disc space-y-2 pl-5">{plan.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul><div className="mt-4 grid gap-2"><Button type="button" className="min-h-11 w-full bg-teal-700 text-white hover:bg-teal-800" onClick={() => setLocation(`/admin/studio/catalogue-existant/${storeId}`)}>Compléter le catalogue existant</Button><Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => setLocation(`/admin/studio/contenu-public/${storeId}`)}>Personnaliser bannières et textes</Button></div></CardContent></Card> : <Card className="border-fuchsia-200 bg-fuchsia-50"><CardHeader><CardDescription>Confirmation de publication</CardDescription><CardTitle className="mt-1 text-xl">Créer le catalogue réel</CardTitle></CardHeader><CardContent className="space-y-4"><Acknowledgement checked={previewAcknowledged} onCheckedChange={setPreviewAcknowledged} label={plan.manualAcknowledgements[0]} /><Acknowledgement checked={mediaAcknowledged} onCheckedChange={setMediaAcknowledged} label={plan.manualAcknowledgements[1]} /><Acknowledgement checked={operationsAcknowledged} onCheckedChange={setOperationsAcknowledged} label={plan.manualAcknowledgements[2]} /><div className="space-y-2"><Label htmlFor="catalogue-name">Recopiez « {storeName} »</Label><Input id="catalogue-name" value={confirmationName} onChange={event => setConfirmationName(event.target.value)} autoComplete="off" /></div>{publishMutation.error ? <p className="text-sm leading-6 text-rose-800">{publishMutation.error.message}</p> : null}<Button type="button" disabled={!canConfirmPublication} onClick={() => publishMutation.mutate({ storeId, planToken: preview.planToken, confirmationName, previewAcknowledged: true, missingMediaVariantsAcknowledged: true, operationsLegalDomainAcknowledged: true })} className="min-h-11 w-full bg-fuchsia-700 text-white hover:bg-fuchsia-800"><PackageCheck className="mr-2 h-4 w-4" /> {publishMutation.isPending ? "Publication en cours…" : "Publier le catalogue réel"}</Button><p className="text-xs leading-5 text-fuchsia-950">Cette action crée catégories et produits, mais ne change pas le statut `setup`.</p></CardContent></Card>}
          <ActivationPanel activation={activation} storeName={activationQuery.data?.store.displayName || ""} name={activationName} setName={setActivationName} ownerEmail={activationOwnerEmail} setOwnerEmail={setActivationOwnerEmail} domainVerified={domainVerified} setDomainVerified={setDomainVerified} variantsReviewed={variantsReviewed} setVariantsReviewed={setVariantsReviewed} shippingReturnsReviewed={shippingReturnsReviewed} setShippingReturnsReviewed={setShippingReturnsReviewed} acknowledged={activationAcknowledged} setAcknowledged={setActivationAcknowledged} enabled={canConfirmActivation && !activated} pending={activateMutation.isPending} error={activateMutation.error?.message} success={activated} onActivate={() => activateMutation.mutate({ storeId, confirmationName: activationName, confirmationOwnerEmail: activationOwnerEmail, domainVerified: true, variantsReviewed: true, shippingReturnsReviewed: true, activationAcknowledged: true })} />
        </aside>
      </section>
    </>}
  </main></DashboardLayout>;
}

function Acknowledgement({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (value: boolean) => void; label: string }) {
  return <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-fuchsia-200 bg-white/70 p-3 text-sm leading-5 text-slate-700"><Checkbox checked={checked} onCheckedChange={value => onCheckedChange(value === true)} className="mt-0.5" /><span>{label}</span></Label>;
}

function ActivationPanel({ activation, storeName, name, setName, ownerEmail, setOwnerEmail, domainVerified, setDomainVerified, variantsReviewed, setVariantsReviewed, shippingReturnsReviewed, setShippingReturnsReviewed, acknowledged, setAcknowledged, enabled, pending, error, success, onActivate }: { activation: { checks: ActivationCheck[]; locallyReadyForManualActivation: boolean } | undefined; storeName: string; name: string; setName: (value: string) => void; ownerEmail: string; setOwnerEmail: (value: string) => void; domainVerified: boolean; setDomainVerified: (value: boolean) => void; variantsReviewed: boolean; setVariantsReviewed: (value: boolean) => void; shippingReturnsReviewed: boolean; setShippingReturnsReviewed: (value: boolean) => void; acknowledged: boolean; setAcknowledged: (value: boolean) => void; enabled: boolean; pending: boolean; error?: string; success: boolean; onActivate: () => void }) {
  if (success) return <Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-5 text-sm leading-6 text-emerald-950"><p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" /> Boutique activée</p><p className="mt-2">Le storefront est désormais éligible à la diffusion publique. Vérifiez le domaine dans une session privée.</p></CardContent></Card>;
  if (!activation) return <Card className="border-slate-200"><CardContent className="p-5 text-sm text-slate-600">Chargement du prévol d’activation…</CardContent></Card>;
  const blocked = activation.checks.filter(check => check.state === "blocked");
  const style = { ready: "border-emerald-200 bg-emerald-50 text-emerald-950", blocked: "border-rose-200 bg-rose-50 text-rose-950", manual: "border-amber-200 bg-amber-50 text-amber-950" };
  const label = { ready: "Prêt", blocked: "À compléter", manual: "À confirmer" };
  return <Card className={activation.locallyReadyForManualActivation ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}><CardHeader><CardDescription>Étape distincte, après le catalogue</CardDescription><CardTitle className="mt-1 text-xl">Prévol final d’ouverture</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2">{activation.checks.map(check => <div key={check.key} className={`rounded-xl border p-3 text-sm leading-5 ${style[check.state]}`}><div className="flex items-center justify-between gap-2"><p className="font-bold">{check.label}</p><Badge variant="outline" className="border-current bg-white/60 text-inherit">{label[check.state]}</Badge></div><p className="mt-1">{check.detail}</p></div>)}</div>{blocked.length ? <div className="rounded-xl border border-amber-200 bg-white/70 p-3 text-sm leading-6 text-amber-950"><p className="font-bold">Ouverture bloquée tant que les éléments rouges ne sont pas traités.</p><p className="mt-1">Les confirmations finales apparaîtront ensuite ici.</p></div> : <><Acknowledgement checked={domainVerified} onCheckedChange={setDomainVerified} label="Je confirme avoir vérifié manuellement le domaine et son affichage attendu." /><Acknowledgement checked={variantsReviewed} onCheckedChange={setVariantsReviewed} label="Je confirme avoir revu les variantes client ou validé qu’aucune variante n’est nécessaire." /><Acknowledgement checked={shippingReturnsReviewed} onCheckedChange={setShippingReturnsReviewed} label="Je confirme avoir revu les informations de livraison, délais et retours affichées au client." /><Acknowledgement checked={acknowledged} onCheckedChange={setAcknowledged} label="Je comprends que cette action rend la boutique publiquement servable." /><div className="space-y-2"><Label htmlFor="activation-name">Recopiez « {storeName} »</Label><Input id="activation-name" value={name} onChange={event => setName(event.target.value)} autoComplete="off" /></div><div className="space-y-2"><Label htmlFor="activation-owner-email">E-mail du propriétaire actif</Label><Input id="activation-owner-email" type="email" value={ownerEmail} onChange={event => setOwnerEmail(event.target.value)} autoComplete="off" /></div>{error ? <p className="text-sm leading-6 text-rose-800">{error}</p> : null}<Button type="button" disabled={!enabled} onClick={onActivate} className="min-h-11 w-full bg-emerald-700 text-white hover:bg-emerald-800"><Store className="mr-2 h-4 w-4" /> {pending ? "Ouverture en cours…" : "Activer et ouvrir la boutique"}</Button></>}</CardContent></Card>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Publication contrôlée indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(cents / 100);
}
