import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Globe, Truck, CreditCard, Bell, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  const setField = (key: keyof SettingsForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.site_name.trim() || !form.contact_email.trim()) {
      toast.error("Le nom du site et l'email de contact sont obligatoires");
      return;
    }
    const threshold = Number(form.free_shipping_threshold);
    const shippingRate = Number(form.flat_shipping_rate);
    if (!Number.isInteger(threshold) || threshold < 0 || !Number.isInteger(shippingRate) || shippingRate < 0) {
      toast.error("Les frais de livraison doivent être des montants en centimes valides");
      return;
    }

    try {
      await Promise.all(settingKeys.map((key) => updateSetting.mutateAsync({
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
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-orange-600">Configuration de la boutique</p>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres du site</h1>
          <p className="text-muted-foreground">Gérez les informations affichées et les règles de livraison de MAZIGHO.</p>
        </div>

        {settingsQuery.error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Impossible de charger les paramètres : {settingsQuery.error.message}</div>}

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Général</TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2"><Truck className="h-4 w-4" /> Livraison</TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Paiement</TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="siteName">Nom du site</Label><Input id="siteName" value={form.site_name} onChange={(event) => setField("site_name", event.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="contactEmail">Email de contact</Label><Input id="contactEmail" type="email" value={form.contact_email} onChange={(event) => setField("contact_email", event.target.value)} /></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <select 
                    id="currency" 
                    value={form.currency} 
                    onChange={(event) => setField("currency", event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="CHF">Franc Suisse (CHF)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Sélectionnez la devise principale de votre boutique.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving || settingsQuery.isLoading} className="bg-orange-500 hover:bg-orange-600">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card>
              <CardHeader><CardTitle>Options de livraison</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="freeShippingThreshold">Seuil de livraison gratuite (centimes CHF)</Label><Input id="freeShippingThreshold" type="number" min="0" step="1" value={form.free_shipping_threshold} onChange={(event) => setField("free_shipping_threshold", event.target.value)} /><p className="text-xs text-muted-foreground">Exemple : 10000 correspond à 100,00 CHF.</p></div>
                <div className="space-y-2"><Label htmlFor="flatRate">Frais de port fixes (centimes CHF)</Label><Input id="flatRate" type="number" min="0" step="1" value={form.flat_shipping_rate} onChange={(event) => setField("flat_shipping_rate", event.target.value)} /><p className="text-xs text-muted-foreground">Ces valeurs sont enregistrées pour être utilisées par le tunnel de commande.</p></div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment"><Card><CardHeader><CardTitle>Méthodes de paiement</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4"><div><p className="font-medium">Stripe</p><p className="text-xs text-muted-foreground">La connexion des clés Stripe sera nécessaire avant l'ouverture des paiements.</p></div><Badge variant="secondary">À configurer</Badge></div><p className="text-sm text-muted-foreground">Aucune clé secrète n'est enregistrée par ce formulaire. Elles devront être ajoutées dans les variables sécurisées de Vercel.</p></CardContent></Card></TabsContent>

          <TabsContent value="notifications"><Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Les notifications de nouvelles commandes et de messages sont actuellement transmises à l'adresse propriétaire configurée côté serveur.</p></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
