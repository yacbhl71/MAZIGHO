import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Globe, Truck, CreditCard, Bell, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Paramètres enregistrés avec succès (simulation)");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres du Site</h1>
          <p className="text-muted-foreground">Configurez les options générales, la livraison et les paiements.</p>
        </div>

        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>Module en cours de développement</AlertTitle>
          <AlertDescription>
            Les paramètres modifiés ici ne sont pas encore persistés en base de données. Cette interface sert d'aperçu pour la configuration finale.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Général
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Livraison
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Paiement
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nom du site</Label>
                    <Input id="siteName" defaultValue="MAZIGHO" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email de contact</Label>
                    <Input id="contactEmail" defaultValue="contact@mazigho.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Input id="currency" defaultValue="EUR (€)" disabled />
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                  <Save className="mr-2 h-4 w-4" /> {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Options de Livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">Seuil de livraison gratuite (en cents)</Label>
                  <Input id="freeShippingThreshold" type="number" defaultValue="5000" />
                  <p className="text-xs text-muted-foreground">Ex: 5000 pour 50,00 €</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flatRate">Frais de port fixes (en cents)</Label>
                  <Input id="flatRate" type="number" defaultValue="500" />
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                  <Save className="mr-2 h-4 w-4" /> Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Méthodes de Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Stripe</p>
                      <p className="text-xs text-muted-foreground">Paiement par carte bancaire sécurisé</p>
                    </div>
                  </div>
                  <Badge>Activé</Badge>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <Globe className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-medium">PayPal</p>
                      <p className="text-xs text-muted-foreground">Paiement via compte PayPal</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Désactivé</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
