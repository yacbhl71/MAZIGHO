import { useEffect, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultLegalProfile, type LegalProfile } from "@/hooks/useLegalProfile";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Save,
  Scale,
  Truck,
  Undo2,
} from "lucide-react";

type LegalForm = LegalProfile;

const guideItems = [
  {
    icon: Building2,
    title: "Informations d’exploitant",
    description: "Utilisez votre nom réel, l’adresse publique de l’activité et son statut actuel.",
    tone: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    icon: Truck,
    title: "Livraison et retours",
    description: "Annoncez uniquement ce que vous pouvez réellement appliquer aux clients.",
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    icon: FileText,
    title: "Publication automatique",
    description: "Une seule sauvegarde met à jour les quatre pages juridiques publiques.",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
];

export default function AdminLegal() {
  const [form, setForm] = useState<LegalForm>(defaultLegalProfile);
  const legalQuery = trpc.admin.legal.get.useQuery();
  const updateLegal = trpc.admin.legal.update.useMutation();

  useEffect(() => {
    if (legalQuery.data) {
      setForm(legalQuery.data as LegalForm);
    }
  }, [legalQuery.data]);

  const setField = (field: keyof LegalForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const restoreApprovedDefaults = () => {
    setForm(defaultLegalProfile);
    toast.message("Les valeurs de référence ont été replacées dans le formulaire. Enregistrez pour les publier.");
  };

  const handleSave = async () => {
    const requiredFields: Array<keyof LegalForm> = [
      "operatorName",
      "addressLine",
      "postalCodeCity",
      "country",
      "contactEmail",
      "businessStatus",
      "ideVatNumber",
      "deliveryZones",
      "deliveryDetails",
      "returnsPolicy",
    ];

    if (requiredFields.some(field => !form[field].trim())) {
      toast.error("Chaque information doit être renseignée avant publication.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())) {
      toast.error("Indiquez une adresse e-mail publique valide.");
      return;
    }

    try {
      await updateLegal.mutateAsync({
        operatorName: form.operatorName.trim(),
        addressLine: form.addressLine.trim(),
        postalCodeCity: form.postalCodeCity.trim(),
        country: form.country.trim(),
        contactEmail: form.contactEmail.trim(),
        businessStatus: form.businessStatus.trim(),
        ideVatNumber: form.ideVatNumber.trim(),
        deliveryZones: form.deliveryZones.trim(),
        deliveryDetails: form.deliveryDetails.trim(),
        returnsPolicy: form.returnsPolicy.trim(),
      });
      await legalQuery.refetch();
      toast.success("Informations légales enregistrées et publiées sur les pages concernées.");
    } catch (error) {
      toast.error(`Impossible d’enregistrer : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  const isSaving = updateLegal.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-800">
                <Scale className="h-4 w-4" /> Centre de conformité
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Informations légales</h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Modifiez ici les informations officielles publiées sur MAZIGHO. Elles sont reprises sur les mentions légales, la confidentialité, les conditions générales et la page livraison et retours.
              </p>
            </div>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-8 border-orange-100 bg-orange-500 text-white shadow-sm md:mx-0">
              <Scale className="h-12 w-12" />
            </div>
          </div>
          <div className="border-t border-orange-100 bg-white/70 px-6 py-4 md:px-8">
            <div className="flex items-start gap-3 text-sm text-slate-700">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p><strong>Conseil :</strong> ne publiez que des informations exactes et actuelles. Les textes juridiques structurés restent protégés afin d’éviter leur suppression accidentelle.</p>
            </div>
          </div>
        </section>

        {legalQuery.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Impossible de charger les informations enregistrées : {legalQuery.error.message}. Les valeurs de référence sont affichées dans le formulaire.
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {guideItems.map(({ icon: Icon, title, description, tone }) => (
            <div key={title} className={`rounded-2xl border p-5 ${tone}`}>
              <Icon className="h-6 w-6" />
              <h2 className="mt-3 font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p><strong>Synchronisation centralisée :</strong> les pages publiques conservent des valeurs de secours pendant le chargement afin de ne jamais devenir vides.</p></div>
          <Button asChild variant="outline" className="shrink-0 border-emerald-300 bg-white hover:bg-emerald-100"><Link href="/mentions-legales"><ExternalLink className="mr-2 h-4 w-4" /> Voir la page publique</Link></Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600" /> Exploitant et coordonnées publiques</CardTitle>
            <CardDescription>Ces informations permettent aux visiteurs d’identifier l’activité et de prendre contact.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="operatorName">Nom de l’exploitant</Label><Input id="operatorName" value={form.operatorName} onChange={event => setField("operatorName", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="businessStatus">Statut de l’activité</Label><Input id="businessStatus" value={form.businessStatus} onChange={event => setField("businessStatus", event.target.value)} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="addressLine">Adresse</Label><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="addressLine" className="pl-9" value={form.addressLine} onChange={event => setField("addressLine", event.target.value)} /></div></div>
              <div className="space-y-2"><Label htmlFor="postalCodeCity">NPA et localité</Label><Input id="postalCodeCity" value={form.postalCodeCity} onChange={event => setField("postalCodeCity", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="country">Pays</Label><Input id="country" value={form.country} onChange={event => setField("country", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="contactEmail">E-mail public de contact</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="contactEmail" className="pl-9" type="email" value={form.contactEmail} onChange={event => setField("contactEmail", event.target.value)} /></div></div>
            </div>
            <div className="space-y-2"><Label htmlFor="ideVatNumber">Numéro IDE / TVA</Label><Input id="ideVatNumber" value={form.ideVatNumber} onChange={event => setField("ideVatNumber", event.target.value)} /><p className="text-xs text-muted-foreground">Si vous n’en avez pas encore, indiquez clairement que le numéro n’est pas attribué à ce jour.</p></div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-amber-600" /> Livraison et retours</CardTitle>
            <CardDescription>Restez prudent : les informations doivent correspondre aux conditions réellement applicables avant l’ouverture des commandes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label htmlFor="deliveryZones">Zones de livraison</Label><Input id="deliveryZones" value={form.deliveryZones} onChange={event => setField("deliveryZones", event.target.value)} /><p className="text-xs text-muted-foreground">Exemple : « Suisse et certains pays d’Europe, selon disponibilité ».</p></div>
            <div className="space-y-2"><Label htmlFor="deliveryDetails">Détails de livraison</Label><textarea id="deliveryDetails" value={form.deliveryDetails} onChange={event => setField("deliveryDetails", event.target.value)} className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /><p className="text-xs text-muted-foreground">N’annoncez pas de délai ou de prix définitif tant que vous ne pouvez pas les assurer.</p></div>
            <div className="space-y-2"><Label htmlFor="returnsPolicy">Politique actuelle de retours</Label><textarea id="returnsPolicy" value={form.returnsPolicy} onChange={event => setField("returnsPolicy", event.target.value)} className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /><p className="text-xs text-muted-foreground">Cette rubrique ne remplace pas les droits impératifs applicables aux produits défectueux.</p></div>
          </CardContent>
        </Card>

        <section className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={restoreApprovedDefaults} disabled={isSaving}><Undo2 className="mr-2 h-4 w-4" /> Restaurer les valeurs de référence</Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || legalQuery.isLoading} className="bg-orange-500 hover:bg-orange-600"><>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}</> Enregistrer et publier</Button>
        </section>
      </div>
    </DashboardLayout>
  );
}
