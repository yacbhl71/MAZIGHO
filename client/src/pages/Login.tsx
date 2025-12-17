import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";
import { useLocalAuth } from "@/hooks/useLocalAuth";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useLocalAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    // Simuler un délai de connexion
    setTimeout(() => {
      if (login(formData.email, formData.password)) {
        toast.success("Connexion réussie !", {
          description: "Bienvenue sur MAZIGHO !",
        });
        navigate("/mon-compte");
      } else {
        toast.error("Identifiants incorrects", {
          description: "Email ou mot de passe invalide",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à l'accueil</span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Se Connecter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Connectez-vous à votre compte MAZIGHO pour accéder à vos commandes et favoris
            </p>
          </div>
        </section>

        {/* Login Form */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
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
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link href="/reset-password">
                      <span className="text-sm text-orange-500 hover:text-orange-600 cursor-pointer font-medium">
                        Mot de passe oublié ?
                      </span>
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion en cours..." : "Se connecter"}
                  </Button>
                </form>

                {/* Register Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600 mb-3">
                    Vous n'avez pas de compte ?
                  </p>
                  <Link href="/register">
                    <Button variant="outline" className="w-full">
                      Créer un compte
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Demo Info */}
            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-3">📝 Compte de démonstration</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Créez un compte ou utilisez ces identifiants de test :
                </p>
                <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono">
                  <p>Email: <span className="text-blue-600">demo@mazigho.fr</span></p>
                  <p>Mot de passe: <span className="text-blue-600">demo123</span></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
