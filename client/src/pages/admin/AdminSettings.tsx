import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, CircleAlert, CircleCheck, CreditCard, Globe2, Loader2, Mail, Save, Settings2, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { centsToChfInput, parseChfToCents } from "@/lib/moneyInput";

type ShippingPolicy = "included" | "flat_rate";

type SettingsForm = {
  site_name: string;
  contact_email: string;
  currency: string;
  shipping_policy: ShippingPolicy;
  free_shipping_threshold: string;
  flat_shipping_rate: string;
};

const defaultForm: SettingsForm = {
  site_name: "MAZIGHO",
  contact_email: "contact@mazigho.com",
  currency: "CHF",
  // Preserve the current all-inclusive MAZIGHO storefront until an owner opts in.
  shipping_policy: "included",
  free_shipping_threshold: "100,00",
  flat_shipping_rate: "5,00",
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
      if (!(setting.key in next)) continue;
      if (setting.key === "free_shipping_threshold" || setting.key === "flat_shipping_rate") {
        next[setting.key] = centsToChfInput(setting.value);
      } else if (setting.key === "shipping_policy") {
        next.shipping_policy = setting.value === "flat_rate" ? "flat_rate" : "included";
      } else {
        next[setting.key as "site_name" | "contact_email" | "currency"] = setting.value;
      }
    }
    setForm(next);
  }, [settingsQuery.data]);

  const deliveryPreview = useMemo(() => ({
    threshold: formatCents(String(parseChfToCents(form.free_shipping_threshold) ?? NaN), form.currency),
    rate: formatCents(String(parseChfToCents(form.flat_shipping_rate) ?? NaN), form.currency),
  }), [form.currency, form.flat_shipping_rate, form.free_shipping_threshold]);

  const setField = <Key extends keyof SettingsForm>(key: Key, value: SettingsForm[Key]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.site_name.trim() || !form.contact_email.trim()) {
      toast.error("Le nom du site et l'e-mail de contact sont obligatoires");
      return;
    }
    const threshold = parseChfToCents(form.free_shipping_threshold);
    const shippingRate = parseChfToCents(form.flat_shipping_rate);
    if (threshold == null || threshold < 0 || shippingRate == null || shippingRate < 0) {
      toast.error("Saisissez des montants de livraison valides en CHF (ex. 5,00 ou 5.00)");
      return;
    }

    const descriptions: Partial<Record<keyof SettingsForm, string>> = {
      shipping_policy: "Politique client : livraison comprise dans les prix ou frais fixes par commande",
      free_shipping_threshold: "Seuil de livraison gratuite en centimes (0 = pas de seuil)",
      flat_shipping_rate: "Frais de livraison fixes par commande en centimes",
    };

    try {
      await Promise.all(settingKeys.map(key => updateSetting.mutateAsync({
        key,
        value: key === "free_shipping_threshold" ? String(threshold)
          : key === "flat_shipping_rate" ? String(shippingRate)
            : form[key].trim(),
        description: descriptions[key],
      })));
      toast.success("Politique de livraison et paramètres enregistrés");
      await settingsQuery.refetch();
    } catch (error) {
      toast.error(`Erreur : ${error instanceof Error ? error.message : "enregistrement impossible"}`);
    }
  };

  const isSaving = updateSetting.isPending;
  const isIncluded = form.shipping_policy === "included";

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-orange-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Settings2 className="h-4 w-4" /> Centre de configuration</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Paramètres de la boutique</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Contrôlez les informations de la boutique, la politique de livraison et les services activés.</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving || settingsQuery.isLoading} className="bg-orange-500 hover:bg-orange-600">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer les réglages
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Boutique</p><p className="mt-1 text-xl font-bold text-slate-900">{form.site_name || "MAZIGHO"}</p><p className="mt-1 text-xs text-muted-foreground">Devise : {form.currency}</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Livraison client</p><p className="mt-1 text-xl font-bold text-emerald-700">{isIncluded ? "Offerte" : `Dès ${deliveryPreview.threshold}`}</p><p className="mt-1 text-xs text-muted-foreground">{isIncluded ? "Comprise dans les prix" : `${deliveryPreview.rate} sous le seuil`}</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paiement en ligne</p><p className="mt-1 text-xl font-bold text-amber-700">À connecter</p><p className="mt-1 text-xs text-muted-foreground">Aucune clé de paiement enregistrée ici</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mails automatiques</p><p className="mt-1 text-xl font-bold text-amber-700">À vérifier</p><p className="mt-1 text-xs text-muted-foreground">Domaine connecté, prestataire à finaliser</p></CardContent></Card>
        </section>

        {settingsQuery.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Impossible de charger les paramètres : {settingsQuery.error.message}</div>}

        <Tabs defaultValue="general" className="space-y-5">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="general" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Globe2 className="h-4 w-4" /> Général</TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Truck className="h-4 w-4" /> Livraison</TabsTrigger>
            <TabsTrigger value="payment" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><CreditCard className="h-4 w-4" /> Paiement</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Bell className="h-4 w-4" /> E-mails</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="shadow-sm"><CardHeader><CardTitle>Informations générales</CardTitle><CardDescription>Ces informations représentent votre boutique et servent de référence aux interfaces publiques.</CardDescription></CardHeader><CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="siteName">Nom du site</Label><Input id="siteName" value={form.site_name} onChange={event => setField("site_name", event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="contactEmail">E-mail de contact</Label><Input id="contactEmail" type="email" value={form.contact_email} onChange={event => setField("contact_email", event.target.value)} /></div>
              </div>
              <div className="max-w-md space-y-2"><Label htmlFor="currency">Devise principale</Label><select id="currency" value={form.currency} onChange={event => setField("currency", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="CHF">Franc suisse (CHF)</option><option value="EUR">Euro (€)</option><option value="USD">Dollar (USD)</option></select><p className="text-xs text-muted-foreground">La conversion réelle du catalogue et du paiement sera configurée séparément.</p></div>
              <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card className="shadow-sm"><CardHeader><CardTitle>Politique de livraison client</CardTitle><CardDescription>Choisissez ce que le client paie. Les profils fournisseur par produit et par destination restent contrôlés en interne pour garantir que chaque article peut être livré.</CardDescription></CardHeader><CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2" role="radiogroup" aria-label="Politique de livraison">
                <button type="button" role="radio" aria-checked={isIncluded} onClick={() => setField("shipping_policy", "included")} className={`rounded-xl border p-5 text-left ${isIncluded ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-200"}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">Livraison offerte</p><p className="mt-2 text-sm leading-6 text-slate-600">Les prix affichés sont tout compris. Aucun frais de livraison n’est ajouté au panier.</p></div>{isIncluded && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}</div>
                </button>
                <button type="button" role="radio" aria-checked={!isIncluded} onClick={() => setField("shipping_policy", "flat_rate")} className={`rounded-xl border p-5 text-left ${!isIncluded ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100" : "border-slate-200 bg-white hover:border-orange-200"}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">Frais fixes au panier</p><p className="mt-2 text-sm leading-6 text-slate-600">Un seul frais est ajouté à la commande, avec possibilité de l’offrir à partir d’un montant défini.</p></div>{!isIncluded && <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-600" />}</div>
                </button>
              </div>

              <div className={`grid gap-4 md:grid-cols-2 ${isIncluded ? "opacity-60" : ""}`}>
                <div className="space-y-2"><Label htmlFor="freeShippingThreshold">Livraison offerte dès (CHF)</Label><Input id="freeShippingThreshold" type="text" inputMode="decimal" disabled={isIncluded} placeholder="50,00" value={form.free_shipping_threshold} onChange={event => setField("free_shipping_threshold", event.target.value)} /><p className="text-xs text-muted-foreground">Laissez <strong>0</strong> pour ne jamais offrir les frais automatiquement.</p></div>
                <div className="space-y-2"><Label htmlFor="flatRate">Frais fixes par commande (CHF)</Label><Input id="flatRate" type="text" inputMode="decimal" disabled={isIncluded} placeholder="4,90" value={form.flat_shipping_rate} onChange={event => setField("flat_shipping_rate", event.target.value)} /><p className="text-xs text-muted-foreground">Un seul montant sera ajouté, jamais un frais par article.</p></div>
              </div>

              <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${isIncluded ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-sky-100 bg-sky-50 text-sky-950"}`}>
                <Truck className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{isIncluded ? "Politique active : la livraison reste comprise dans le prix public, conformément au fonctionnement actuel de MAZIGHO." : `Politique active : ${deliveryPreview.rate} seront facturés une seule fois sous ${deliveryPreview.threshold}, puis la livraison sera offerte.`}</p>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer la politique</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="payment"><Card className="shadow-sm"><CardHeader><CardTitle>Paiement en ligne</CardTitle><CardDescription>Le panneau indique l’état réel de l’intégration : aucun prestataire de paiement n’est encore connecté.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><CreditCard className="h-5 w-5 text-amber-600" /> Paiement sécurisé</div><p className="mt-1 text-sm text-slate-700">Stripe pourra être relié lorsque vous serez prêt à activer les encaissements réels.</p></div><Badge className="w-fit border-0 bg-amber-600">À configurer</Badge></div><div className="flex items-start gap-3 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Les clés de paiement ne seront jamais saisies sur cette page. Elles devront être ajoutées uniquement dans les variables sécurisées de Vercel.</p></div></CardContent></Card></TabsContent>

          <TabsContent value="notifications"><Card className="shadow-sm"><CardHeader><CardTitle>E-mails et notifications</CardTitle><CardDescription>Les invitations et réinitialisations de mot de passe sont prêtes côté MAZIGHO, mais l’envoi reste conditionné à un service e-mail transactionnel vérifié.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><Mail className="h-5 w-5 text-emerald-700" /> Domaine de la boutique</div><p className="mt-1 text-sm text-slate-700">`mazigho.ch` est connecté et sécurisé. Il peut maintenant servir à vérifier le domaine d’envoi.</p></div><Badge className="w-fit border-0 bg-emerald-600">Connecté</Badge></div><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p>Avant tout e-mail réel, le domaine d’envoi doit être vérifié chez le prestataire transactionnel et les variables sécurisées doivent être ajoutées dans Vercel. Aucun e-mail n’est simulé ni envoyé avant cette vérification.</p></div><div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p>La connexion e-mail/mot de passe est déjà fonctionnelle. Après vérification du prestataire, les invitations et la récupération de mot de passe utiliseront des liens personnels à usage unique.</p></div></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
