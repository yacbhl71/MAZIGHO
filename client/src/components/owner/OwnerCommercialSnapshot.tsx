import { BarChart3, Loader2, PackageCheck, RefreshCw, ShoppingBag, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function money(value: number, currencyCode: string) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: currencyCode }).format(Math.max(0, value) / 100);
}

/** Read-only store-scoped sales indicators; no customer profiling or campaign automation. */
export default function OwnerCommercialSnapshot() {
  const snapshot = trpc.owner.getCommercialSnapshot.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const data = snapshot.data;

  return <section className="space-y-5">
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-indigo-950"><BarChart3 className="h-5 w-5 text-indigo-700" /> Repères commerciaux</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">Un aperçu de vos seules commandes localement confirmées : montants encaissés, panier moyen et rythme des 30 derniers jours. Aucun profil client, pixel ou relance n’est créé.</CardDescription>
          </div>
          <Button type="button" variant="outline" className="min-h-11 border-indigo-200 text-indigo-900 hover:bg-indigo-50" onClick={() => void snapshot.refetch()} disabled={snapshot.isFetching}>
            {snapshot.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {snapshot.isLoading ? <div className="grid gap-3 md:grid-cols-3"><div className="h-28 animate-pulse rounded-xl bg-white/80" /><div className="h-28 animate-pulse rounded-xl bg-white/80" /><div className="h-28 animate-pulse rounded-xl bg-white/80" /></div> : snapshot.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Les repères commerciaux sont momentanément indisponibles. Aucune commande n’a été modifiée.</div> : !data?.buckets.length ? <div className="rounded-xl border border-dashed border-indigo-200 bg-white/80 p-6 text-center"><ShoppingBag className="mx-auto h-7 w-7 text-indigo-700" /><p className="mt-3 font-semibold text-indigo-950">Aucune commande réglée à analyser.</p><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-indigo-900">Les indicateurs apparaîtront après les premières commandes localement marquées comme réglées. Les commandes en attente, les données de test non confirmées et les informations clients restent hors de cette vue.</p></div> : <div className="space-y-4">{data.buckets.map(bucket => <article key={bucket.currencyCode} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-slate-950">Ventes {bucket.currencyCode}</p><p className="mt-1 text-sm text-slate-600">Lecture commerciale de votre boutique uniquement.</p></div><Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-800">{bucket.paidOrderCount} confirmée{bucket.paidOrderCount > 1 ? "s" : ""}</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ventes confirmées</p><p className="mt-1 text-xl font-bold text-slate-950">{money(bucket.paidRevenueCents, bucket.currencyCode)}</p><p className="mt-1 text-xs text-slate-500">{bucket.paidOrderCount} commande{bucket.paidOrderCount > 1 ? "s" : ""}</p></div><div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-cyan-800">30 derniers jours</p><p className="mt-1 text-xl font-bold text-cyan-950">{money(bucket.paidLast30DaysRevenueCents, bucket.currencyCode)}</p><p className="mt-1 text-xs text-cyan-800">{bucket.paidLast30DaysCount} commande{bucket.paidLast30DaysCount > 1 ? "s" : ""}</p></div><div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Panier moyen</p><p className="mt-1 text-xl font-bold text-emerald-950">{money(bucket.averageBasketCents, bucket.currencyCode)}</p><p className="mt-1 text-xs text-emerald-800">commandes confirmées</p></div></div></article>)}</div>}
      </CardContent>
    </Card>

    {data?.topProducts.length ? <Card className="border-slate-200"><CardHeader><CardTitle className="flex items-center gap-2 text-slate-950"><PackageCheck className="h-5 w-5 text-indigo-700" /> Produits les plus vendus</CardTitle><CardDescription>Classement par quantité sur les commandes réglées de cette boutique, sans fiche client ni revenu produit trans-devise.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{data.topProducts.map((product, index) => <div key={product.productId} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">#{index + 1}</Badge><TrendingUp className="h-4 w-4 text-indigo-700" /></div><p className="mt-4 truncate font-semibold text-slate-950" title={product.productName}>{product.productName}</p><p className="mt-2 text-sm text-slate-600"><strong className="text-slate-950">{product.quantitySold}</strong> unité{product.quantitySold > 1 ? "s" : ""} vendue{product.quantitySold > 1 ? "s" : ""}</p></div>)}</div></CardContent></Card> : null}
  </section>;
}
