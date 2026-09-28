import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, CircleAlert, CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import OwnerAlgeriaWilayaDelivery from "@/components/owner/OwnerAlgeriaWilayaDelivery";
import { toast } from "sonner";

type OwnerModuleTarget = "operations" | "legal" | "markets" | "orders" | "integrations";

type OwnerAlgeriaPaymentsProps = {
  canManage: boolean;
  onNavigate: (module: OwnerModuleTarget) => void;
};

const requirementPresentation = {
  marché: { label: "Marché Algérie", module: "markets" as const, detail: "Algérie doit être un marché visible de la boutique." },
  livraison: { label: "Livraison vers l’Algérie", module: "operations" as const, detail: "L’Algérie doit être une destination servie avec délai et retours affichés." },
  grille_wilayas: { label: "Grille par wilaya", module: "integrations" as const, detail: "Activez au moins une wilaya avec un tarif et un délai vérifiés." },
  devise_dzd: { label: "Devise dinar (DZD)", module: "integrations" as const, detail: "Les prix et tarifs Algérie doivent être exprimés en dinar avec un taux manuel contrôlé." },
  informations_légales: { label: "Informations légales et fiscales", module: "legal" as const, detail: "Les informations d’exploitant, retours et la mention fiscale DZ doivent être prêtes au checkout." },
};

/** Owner-only configuration surface. It never stores local-provider credentials. */
export default function OwnerAlgeriaPayments({ canManage, onNavigate }: OwnerAlgeriaPaymentsProps) {
  const utils = trpc.useUtils();
  const [dzdRate, setDzdRate] = useState("");
  const readiness = trpc.owner.getAlgeriaCashOnDeliveryReadiness.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const save = trpc.owner.saveAlgeriaCashOnDeliverySettings.useMutation({
    onSuccess: async (data) => {
      await Promise.all([
        readiness.refetch(),
        utils.storefront.getPaymentAvailability.invalidate(),
      ]);
      toast.success(data.enabled ? "Paiement à la livraison Algérie activé pour cette boutique." : "Paiement à la livraison Algérie désactivé.");
    },
    onError: error => toast.error(error.message || "Le réglage de paiement à la livraison n’a pas pu être enregistré."),
  });
  const onlinePreparation = trpc.owner.getAlgeriaOnlinePaymentPreparation.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const currency = trpc.owner.getStoreCurrency.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  useEffect(() => {
    if (currency.data) setDzdRate((currency.data.rateBps / 10_000).toFixed(4).replace(".", ","));
  }, [currency.data]);
  const saveDzdCurrency = trpc.owner.saveStoreCurrency.useMutation({
    onSuccess: async () => {
      await Promise.all([currency.refetch(), readiness.refetch(), utils.content.getStoreCurrency.invalidate()]);
      toast.success("Devise DZD et taux manuel enregistrés pour cette boutique.");
    },
    onError: error => toast.error(error.message || "La devise DZD n’a pas pu être enregistrée."),
  });
  const saveOnlinePreparation = trpc.owner.saveAlgeriaOnlinePaymentPreparation.useMutation({
    onSuccess: async () => {
      await onlinePreparation.refetch();
      toast.success("Étape de préparation du paiement en ligne enregistrée.");
    },
    onError: error => toast.error(error.message || "La préparation du paiement en ligne n’a pas pu être enregistrée."),
  });
  const data = readiness.data;
  const requirements = data?.eligibility;
  const online = onlinePreparation.data;
  const updateOnlineStep = (key: "merchantEligibilityConfirmed" | "acquirerContractConfirmed" | "testAccessReceived" | "certificationCompleted") => {
    if (!online) return;
    saveOnlinePreparation.mutate({
      merchantEligibilityConfirmed: key === "merchantEligibilityConfirmed" ? !online.merchantEligibilityConfirmed : online.merchantEligibilityConfirmed,
      acquirerContractConfirmed: key === "acquirerContractConfirmed" ? !online.acquirerContractConfirmed : online.acquirerContractConfirmed,
      testAccessReceived: key === "testAccessReceived" ? !online.testAccessReceived : online.testAccessReceived,
      certificationCompleted: key === "certificationCompleted" ? !online.certificationCompleted : online.certificationCompleted,
    });
  };

  return <div className="space-y-5">
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-950"><Banknote className="h-5 w-5 text-emerald-700" /> Vendre en Algérie</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">Activez d’abord le paiement à la livraison pour les commandes livrées en Algérie. Le client règle le montant au moment de la remise ; la boutique confirme ensuite l’encaissement manuellement, après livraison.</CardDescription>
          </div>
          <Badge variant="outline" className={data?.enabled ? "w-fit border-emerald-300 bg-white text-emerald-800" : "w-fit border-amber-300 bg-white text-amber-900"}>{data?.enabled ? "Paiement à la livraison actif" : "À configurer"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {readiness.isLoading ? <div className="h-32 animate-pulse rounded-xl bg-white/80" /> : readiness.isError || !data ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Le contrôle Algérie est momentanément indisponible. Aucun mode de paiement n’a été modifié.</div> : <>
          <div className={requirements?.eligible ? "rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm leading-6 text-emerald-950" : "rounded-xl border border-amber-200 bg-white/80 p-4 text-sm leading-6 text-amber-950"}>
            <p className="font-semibold">{requirements?.eligible ? "Boutique prête à proposer le paiement à la livraison" : "Éléments à compléter avant l’activation"}</p>
            <p className="mt-1">{requirements?.eligible ? "Le marché, la livraison et les informations publiques nécessaires sont configurés pour la destination Algérie." : "Cette protection évite de proposer un encaissement à la livraison sans zone réellement servie ni informations de vente visibles."}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {(Object.entries(requirementPresentation) as Array<[keyof typeof requirementPresentation, typeof requirementPresentation[keyof typeof requirementPresentation]]>).map(([key, item]) => {
              const ready = key === "marché" ? requirements?.marketEnabled : key === "livraison" ? requirements?.deliveryEnabled : key === "grille_wilayas" ? requirements?.wilayaDeliveryConfigured : key === "devise_dzd" ? requirements?.dzdCurrencyConfigured : requirements?.legalReady;
              return <div key={key} className={`rounded-xl border p-4 ${ready ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"}`}>
                <div className="flex items-start gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${ready ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"}`}>{ready ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}</span><p className="font-semibold text-slate-950">{item.label}</p></div>
                <p className="mt-3 text-xs leading-5 text-slate-600">{item.detail}</p>
                {!ready && <Button type="button" size="sm" variant="outline" className="mt-4 min-h-10 border-amber-300 bg-white text-amber-950 hover:bg-amber-100" onClick={() => onNavigate(item.module)}>Configurer</Button>}
              </div>;
            })}
          </div>

          <div className={requirements?.dzdCurrencyConfigured ? "rounded-xl border border-emerald-200 bg-emerald-50/60 p-4" : "rounded-xl border border-amber-200 bg-amber-50/70 p-4"}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-semibold text-slate-950">Prix et livraison en dinar algérien</p><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-700">Le taux est saisi et vérifié par le propriétaire : MAZIGHO ne récupère aucun cours automatiquement. Il sert à convertir le catalogue de référence en DZD ; il n’altère jamais les anciennes commandes.</p></div><Badge variant="outline" className={requirements?.dzdCurrencyConfigured ? "w-fit border-emerald-300 bg-white text-emerald-800" : "w-fit border-amber-300 bg-white text-amber-900"}>{currency.data?.code === "DZD" ? "DZD actif" : "DZD requis"}</Badge></div>
            {canManage ? <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="max-w-xs flex-1 space-y-1.5"><label htmlFor="algeria-dzd-rate" className="text-xs font-semibold text-slate-700">Taux manuel pour 1 CHF</label><Input id="algeria-dzd-rate" inputMode="decimal" value={dzdRate} onChange={event => setDzdRate(event.target.value.replace(/[^0-9,.]/g, ""))} placeholder="Ex. 140,0000" className="min-h-11 bg-white" /></div><Button type="button" className="min-h-11 bg-emerald-700 hover:bg-emerald-800" disabled={saveDzdCurrency.isPending || !Number.isFinite(Number(dzdRate.replace(",", "."))) || Number(dzdRate.replace(",", ".")) <= 0} onClick={() => saveDzdCurrency.mutate({ code: "DZD", rateBps: Math.round(Number(dzdRate.replace(",", ".")) * 10_000) })}>{saveDzdCurrency.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : "Enregistrer DZD"}</Button></div> : null}
          </div>

          {canManage ? <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-950">Disponibilité pour les clients</p><p className="mt-1 text-xs leading-5 text-slate-600">{data.enabled ? "Les clients dont la destination est l’Algérie peuvent passer une commande à régler à la livraison. L’état reste non réglé jusqu’à la confirmation manuelle de la collecte." : "Aucune commande à la livraison ne peut encore être créée."}</p></div><Button type="button" className={data.enabled ? "min-h-11 border-rose-300 bg-white text-rose-800 hover:bg-rose-50" : "min-h-11 bg-emerald-700 hover:bg-emerald-800"} variant={data.enabled ? "outline" : "default"} disabled={save.isPending || (!data.enabled && !requirements?.eligible)} onClick={() => save.mutate({ enabled: !data.enabled })}>{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : data.enabled ? "Désactiver" : "Activer le paiement à la livraison"}</Button></div> : <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Seul le propriétaire peut ouvrir ou fermer le paiement à la livraison pour cette boutique. L’équipe peut voir les prérequis sans les modifier.</p></div>}
        </>}
      </CardContent>
    </Card>

    <OwnerAlgeriaWilayaDelivery canManage={canManage} />

    <Card className="border-sky-200 bg-sky-50/50">
      <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-slate-950"><CreditCard className="h-5 w-5 text-sky-700" /> Paiement en ligne CIB / Edahabia</CardTitle><CardDescription className="mt-1 max-w-3xl">Préparation séparée, prévue pour le moment où la boutique dispose des autorisations et spécifications officielles nécessaires.</CardDescription></div><Badge variant="outline" className={online?.status.readyForProviderActivation ? "w-fit border-emerald-300 bg-white text-emerald-800" : "w-fit border-sky-300 bg-white text-sky-900"}>{online ? `${online.status.completed}/${online.status.total} étapes` : "Vérification…"}</Badge></div></CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-slate-700"><div className="rounded-xl border border-sky-200 bg-white p-4"><p className="font-semibold text-slate-950">Le parcours reste dans votre boutique</p><p className="mt-1">Le propriétaire prépare son dossier marchand, reçoit le kit de test de sa banque/SATIM, réalise les essais demandés puis active le moyen autorisé. MAZIGHO ne demandera jamais de carte, code OTP, clé ou certificat dans ce panneau.</p></div>{onlinePreparation.isLoading ? <div className="h-44 animate-pulse rounded-xl bg-white" /> : onlinePreparation.isError || !online ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Le parcours de paiement en ligne est momentanément indisponible. Aucun moyen de paiement n’est activé.</div> : <><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><OnlinePreparationStep title="Légal DZ" detail="Mentions vendeur, livraison, retours et fiscalité de la boutique sont prêtes." ready={online.legalReady} action={null} /><OnlinePreparationStep title="Éligibilité marchand" detail="Le vendeur a vérifié qu’il peut contracter localement pour ce moyen." ready={online.merchantEligibilityConfirmed} action={canManage ? () => updateOnlineStep("merchantEligibilityConfirmed") : null} pending={saveOnlinePreparation.isPending} /><OnlinePreparationStep title="Contrat acquéreur" detail="La convention ou l’instruction officielle de la banque/SATIM est obtenue." ready={online.acquirerContractConfirmed} action={canManage ? () => updateOnlineStep("acquirerContractConfirmed") : null} pending={saveOnlinePreparation.isPending} /><OnlinePreparationStep title="Accès de test" detail="Le kit de test officiel et sa documentation ont été reçus hors de MAZIGHO." ready={online.testAccessReceived} action={canManage ? () => updateOnlineStep("testAccessReceived") : null} pending={saveOnlinePreparation.isPending} /><OnlinePreparationStep title="Certification" detail="Les essais et la validation demandés par le prestataire sont terminés." ready={online.certificationCompleted} action={canManage ? () => updateOnlineStep("certificationCompleted") : null} pending={saveOnlinePreparation.isPending} /></div><div className={online.status.readyForProviderActivation ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950" : "rounded-xl border border-sky-200 bg-white p-4 text-sm leading-6 text-sky-950"}><p className="font-semibold">{online.status.readyForProviderActivation ? "Dossier de préparation complété" : "Passerelle locale non encore connectée"}</p><p className="mt-1">{online.status.readyForProviderActivation ? "La boutique peut désormais fournir à MAZIGHO Studio les spécifications techniques officielles du prestataire retenu pour intégrer, tester et homologuer le connecteur. Cette checklist n’active pas le paiement en ligne et aucun bouton client n’apparaît avant l’intégration certifiée." : "Complétez les étapes factuelles au fur et à mesure. Aucun pays Stripe fictif, aucune clé et aucun accès de paiement en ligne ne sont stockés ou affichés ici."}</p></div></>}<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-600">La future activation se fera dans la boutique après intégration technique, tests et certification du prestataire retenu. L’encaissement à la livraison peut rester actif indépendamment.</p><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11 border-sky-300 bg-white text-sky-950 hover:bg-sky-100" onClick={() => onNavigate("integrations")}>Voir les intégrations</Button><Button asChild type="button" variant="outline" className="min-h-11 border-sky-300 bg-white text-sky-950 hover:bg-sky-100"><a href="https://www.cibweb.dz/" target="_blank" rel="noreferrer">Portail CIBWeb <ExternalLink className="ml-2 h-4 w-4" /></a></Button></div></div></CardContent>
    </Card>
  </div>;
}

function OnlinePreparationStep({ title, detail, ready, action, pending = false }: { title: string; detail: string; ready: boolean; action: (() => void) | null; pending?: boolean }) {
  return <div className={`flex flex-col rounded-xl border p-4 ${ready ? "border-emerald-200 bg-emerald-50/70" : "border-sky-100 bg-white"}`}><div className="flex items-start gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${ready ? "bg-emerald-600 text-white" : "bg-sky-100 text-sky-800"}`}>{ready ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}</span><p className="font-semibold text-slate-950">{title}</p></div><p className="mt-3 flex-1 text-xs leading-5 text-slate-600">{detail}</p>{action && <Button type="button" size="sm" variant="outline" className={ready ? "mt-4 min-h-10 border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100" : "mt-4 min-h-10 border-sky-300 bg-white text-sky-950 hover:bg-sky-100"} disabled={pending} onClick={action}>{pending ? "Enregistrement…" : ready ? "Retirer l’étape" : "Marquer comme prêt"}</Button>}</div>;
}
