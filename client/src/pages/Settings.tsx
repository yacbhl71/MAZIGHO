import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowLeft, Mail, User, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Paramètres sauvegardés avec succès !", {
      description: "Vos informations ont été mises à jour.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/mon-compte">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à mon compte</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-8 w-8 text-green-600" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Paramètres
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Gérez vos informations personnelles et vos préférences
            </p>
          </div>
        </section>

        {/* Settings Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Informations Personnelles
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Votre prénom"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Votre nom"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+33 1 23 45 67 89"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Address Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adresse
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Votre adresse"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  {/* City, Postal Code, Country */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Paris"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code Postal</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        placeholder="75001"
                        value={formData.postalCode}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        name="country"
                        placeholder="France"
                        value={formData.country}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                    >
                      Sauvegarder les modifications
                    </Button>
                    <Link href="/mon-compte">
                      <Button variant="outline" className="flex-1">
                        Annuler
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Info Section */}
            <Card className="mt-8 bg-green-50 border-green-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-2">🔒 Sécurité</h3>
                <p className="text-gray-700 mb-4">
                  Vos données personnelles sont sécurisées et chiffrées. Nous ne partagerons jamais vos informations avec des tiers.
                </p>
                <Button variant="outline" className="w-full">
                  Changer le mot de passe
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
