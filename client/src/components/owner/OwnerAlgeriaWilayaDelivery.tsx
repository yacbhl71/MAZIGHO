import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, MapPinned, Save, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type DeliveryRate = {
  code: string;
  name: string;
  homeDeliveryDzd: number | null;
  relayDeliveryDzd: number | null;
  deliveryLeadTime: string;
  enabled: boolean;
};

type DeliverySettings = {
  source: "custom" | "letshop_public_2023_02_07";
  updatedAt: string | null;
  rates: DeliveryRate[];
};

type OwnerAlgeriaWilayaDeliveryProps = {
  canManage: boolean;
};

function displayDzd(value: number | null) {
  return value === null ? "—" : `${new Intl.NumberFormat("fr-DZ").format(value)} DA`;
}

function parseAmount(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 20_000 ? parsed : null;
}

/** Compact, tablet-friendly per-wilaya delivery administration. */
export default function OwnerAlgeriaWilayaDelivery({ canManage }: OwnerAlgeriaWilayaDeliveryProps) {
  const utils = trpc.useUtils();
  const query = trpc.owner.getAlgeriaWilayaDeliverySettings.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [draft, setDraft] = useState<DeliverySettings | null>(null);
  const [filter, setFilter] = useState("");
  useEffect(() => {
    if (query.data) setDraft(query.data as DeliverySettings);
  }, [query.data]);

  const save = trpc.owner.saveAlgeriaWilayaDeliverySettings.useMutation({
    onSuccess: async (data) => {
      setDraft(data as DeliverySettings);
      await Promise.all([query.refetch(), utils.owner.getAlgeriaCashOnDeliveryReadiness.invalidate()]);
      toast.success("Grille de livraison Algérie enregistrée.");
    },
    onError: error => toast.error(error.message || "La grille de livraison n’a pas pu être enregistrée."),
  });
  const installReference = trpc.owner.installAlgeriaWilayaDeliveryReference.useMutation({
    onSuccess: async (data) => {
      setDraft(data as DeliverySettings);
      await Promise.all([query.refetch(), utils.owner.getAlgeriaCashOnDeliveryReadiness.invalidate()]);
      toast.success("Référentiel public chargé comme brouillon éditable.");
    },
    onError: error => toast.error(error.message || "Le référentiel n’a pas pu être chargé."),
  });

  const rows = useMemo(() => (draft?.rates || []).filter(rate => `${rate.code} ${rate.name}`.toLocaleLowerCase("fr").includes(filter.trim().toLocaleLowerCase("fr"))), [draft?.rates, filter]);
  const activeCount = draft?.rates.filter(rate => rate.enabled).length || 0;
  const validActiveCount = draft?.rates.filter(rate => rate.enabled && (rate.homeDeliveryDzd !== null || rate.relayDeliveryDzd !== null) && rate.deliveryLeadTime.trim()).length || 0;
  const changed = JSON.stringify(draft) !== JSON.stringify(query.data);

  const updateRate = (code: string, patch: Partial<DeliveryRate>) => setDraft(current => current ? {
    ...current,
    source: "custom",
    rates: current.rates.map(rate => rate.code === code ? { ...rate, ...patch } : rate),
  } : current);

  return <Card className="border-emerald-200 bg-white">
    <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-slate-950"><MapPinned className="h-5 w-5 text-emerald-700" /> Livraison Algérie par wilaya</CardTitle>
          <CardDescription className="mt-2 max-w-3xl">Le client choisit une wilaya puis domicile ou point relais. Le tarif et le délai s’affichent avant sa confirmation ; le serveur recalcule toujours le montant de la commande.</CardDescription>
        </div>
        <Badge variant="outline" className={validActiveCount > 0 ? "w-fit border-emerald-300 bg-white text-emerald-800" : "w-fit border-amber-300 bg-white text-amber-900"}>{validActiveCount > 0 ? `${validActiveCount} wilaya${validActiveCount > 1 ? "s" : ""} prête${validActiveCount > 1 ? "s" : ""}` : "Aucune wilaya activée"}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-5 p-4 sm:p-6">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
        <p className="font-semibold">Une base de départ, jamais un tarif imposé</p>
        <p className="mt-1">Le bouton ci-dessous copie dans cette boutique le tableau public Letshop daté du 07/02/2023. Il est chargé <strong>désactivé</strong> : vérifiez vos propres zones, transporteur, tarifs et délais avant de cocher une wilaya.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold text-slate-950">Référentiel public 2023</p><p className="mt-1 text-xs leading-5 text-slate-600">58 tarifs historiques, plus les 11 nouvelles wilayas sans tarif présumé. Cette action remplace uniquement votre grille non enregistrée à l’écran.</p></div>
        {canManage ? <Button type="button" variant="outline" className="min-h-11 border-sky-300 bg-white text-sky-950 hover:bg-sky-100" disabled={installReference.isPending} onClick={() => {
          if (!draft || window.confirm("Charger la référence 2023 dans cette boutique ? Les tarifs actuellement affichés seront remplacés par un brouillon désactivé.")) installReference.mutate();
        }}>{installReference.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement…</> : "Charger la référence"}</Button> : null}
      </div>

      {query.isLoading || !draft ? <div className="h-72 animate-pulse rounded-xl bg-slate-100" /> : query.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">La grille est momentanément indisponible. Aucun tarif client n’a été modifié.</div> : <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={filter} onChange={event => setFilter(event.target.value)} className="min-h-11 bg-white pl-9" placeholder="Rechercher une wilaya…" /></div><p className="text-xs text-slate-600">{activeCount} activée{activeCount > 1 ? "s" : ""} · {validActiveCount} complète{validActiveCount > 1 ? "s" : ""}</p></div>
        <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
          {rows.map(rate => <article key={rate.code} className={`rounded-xl border p-4 ${rate.enabled ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-slate-300 bg-white text-slate-700">{rate.code}</Badge><p className="font-semibold text-slate-950">{rate.name}</p>{rate.enabled ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Active</Badge> : <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Masquée</Badge>}</div><p className="mt-2 text-xs leading-5 text-slate-600">Domicile {displayDzd(rate.homeDeliveryDzd)} · Relais {displayDzd(rate.relayDeliveryDzd)} · {rate.deliveryLeadTime || "Délai non renseigné"}</p></div>
              {canManage ? <div className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3"><span className="text-xs font-semibold text-slate-700">Proposer</span><Switch checked={rate.enabled} onCheckedChange={enabled => updateRate(rate.code, { enabled })} aria-label={`Proposer ${rate.name}`} /></div> : null}
            </div>
            {canManage && <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3"><AmountInput label="Domicile (DA)" value={rate.homeDeliveryDzd} onChange={value => updateRate(rate.code, { homeDeliveryDzd: value })} /><AmountInput label="Relais (DA)" value={rate.relayDeliveryDzd} onChange={value => updateRate(rate.code, { relayDeliveryDzd: value })} /><div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">Délai annoncé</label><Input value={rate.deliveryLeadTime} maxLength={120} onChange={event => updateRate(rate.code, { deliveryLeadTime: event.target.value })} placeholder="Ex. 1–3 jours" className="min-h-11 bg-white" /></div></div>}
          </article>)}
        </div>
        {rows.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm text-slate-600">Aucune wilaya ne correspond à cette recherche.</div>}
        {canManage ? <div className="sticky bottom-0 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><p className="flex gap-2 text-xs leading-5 text-emerald-950"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Une wilaya activée doit comporter au moins un mode et un délai. Le paiement à la livraison reste fermé tant qu’aucune zone complète n’est enregistrée.</p><Button type="button" className="min-h-11 bg-emerald-700 hover:bg-emerald-800" disabled={!changed || save.isPending || validActiveCount !== activeCount} onClick={() => draft && save.mutate(draft)}>{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><Save className="mr-2 h-4 w-4" />Enregistrer la grille</>}</Button></div> : <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>Seul le propriétaire peut changer les wilayas, tarifs et délais. L’équipe peut consulter la grille pour préparer les commandes.</p></div>}
      </>}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-500">Source de référence : <a className="font-semibold text-sky-800 underline underline-offset-2" href="https://www.letshop.dz/wilayas-et-tarifs-de-livraison/" target="_blank" rel="noreferrer">tableau Letshop public du 07/02/2023 <ExternalLink className="mb-0.5 inline h-3 w-3" /></a>. MAZIGHO ne garantit ni ces tarifs historiques, ni les tarifs d’un transporteur.</p>
    </CardContent>
  </Card>;
}

function AmountInput({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">{label}</label><Input type="number" inputMode="numeric" min="0" max="20000" value={value ?? ""} onChange={event => onChange(parseAmount(event.target.value))} placeholder="Indisponible" className="min-h-11 bg-white" /></div>;
}
