import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { storefrontCountryChoices } from "@shared/storeMarketSettings";

type SimulationOffer = {
  productId: number;
  variantId?: number;
  name: string;
  description: string;
  variantLabel: string | null;
  featured: boolean;
  unitAmountCents: number;
  stock: number;
  status: "available" | "limited" | "unavailable";
  maxQuantity: number;
  message: string;
};

type SimulationLine = {
  productId: number;
  variantId?: number;
  name: string;
  variantLabel: string | null;
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

const statusLabels = { available: "Disponible", limited: "Stock limité", unavailable: "Indisponible" };

function lineKey(productId: number, variantId?: number) {
  return `${productId}:${variantId ?? "base"}`;
}

export default function OwnerPrivateCartSimulation({ onNavigate }: { onNavigate: (module: "catalogue" | "operations") => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [countryCode, setCountryCode] = useState<string>("");
  const lines = useMemo(() => Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([key, quantity]) => {
      const [productId, variant] = key.split(":");
      return { productId: Number(productId), variantId: variant === "base" ? undefined : Number(variant), quantity };
    }), [quantities]);
  const simulation = trpc.owner.getPrivateCartSimulation.useQuery({ countryCode: countryCode || undefined, lines }, { retry: false, refetchOnWindowFocus: false });
  const catalog = (simulation.data?.catalog ?? []) as SimulationOffer[];
  const cartLines = (simulation.data?.lines ?? []) as SimulationLine[];
  const currencyCode = simulation.data?.currencyCode || "CHF";
  const delivery = simulation.data?.delivery;
  const totals = simulation.data?.totals;
  const taxDisclosure = simulation.data?.taxDisclosure;

  useEffect(() => {
    if (countryCode || !delivery?.servedCountries?.length) return;
    setCountryCode(delivery.servedCountries[0]);
  }, [countryCode, delivery?.servedCountries]);

  useEffect(() => {
    if (!catalog.length) return;
    setQuantities(current => Object.fromEntries(Object.entries(current).filter(([key]) => catalog.some(offer => lineKey(offer.productId, offer.variantId) === key))));
  }, [catalog.length]);

  const setQuantity = (offer: SimulationOffer, quantity: number) => {
    const key = lineKey(offer.productId, offer.variantId);
    const nextQuantity = Math.max(0, Math.min(offer.maxQuantity, Math.round(quantity) || 0));
    setQuantities(current => {
      if (nextQuantity === 0) {
        const { [key]: _removed, ...remaining } = current;
        return remaining;
      }
      return { ...current, [key]: nextQuantity };
    });
  };

  const formatMoney = (amountCents: number) => new Intl.NumberFormat("fr-CH", { style: "currency", currency: currencyCode, currencyDisplay: "code", minimumFractionDigits: 2 }).format(amountCents / 100);
  const servedCountries = delivery?.servedCountries ?? [];
  const selectableCountries = Array.from(new Set([...servedCountries, ...storefrontCountryChoices.map(country => country.code)]));

  return <div className="space-y-5">
    <Card className="border-teal-100"><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-teal-700" /> Simulation panier & checkout</CardTitle><CardDescription className="mt-1 max-w-3xl">Vérifiez les produits, variantes, stocks, frais et total de présentation de votre propre boutique. Cette simulation est privée, temporaire et isolée : elle ne crée aucun panier client, compte, paiement, commande, fournisseur ou expédition.</CardDescription></div><Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 px-3 py-1 text-teal-800"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Lecture privée</Badge></div></CardHeader></Card>

    {simulation.isLoading && !simulation.data ? <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" /> : simulation.isError || !simulation.data ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">La simulation est momentanément indisponible.</p><p className="mt-1">Actualisez la page avant de réessayer. Aucune donnée n’a été créée.</p></div></CardContent></Card> : <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <Card className="border-slate-200"><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Catalogue actif de votre boutique</CardDescription><CardTitle className="mt-1 text-xl">Composer le test</CardTitle></div><Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 text-slate-700">{catalog.length} sélection{catalog.length > 1 ? "s" : ""}</Badge></div></CardHeader><CardContent className="space-y-4 p-4 sm:p-6">{catalog.length === 0 ? <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-semibold">Aucune fiche active et vendable.</p><p className="mt-1">Ajoutez un produit actif, un prix valide et du stock avant de simuler le parcours.</p><Button type="button" className="mt-4 min-h-11 bg-teal-700 hover:bg-teal-800" onClick={() => onNavigate("catalogue")}>Ouvrir le catalogue</Button></div> : catalog.map(offer => { const key = lineKey(offer.productId, offer.variantId); const quantity = quantities[key] || 0; const addable = offer.maxQuantity > 0; return <article key={key} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-base font-bold text-slate-950">{offer.name}</p>{offer.featured && <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">À la une</Badge>}{offer.variantLabel && <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">{offer.variantLabel}</Badge>}</div>{offer.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{offer.description}</p>}</div><div className="shrink-0 text-left sm:text-right"><p className="text-lg font-bold text-slate-950">{formatMoney(offer.unitAmountCents)}</p><Badge variant="outline" className={`mt-2 ${statusStyles[offer.status]}`}>{statusLabels[offer.status]}</Badge></div></div><div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">{offer.message}</p>{addable ? <div className="flex min-h-11 items-center rounded-xl border border-slate-300 bg-slate-50"><Button type="button" variant="ghost" size="icon" disabled={quantity < 1} onClick={() => setQuantity(offer, quantity - 1)} aria-label={`Retirer une unité de ${offer.name}`}><Minus className="h-4 w-4" /></Button><span className="min-w-10 text-center text-sm font-bold text-slate-950">{quantity}</span><Button type="button" variant="ghost" size="icon" disabled={quantity >= offer.maxQuantity} onClick={() => setQuantity(offer, quantity + 1)} aria-label={`Ajouter une unité de ${offer.name}`}><Plus className="h-4 w-4" /></Button></div> : <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-900">À corriger dans le catalogue</Badge>}</div></article>; })}</CardContent></Card>

        <aside className="space-y-5"><Card className="border-slate-200"><CardHeader className="border-b border-slate-100"><CardDescription>Destination de simulation</CardDescription><CardTitle className="mt-1 text-xl">Panier simulé</CardTitle></CardHeader><CardContent className="space-y-4 p-5"><label className="block space-y-2"><span className="text-sm font-semibold text-slate-900">Pays de livraison</span><select value={countryCode} onChange={event => setCountryCode(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Choisir pour le test</option>{selectableCountries.map(code => <option key={code} value={code}>{storefrontCountryChoices.find(country => country.code === code)?.label || code}</option>)}</select></label>{countryCode && delivery && !delivery.countryServed && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-950"><AlertTriangle className="mr-1 inline h-4 w-4" /> Cette destination n’est pas desservie selon les règles enregistrées.</div>}{!cartLines.length ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Ajoutez une sélection disponible. Rien n’est enregistré.</div> : <>{cartLines.map(line => <div key={lineKey(line.productId, line.variantId)} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-950">{line.name}{line.variantLabel ? ` · ${line.variantLabel}` : ""}</p><p className="mt-1 text-xs leading-5 text-slate-500">{line.message}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setQuantities(current => { const key = lineKey(line.productId, line.variantId); const { [key]: _removed, ...remaining } = current; return remaining; })} aria-label={`Retirer ${line.name}`}><Trash2 className="h-4 w-4" /></Button></div><div className="mt-3 flex items-center justify-between text-sm"><Badge variant="outline" className={statusStyles[line.status]}>{line.acceptedQuantity} unité{line.acceptedQuantity > 1 ? "s" : ""}</Badge><span className="font-bold text-slate-950">{formatMoney(line.lineTotalCents)}</span></div></div>)}<div className="space-y-2 border-t border-slate-200 pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-600">Sous-total</span><span className="font-medium text-slate-950">{formatMoney(totals?.subtotalCents || 0)}</span></div><div className="flex justify-between"><span className="text-slate-600">Livraison</span><span className={(totals?.shippingCents || 0) > 0 ? "font-medium text-slate-950" : "font-medium text-emerald-700"}>{(totals?.shippingCents || 0) > 0 ? formatMoney(totals?.shippingCents || 0) : "Incluse / non applicable"}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total de présentation</span><span className="text-teal-700">{formatMoney(totals?.totalCents || 0)}</span></div></div></>}</CardContent></Card>
          <Card className="border-sky-200 bg-sky-50"><CardContent className="p-5 text-sm leading-6 text-sky-950"><p className="flex items-center gap-2 font-bold"><Truck className="h-4 w-4" /> Livraison simulée</p><p className="mt-2">{delivery?.deliveryLeadTime || "Délai à compléter dans Livraison & retours."}</p>{delivery?.returnsSummary && <p className="mt-2 border-t border-sky-200 pt-2"><strong>Retours :</strong> {delivery.returnsSummary}</p>}<Button type="button" variant="outline" className="mt-4 min-h-11 border-sky-300 bg-white text-sky-950 hover:bg-sky-100" onClick={() => onNavigate("operations")}>Vérifier la livraison</Button></CardContent></Card>
          <Card className={taxDisclosure?.configured ? "border-violet-200 bg-violet-50" : "border-amber-200 bg-amber-50"}><CardContent className={`p-5 text-sm leading-6 ${taxDisclosure?.configured ? "text-violet-950" : "text-amber-950"}`}><p className="font-bold">Fiscalité de présentation</p>{taxDisclosure?.configured ? <><p className="mt-2">{taxDisclosure.notice}</p><p className="mt-2 border-t border-current/15 pt-2 text-xs">Mention déclarée pour {taxDisclosure.countryCode || "la destination sélectionnée"}. Le total ci-dessus n’exécute aucun calcul ni encaissement fiscal.</p></> : <><p className="mt-2">Aucune mention fiscale validée pour cette destination.</p><p className="mt-2 text-xs">Complétez-la dans Informations légales avant toute décision d’encaissement réel. Cette simulation ne calcule, ne collecte, ne déclare ni ne reverse aucune taxe.</p></>}</CardContent></Card>
          <Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><CreditCard className="h-4 w-4" /> Limites conservées</p><p className="mt-2">Cette vérification ne crée aucun panier visiteur, client, checkout, session Stripe, paiement, commande, fournisseur, expédition ou remboursement.</p></CardContent></Card>
        </aside>
      </div>
      <Card className="border-emerald-200 bg-emerald-50"><CardContent className="flex flex-col gap-3 p-5 text-sm leading-6 text-emerald-950 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-bold"><PackageCheck className="h-5 w-5" /> Lecture de préparation uniquement</p><p className="mt-1">Utilisez ce test pour repérer un stock, une variante, un prix ou une règle de livraison incohérents avant toute décision ultérieure concernant l’encaissement réel.</p></div><Badge variant="outline" className="w-fit border-emerald-300 bg-white text-emerald-900">Aucune action commerciale</Badge></CardContent></Card>
    </>}
  </div>;
}
