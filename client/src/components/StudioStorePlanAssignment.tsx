import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Layers3, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saasPlanFeatureCatalog } from "@shared/saasPlanCatalog";
import type { StoreSaasPlanAssignment } from "@shared/storeSaasPlanAssignment";
import { toast } from "sonner";

type StorePlanTarget = { id: number; displayName: string; planAssignment: StoreSaasPlanAssignment | null };

export default function StudioStorePlanAssignment({ store, onChanged }: { store: StorePlanTarget; onChanged: () => Promise<void> | void }) {
  const catalogQuery = trpc.admin.studio.getSaasPlanCatalog.useQuery(undefined, { refetchOnWindowFocus: false });
  const [planId, setPlanId] = useState("");
  const [confirmationName, setConfirmationName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [clearConfirmationName, setClearConfirmationName] = useState("");
  const [clearAcknowledged, setClearAcknowledged] = useState(false);

  useEffect(() => {
    setPlanId(store.planAssignment?.planId ?? "");
    setConfirmationName("");
    setAcknowledged(false);
    setClearConfirmationName("");
    setClearAcknowledged(false);
  }, [store.id, store.planAssignment?.planId]);

  const selectedTemplate = useMemo(() => catalogQuery.data?.plans.find(plan => plan.id === planId) ?? null, [catalogQuery.data?.plans, planId]);
  const assign = trpc.admin.studio.assignStoreSaasPlanTemplate.useMutation({
    onSuccess: async () => { toast.success("Plan attribué comme brouillon descriptif. Aucune fonctionnalité n’a été bloquée ou activée."); await onChanged(); },
    onError: error => toast.error(error.message || "Le plan n’a pas pu être attribué."),
  });
  const clear = trpc.admin.studio.clearStoreSaasPlanAssignment.useMutation({
    onSuccess: async () => { toast.success("Attribution de plan retirée. Aucun accès ni abonnement n’a changé."); await onChanged(); },
    onError: error => toast.error(error.message || "L’attribution n’a pas pu être retirée."),
  });
  const canAssign = Boolean(selectedTemplate && confirmationName.trim() === store.displayName.trim() && acknowledged);
  const canClear = Boolean(store.planAssignment && clearConfirmationName.trim() === store.displayName.trim() && clearAcknowledged);

  return <Card className="border-sky-200"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-sky-700" /> Offre SaaS attribuée</CardTitle><CardDescription className="mt-2 max-w-3xl">Associez explicitement un modèle du catalogue à cette boutique. L’attribution est un repère réversible et une copie des fonctionnalités proposées : elle n’applique pas encore de feature flag, ne bloque aucun module et ne crée ni abonnement ni paiement.</CardDescription></div><Badge variant="outline" className="w-fit border-sky-200 bg-sky-50 text-sky-900">Brouillon non appliqué</Badge></div></CardHeader><CardContent className="space-y-4">{catalogQuery.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-slate-100" /> : <><div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4"><p className="text-xs font-bold uppercase tracking-wide text-sky-800">Attribution actuelle</p>{store.planAssignment ? <><div className="mt-2 flex flex-wrap items-center gap-2"><p className="text-lg font-bold text-slate-950">{store.planAssignment.planName}</p><Badge variant="outline" className="border-sky-200 bg-white text-sky-900">{store.planAssignment.features.length} fonctionnalité(s) proposées</Badge></div><p className="mt-2 text-xs leading-5 text-slate-600">Attribuée le {new Date(store.planAssignment.assignedAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}. Cette copie reste stable même si le catalogue est modifié ensuite.</p></> : <p className="mt-2 text-sm leading-6 text-slate-700">Aucune offre n’est encore attribuée à cette boutique.</p>}</div>
    <div className="space-y-2"><Label htmlFor={`store-plan-template-${store.id}`}>Modèle à attribuer</Label><Select value={planId} onValueChange={setPlanId}><SelectTrigger id={`store-plan-template-${store.id}`} className="min-h-11 bg-white"><SelectValue placeholder="Choisir une offre du catalogue" /></SelectTrigger><SelectContent>{catalogQuery.data?.plans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name} · {plan.features.length} fonctionnalité(s)</SelectItem>)}</SelectContent></Select></div>
    {selectedTemplate && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-950">{selectedTemplate.name}</p><p className="mt-1 text-xs leading-5 text-slate-600">{selectedTemplate.description}</p><div className="mt-3 flex flex-wrap gap-2">{selectedTemplate.features.map(featureId => <Badge key={featureId} variant="outline" className="border-slate-200 bg-white text-slate-700">{saasPlanFeatureCatalog.find(feature => feature.id === featureId)?.title || featureId}</Badge>)}</div></div>}
    <div className="space-y-2"><Label htmlFor={`store-plan-confirmation-${store.id}`}>Recopiez le nom de la boutique</Label><Input id={`store-plan-confirmation-${store.id}`} value={confirmationName} onChange={event => setConfirmationName(event.target.value)} placeholder={store.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><Checkbox checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} className="mt-1" /><span>Je confirme une attribution descriptive pour <strong>{store.displayName}</strong>. Je comprends qu’elle est réversible et qu’elle ne modifie aucun accès, paiement, facture, e-mail ou statut de boutique.</span></label><Button type="button" className="min-h-11 w-full bg-sky-700 hover:bg-sky-800" disabled={!canAssign || assign.isPending} onClick={() => assign.mutate({ storeId: store.id, confirmationName, planId, acknowledged: true })}>{assign.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Attribution…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Attribuer comme brouillon</>}</Button>
    {store.planAssignment && <div className="border-t border-slate-200 pt-5"><p className="font-semibold text-slate-950">Retirer l’attribution</p><p className="mt-1 text-xs leading-5 text-slate-600">Cela efface uniquement le repère de plan. Les fonctionnalités déjà disponibles restent inchangées.</p><div className="mt-3 space-y-2"><Label htmlFor={`store-plan-clear-${store.id}`}>Recopiez le nom de la boutique</Label><Input id={`store-plan-clear-${store.id}`} value={clearConfirmationName} onChange={event => setClearConfirmationName(event.target.value)} placeholder={store.displayName} /></div><label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm leading-6 text-rose-950"><Checkbox checked={clearAcknowledged} onCheckedChange={value => setClearAcknowledged(value === true)} className="mt-1" /><span>Je confirme retirer seulement l’attribution descriptive. Aucun client, droit, paiement, abonnement ou document n’est affecté.</span></label><Button type="button" variant="outline" className="mt-3 min-h-11 w-full border-rose-200 bg-white text-rose-800 hover:bg-rose-50" disabled={!canClear || clear.isPending} onClick={() => clear.mutate({ storeId: store.id, confirmationName: clearConfirmationName, acknowledged: true })}>{clear.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Retrait…</> : <><Trash2 className="mr-2 h-4 w-4" />Retirer l’attribution</>}</Button></div>}
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Les fonctionnalités listées sont actuellement des <strong>promesses de plan</strong>. Leur application réelle devra être construite module par module avec tests d’isolation, puis validée séparément.</p></div></>}</CardContent></Card>;
}
