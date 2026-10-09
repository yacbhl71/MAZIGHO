import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, SlidersHorizontal, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSaasPlanEntitlements, MEBIBYTE } from "@shared/saasEntitlements";
import type { StoreSaasPlanAssignment } from "@shared/storeSaasPlanAssignment";
import { STORE_QUOTA_OVERRIDE_MAX_MEDIA_BYTES, STORE_QUOTA_OVERRIDE_MAX_MONTHLY_AI_REQUESTS, STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS, type StoreQuotaOverride } from "@shared/storeQuotaOverride";
import { toast } from "sonner";

type StoreQuotaTarget = {
  id: number;
  displayName: string;
  planAssignment: StoreSaasPlanAssignment | null;
  quotaOverride?: StoreQuotaOverride | null;
};

function positiveInteger(value: string, maximum: number) {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : null;
}

const MAX_MEDIA_MIB = STORE_QUOTA_OVERRIDE_MAX_MEDIA_BYTES / MEBIBYTE;

export default function StudioStoreQuotaOverride({ store, onChanged }: { store: StoreQuotaTarget; onChanged: () => Promise<void> | void }) {
  const defaultEntitlements = useMemo(() => getSaasPlanEntitlements(store.planAssignment?.planId), [store.planAssignment?.planId]);
  const [productsUnlimited, setProductsUnlimited] = useState(defaultEntitlements.maxActiveProducts === null);
  const [productLimit, setProductLimit] = useState(String(defaultEntitlements.maxActiveProducts ?? 50));
  const [teamUnlimited, setTeamUnlimited] = useState(defaultEntitlements.maxTeamMembers === null);
  const [teamLimit, setTeamLimit] = useState(String(defaultEntitlements.maxTeamMembers ?? 8));
  const [mediaMib, setMediaMib] = useState(String(Math.round(defaultEntitlements.mediaQuotaBytes / MEBIBYTE)));
  const [aiLimit, setAiLimit] = useState(String(defaultEntitlements.monthlyAiRequests));
  const [documentLimit, setDocumentLimit] = useState(String(defaultEntitlements.maxWorkspaceDocuments));
  const [templateLimit, setTemplateLimit] = useState(String(defaultEntitlements.maxWorkspaceTemplates));
  const [confirmationName, setConfirmationName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [clearConfirmationName, setClearConfirmationName] = useState("");
  const [clearAcknowledged, setClearAcknowledged] = useState(false);

  useEffect(() => {
    const current = store.quotaOverride ?? getSaasPlanEntitlements(store.planAssignment?.planId);
    setProductsUnlimited(current.maxActiveProducts === null);
    setProductLimit(String(current.maxActiveProducts ?? 50));
    setTeamUnlimited(current.maxTeamMembers === null);
    setTeamLimit(String(current.maxTeamMembers ?? 8));
    setMediaMib(String(Math.round(current.mediaQuotaBytes / MEBIBYTE)));
    setAiLimit(String(current.monthlyAiRequests));
    setDocumentLimit(String(current.maxWorkspaceDocuments));
    setTemplateLimit(String(current.maxWorkspaceTemplates));
    setConfirmationName("");
    setAcknowledged(false);
    setClearConfirmationName("");
    setClearAcknowledged(false);
  }, [store.id, store.planAssignment?.planId, store.quotaOverride?.updatedAt]);

  const products = productsUnlimited ? null : positiveInteger(productLimit, 1_000_000);
  const team = teamUnlimited ? null : positiveInteger(teamLimit, 1_000);
  const media = positiveInteger(mediaMib, MAX_MEDIA_MIB);
  const ai = positiveInteger(aiLimit, STORE_QUOTA_OVERRIDE_MAX_MONTHLY_AI_REQUESTS);
  const documents = positiveInteger(documentLimit, STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS);
  const templates = positiveInteger(templateLimit, STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS);
  const valuesValid = products !== null || productsUnlimited;
  const canSave = Boolean(valuesValid && (team !== null || teamUnlimited) && media && ai && documents && templates && confirmationName.trim() === store.displayName.trim() && acknowledged);
  const canClear = Boolean(store.quotaOverride && clearConfirmationName.trim() === store.displayName.trim() && clearAcknowledged);
  const validationMessages = [
    !valuesValid && `Produits : saisissez un nombre de 1 à 1 000 000 ou cochez « Sans plafond ».`,
    team === null && !teamUnlimited && `Accès délégués : saisissez un nombre de 1 à 1 000 ou cochez « Sans plafond ».`,
    !media && `Médias : saisissez une valeur de 1 à ${MAX_MEDIA_MIB.toLocaleString("fr-CH")} Mio.`,
    !ai && `IA : saisissez une valeur de 1 à ${STORE_QUOTA_OVERRIDE_MAX_MONTHLY_AI_REQUESTS.toLocaleString("fr-CH")} par mois.`,
    !documents && `Documents Workspace : saisissez une valeur de 1 à ${STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS.toLocaleString("fr-CH")}.`,
    !templates && `Modèles Workspace : saisissez une valeur de 1 à ${STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS.toLocaleString("fr-CH")}.`,
    confirmationName.trim() !== store.displayName.trim() && `Recopiez exactement « ${store.displayName} ».`,
    !acknowledged && `Cochez la confirmation avant d’enregistrer.`,
  ].filter((message): message is string => Boolean(message));
  const save = trpc.admin.studio.setStoreQuotaOverride.useMutation({
    onSuccess: async () => { toast.success("Capacités exceptionnelles enregistrées pour cette boutique. Aucun paiement, plan public ou e-mail n’a été modifié."); setConfirmationName(""); setAcknowledged(false); await onChanged(); },
    onError: error => toast.error(error.message || "Les capacités n’ont pas pu être enregistrées."),
  });
  const clear = trpc.admin.studio.clearStoreQuotaOverride.useMutation({
    onSuccess: async () => { toast.success("Dérogation de capacités retirée. Les prochains contrôles suivent à nouveau le plan officiel."); setClearConfirmationName(""); setClearAcknowledged(false); await onChanged(); },
    onError: error => toast.error(error.message || "La dérogation n’a pas pu être retirée."),
  });

  return <Card className={store.quotaOverride ? "border-emerald-200" : "border-indigo-200"}>
    <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-indigo-700" /> Capacités exceptionnelles</CardTitle><CardDescription className="mt-2 max-w-3xl">Accordez à une boutique offerte, pilote ou négociée les capacités que vous choisissez, sans modifier la grille publique FREE / BASIC / PRO / LIFETIME. Tous les contrôles serveur de produits, équipe, médias, IA et Workspace suivront ces valeurs.</CardDescription></div><Badge variant="outline" className={store.quotaOverride ? "w-fit border-emerald-200 bg-emerald-50 text-emerald-800" : "w-fit border-indigo-200 bg-indigo-50 text-indigo-800"}>{store.quotaOverride ? "Dérogation active" : "Option Studio"}</Badge></div></CardHeader>
    <CardContent className="space-y-4">{store.quotaOverride ? <>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>Capacités exceptionnelles actives.</strong> Elles prévalent sur le plan pour cette boutique uniquement. La commission, les factures, les paiements et la visibilité publique restent inchangés.</div>
      <div className="space-y-2"><Label htmlFor={`quota-clear-${store.id}`}>Recopiez le nom de la boutique</Label><Input id={`quota-clear-${store.id}`} value={clearConfirmationName} onChange={event => setClearConfirmationName(event.target.value)} placeholder={store.displayName} /></div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-white p-3 text-sm leading-6 text-emerald-950"><Checkbox checked={clearAcknowledged} onCheckedChange={value => setClearAcknowledged(value === true)} className="mt-1" /><span>Je confirme retirer cette dérogation pour <strong>{store.displayName}</strong>. Les données déjà créées sont conservées ; seuls les prochains contrôles reviennent aux capacités du plan officiel.</span></label>
      <Button type="button" variant="outline" className="min-h-11 w-full border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100" disabled={!canClear || clear.isPending} onClick={() => clear.mutate({ storeId: store.id, confirmationName: clearConfirmationName, acknowledged: true })}>{clear.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Retrait…</> : <><Trash2 className="mr-2 h-4 w-4" />Revenir aux capacités du plan</>}</Button>
    </> : <>
      <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3"><div className="flex items-center justify-between gap-3"><Label htmlFor={`quota-products-${store.id}`}>Produits actifs</Label><label className="flex items-center gap-2 text-xs font-medium text-slate-700"><Checkbox checked={productsUnlimited} onCheckedChange={value => setProductsUnlimited(value === true)} />Sans plafond</label></div>{!productsUnlimited && <Input id={`quota-products-${store.id}`} inputMode="numeric" value={productLimit} onChange={event => setProductLimit(event.target.value)} aria-label="Nombre maximum de produits actifs" />}</div><div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3"><div className="flex items-center justify-between gap-3"><Label htmlFor={`quota-team-${store.id}`}>Accès délégués</Label><label className="flex items-center gap-2 text-xs font-medium text-slate-700"><Checkbox checked={teamUnlimited} onCheckedChange={value => setTeamUnlimited(value === true)} />Sans plafond</label></div>{!teamUnlimited && <Input id={`quota-team-${store.id}`} inputMode="numeric" value={teamLimit} onChange={event => setTeamLimit(event.target.value)} aria-label="Nombre maximum d’accès délégués" />}</div></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="space-y-2"><Label htmlFor={`quota-media-${store.id}`}>Médias (Mio)</Label><Input id={`quota-media-${store.id}`} inputMode="numeric" min={1} max={MAX_MEDIA_MIB} value={mediaMib} onChange={event => setMediaMib(event.target.value)} aria-invalid={!media} aria-describedby={`quota-media-help-${store.id}`} className={!media ? "border-rose-400 focus-visible:ring-rose-400" : undefined} /><p id={`quota-media-help-${store.id}`} className={!media ? "text-xs font-medium text-rose-700" : "text-xs text-slate-500"}>1 à {MAX_MEDIA_MIB.toLocaleString("fr-CH")} Mio (maximum 100 Gio)</p></div><div className="space-y-2"><Label htmlFor={`quota-ai-${store.id}`}>IA / mois</Label><Input id={`quota-ai-${store.id}`} inputMode="numeric" min={1} max={STORE_QUOTA_OVERRIDE_MAX_MONTHLY_AI_REQUESTS} value={aiLimit} onChange={event => setAiLimit(event.target.value)} aria-invalid={!ai} aria-describedby={`quota-ai-help-${store.id}`} className={!ai ? "border-rose-400 focus-visible:ring-rose-400" : undefined} /><p id={`quota-ai-help-${store.id}`} className={!ai ? "text-xs font-medium text-rose-700" : "text-xs text-slate-500"}>1 à {STORE_QUOTA_OVERRIDE_MAX_MONTHLY_AI_REQUESTS.toLocaleString("fr-CH")} requêtes</p></div><div className="space-y-2"><Label htmlFor={`quota-documents-${store.id}`}>Documents Workspace</Label><Input id={`quota-documents-${store.id}`} inputMode="numeric" min={1} max={STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS} value={documentLimit} onChange={event => setDocumentLimit(event.target.value)} aria-invalid={!documents} aria-describedby={`quota-documents-help-${store.id}`} className={!documents ? "border-rose-400 focus-visible:ring-rose-400" : undefined} /><p id={`quota-documents-help-${store.id}`} className={!documents ? "text-xs font-medium text-rose-700" : "text-xs text-slate-500"}>1 à {STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS.toLocaleString("fr-CH")}</p></div><div className="space-y-2"><Label htmlFor={`quota-templates-${store.id}`}>Modèles Workspace</Label><Input id={`quota-templates-${store.id}`} inputMode="numeric" min={1} max={STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS} value={templateLimit} onChange={event => setTemplateLimit(event.target.value)} aria-invalid={!templates} aria-describedby={`quota-templates-help-${store.id}`} className={!templates ? "border-rose-400 focus-visible:ring-rose-400" : undefined} /><p id={`quota-templates-help-${store.id}`} className={!templates ? "text-xs font-medium text-rose-700" : "text-xs text-slate-500"}>1 à {STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS.toLocaleString("fr-CH")}</p></div></div>
      <div className="space-y-2"><Label htmlFor={`quota-confirm-${store.id}`}>Recopiez le nom de la boutique</Label><Input id={`quota-confirm-${store.id}`} value={confirmationName} onChange={event => setConfirmationName(event.target.value)} placeholder={store.displayName} /></div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm leading-6 text-indigo-950"><Checkbox checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} className="mt-1" /><span>Je confirme des capacités exceptionnelles pour <strong>{store.displayName}</strong>. Le plan public, les commissions, les commandes, les abonnements, les factures, les e-mails et la publication ne changent pas.</span></label>
      {validationMessages.length > 0 && <div id={`quota-validation-${store.id}`} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-950"><p className="font-semibold">Le bouton reste désactivé jusqu’à correction des valeurs ci-dessus.</p><ul className="mt-1 list-disc space-y-1 pl-5">{validationMessages.map(message => <li key={message}>{message}</li>)}</ul></div>}
      <Button type="button" className="min-h-11 w-full bg-indigo-700 hover:bg-indigo-800" disabled={!canSave || save.isPending} aria-describedby={validationMessages.length ? `quota-validation-${store.id}` : undefined} onClick={() => { if (media && ai && documents && templates && (products !== null || productsUnlimited) && (team !== null || teamUnlimited)) save.mutate({ storeId: store.id, confirmationName, quotas: { maxActiveProducts: productsUnlimited ? null : products!, maxTeamMembers: teamUnlimited ? null : team!, mediaQuotaBytes: media * MEBIBYTE, monthlyAiRequests: ai, maxWorkspaceDocuments: documents, maxWorkspaceTemplates: templates }, acknowledged: true }); }}>{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Accorder ces capacités</>}</Button>
    </>}</CardContent>
  </Card>;
}
