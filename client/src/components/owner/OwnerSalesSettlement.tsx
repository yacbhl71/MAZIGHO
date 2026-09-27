import { CircleDollarSign, CreditCard, Loader2, ReceiptText, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function money(value: number, currencyCode: string) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: currencyCode || "CHF" }).format(Math.max(0, value) / 100);
}

function modePresentation(mode: "test" | "live") {
  return mode === "live"
    ? { label: "Production", className: "border-emerald-200 bg-emerald-50 text-emerald-800" }
    : { label: "Test", className: "border-violet-200 bg-violet-50 text-violet-800" };
}

/** Read-only financial tracking; it never controls Stripe, payouts, refunds or disputes. */
export default function OwnerSalesSettlement() {
  const settlement = trpc.owner.getSalesSettlementOverview.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const data = settlement.data;

  return <section className="space-y-5">
    <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-sky-50">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-teal-950"><CircleDollarSign className="h-5 w-5 text-teal-700" /> Encaissements & commission</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">Suivi comptable de vos commandes <strong>Stripe Connect Direct Charges</strong>. Chaque ligne reste attachée à votre boutique et distingue strictement Test et Production.</CardDescription>
          </div>
          <Button type="button" variant="outline" className="min-h-11 border-teal-200 text-teal-900 hover:bg-teal-50" onClick={() => void settlement.refetch()} disabled={settlement.isFetching}>
            {settlement.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {settlement.isLoading ? <div className="grid gap-3 md:grid-cols-3"><div className="h-28 animate-pulse rounded-xl bg-white/80" /><div className="h-28 animate-pulse rounded-xl bg-white/80" /><div className="h-28 animate-pulse rounded-xl bg-white/80" /></div> : settlement.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Le suivi des encaissements est momentanément indisponible. Aucune donnée client, adresse ou information bancaire n’est affichée.</div> : !data || data.buckets.length === 0 ? <div className="rounded-xl border border-dashed border-teal-200 bg-white/80 p-6 text-center"><ReceiptText className="mx-auto h-7 w-7 text-teal-700" /><p className="mt-3 font-semibold text-teal-950">Aucun encaissement Stripe Connect confirmé.</p><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-teal-900">Les commandes de Test et de Production apparaîtront ici uniquement après confirmation sécurisée d’un paiement. Les commandes non réglées ne sont pas comptées.</p></div> : <div className="space-y-4">{data.buckets.map(bucket => {
          const mode = modePresentation(bucket.mode);
          return <article key={`${bucket.mode}-${bucket.currencyCode}`} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">Encaissements {bucket.currencyCode}</p><p className="mt-1 text-sm text-slate-600">{bucket.paidOrderCount} commande{bucket.paidOrderCount > 1 ? "s" : ""} réglée{bucket.paidOrderCount > 1 ? "s" : ""} par Stripe Connect.</p></div><Badge variant="outline" className={mode.className}>{mode.label}</Badge></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Montant encaissé</p><p className="mt-1 text-xl font-bold text-slate-950">{money(bucket.paidGrossCents, bucket.currencyCode)}</p></div><div className="rounded-lg border border-violet-100 bg-violet-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Commission MAZIGHO</p><p className="mt-1 text-xl font-bold text-violet-950">{money(bucket.platformFeeCents, bucket.currencyCode)}</p></div><div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Estimation boutique</p><p className="mt-1 text-xl font-bold text-emerald-950">{money(bucket.merchantNetEstimateCents, bucket.currencyCode)}</p></div></div>
            {bucket.refundedOrderCount > 0 ? <p className="mt-3 text-xs leading-5 text-amber-800">{bucket.refundedOrderCount} commande{bucket.refundedOrderCount > 1 ? "s" : ""} marquée{bucket.refundedOrderCount > 1 ? "s" : "e"} comme remboursée{bucket.refundedOrderCount > 1 ? "s" : ""} : {money(bucket.refundedGrossCents, bucket.currencyCode)}. Ce montant reste séparé des encaissements confirmés.</p> : null}
          </article>;
        })}</div>}
      </CardContent>
    </Card>

    {data?.recentSales.length ? <Card className="border-slate-200">
      <CardHeader><CardTitle className="flex items-center gap-2 text-slate-950"><CreditCard className="h-5 w-5 text-teal-700" /> Derniers paiements confirmés</CardTitle><CardDescription>Références de commandes et montants seulement — jamais de carte, compte bancaire, identité client ou adresse.</CardDescription></CardHeader>
      <CardContent><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[780px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Commande</th><th className="px-4 py-3 font-semibold">Environnement</th><th className="px-4 py-3 font-semibold">Paiement</th><th className="px-4 py-3 font-semibold">Commission</th><th className="px-4 py-3 font-semibold">Traitement</th><th className="px-4 py-3 font-semibold">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recentSales.map(sale => { const mode = modePresentation(sale.mode); return <tr key={`${sale.mode}-${sale.id}`} className="bg-white"><td className="px-4 py-3 font-semibold text-slate-950">#{sale.id}</td><td className="px-4 py-3"><Badge variant="outline" className={mode.className}>{mode.label}</Badge></td><td className="px-4 py-3"><p className="font-medium text-slate-900">{money(sale.totalAmount, sale.currencyCode)}</p><p className="mt-1 text-xs text-slate-500">{sale.paymentStatus === "paid" ? "Confirmé" : "Remboursé"}</p></td><td className="px-4 py-3"><p className="font-medium text-slate-900">{money(sale.platformFeeAmount, sale.currencyCode)}</p><p className="mt-1 text-xs text-slate-500">{(sale.commissionRateBps / 100).toLocaleString("fr-CH", { maximumFractionDigits: 2 })} %</p></td><td className="px-4 py-3 text-slate-600">{sale.status === "processing" ? "En préparation" : sale.status === "shipped" ? "Expédiée" : sale.status === "delivered" ? "Livrée" : sale.status}</td><td className="px-4 py-3 text-slate-600">{new Date(sale.createdAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}</td></tr>; })}</tbody></table></div></CardContent>
    </Card> : null}

    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /><p><strong className="text-slate-800">Lecture comptable uniquement.</strong> L’estimation boutique correspond au montant client moins la commission MAZIGHO enregistrée à la commande. Les frais Stripe, taxes, versements, remboursements, litiges et écritures comptables définitives restent à vérifier dans Stripe et auprès d’un professionnel compétent. Cette vue n’exécute aucune action financière.</p></div>
  </section>;
}
