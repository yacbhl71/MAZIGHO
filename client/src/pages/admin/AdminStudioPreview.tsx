import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CircleAlert, Eye, LockKeyhole, PackageOpen, PawPrint, ShoppingBag, Sparkles, Store } from "lucide-react";
import { useLocation, useRoute } from "wouter";

function PreviewLoading() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />
      <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
      </div>
    </div>
  );
}

export default function AdminStudioPreview() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/apercu/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const previewQuery = trpc.admin.studio.getPrivateStorefrontPreview.useQuery(
    { storeId: isValidStoreId ? storeId : 0 },
    { enabled: isValidStoreId, retry: false },
  );

  const preview = previewQuery.data;
  const primary = preview?.identity.customPrimary || "#0F766E";
  const accent = preview?.identity.customAccent || "#F59E0B";
  const soft = preview?.identity.customSoft || "#F0FDFA";

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-slate-900 text-white hover:bg-slate-900"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Aperçu privé Studio</Badge>
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">Non public · vente désactivée</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Visualisation sécurisée de la boutique</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette vue est réservée à MAZIGHO Studio. Elle lit un snapshot privé de la boutique, sans utiliser son domaine ni les routes publiques, et ne permet ni panier, ni paiement, ni commande.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation("/admin/studio")} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à Studio
          </Button>
        </div>

        {!isValidStoreId ? (
          <Card className="border-rose-200 bg-rose-50"><CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Boutique non sélectionnée.</p><p className="mt-1">Revenez dans Studio et choisissez l’aperçu privé depuis une boutique offerte en préparation.</p></div></CardContent></Card>
        ) : previewQuery.isLoading ? <PreviewLoading /> : previewQuery.isError || !preview ? (
          <Card className="border-rose-200 bg-rose-50"><CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Aperçu indisponible.</p><p className="mt-1">Cette adresse est réservée à l’opérateur et à une boutique offerte préparée dans Studio. Aucun contenu client ou sensible n’est affiché.</p></div></CardContent></Card>
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:px-8">Rendu storefront privé — lecture seule</div>
              <div className="p-5 md:p-8" style={{ backgroundColor: soft }}>
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      {preview.identity.brandLogoUrl ? <img src={preview.identity.brandLogoUrl} alt="Logo de la boutique" className="h-12 w-12 rounded-2xl border border-white bg-white object-contain p-1.5 shadow-sm" /> : <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm" style={{ color: primary }}><PawPrint className="h-6 w-6" /></div>}
                      <div><p className="text-lg font-bold tracking-tight text-slate-950">{preview.identity.brandName}</p><p className="text-xs font-medium text-slate-600">{preview.store.currency} · boutique en {preview.store.status}</p></div>
                    </div>
                    <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: primary }}>{preview.identity.highlightEyebrow || "Aperçu catalogue"}</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{preview.identity.highlightTitle || preview.identity.brandMessage || "Une boutique prête à personnaliser."}</h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-700">{preview.identity.highlightText || preview.identity.brandMessage || "Cette boutique est en préparation et ne peut pas être visitée publiquement."}</p>
                  </div>
                  <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/85 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-900"><Eye className="h-5 w-5" style={{ color: primary }} /><p className="font-semibold">Mode aperçu sécurisé</p></div>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <p className="flex gap-2"><LockKeyhole className="mt-1 h-4 w-4 shrink-0" style={{ color: primary }} /> Disponible uniquement dans Studio.</p>
                      <p className="flex gap-2"><Store className="mt-1 h-4 w-4 shrink-0" style={{ color: primary }} /> Domaine public non utilisé.</p>
                      <p className="flex gap-2"><ShoppingBag className="mt-1 h-4 w-4 shrink-0" style={{ color: primary }} /> Vente, panier et paiement absents.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Univers de la boutique</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Catégories préparées</h2></div>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{preview.categories.length} catégorie{preview.categories.length > 1 ? "s" : ""}</Badge>
              </div>
              {preview.categories.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Aucune catégorie n’est encore préparée pour cette boutique.</div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{preview.categories.map(category => <article key={category.id} className="min-h-36 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: soft, color: primary }}><PawPrint className="h-5 w-5" /></div><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} /></div><h3 className="mt-5 font-bold text-slate-950">{category.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{category.description || "Catégorie à compléter avant l’ouverture publique."}</p></article>)}</div>}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Catalogue privé</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Fiches actuellement visibles dans l’aperçu</h2></div><Badge className="border-0 bg-slate-900 text-white hover:bg-slate-900">Non commercial</Badge></div>
              {preview.products.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Aucune fiche active n’est disponible dans le snapshot privé.</div> : <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{preview.products.map(product => <article key={product.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-5"><div className="flex items-center justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-700 shadow-sm"><PackageOpen className="h-5 w-5" /></div>{product.featured && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900"><Sparkles className="mr-1 h-3.5 w-3.5" /> Démonstration</Badge>}</div><h3 className="mt-6 text-lg font-bold tracking-tight text-slate-950">{product.name}</h3><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{product.description || "Fiche de démonstration à compléter avant toute ouverture."}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Non vendable</span><Button type="button" size="sm" disabled className="bg-slate-200 text-slate-500"><ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Vente désactivée</Button></div></article>)}</div>}
            </section>

            <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-6 text-teal-950"><strong>État préservé :</strong> cet aperçu ne crée ni domaine, ni session client, ni panier, ni promotion, ni paiement Stripe Test, ni commande fournisseur. La boutique demeure en <strong>`{preview.store.status}`</strong> et son storefront reste non public.</div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
