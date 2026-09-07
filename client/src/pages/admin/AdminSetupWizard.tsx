import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, KeyRound, Landmark, LockKeyhole, Rocket, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";

export default function AdminSetupWizard() {
  const [, setLocation] = useLocation();
  const statusQuery = trpc.admin.setup.getStatus.useQuery();
  const settingsQuery = trpc.admin.settings.getAll.useQuery();
  const completeSetup = trpc.admin.setup.completeNonSensitive.useMutation({
    onSuccess: async () => {
      toast.success("Identité de boutique enregistrée. L’assistant est marqué comme terminé.");
      await Promise.all([statusQuery.refetch(), settingsQuery.refetch()]);
    },
    onError: error => toast.error(error.message || "Configuration impossible."),
  });
  const [siteName, setSiteName] = useState("MAZIGHO");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (!settingsQuery.data) return;
    const values = new Map(settingsQuery.data.map(setting => [setting.key, setting.value]));
    setSiteName(values.get("site_name") || "MAZIGHO");
    setContactEmail(values.get("contact_email") || "");
  }, [settingsQuery.data]);

  const status = statusQuery.data;
  const markComplete = () => completeSetup.mutate({ siteName, contactEmail });
  const checklist = status?.checklist;

  return <DashboardLayout><div className="mx-auto max-w-5xl space-y-7">
    <section className="overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-teal-50 p-6 md:p-9">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-700"><Rocket className="h-4 w-4" /> Démarrage sécurisé</div><h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Préparer cette instance de boutique</h1><p className="mt-3 leading-7 text-slate-600">Finalisez l’identité de votre boutique et vérifiez les éléments essentiels avant ouverture. Les clés Stripe, Odoo et la base de données ne sont volontairement jamais saisies ni affichées ici.</p></div><Badge className={status?.completed ? "w-fit bg-emerald-600" : "w-fit bg-amber-500"}>{status?.completed ? "Configuration enregistrée" : "À finaliser"}</Badge></div>
    </section>

    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"><Card className="border-orange-100 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-orange-600" /> Identité de boutique</CardTitle><CardDescription>Ces informations sont modifiables plus tard depuis les réglages et la personnalisation.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><label htmlFor="setup-store-name" className="text-sm font-medium">Nom de la boutique</label><Input id="setup-store-name" value={siteName} maxLength={100} onChange={event => setSiteName(event.target.value)} /></div><div className="space-y-2"><label htmlFor="setup-contact-email" className="text-sm font-medium">E-mail de support</label><Input id="setup-contact-email" value={contactEmail} type="email" maxLength={320} placeholder="support@votre-boutique.com" onChange={event => setContactEmail(event.target.value)} /></div><Button className="bg-orange-500 hover:bg-orange-600" disabled={completeSetup.isPending || !siteName.trim() || !contactEmail.trim()} onClick={markComplete}>{completeSetup.isPending ? "Enregistrement…" : "Enregistrer l’identité et terminer"}<CheckCircle2 className="ml-2 h-4 w-4" /></Button></CardContent></Card>
      <Card className="border-teal-100 bg-teal-50/40 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-teal-950"><ShieldCheck className="h-5 w-5 text-teal-700" /> Frontière de sécurité</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-teal-950"><p>Les informations d’entreprise sont conservées dans les réglages. Les identifiants techniques restent dans le coffre de secrets de l’hébergement.</p><div className="rounded-lg border border-teal-200 bg-white/80 p-3"><strong>Jamais dans l’assistant :</strong><br />clés Stripe, mots de passe TiDB, jetons Odoo ou session fournisseur.</div></CardContent></Card></div>

    <Card className="shadow-sm"><CardHeader><CardTitle>Checklist du propriétaire</CardTitle><CardDescription>Chaque étape est indépendante : vous gardez le contrôle de votre instance et de ses accès.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{[
      { icon: Store, label: "Identité de boutique", detail: checklist?.storefrontIdentity ? "Nom et e-mail de support renseignés" : "Renseignez le nom et l’e-mail ci-dessus", ready: checklist?.storefrontIdentity, action: () => document.getElementById("setup-store-name")?.focus() },
      { icon: Landmark, label: "Informations légales", detail: checklist?.legalProfile ? "Profil légal renseigné" : "À compléter avant mise en vente", ready: checklist?.legalProfile, action: () => setLocation("/admin/legal") },
      { icon: KeyRound, label: "Mot de passe administrateur", detail: "Géré depuis les paramètres de votre compte", ready: checklist?.adminAccount, action: () => setLocation("/parametres") },
      { icon: LockKeyhole, label: "Services techniques", detail: "À configurer dans le coffre de secrets de l’hébergement", ready: false, action: () => setLocation("/admin/sante") },
    ].map(item => { const Icon = item.icon; return <button key={item.label} type="button" onClick={item.action} className="flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition-colors hover:border-orange-300 hover:bg-orange-50/30"><div className={`rounded-lg p-2 ${item.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p></div>{item.ready ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}</button>; })}</CardContent></Card>
  </div></DashboardLayout>;
}
