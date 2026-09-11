import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CircleAlert, CreditCard, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";

type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  collectionTitle: string;
  priceCents: number;
  featured: boolean;
  status: "available" | "limited" | "unavailable";
  maxQuantity: number;
  message: string;
};

type CartLine = {
  productId: string;
  name: string;
  priceCents: number;
  requestedQuantity: number;
  acceptedQuantity: number;
  lineTotalCents: number;
  status: "available" | "limited" | "unavailable";
  message: string;
};

const statusStyles = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-900",
  limited: "border-amber-200 bg-amber-50 text-amber-900",
  unavailable: "border-rose-200 bg-rose-50 text-rose-900",
};

const statusLabels = {
  available: "Disponible pour le test",
  limited: "Quantité limitée",
  unavailable: "Non ajoutable",
};

function formatPrice(cents: number, currencyCode: string) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: currencyCode, minimumFractionDigits: 2 }).format(cents / 100);
}

export default function AdminStudioOwnerPrivateCartSimulation() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/panier-simulation/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const lines = useMemo(() => Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity })), [quantities]);
  const query = trpc.admin.studio.getOwnerPrivateCartSimulation.useQuery(
    { storeId: validStoreId ? storeId : 0, lines },
    { enabled: validStoreId, retry: false },
  );

  const catalog = (query.data?.catalog ?? []) as CatalogProduct[];
  const cartLines = (query.data?.lines ?? []) as CartLine[];
  const currencyCode = query.data?.currencyCode || "CHF";
  const subtotalCents = query.data?.subtotalCents ?? 0;
  const itemCount = query.data?.itemCount ?? 0;

  useEffect(() => {
    if (!catalog.length) return;
    setQuantities(current => Object.fromEntries(Object.entries(current).filter(([productId]) => catalog.some(product => product.id === productId))));
  }, [catalog.length]);

  const setQuantity = (productId: string, quantity: number, maxQuantity = 99) => {
    const nextQuantity = Math.max(0, Math.min(maxQuantity, Math.round(quantity) || 0));
    setQuantities(current => {
      if (nextQuantity === 0) {
        const { [productId]: _removed, ...remaining } = current;
        return remaining;
      }
      return { ...current, [productId]: nextQuantity };
    });
  };

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Simulation privée Studio</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">Panier de préparation</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Tester le futur panier</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Composez un panier de travail avec les fiches, prix et disponibilités déjà préparés. Cette simulation est calculée côté Studio : elle ne crée aucun panier réel, client, paiement, commande ou action fournisseur.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/stock-fournisseurs/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Stock et fournisseur</Button></header>

    {query.isLoading ? <div className="h-[620px] animate-pulse rounded-3xl bg-slate-100" /> : query.isError || !query.data ? <Unavailable /> : <>
      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-sm leading-6 text-violet-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{query.data.store.displayName} · toujours en état `setup`</p><p className="mt-1">Les boutons ci-dessous servent uniquement à vérifier les quantités et le total de présentation. Aucun produit n’est ajouté à un panier de visiteur et aucune fonction d’achat n’est disponible.</p></div></div></section>

      {!catalog.length ? <Card className="border-amber-200 bg-amber-50"><CardContent className="p-6 text-sm leading-6 text-amber-950"><p className="font-bold">Préparez d’abord des fiches produits.</p><p className="mt-1">La simulation utilise exclusivement les fiches privées déjà enregistrées. Revenez à l’atelier Fiches produits, créez votre sélection, puis préparez au moins une disponibilité dans Stock et fournisseur.</p><Button type="button" className="mt-4 bg-slate-950 text-white hover:bg-slate-800" onClick={() => setLocation(`/admin/studio/produits/${storeId}`)}>Ouvrir les fiches produits</Button></CardContent></Card> : <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_390px]">
        <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Fiches privées disponibles</CardDescription><CardTitle className="mt-1 text-xl">Construire le test</CardTitle></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">{catalog.length} fiche{catalog.length > 1 ? "s" : ""}</Badge></div></CardHeader><CardContent className="space-y-4 p-4 sm:p-6">
          {catalog.map(product => { const quantity = quantities[product.id] || 0; const addable = product.maxQuantity > 0; return <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-base font-bold text-slate-950">{product.name}</p>{product.featured && <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">À la une</Badge>}</div><p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{product.collectionTitle}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{product.description}</p></div><div className="shrink-0 text-left sm:text-right"><p className="text-lg font-bold text-slate-950">{formatPrice(product.priceCents, currencyCode)}</p><Badge variant="outline" className={`mt-2 ${statusStyles[product.status]}`}>{statusLabels[product.status]}</Badge></div></div><div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">{product.message}</p>{addable ? <div className="flex min-h-11 items-center rounded-xl border border-slate-300 bg-slate-50"><Button type="button" variant="ghost" size="icon" disabled={quantity < 1} onClick={() => setQuantity(product.id, quantity - 1, product.maxQuantity)} aria-label={`Retirer une unité de ${product.name}`}><Minus className="h-4 w-4" /></Button><span className="min-w-10 text-center text-sm font-bold text-slate-950">{quantity}</span><Button type="button" variant="ghost" size="icon" disabled={quantity >= product.maxQuantity} onClick={() => setQuantity(product.id, quantity + 1, product.maxQuantity)} aria-label={`Ajouter une unité de ${product.name}`}><Plus className="h-4 w-4" /></Button></div> : <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-900">À préparer avant ajout</Badge>}</div></article>; })}
        </CardContent></Card>

        <aside className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex items-center justify-between"><div><CardDescription>Lecture de test</CardDescription><CardTitle className="mt-1 text-xl">Panier simulé</CardTitle></div><ShoppingBag className="h-5 w-5 text-slate-500" /></div></CardHeader><CardContent className="space-y-4 p-5">{!cartLines.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Ajoutez une fiche disponible depuis la sélection. Rien ne sera persisté.</div> : <>{cartLines.map(line => <div key={line.productId} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-950">{line.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{line.message}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setQuantity(line.productId, 0)} aria-label={`Retirer ${line.name}`}><Trash2 className="h-4 w-4" /></Button></div><div className="mt-3 flex items-center justify-between text-sm"><Badge variant="outline" className={statusStyles[line.status]}>{line.acceptedQuantity} unité{line.acceptedQuantity > 1 ? "s" : ""}</Badge><span className="font-bold text-slate-950">{formatPrice(line.lineTotalCents, currencyCode)}</span></div></div>)}<div className="border-t border-slate-200 pt-4"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Total de présentation</p><p className="mt-1 text-sm text-slate-600">{itemCount} article{itemCount > 1 ? "s" : ""} retenu{itemCount > 1 ? "s" : ""}</p></div><p className="text-2xl font-bold text-slate-950">{formatPrice(subtotalCents, currencyCode)}</p></div></div></>}</CardContent></Card><Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><CreditCard className="h-4 w-4" /> Limite volontaire</p><p className="mt-2">Le total n’inclut pas de livraison, taxe, remise ou moyen de paiement. Il n’existe aucun bouton de checkout : la simulation ne crée ni client, ni session Stripe, ni commande, ni action fournisseur.</p></CardContent></Card><Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-5 text-sm leading-6 text-emerald-950"><p className="flex items-center gap-2 font-bold"><PackageCheck className="h-4 w-4" /> Prochaine vérification</p><p className="mt-2">Utilisez cette maquette pour repérer une fiche indisponible, une quantité incohérente ou un prix à revoir avant la future étape de catalogue publiable.</p></CardContent></Card></aside>
      </section>}
    </>}
  </main></DashboardLayout>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Simulation privée de panier indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
