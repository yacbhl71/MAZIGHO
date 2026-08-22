import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CircleAlert, CircleCheck, CreditCard, Globe2, Loader2, Mail, Save, Settings2, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type SettingsForm = {
  site_name: string;
  contact_email: string;
  currency: string;
  free_shipping_threshold: string;
  flat_shipping_rate: string;
};

const defaultForm: SettingsForm = {
  site_name: "MAZIGHO",
  contact_email: "contact@mazigho.com",
  currency: "CHF",
  free_shipping_threshold: "10000",
  flat_shipping_rate: "500",
};

const settingKeys = Object.keys(defaultForm) as Array<keyof SettingsForm>;

function formatCents(value: string, currency: string) {
  const cents = Number(value);
  if (!Number.isFinite(cents)) return "—";
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function AdminSettings() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const settingsQuery = trpc.admin.settings.getAll.useQuery();
  const updateSetting = trpc.admin.settings.update.useMutation();

  useEffect(() => {
    if (!settingsQuery.data) return;
    const next = { ...defaultForm };
    for (const setting of settingsQuery.data) {
      if (setting.key in next) next[setting.key as keyof SettingsForm] = setting.value;
    }
    setForm(next);
  }, [settingsQuery.data]);

  const deliveryPreview = useMemo(() => ({
    threshold: formatCents(form.free_shipping_threshold, form.currency),
    rate: formatCents(form.flat_shipping_rate, form.currency),
  }), [form.currency, form.flat_shipping_rate, form.free_shipping_threshold]);

  const setField = (key: keyof SettingsForm, value: string) => setForm(current => ({ ...current, [key]: value }));

  const handleSave = async () => {
    if (!form.site_name.trim() || !form.contact_email.trim()) {
      toast.error("Le nom du site et l'e-mail de contact sont obligatoires");
      return;
    }
    const threshold = Number(form.free_shipping_threshold);
    const shippingRate = Number(form.flat_shipping_rate);
    if (!Number.isInteger(threshold) || threshold < 0 || !Number.isInteger(shippingRate) || shippingRate < 0) {
      toast.error("Les montants de livraison doivent être exprimés en centimes entiers positifs");
      return;
    }

    try {
      await Promise.all(settingKeys.map(key => updateSetting.mutateAsync({
        key,
        value: form[key].trim(),
        description: key === "free_shipping_threshold" ? "Seuil de livraison gratuite en centimes" : key === "flat_shipping_rate" ? "Frais de livraison fixes en centimes" : undefined,
      })));
      toast.success("Paramètres enregistrés dans la base de données");
      await settingsQuery.refetch();
    } catch (error) {
      toast.error(`Erreur : ${error instanceof Error ? error.message : "enregistrement impossible"}`);
    }
  };

  const isSaving = updateSetting.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-orange-50 p-6 md:p-8"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Settings2 className="h-4 w-4" /> Centre de configuration</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Paramètres de la boutique</h1><p className="mt-2 max-w-2xl text-slate-600">Contrôlez les informations de MAZIGHO, la livraison et les services qui seront activés au fur et à mesure.</p></div><Button onClick={handleSave} disabled={isSaving || settingsQuery.isLoading} className="bg-orange-500 hover:bg-orange-600">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer les réglages</Button></div></section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Boutique</p><p className="mt-1 text-xl font-bold text-slate-900">{form.site_name || "MAZIGHO"}</p><p className="mt-1 text-xs text-muted-foreground">Devise : {form.currency}</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Livraison offerte</p><p className="mt-1 text-xl font-bold text-emerald-700">Dès {deliveryPreview.threshold}</p><p className="mt-1 text-xs text-muted-foreground">Selon le seuil actif</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paiement en ligne</p><p className="mt-1 text-xl font-bold text-amber-700">À connecter</p><p className="mt-1 text-xs text-muted-foreground">Aucune clé de paiement enregistrée</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mails automatiques</p><p className="mt-1 text-xl font-bold text-slate-700">En attente</p><p className="mt-1 text-xs text-muted-foreground">À activer après connexion du domaine</p></CardContent></Card></section>

        {settingsQuery.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Impossible de charger les paramètres : {settingsQuery.error.message}</div>}

        <Tabs defaultValue="general" className="space-y-5"><TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0"><TabsTrigger value="general" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Globe2 className="h-4 w-4" /> Général</TabsTrigger><TabsTrigger value="shipping" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Truck className="h-4 w-4" /> Livraison</TabsTrigger><TabsTrigger value="payment" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><CreditCard className="h-4 w-4" /> Paiement</TabsTrigger><TabsTrigger value="notifications" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Bell className="h-4 w-4" /> E-mails</TabsTrigger></TabsList>

          <TabsContent value="general"><Card className="shadow-sm"><CardHeader><CardTitle>Informations générales</CardTitle><CardDescription>Ces informations représentent votre boutique et servent de référence aux interfaces publiques.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="siteName">Nom du site</Label><Input id="siteName" value={form.site_name} onChange={event => setField("site_name", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="contactEmail">E-mail de contact</Label><Input id="contactEmail" type="email" value={form.contact_email} onChange={event => setField("contact_email", event.target.value)} /></div></div><div className="max-w-md space-y-2"><Label htmlFor="currency">Devise principale</Label><select id="currency" value={form.currency} onChange={event => setField("currency", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="CHF">Franc suisse (CHF)</option><option value="EUR">Euro (€)</option><option value="USD">Dollar (USD)</option></select><p className="text-xs text-muted-foreground">Le catalogue et les montants doivent rester cohérents avec cette devise.</p></div><Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button></CardContent></Card></TabsContent>

          <TabsContent value="shipping"><Card className="shadow-sm"><CardHeader><CardTitle>Options de livraison</CardTitle><CardDescription>Les montants sont enregistrés en centimes afin de préserver la précision des prix.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="freeShippingThreshold">Seuil de livraison gratuite (centimes)</Label><Input id="freeShippingThreshold" type="number" min="0" step="1" value={form.free_shipping_threshold} onChange={event => setField("free_shipping_threshold", event.target.value)} /><p className="text-xs text-muted-foreground">Aperçu client : livraison gratuite dès <strong>{deliveryPreview.threshold}</strong>.</p></div><div className="space-y-2"><Label htmlFor="flatRate">Frais fixes de livraison (centimes)</Label><Input id="flatRate" type="number" min="0" step="1" value={form.flat_shipping_rate} onChange={event => setField("flat_shipping_rate", event.target.value)} /><p className="text-xs text-muted-foreground">Aperçu client : frais de <strong>{deliveryPreview.rate}</strong> sous le seuil.</p></div></div><div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900"><Truck className="mt-0.5 h-5 w-5 shrink-0" /><p>Vérifiez les règles commerciales avant tout changement : ces réglages sont destinés au tunnel de commande.</p></div><Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button></CardContent></Card></TabsContent>

          <TabsContent value="payment"><Card className="shadow-sm"><CardHeader><CardTitle>Paiement en ligne</CardTitle><CardDescription>Le panneau indique l’état réel de l’intégration : aucun prestataire de paiement n’est encore connecté.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><CreditCard className="h-5 w-5 text-amber-600" /> Paiement sécurisé</div><p className="mt-1 text-sm text-slate-700">Stripe pourra être relié lorsque vous serez prêt à activer les encaissements réels.</p></div><Badge className="w-fit border-0 bg-amber-600">À configurer</Badge></div><div className="flex items-start gap-3 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Les clés de paiement ne seront jamais saisies sur cette page. Elles devront être ajoutées uniquement dans les variables sécurisées de Vercel.</p></div></CardContent></Card></TabsContent>

          <TabsContent value="notifications"><Card className="shadow-sm"><CardHeader><CardTitle>E-mails et notifications</CardTitle><CardDescription>Les confirmations de commandes et la récupération de mot de passe nécessitent un domaine relié et un service d’envoi vérifié.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><Mail className="h-5 w-5 text-slate-600" /> Envoi d’e-mails</div><p className="mt-1 text-sm text-slate-700">En attente de la connexion du domaine `mazigho.fr` et de la vérification auprès du prestataire d’e-mails.</p></div><Badge variant="secondary">En attente</Badge></div><div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" /><p>Le lendemain, après identification de votre registrar, nous connecterons le domaine puis activerons la récupération de mot de passe par e-mail pour les clients et l’administrateur.</p></div><div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p>La connexion avec e-mail et mot de passe MAZIGHO fonctionne déjà ; seule l’automatisation des e-mails reste à activer.</p></div></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
