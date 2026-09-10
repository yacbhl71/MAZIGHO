import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BadgeCheck, CircleAlert, ClipboardCheck, Eye, LayoutDashboard, LockKeyhole, PackageOpen, Palette, Rocket, Settings2, ShoppingBag, Sparkles, UsersRound } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

function WorkspaceSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"><div className="h-[390px] animate-pulse rounded-3xl bg-slate-100" /><div className="h-[390px] animate-pulse rounded-3xl bg-slate-100" /></div>
    </div>
  );
}

function statusStyle(state: "ready" | "blocked" | "manual") {
  if (state === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (state === "manual") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-rose-200 bg-rose-50 text-rose-900";
}

export default function AdminStudioOwnerWorkspacePreview() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/espace-proprietaire/:storeId");
  const storeId = Number(params?.storeId);
  const isValidStoreId = Number.isInteger(storeId) && storeId > 0;
  const storefrontQuery = trpc.admin.studio.getPrivateStorefrontPreview.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });
  const readinessQuery = trpc.admin.studio.getGiftStoreSetupReadiness.useQuery({ storeId: isValidStoreId ? storeId : 0 }, { enabled: isValidStoreId, retry: false });

  const snapshot = storefrontQuery.data;
  const readiness = readinessQuery.data;
  const primary = snapshot?.identity.customPrimary || "#0F766E";
  const soft = snapshot?.identity.customSoft || "#F0FDFA";
  const firstChecks = readiness?.readiness.checks.filter(check => ["brand", "catalogue", "currency", "owner", "legal"].includes(check.key)) ?? [];

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-900 text-white hover:bg-slate-900"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Aperçu privé Studio</Badge><Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-900">Panneau propriétaire — simulation</Badge></div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Le futur espace de la boutique cliente</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">Cette page montre la différence entre votre console MAZIGHO Studio et le panneau quotidien d’un futur propriétaire. C’est une visualisation opérateur : elle ne donne aucun accès client et ne modifie pas la boutique.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation("/admin/studio")} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à Studio</Button>
        </div>

        {!isValidStoreId ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Boutique non sélectionnée.</p><p className="mt-1">Revenez dans MAZIGHO Studio et ouvrez l’aperçu depuis une boutique offerte en préparation.</p></div></CardContent></Card> : storefrontQuery.isLoading || readinessQuery.isLoading ? <WorkspaceSkeleton /> : storefrontQuery.isError || readinessQuery.isError || !snapshot || !readiness ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Aperçu du panneau indisponible.</p><p className="mt-1">Cette vue exige une boutique offerte en état `setup` et reste exclusivement réservée à MAZIGHO Studio.</p></div></CardContent></Card> : <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-7" style={{ backgroundColor: soft }}>
              <div className="flex min-w-0 items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm" style={{ color: primary }}>{snapshot.identity.brandLogoUrl ? <img src={snapshot.identity.brandLogoUrl} alt="Logo de la boutique" className="h-10 w-10 object-contain" /> : <Sparkles className="h-6 w-6" />}</div><div className="min-w-0"><p className="truncate text-xl font-bold tracking-tight text-slate-950">{snapshot.identity.brandName}</p><p className="mt-1 text-sm text-slate-600">Panneau propriétaire simulé · {readiness.store.currency} · état `setup`</p></div></div>
              <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/studio/constructeur/${snapshot.store.id}`} className="inline-flex items-center text-sm font-semibold text-slate-800 hover:text-slate-950"><Palette className="mr-1.5 h-4 w-4" /> Créer et personnaliser</Link><Link href={`/admin/studio/lancement/${snapshot.store.id}`} className="inline-flex items-center text-sm font-semibold text-slate-800 hover:text-slate-950"><Rocket className="mr-1.5 h-4 w-4" /> Centre de lancement</Link><Link href={`/admin/studio/checklist/${snapshot.store.id}`} className="inline-flex items-center text-sm font-semibold text-slate-800 hover:text-slate-950"><ClipboardCheck className="mr-1.5 h-4 w-4" /> Suivi de préparation</Link><Link href={`/admin/studio/apercu/${snapshot.store.id}`} className="inline-flex items-center text-sm font-semibold text-slate-800 hover:text-slate-950"><Eye className="mr-1.5 h-4 w-4" /> Aperçu storefront</Link><Badge className="border-0 bg-slate-900 text-white hover:bg-slate-900">Aucune session client</Badge></div>
            </div>
            <div className="grid border-t border-slate-200 sm:grid-cols-4"><div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Données</p><p className="mt-1 text-sm font-semibold text-slate-950">Une boutique isolée</p></div><div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Rôle cible</p><p className="mt-1 text-sm font-semibold text-slate-950">Propriétaire / équipe</p></div><div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Console Studio</p><p className="mt-1 text-sm font-semibold text-slate-950">Inaccessible au client</p></div><div className="px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Public</p><p className="mt-1 text-sm font-semibold text-slate-950">Toujours fermé</p></div></div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="rounded-3xl bg-slate-950 p-4 text-white shadow-lg"><div className="border-b border-white/10 px-3 py-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Panneau de la boutique</p><p className="mt-2 font-semibold">Navigation propriétaire</p></div><nav className="mt-4 space-y-1.5">{[[LayoutDashboard, "Pilotage", "Vue quotidienne"], [PackageOpen, "Catalogue", "Produits & catégories"], [Palette, "Marque & contenu", "Identité et pages"], [ShoppingBag, "Commandes", "Suivi de vente"], [Settings2, "Réglages", "Préférences boutique"]].map(([Icon, title, detail]) => { const NavIcon = Icon as typeof LayoutDashboard; return <div key={title as string} className={title === "Pilotage" ? "flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3" : "flex items-center gap-3 rounded-xl px-3 py-3 text-slate-300"}><NavIcon className="h-4 w-4 shrink-0" /><div><p className="text-sm font-medium">{title as string}</p><p className="mt-0.5 text-[11px] text-slate-400">{detail as string}</p></div></div>; })}</nav><div className="mt-6 rounded-xl border border-white/10 bg-white/[0.06] p-3 text-xs leading-5 text-slate-300"><LockKeyhole className="mb-2 h-4 w-4" />Les réglages plateforme, les autres boutiques, les secrets et les contrôles techniques restent absents de cet espace.</div></aside>

            <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card className="border-slate-200"><CardHeader className="pb-2"><CardDescription>Identité</CardDescription><CardTitle className="text-base">{snapshot.identity.brandName}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">Profil propre à la boutique.</CardContent></Card><Card className="border-slate-200"><CardHeader className="pb-2"><CardDescription>Catalogue</CardDescription><CardTitle className="text-base">{snapshot.categories.length} catégories</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">{snapshot.products.length} fiche{snapshot.products.length > 1 ? "s" : ""} non commerciale{snapshot.products.length > 1 ? "s" : ""}.</CardContent></Card><Card className="border-slate-200"><CardHeader className="pb-2"><CardDescription>Commandes</CardDescription><CardTitle className="text-base">Module isolé</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">Aucune commande affichée dans cet aperçu.</CardContent></Card><Card className="border-slate-200"><CardHeader className="pb-2"><CardDescription>Diffusion</CardDescription><CardTitle className="text-base">Non publique</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">Pas de domaine, panier ni paiement.</CardContent></Card></div>

              <Card className="border-slate-200"><CardHeader><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Exemple de tableau de bord quotidien</CardDescription><CardTitle className="mt-1 text-xl">Préparer la marque et le catalogue</CardTitle></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">Démo non interactive</Badge></div></CardHeader><CardContent className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(270px,.95fr)]"><div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Message de marque</p><p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{snapshot.identity.highlightTitle || snapshot.identity.brandMessage || "Une boutique prête à personnaliser."}</p><p className="mt-3 text-sm leading-6 text-slate-600">{snapshot.identity.highlightText || snapshot.identity.brandMessage || "Ajoutez votre message, vos produits et vos visuels avant toute ouverture."}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-slate-950"><PackageOpen className="h-4 w-4" /> Catégories prêtes</p><div className="mt-3 flex flex-wrap gap-2">{snapshot.categories.length ? snapshot.categories.map(category => <span key={category.id} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: soft, color: primary }}>{category.name}</span>) : <span className="text-sm text-slate-500">À préparer</span>}</div></div><div className="rounded-2xl border border-slate-200 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-slate-950"><UsersRound className="h-4 w-4" /> Équipe boutique</p><p className="mt-3 text-sm leading-6 text-slate-600">Le futur propriétaire ne verra que son périmètre de boutique et les membres autorisés.</p></div></div></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-950">État de préparation</p><div className="mt-4 space-y-2">{firstChecks.map(check => <div key={check.key} className={`rounded-xl border p-3 ${statusStyle(check.state)}`}><div className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-sm font-semibold">{check.label}</p><p className="mt-1 text-xs leading-5 opacity-80">{check.detail}</p></div></div></div>)}</div></div></CardContent></Card>

              <Card className="border-violet-200 bg-violet-50/50"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-violet-950">Ce que le propriétaire pourra gérer à terme</p><p className="mt-1 max-w-3xl text-sm leading-6 text-violet-900">Sa marque, son catalogue, ses commandes et son contenu propres. Les modules d’infrastructure, les autres boutiques, les secrets et les décisions de plateforme restent exclusivement dans MAZIGHO Studio.</p></div><Button type="button" disabled className="w-fit bg-violet-200 text-violet-700"><LockKeyhole className="mr-2 h-4 w-4" /> Aperçu uniquement</Button></CardContent></Card>
            </div>
          </section>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950"><strong>Limite volontaire :</strong> ce panneau est une vue de conception réservée à l’opérateur. Il n’est pas un espace connecté pour le propriétaire et ne crée ni compte, ni permission, ni invitation, ni commande, ni paiement ou activation publique.</div>
        </>}
      </div>
    </DashboardLayout>
  );
}
