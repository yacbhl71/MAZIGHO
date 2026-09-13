import { useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Boxes, ExternalLink, Image, PackageSearch, Palette, Store, TriangleAlert } from "lucide-react";

export default function AdminStudioOwnerActiveStoreManagement() {
  const [, params] = useRoute("/admin/studio/gestion-boutique/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const storefrontQuery = trpc.admin.studio.getOwnerPublicStorefrontContent.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });
  const catalogueQuery = trpc.admin.studio.getOwnerExistingCatalogue.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });

  if (!validStoreId) return <DashboardLayout><main className="mx-auto max-w-5xl px-4 py-8 md:px-8"><Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-950">Boutique non sélectionnée.</CardContent></Card></main></DashboardLayout>;
  const store = storefrontQuery.data?.store;
  const catalogue = catalogueQuery.data;
  const loading = storefrontQuery.isLoading || catalogueQuery.isLoading;
  const failed = storefrontQuery.isError || catalogueQuery.isError;
  const domain = store?.primaryDomain;

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge><Badge className="border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-50">Gestion de boutique</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Gérer la boutique</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Gérez le contenu et le catalogue de cette boutique depuis Studio. Son statut public reste distinct : aucune ouverture, fermeture ou publication n’est déclenchée ici.</p></header>
    {loading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-52 animate-pulse rounded-2xl bg-slate-100" /><div className="h-52 animate-pulse rounded-2xl bg-slate-100" /></div> : failed || !store ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Gestion indisponible.</p><p className="mt-1">La lecture du catalogue ou de la vitrine de cette boutique n’a pas pu être chargée. Vérifiez son statut depuis le registre Studio.</p></div></CardContent></Card> : <>
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700"><Store className="h-5 w-5" /></div><div><p className="font-bold text-emerald-950">{store.displayName}</p><p className="mt-1 text-sm text-emerald-800">Statut : {store.status} · Domaine : {domain || "à configurer"}</p></div></div>{domain && <Button asChild variant="outline" className="min-h-11 border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100"><a href={`https://${domain}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Voir la boutique</a></Button>}</div></section>
      <section className="grid gap-5 md:grid-cols-2"><Card className="border-slate-200"><CardHeader><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700"><PackageSearch className="h-5 w-5" /></div><div><CardDescription>Catalogue réel</CardDescription><CardTitle className="mt-1">Produits et catégories</CardTitle></div></div></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">{catalogue ? `${catalogue.categories.length} catégorie(s) et ${catalogue.products.length} produit(s) sont disponibles à l’édition.` : "Le catalogue se chargera ici."}</p><Button asChild className="mt-5 min-h-11 bg-slate-950 text-white hover:bg-slate-800"><a href={`/admin/studio/catalogue-existant/${storeId}`}><Boxes className="mr-2 h-4 w-4" /> Gérer le catalogue</a></Button></CardContent></Card>
        <Card className="border-slate-200"><CardHeader><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Palette className="h-5 w-5" /></div><div><CardDescription>Vitrine publique</CardDescription><CardTitle className="mt-1">Bannières, images et textes</CardTitle></div></div></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">{storefrontQuery.data ? `${storefrontQuery.data.banners.length} bannière(s) propre(s) sont enregistrées. Personnalisez l’identité et les visuels animalier.` : "La personnalisation se chargera ici."}</p><Button asChild className="mt-5 min-h-11 bg-violet-700 text-white hover:bg-violet-800"><a href={`/admin/studio/contenu-public/${storeId}`}><Image className="mr-2 h-4 w-4" /> Personnaliser la vitrine</a></Button></CardContent></Card></section>
      <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">Ces outils modifient uniquement cette boutique. Ils ne changent pas son statut public et ne modifient ni MAZIGHO principal, ni les fournisseurs, ni les paiements.</p>
    </>}</main></DashboardLayout>;
}
