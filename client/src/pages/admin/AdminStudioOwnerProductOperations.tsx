import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Boxes, CircleAlert, LockKeyhole, PackageCheck, Save, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useLocation, useRoute } from "wouter";

type StockState = "to_confirm" | "in_stock" | "limited" | "out_of_stock";
type Product = { id: string; name: string };
type ProductOperation = { productId: string; stockState: StockState; stockQuantity: number; supplierName: string; supplierReference: string };

const stockLabels: Record<StockState, { label: string; description: string; badge: string }> = {
  to_confirm: { label: "À confirmer", description: "Aucune disponibilité n’est encore validée.", badge: "border-slate-200 bg-slate-100 text-slate-700" },
  in_stock: { label: "Disponible", description: "Disponibilité de préparation indiquée par l’opérateur.", badge: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  limited: { label: "Stock limité", description: "Quantité de préparation basse ou à surveiller.", badge: "border-amber-200 bg-amber-50 text-amber-900" },
  out_of_stock: { label: "Indisponible", description: "Ne pas présenter comme disponible dans un futur test de panier.", badge: "border-rose-200 bg-rose-50 text-rose-900" },
};

function cloneOperations(operations: ProductOperation[]) {
  return operations.map(operation => ({ ...operation }));
}

export default function AdminStudioOwnerProductOperations() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/studio/stock-fournisseurs/:storeId");
  const storeId = Number(params?.storeId);
  const validStoreId = Number.isInteger(storeId) && storeId > 0;
  const utils = trpc.useUtils();
  const query = trpc.admin.studio.getOwnerProductOperationDrafts.useQuery({ storeId: validStoreId ? storeId : 0 }, { enabled: validStoreId, retry: false });
  const [operations, setOperations] = useState<ProductOperation[]>([]);
  const [initialOperations, setInitialOperations] = useState<ProductOperation[]>([]);

  useEffect(() => {
    if (!query.data) return;
    const next = cloneOperations(query.data.operations);
    setOperations(next);
    setInitialOperations(next);
  }, [query.data]);

  const productById = useMemo(() => new Map((query.data?.products ?? []).map((product: Product) => [product.id, product])), [query.data?.products]);
  const changed = JSON.stringify(operations) !== JSON.stringify(initialOperations);
  const update = (productId: string, patch: Partial<ProductOperation>) => setOperations(current => current.map(operation => operation.productId === productId ? { ...operation, ...patch } : operation));

  const saveMutation = trpc.admin.studio.saveOwnerProductOperationDrafts.useMutation({
    onSuccess: async () => {
      toast.success("Préparation de stock et fournisseur enregistrée.");
      await Promise.all([
        utils.admin.studio.getOwnerProductOperationDrafts.invalidate({ storeId }),
        utils.admin.studio.getOwnerProductDrafts.invalidate({ storeId }),
        utils.admin.studio.getGiftStorePreparationChecklist.invalidate({ storeId }),
        utils.admin.studio.getGiftStoreLaunchCenter.invalidate({ storeId }),
      ]);
    },
    onError: error => toast.error(error.message || "La préparation opérationnelle n’a pas pu être enregistrée."),
  });

  if (!validStoreId) return <DashboardLayout><main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8"><Unavailable /></main></DashboardLayout>;

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Atelier privé Studio</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">Stock et fournisseur de préparation</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Préparer stock et fournisseur</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Indiquez une disponibilité de travail et une référence fournisseur interne pour chaque fiche préparée. Ces données restent privées : elles ne créent ni stock réel, ni fournisseur actif, ni commande, ni synchronisation externe.</p></div><Button type="button" variant="outline" onClick={() => setLocation(`/admin/studio/produits/${storeId}`)} className="w-fit border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Fiches produits</Button></header>

    {query.isLoading ? <div className="h-[620px] animate-pulse rounded-3xl bg-slate-100" /> : query.isError || !query.data ? <Unavailable /> : <>
      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-sm leading-6 text-violet-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{query.data.store.displayName} · toujours en état `setup`</p><p className="mt-1">Cet atelier sert à préparer des informations opérationnelles avant un futur test privé. Aucun lien de fournisseur, prix d’achat, contact, identifiant d’accès ou achat ne peut être enregistré ici.</p></div></div></section>

      {!operations.length ? <Card className="border-amber-200 bg-amber-50"><CardContent className="p-6 text-sm leading-6 text-amber-950"><p className="font-bold">Préparez d’abord une fiche produit.</p><p className="mt-1">Le stock et les références fournisseur se rattachent uniquement aux fiches privées déjà enregistrées. Revenez à l’atelier Fiches produits, créez une sélection, puis revenez ici.</p></CardContent></Card> : <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_390px]">
        <Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardDescription>Préparation opérationnelle</CardDescription><CardTitle className="mt-1 text-xl">Disponibilité et repères internes</CardTitle></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">{operations.length} fiche{operations.length > 1 ? "s" : ""}</Badge></div></CardHeader><CardContent className="space-y-4 p-4 sm:p-6">
          {operations.map((operation, index) => <article key={operation.productId} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-slate-950">{productById.get(operation.productId)?.name || `Fiche ${index + 1}`}</p><p className="mt-1 text-xs text-slate-500">Préparation interne · aucune interaction avec un fournisseur</p></div><Badge variant="outline" className={stockLabels[operation.stockState].badge}>{stockLabels[operation.stockState].label}</Badge></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label htmlFor={`stock-state-${operation.productId}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">État de disponibilité</Label><select id={`stock-state-${operation.productId}`} value={operation.stockState} onChange={event => update(operation.productId, { stockState: event.target.value as StockState, stockQuantity: event.target.value === "in_stock" || event.target.value === "limited" ? operation.stockQuantity : 0 })} className="mt-2 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400"><option value="to_confirm">À confirmer</option><option value="in_stock">Disponible</option><option value="limited">Stock limité</option><option value="out_of_stock">Indisponible</option></select><p className="mt-1 text-xs leading-5 text-slate-500">{stockLabels[operation.stockState].description}</p></div><div><Label htmlFor={`stock-quantity-${operation.productId}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Quantité de préparation</Label><Input id={`stock-quantity-${operation.productId}`} type="number" min={0} max={999999} inputMode="numeric" disabled={operation.stockState !== "in_stock" && operation.stockState !== "limited"} value={operation.stockQuantity} onChange={event => update(operation.productId, { stockQuantity: Math.max(0, Math.min(999999, Number.parseInt(event.target.value || "0", 10) || 0)) })} className="mt-2 border-slate-300 disabled:bg-slate-100" /><p className="mt-1 text-xs leading-5 text-slate-500">Indication manuelle, jamais synchronisée.</p></div></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label htmlFor={`supplier-name-${operation.productId}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Fournisseur de référence</Label><Input id={`supplier-name-${operation.productId}`} value={operation.supplierName} maxLength={96} placeholder="Ex. Fournisseur à vérifier" onChange={event => update(operation.productId, { supplierName: event.target.value })} className="mt-2 border-slate-300" /><p className="mt-1 text-xs leading-5 text-slate-500">Nom de travail seulement ; aucun contact ni accès externe.</p></div><div><Label htmlFor={`supplier-reference-${operation.productId}`} className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Référence fournisseur</Label><Input id={`supplier-reference-${operation.productId}`} value={operation.supplierReference} maxLength={128} placeholder="Ex. réf. à confirmer" onChange={event => update(operation.productId, { supplierReference: event.target.value })} className="mt-2 border-slate-300" /><p className="mt-1 text-xs leading-5 text-slate-500">Code ou repère interne ; sans URL, prix d’achat ni SKU public.</p></div></div>
          </article>)}
          <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="button" onClick={() => saveMutation.mutate({ storeId, operations })} disabled={!changed || saveMutation.isPending} className="min-h-11 bg-slate-950 px-5 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Enregistrement…" : "Enregistrer la préparation"}</Button></div>
        </CardContent></Card>

        <aside className="space-y-5"><Card className="border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex items-center justify-between"><div><CardDescription>Lecture privée</CardDescription><CardTitle className="mt-1 text-xl">État de la sélection</CardTitle></div><Boxes className="h-5 w-5 text-slate-500" /></div></CardHeader><CardContent className="space-y-3 p-5">{operations.map(operation => <div key={`summary-${operation.productId}`} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-950">{productById.get(operation.productId)?.name || "Fiche préparée"}</p><Badge variant="outline" className={stockLabels[operation.stockState].badge}>{stockLabels[operation.stockState].label}</Badge></div><p className="mt-2 text-sm text-slate-600">{operation.supplierName ? `Référence : ${operation.supplierName}` : "Fournisseur à renseigner"}{operation.supplierReference ? ` · ${operation.supplierReference}` : ""}</p>{(operation.stockState === "in_stock" || operation.stockState === "limited") && <p className="mt-1 text-xs font-semibold text-slate-700">Quantité de préparation : {operation.stockQuantity}</p>}</div>)}</CardContent></Card><Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950"><p className="flex items-center gap-2 font-bold"><Truck className="h-4 w-4" /> Limite volontaire</p><p className="mt-2">Cet écran n’achète rien, ne contacte aucun fournisseur et ne synchronise aucune donnée. Vous pouvez ensuite vérifier les fiches, prix et disponibilités dans une simulation de panier privée.</p><Button type="button" variant="outline" className="mt-4 min-h-11 border-amber-300 bg-white text-amber-950 hover:bg-amber-100" onClick={() => setLocation(`/admin/studio/panier-simulation/${storeId}`)}><ShoppingBag className="mr-2 h-4 w-4" /> Tester le panier privé</Button></CardContent></Card></aside>
      </section>}
    </>}
  </main></DashboardLayout>;
}

function Unavailable() {
  return <Card className="border-rose-200 bg-rose-50"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Atelier stock et fournisseur indisponible.</p><p className="mt-1">Cette page est réservée aux boutiques offertes encore en préparation, depuis MAZIGHO Studio.</p></div></CardContent></Card>;
}
