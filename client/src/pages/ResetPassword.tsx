import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      toast.success("Email de réinitialisation envoyé !", {
        description: "Vérifiez votre boîte mail pour le code de réinitialisation",
      });
      setStep("code");
      setIsLoading(false);
    }, 500);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error("Veuillez entrer le code");
      return;
    }

    // Simuler la vérification du code
    if (code === "123456") {
      setStep("password");
      toast.success("Code valide !");
    } else {
      toast.error("Code invalide", {
        description: "Veuillez vérifier le code reçu par email",
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      toast.success("Mot de passe réinitialisé !", {
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe",
      });
      navigate("/login");
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
            <Link href="/login">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à la connexion</span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Réinitialiser votre mot de passe
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Suivez les étapes pour créer un nouveau mot de passe sécurisé
            </p>
          </div>
        </section>

        {/* Reset Password Form */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-md">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              <div className={`flex flex-col items-center ${step === "email" || step === "code" || step === "password" ? "text-orange-500" : "text-gray-300"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === "email" || step === "code" || step === "password" ? "bg-orange-500 text-white" : "bg-gray-200"}`}>
                  1
                </div>
                <span className="text-xs mt-2">Email</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step === "code" || step === "password" ? "bg-orange-500" : "bg-gray-200"}`}></div>
              <div className={`flex flex-col items-center ${step === "code" || step === "password" ? "text-orange-500" : "text-gray-300"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === "code" || step === "password" ? "bg-orange-500 text-white" : "bg-gray-200"}`}>
                  2
                </div>
                <span className="text-xs mt-2">Code</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step === "password" ? "bg-orange-500" : "bg-gray-200"}`}></div>
              <div className={`flex flex-col items-center ${step === "password" ? "text-orange-500" : "text-gray-300"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === "password" ? "bg-orange-500 text-white" : "bg-gray-200"}`}>
                  3
                </div>
                <span className="text-xs mt-2">Mot de passe</span>
              </div>
            </div>

            <Card>
              <CardContent className="p-8">
                {/* Step 1: Email */}
                {step === "email" && (
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Adresse email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Entrez l'email associé à votre compte MAZIGHO
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Envoi en cours..." : "Envoyer le code"}
                    </Button>
                  </form>
                )}

                {/* Step 2: Code */}
                {step === "code" && (
                  <form onSubmit={handleCodeSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="code">Code de réinitialisation</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength={6}
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Entrez le code reçu par email (pour la démo: 123456)
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Vérifier le code
                    </Button>
                  </form>
                )}

                {/* Step 3: New Password */}
                {step === "password" && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-2">💡 Besoin d'aide ?</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Si vous ne recevez pas le code par email, vérifiez votre dossier spam ou contactez notre support.
                </p>
                <Link href="/contact">
                  <span className="text-sm text-orange-500 hover:text-orange-600 cursor-pointer font-medium">
                    Contacter le support →
                  </span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
