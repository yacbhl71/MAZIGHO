import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AccountReference = {
  service: "cj" | "aliexpress" | "bigbuy" | "printful";
  name: string;
  email: string;
  note: string;
};

const serviceStyles: Record<AccountReference["service"], { badge: string; field: string }> = {
  cj: { badge: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100", field: "border-emerald-100 bg-emerald-50/40" },
  aliexpress: { badge: "bg-orange-100 text-orange-800 hover:bg-orange-100", field: "border-orange-100 bg-orange-50/40" },
  bigbuy: { badge: "bg-sky-100 text-sky-800 hover:bg-sky-100", field: "border-sky-100 bg-sky-50/40" },
  printful: { badge: "bg-rose-100 text-rose-800 hover:bg-rose-100", field: "border-rose-100 bg-rose-50/40" },
};

export default function SupplierAccountRegistry({ focusService, compact = false }: { focusService?: AccountReference["service"]; compact?: boolean }) {
  const utils = trpc.useUtils();
  const referencesQuery = trpc.admin.supplierAccounts.get.useQuery();
  const [references, setReferences] = useState<AccountReference[]>([]);

  useEffect(() => {
    if (referencesQuery.data) setReferences(referencesQuery.data);
  }, [referencesQuery.data]);

  const visibleReferences = useMemo(
    () => focusService ? references.filter(reference => reference.service === focusService) : references,
    [focusService, references]
  );

  const saveReferences = trpc.admin.supplierAccounts.update.useMutation({
    onSuccess: async (saved) => {
      setReferences(saved);
      await utils.admin.supplierAccounts.get.invalidate();
      toast.success("Références de comptes fournisseurs enregistrées.");
    },
    onError: error => toast.error(`Impossible d’enregistrer les références : ${error.message}`),
  });

  const updateReference = (service: AccountReference["service"], field: "email" | "note", value: string) => {
    setReferences(current => current.map(reference => reference.service === service ? { ...reference, [field]: value } : reference));
  };

  const isReady = references.length === 4;
  const isDirty = isReady && JSON.stringify(references) !== JSON.stringify(referencesQuery.data || []);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className={compact ? "pb-3" : "border-b bg-slate-50/60"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><UserRound className="h-4 w-4 text-slate-600" /> Comptes de référence</div>
            <CardTitle className="mt-2 text-xl text-slate-950">{focusService ? "Compte Printful de référence" : "Retrouver vos comptes fournisseurs"}</CardTitle>
            <CardDescription className="mt-1 max-w-3xl">Visible uniquement dans l’administration. Notez ici l’adresse e-mail associée à chaque service pour éviter les confusions entre comptes.</CardDescription>
          </div>
          {!compact && <Badge className="w-fit bg-slate-900 text-white hover:bg-slate-900"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Privé administrateur</Badge>}
        </div>
      </CardHeader>
      <CardContent className={compact ? "pt-1" : "pt-5"}>
        <div className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-2"}>
          {referencesQuery.isLoading && !isReady ? <p className="text-sm text-slate-500">Chargement des références…</p> : visibleReferences.map(reference => {
            const style = serviceStyles[reference.service];
            return (
              <article key={reference.service} className={`border p-4 ${style.field}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">{reference.name}</h3>
                  <Badge className={style.badge}><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Compte de référence</Badge>
                </div>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor={`supplier-email-${reference.service}`}>Adresse e-mail utilisée</label>
                <div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id={`supplier-email-${reference.service}`} type="email" className="bg-white pl-9" value={reference.email} onChange={event => updateReference(reference.service, "email", event.target.value)} placeholder="À renseigner dans le panel" /></div>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor={`supplier-note-${reference.service}`}>Statut ou mémo</label>
                <Input id={`supplier-note-${reference.service}`} className="mt-2 bg-white" value={reference.note} onChange={event => updateReference(reference.service, "note", event.target.value)} placeholder="Ex. compte gratuit créé" maxLength={250} />
              </article>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xs leading-5 text-slate-600"><strong>À ne jamais inscrire ici :</strong> mot de passe, code de récupération, clé API, jeton OAuth, numéro de carte ou autre secret. Ces données restent uniquement dans les services concernés ou dans les variables sécurisées Vercel.</p>
          <Button onClick={() => saveReferences.mutate(references)} disabled={!isReady || !isDirty || saveReferences.isPending} className="shrink-0 bg-slate-900 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" />{saveReferences.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
