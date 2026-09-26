import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, CreditCard, Loader2, Mail, PlugZap, ShieldCheck } from "lucide-react";
import { storeIntegrationCatalog, type StoreIntegrationId } from "@shared/storeIntegrationRequests";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const categoryPresentation = {
  payment: { label: "Paiement", icon: CreditCard, className: "border-amber-200 bg-amber-50 text-amber-900" },
  analytics: { label: "Mesure", icon: BarChart3, className: "border-sky-200 bg-sky-50 text-sky-900" },
  email: { label: "E-mails", icon: Mail, className: "border-violet-200 bg-violet-50 text-violet-900" },
} as const;

export default function OwnerIntegrationCenter({ canManage }: { canManage: boolean }) {
  const integrations = trpc.owner.getIntegrationRequests.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [selected, setSelected] = useState<StoreIntegrationId[]>([]);

  useEffect(() => {
    if (!integrations.data) return;
    setSelected(integrations.data.requests.map(request => request.id));
  }, [integrations.data]);

  const save = trpc.owner.saveIntegrationRequests.useMutation({
    onSuccess: async () => {
      await integrations.refetch();
      toast.success("Demandes d’intégration enregistrées pour MAZIGHO Studio.");
    },
    onError: error => toast.error(error.message),
  });

  const toggle = (id: StoreIntegrationId) => {
    setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  };

  return <div className="space-y-5">
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><PlugZap className="h-5 w-5 text-violet-700" /> Centre d’intégrations</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">Indiquez les outils que vous souhaitez étudier avec MAZIGHO Studio. Cette étape crée uniquement une demande interne propre à votre boutique : aucune clé, connexion, paiement, cookie, pixel, campagne ou e-mail n’est activé.</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit border-slate-200 bg-white text-slate-700">Préparation contrôlée</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {integrations.isLoading ? <div className="h-52 animate-pulse rounded-xl bg-white/70" /> : integrations.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Le centre d’intégrations est temporairement indisponible. Aucune demande ni connexion n’a été modifiée.</div> : <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{storeIntegrationCatalog.map(integration => {
            const category = categoryPresentation[integration.category];
            const Icon = category.icon;
            const requested = selected.includes(integration.id);
            return <button key={integration.id} type="button" disabled={!canManage} onClick={() => toggle(integration.id)} aria-pressed={requested} className={`min-h-52 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-600 disabled:cursor-not-allowed disabled:opacity-65 ${requested ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200" : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"}`}>
              <div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100"><Icon className="h-5 w-5 text-slate-700" /></div><Badge variant="outline" className={category.className}>{category.label}</Badge></div>
              <p className="mt-4 font-semibold text-slate-950">{integration.title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{integration.description}</p>
              <div className={`mt-4 flex items-center gap-2 text-xs font-semibold ${requested ? "text-violet-800" : "text-slate-500"}`}>{requested ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current" />}{requested ? "Demande à examiner" : "Pas de demande"}</div>
            </button>;
          })}</div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-xs leading-5 text-slate-700"><p className="font-semibold text-slate-900">Ce qui se passe ensuite</p><p className="mt-1">MAZIGHO Studio voit seulement les outils demandés. Une connexion réelle demandera plus tard un module dédié : choix du fournisseur, consentement, responsabilités, secret conservé côté serveur, tests et confirmation explicite du propriétaire.</p></div>
          {canManage ? <div className="flex flex-col gap-3 border-t border-violet-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-600">{selected.length ? `${selected.length} demande${selected.length > 1 ? "s" : ""} prête${selected.length > 1 ? "s" : ""} à être examinée${selected.length > 1 ? "s" : ""}.` : "Aucune demande sélectionnée."}</p><Button type="button" className="min-h-11 bg-violet-700 hover:bg-violet-800" disabled={save.isPending} onClick={() => save.mutate({ integrationIds: selected })}>{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : "Enregistrer mes demandes"}</Button></div> : <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" /><p>Seul le propriétaire de la boutique peut demander l’étude d’une intégration. Les membres de l’équipe peuvent consulter cette liste, sans la modifier.</p></div>}
        </div>}
      </CardContent>
    </Card>
    <Card className="border-dashed border-slate-300"><CardContent className="p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Frontières conservées</p><p className="mt-2">N’ajoutez jamais de clé API, mot de passe, compte Stripe, compte PayPal ou identifiant publicitaire dans un champ produit, une page ou un message. Le stockage de secrets, les paiements réels, le tracking et les automatisations commerciales restent hors de cette première brique.</p></CardContent></Card>
  </div>;
}
