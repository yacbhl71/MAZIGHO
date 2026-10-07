import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Bell, CheckCircle2, CircleAlert, CircleCheck, CreditCard, Globe2, Loader2, Mail, Save, Settings2, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { centsToChfInput, parseChfToCents } from "@/lib/moneyInput";
import { storefrontCountryChoices, type StorefrontCountryCode } from "@shared/storeMarketSettings";

type ShippingPolicy = "included" | "flat_rate";
type StoreCurrency = "CHF" | "EUR" | "USD" | "GBP" | "CAD" | "DZD";

type SettingsForm = {
  site_name: string;
  contact_email: string;
  currency: string;
  store_currency_code: StoreCurrency;
  store_currency_rate_bps: string;
  shipping_policy: ShippingPolicy;
  free_shipping_threshold: string;
  flat_shipping_rate: string;
  meta_pixel_id: string;
  tiktok_pixel_id: string;
};

const currencyChoices: Array<{ code: StoreCurrency; label: string; helper: string }> = [
  { code: "CHF", label: "Franc suisse", helper: "Suisse" },
  { code: "EUR", label: "Euro", helper: "Zone euro" },
  { code: "USD", label: "Dollar américain", helper: "International" },
  { code: "GBP", label: "Livre sterling", helper: "Royaume-Uni" },
  { code: "CAD", label: "Dollar canadien", helper: "Canada" },
  { code: "DZD", label: "Dinar algérien", helper: "Algérie" },
];

const defaultForm: SettingsForm = {
  site_name: "MAZIGHO",
  contact_email: "contact@mazigho.com",
  currency: "CHF",
  store_currency_code: "CHF",
  store_currency_rate_bps: "1,0000",
  shipping_policy: "included",
  free_shipping_threshold: "100,00",
  flat_shipping_rate: "5,00",
  meta_pixel_id: "",
  tiktok_pixel_id: "",
};

const settingKeys = Object.keys(defaultForm) as Array<keyof SettingsForm>;

function formatCents(value: string, currency: string) {
  const cents = Number(value);
  if (!Number.isFinite(cents)) return "—";
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function AdminSettings() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [servedCountries, setServedCountries] = useState<StorefrontCountryCode[]>([]);
  const settingsQuery = trpc.admin.settings.getAll.useQuery();
  const shippingReturnsQuery = trpc.owner.getShippingReturnsSettings.useQuery();
  const updateSetting = trpc.admin.settings.update.useMutation();
  const saveShippingReturns = trpc.owner.saveShippingReturnsSettings.useMutation({
    onSuccess: saved => {
      setServedCountries(saved.servedCountries.filter((country): country is StorefrontCountryCode => storefrontCountryChoices.some(choice => choice.code === country)));
      toast.success("Pays de livraison enregistrés pour cette boutique.");
      void shippingReturnsQuery.refetch();
    },
    onError: error => toast.error(error.message || "Les pays de livraison n’ont pas pu être enregistrés."),
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    const next = { ...defaultForm };
    for (const setting of settingsQuery.data) {
      if (!(setting.key in next)) continue;
      if (setting.key === "free_shipping_threshold" || setting.key === "flat_shipping_rate") {
        next[setting.key] = centsToChfInput(setting.value);
      } else if (setting.key === "shipping_policy") {
        next.shipping_policy = setting.value === "flat_rate" ? "flat_rate" : "included";
      } else if (setting.key === "store_currency_code" && currencyChoices.some(choice => choice.code === setting.value)) {
        next.store_currency_code = setting.value as StoreCurrency;
        next.currency = setting.value;
      } else if (setting.key === "store_currency_rate_bps" && /^\d{4,7}$/.test(setting.value)) {
        next.store_currency_rate_bps = (Number(setting.value) / 10_000).toFixed(4).replace(".", ",");
      } else if (setting.key === "site_name" || setting.key === "contact_email" || setting.key === "currency") {
        next[setting.key] = setting.value;
      }
    }
    setForm(next);
  }, [settingsQuery.data]);

  useEffect(() => {
    if (!shippingReturnsQuery.data) return;
    setServedCountries(shippingReturnsQuery.data.servedCountries.filter((country): country is StorefrontCountryCode => storefrontCountryChoices.some(choice => choice.code === country)));
  }, [shippingReturnsQuery.data]);

  const deliveryPreview = useMemo(() => ({
    threshold: formatCents(String(parseChfToCents(form.free_shipping_threshold) ?? NaN), form.currency),
    rate: formatCents(String(parseChfToCents(form.flat_shipping_rate) ?? NaN), form.currency),
  }), [form.currency, form.flat_shipping_rate, form.free_shipping_threshold]);

  const setField = <Key extends keyof SettingsForm>(key: Key, value: SettingsForm[Key]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const toggleServedCountry = (countryCode: StorefrontCountryCode) => {
    setServedCountries(current => {
      if (current.includes(countryCode)) {
        if (current.length === 1) {
          toast.info("Conservez au moins un pays de livraison.");
          return current;
        }
        return current.filter(code => code !== countryCode);
      }
      return [...current, countryCode];
    });
  };

  const handleSave = async () => {
    if (!form.site_name.trim() || !form.contact_email.trim()) {
      toast.error("Le nom du site et l'e-mail de contact sont obligatoires");
      return;
    }
    const threshold = parseChfToCents(form.free_shipping_threshold);
    const shippingRate = parseChfToCents(form.flat_shipping_rate);
    const rateBps = form.store_currency_code === "CHF" ? 10_000 : Math.round(Number(form.store_currency_rate_bps.replace(",", ".")) * 10_000);
    if (threshold == null || threshold < 0 || shippingRate == null || shippingRate < 0) {
      toast.error("Saisissez des montants de livraison valides en CHF (ex. 5,00 ou 5.00)");
      return;
    }
    if (!Number.isInteger(rateBps) || rateBps < 1_000 || rateBps > 2_000_000) {
      toast.error("Saisissez un taux manuel valide pour 1 CHF.");
      return;
    }

    const descriptions: Partial<Record<keyof SettingsForm, string>> = {
      store_currency_code: "Devise de vente active de la boutique",
      store_currency_rate_bps: "Taux manuel : unités de devise de vente pour 1 CHF",
      shipping_policy: "Politique client : livraison comprise dans les prix ou frais fixes par commande",
      free_shipping_threshold: "Seuil de livraison gratuite en centimes (0 = pas de seuil)",
      flat_shipping_rate: "Frais de livraison fixes par commande en centimes",
      meta_pixel_id: "Identifiant Meta Pixel ; chargé uniquement après consentement marketing du visiteur",
      tiktok_pixel_id: "Identifiant TikTok Pixel ; chargé uniquement après consentement marketing du visiteur",
    };

    try {
      await Promise.all(settingKeys.map(key => updateSetting.mutateAsync({
        key,
        value: key === "free_shipping_threshold" ? String(threshold)
          : key === "flat_shipping_rate" ? String(shippingRate)
            : key === "store_currency_rate_bps" ? String(rateBps)
              : key === "currency" ? form.store_currency_code
                : form[key].trim(),
        description: descriptions[key],
      })));
      toast.success("Devise, politique de livraison et paramètres enregistrés");
      await settingsQuery.refetch();
    } catch (error) {
      toast.error(`Erreur : ${error instanceof Error ? error.message : "enregistrement impossible"}`);
    }
  };

  const handleSaveDeliveryCountries = async () => {
    const currentProfile = shippingReturnsQuery.data;
    if (!currentProfile) {
      toast.error("La configuration de livraison n’est pas encore disponible.");
      return;
    }
    if (servedCountries.length === 0) {
      toast.error("Sélectionnez au moins un pays de livraison.");
      return;
    }
    await saveShippingReturns.mutateAsync({ ...currentProfile, servedCountries });
  };

  const isSaving = updateSetting.isPending || saveShippingReturns.isPending;
  const isIncluded = form.shipping_policy === "included";

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-orange-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Settings2 className="h-4 w-4" /> Centre de configuration</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Paramètres de la boutique</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Contrôlez les informations de la boutique, la devise, les pays de livraison et les services activés.</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving || settingsQuery.isLoading} className="bg-orange-500 hover:bg-orange-600">
              {updateSetting.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer les réglages
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Boutique</p><p className="mt-1 text-xl font-bold text-slate-900">{form.site_name || "MAZIGHO"}</p><p className="mt-1 text-xs text-muted-foreground">Devise de vente : {form.store_currency_code}</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Livraison client</p><p className="mt-1 text-xl font-bold text-emerald-700">{isIncluded ? "Offerte" : `Dès ${deliveryPreview.threshold}`}</p><p className="mt-1 text-xs text-muted-foreground">{isIncluded ? "Comprise dans les prix" : `${deliveryPreview.rate} sous le seuil`} · {servedCountries.length || 0} pays</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paiement en ligne</p><p className="mt-1 text-xl font-bold text-violet-700">Stripe Connect Test</p><p className="mt-1 text-xs text-muted-foreground">Parcours vendeur disponible depuis l’espace propriétaire</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mails transactionnels</p><p className="mt-1 text-xl font-bold text-emerald-700">Brevo configuré</p><p className="mt-1 text-xs text-muted-foreground">Contrôle et test professionnel depuis MAZIGHO Studio</p></CardContent></Card>
        </section>

        {settingsQuery.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Impossible de charger les paramètres : {settingsQuery.error.message}</div>}

        <Tabs defaultValue="general" className="space-y-5">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="general" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Globe2 className="h-4 w-4" /> Général</TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Truck className="h-4 w-4" /> Livraison</TabsTrigger>
            <TabsTrigger value="marketing" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><BarChart3 className="h-4 w-4" /> Pixels publicitaires</TabsTrigger>
            <TabsTrigger value="payment" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><CreditCard className="h-4 w-4" /> Paiement</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 border data-[state=active]:border-slate-200 data-[state=active]:bg-white"><Bell className="h-4 w-4" /> E-mails</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="shadow-sm"><CardHeader><CardTitle>Informations générales</CardTitle><CardDescription>Ces informations représentent votre boutique et servent de référence aux interfaces publiques.</CardDescription></CardHeader><CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="siteName">Nom du site</Label><Input id="siteName" value={form.site_name} onChange={event => setField("site_name", event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="contactEmail">E-mail de contact</Label><Input id="contactEmail" type="email" value={form.contact_email} onChange={event => setField("contact_email", event.target.value)} /></div>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div><Label className="text-base font-semibold text-slate-950">Devise de vente</Label><p className="mt-1 text-sm leading-6 text-slate-600">Une seule devise reste active pour toute la boutique afin de garder les prix, le panier et les paiements cohérents.</p></div>
                  <Badge variant="outline" className="w-fit border-sky-200 bg-sky-50 text-sky-800">1 choix actif</Badge>
                </div>
                <RadioGroup value={form.store_currency_code} onValueChange={value => setField("store_currency_code", value as StoreCurrency)} className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Devise de vente">
                  {currencyChoices.map(choice => {
                    const selected = form.store_currency_code === choice.code;
                    return <Label key={choice.code} htmlFor={`currency-${choice.code}`} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${selected ? "border-orange-400 bg-orange-50 text-orange-950 ring-2 ring-orange-100" : "border-slate-200 bg-white text-slate-800 hover:border-orange-200"}`}>
                      <RadioGroupItem value={choice.code} id={`currency-${choice.code}`} />
                      <span className="min-w-0"><span className="block font-semibold">{choice.label} · {choice.code}</span><span className="mt-0.5 block text-xs font-normal text-slate-500">{choice.helper}</span></span>
                    </Label>;
                  })}
                </RadioGroup>
                <div className="mt-5 max-w-xl space-y-2"><Label htmlFor="currencyRate">Taux pour 1 CHF</Label><Input id="currencyRate" type="text" inputMode="decimal" disabled={form.store_currency_code === "CHF"} placeholder={form.store_currency_code === "DZD" ? "Ex. 140,0000" : "Ex. 0,9600"} value={form.store_currency_code === "CHF" ? "1,0000" : form.store_currency_rate_bps} onChange={event => setField("store_currency_rate_bps", event.target.value.replace(/[^0-9,.]/g, ""))} /><p className="text-xs leading-5 text-muted-foreground">Saisissez et contrôlez le taux manuel avant toute vente dans une nouvelle devise. MAZIGHO ne récupère jamais un taux de change automatiquement.</p></div>
              </section>
              <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{updateSetting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer la devise et les informations</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="shipping">
            <div className="space-y-5">
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
                <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{updateSetting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer la politique</Button>
              </CardContent></Card>

              <Card className="border-teal-200 shadow-sm"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>Pays de livraison</CardTitle><CardDescription className="mt-1 max-w-3xl">Cochez uniquement les pays auxquels cette boutique accepte de livrer. Ce choix est indépendant des pays visibles dans la vitrine et reste limité à cette boutique.</CardDescription></div><Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 text-teal-800">{servedCountries.length} pays coché{servedCountries.length > 1 ? "s" : ""}</Badge></div></CardHeader><CardContent className="space-y-5">
                {shippingReturnsQuery.isLoading ? <div className="h-32 animate-pulse rounded-xl bg-slate-100" /> : shippingReturnsQuery.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Impossible de lire les pays de livraison : {shippingReturnsQuery.error.message}</div> : <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {storefrontCountryChoices.map(country => {
                      const checked = servedCountries.includes(country.code);
                      return <Label key={country.code} htmlFor={`served-country-${country.code}`} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${checked ? "border-teal-500 bg-teal-50 text-teal-950" : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"}`}>
                        <Checkbox id={`served-country-${country.code}`} checked={checked} onCheckedChange={() => toggleServedCountry(country.code)} />
                        <span className="min-w-0 flex-1 font-semibold">{country.label} <span className="text-xs font-normal text-slate-500">({country.code})</span></span>
                      </Label>;
                    })}
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-semibold">Contrôle produit conservé</p><p className="mt-1">Cocher un pays n’ajoute ni transporteur, ni frais, ni paiement. Pour rendre un article réellement commandable dans un pays, son profil de livraison produit doit aussi être renseigné et vérifié.</p></div>
                  <Button onClick={handleSaveDeliveryCountries} disabled={saveShippingReturns.isPending || servedCountries.length === 0} className="bg-teal-700 hover:bg-teal-800">{saveShippingReturns.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer les pays de livraison</Button>
                </>}
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="marketing"><Card className="shadow-sm"><CardHeader><CardTitle>Pixels Meta et TikTok</CardTitle><CardDescription>Ajoutez seulement les identifiants créés dans vos propres comptes publicitaires. Aucun script n’est chargé tant qu’un visiteur n’a pas accepté le suivi marketing.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid gap-5 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="metaPixel">Identifiant Meta Pixel</Label><Input id="metaPixel" inputMode="numeric" autoComplete="off" placeholder="Ex. 123456789012345" value={form.meta_pixel_id} onChange={event => setField("meta_pixel_id", event.target.value.replace(/\s+/g, ""))} /><p className="text-xs leading-5 text-muted-foreground">Chiffres uniquement. Laissez vide pour désactiver Meta Pixel.</p></div><div className="space-y-2"><Label htmlFor="tiktokPixel">Identifiant TikTok Pixel</Label><Input id="tiktokPixel" autoComplete="off" placeholder="Ex. CXXXXXXXXXXXXXXXXXXX" value={form.tiktok_pixel_id} onChange={event => setField("tiktok_pixel_id", event.target.value.replace(/\s+/g, ""))} /><p className="text-xs leading-5 text-muted-foreground">Lettres, chiffres, tirets et underscores. Laissez vide pour désactiver TikTok Pixel.</p></div></div><div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /><p><strong>Protection par défaut.</strong> Les pixels sont absents de la boutique tant que le visiteur n’a pas donné son accord. Il peut ensuite retirer ce consentement depuis le bouton « Confidentialité » présent dans la boutique.</p></div></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><p>Cette fonction installe uniquement les pixels de navigation de base. Elle ne crée ni campagne, ni publicité, ni synchronisation de données serveur. Vérifiez vos obligations d’information et de consentement avant activation.</p></div></div><Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">{updateSetting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer les pixels</Button></CardContent></Card></TabsContent>

          <TabsContent value="payment"><Card className="shadow-sm"><CardHeader><CardTitle>Paiement en ligne</CardTitle><CardDescription>Stripe Connect Direct Charges est prévu : chaque boutique est le vendeur et MAZIGHO applique sa commission selon le plan attribué.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-violet-200 bg-violet-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><CreditCard className="h-5 w-5 text-violet-700" /> Parcours Stripe Connect Test</div><p className="mt-1 text-sm text-slate-700">Le compte vendeur et le checkout de préparation se gèrent depuis le parcours propriétaire. Aucun encaissement réel n’est déclenché depuis cette page.</p></div><Badge className="w-fit border-0 bg-violet-700">Préparation disponible</Badge></div><div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p>Les clés Stripe restent exclusivement dans les variables sécurisées de Vercel. Le passage Production reste distinct du parcours Test et ne peut pas être activé depuis ces réglages.</p></div></CardContent></Card></TabsContent>

          <TabsContent value="notifications"><Card className="shadow-sm"><CardHeader><CardTitle>E-mails et notifications</CardTitle><CardDescription>Les invitations, réinitialisations et alertes transactionnelles passent par le service e-mail MAZIGHO, configuré avec Brevo.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><Mail className="h-5 w-5 text-emerald-700" /> Expéditeur transactionnel MAZIGHO</div><p className="mt-1 text-sm text-slate-700">Le domaine d’envoi MAZIGHO est vérifié dans Brevo. Le contrôle technique et le test interne restent accessibles uniquement depuis MAZIGHO Studio.</p></div><Badge className="w-fit border-0 bg-emerald-600">Configuré</Badge></div><div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><p>Le test Studio confirme l’acceptation du message par Brevo ; il ne remplace pas la vérification de réception dans la boîte professionnelle. Aucun destinataire client n’est utilisé par ce test.</p></div><div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p>La connexion e-mail/mot de passe est fonctionnelle. Les invitations et la récupération de mot de passe utilisent des liens personnels à usage unique lorsque l’envoi transactionnel est disponible.</p></div></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
