import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saasPlanFeatureCatalog, type SaasPlanCatalog, type SaasPlanCatalogItem, type SaasPlanFeatureId } from "@shared/saasPlanCatalog";
import { toast } from "sonner";

const immutablePlanIds = new Set(["free", "basic", "premium"]);
const currencyValues = ["CHF", "EUR", "USD", "GBP"] as const;

function priceToCents(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(100_000_000, Math.round(parsed * 100)) : 0;
}

function cloneCatalog(catalog: SaasPlanCatalog): SaasPlanCatalog {
  return { plans: catalog.plans.map(plan => ({ ...plan, features: [...plan.features] })) };
}

export default function StudioSaasPlanCatalog() {
  const catalogQuery = trpc.admin.studio.getSaasPlanCatalog.useQuery(undefined, { refetchOnWindowFocus: false });
  const [catalog, setCatalog] = useState<SaasPlanCatalog | null>(null);

  useEffect(() => {
    if (catalogQuery.data) setCatalog(cloneCatalog(catalogQuery.data));
  }, [catalogQuery.data]);

  const save = trpc.admin.studio.saveSaasPlanCatalog.useMutation({
    onSuccess: async () => {
      await catalogQuery.refetch();
      toast.success("Catalogue de plans enregistré comme brouillon interne.");
    },
    onError: error => toast.error(error.message || "Le catalogue n’a pas pu être enregistré."),
  });

  const updatePlan = (id: string, update: Partial<SaasPlanCatalogItem>) => {
    setCatalog(current => current ? { plans: current.plans.map(plan => plan.id === id ? { ...plan, ...update } : plan) } : current);
  };

  const toggleFeature = (plan: SaasPlanCatalogItem, featureId: SaasPlanFeatureId) => {
    updatePlan(plan.id, { features: plan.features.includes(featureId) ? plan.features.filter(id => id !== featureId) : [...plan.features, featureId] });
  };

  const addPlan = () => {
    setCatalog(current => {
      if (!current || current.plans.length >= 12) return current;
      const id = `plan-${Date.now().toString(36)}`;
      return { plans: [...current.plans, { id, name: "Nouvelle offre", description: "Offre interne à préparer.", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF", features: [], status: "draft" }] };
    });
  };

  const removePlan = (id: string) => setCatalog(current => current ? { plans: current.plans.filter(plan => plan.id !== id) } : current);

  return <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50">
    <CardHeader>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-violet-700" /> Catalogue d’offres et fonctionnalités</CardTitle><CardDescription className="mt-2 max-w-4xl">Préparez les repères commerciaux Free, Basic, Premium et vos offres internes. Les cases sont un catalogue de promesses : elles ne modifient pas encore les droits d’une boutique, n’activent aucun abonnement et ne bloquent aucun client.</CardDescription></div><Badge variant="outline" className="w-fit border-violet-200 bg-white text-violet-900">Brouillons non appliqués</Badge></div>
    </CardHeader>
    <CardContent className="space-y-4">
      {catalogQuery.isLoading || !catalog ? <div className="h-72 animate-pulse rounded-2xl bg-white/80" /> : <>
        <div className="grid gap-4 xl:grid-cols-3">{catalog.plans.map(plan => <section key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-violet-700">{immutablePlanIds.has(plan.id) ? "Offre de départ" : "Offre personnalisée"}</p><div className="mt-2 space-y-2"><Label className="sr-only" htmlFor={`plan-name-${plan.id}`}>Nom de l’offre</Label><Input id={`plan-name-${plan.id}`} value={plan.name} onChange={event => updatePlan(plan.id, { name: event.target.value.slice(0, 60) })} className="min-h-11 text-base font-semibold" /></div></div>{!immutablePlanIds.has(plan.id) && <Button type="button" size="icon" variant="outline" className="min-h-10 min-w-10 border-rose-200 text-rose-800 hover:bg-rose-50" aria-label={`Supprimer ${plan.name}`} onClick={() => removePlan(plan.id)}><Trash2 className="h-4 w-4" /></Button>}</div>
          <div className="mt-3 space-y-2"><Label htmlFor={`plan-description-${plan.id}`}>Positionnement</Label><Textarea id={`plan-description-${plan.id}`} value={plan.description} onChange={event => updatePlan(plan.id, { description: event.target.value.slice(0, 220) })} className="min-h-20 resize-y bg-slate-50" /></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_110px]"><div className="space-y-2"><Label htmlFor={`plan-monthly-${plan.id}`}>Mensuel</Label><Input id={`plan-monthly-${plan.id}`} inputMode="decimal" value={(plan.monthlyAmountCents / 100).toFixed(2)} onChange={event => updatePlan(plan.id, { monthlyAmountCents: priceToCents(event.target.value) })} /></div><div className="space-y-2"><Label htmlFor={`plan-yearly-${plan.id}`}>Annuel</Label><Input id={`plan-yearly-${plan.id}`} inputMode="decimal" value={(plan.yearlyAmountCents / 100).toFixed(2)} onChange={event => updatePlan(plan.id, { yearlyAmountCents: priceToCents(event.target.value) })} /></div><div className="space-y-2"><Label htmlFor={`plan-currency-${plan.id}`}>Devise</Label><Select value={plan.currency} onValueChange={value => updatePlan(plan.id, { currency: value as SaasPlanCatalogItem["currency"] })}><SelectTrigger id={`plan-currency-${plan.id}`} className="min-h-10"><SelectValue /></SelectTrigger><SelectContent>{currencyValues.map(currency => <SelectItem value={currency} key={currency}>{currency}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="mt-4 border-t border-slate-100 pt-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">Fonctionnalités proposées</p><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{plan.features.length}/{saasPlanFeatureCatalog.length}</Badge></div><div className="mt-3 space-y-2">{saasPlanFeatureCatalog.map(feature => <label key={feature.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm leading-5 text-slate-700"><Checkbox checked={plan.features.includes(feature.id)} onCheckedChange={() => toggleFeature(plan, feature.id)} className="mt-0.5" /><span><span className="block font-medium text-slate-900">{feature.title}</span><span className="mt-0.5 block text-xs text-slate-600">{feature.description}</span></span></label>)}</div></div>
        </section>)}</div>
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold text-slate-950">{catalog.plans.length}/12 offres préparées</p><p className="mt-1 text-xs leading-5 text-slate-600">Les prix et fonctionnalités restent internes, modifiables et non affectés à un tenant jusqu’à la construction d’un mécanisme de droits dédié.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11" disabled={catalog.plans.length >= 12} onClick={addPlan}><Plus className="mr-2 h-4 w-4" /> Ajouter une offre</Button><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={save.isPending} onClick={() => save.mutate({ catalog })}>{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><Save className="mr-2 h-4 w-4" />Enregistrer le catalogue</>}</Button></div></div>
      </>}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p><strong>Frontière maintenue :</strong> ces modèles ne changent aucun accès actuel. Une prochaine brique devra concevoir, tester et faire confirmer séparément l’assignation d’un plan à une boutique et l’éventuelle application de droits. Aucun paiement, prélèvement, facture légale, e-mail ou automatisation n’est généré ici.</p></div>
    </CardContent>
  </Card>;
}
