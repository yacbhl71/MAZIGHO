import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = trpc.auth.login.useMutation({
    onSuccess: async data => {
      await utils.auth.me.invalidate();
      toast.success("Connexion réussie. Bienvenue sur MAZIGHO.");
      setLocation(data.user.role === "admin" ? "/admin" : "/mon-compte");
    },
    onError: error => toast.error(error.message || "Connexion impossible."),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à l'accueil</span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Connexion</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Connectez-vous directement à votre compte MAZIGHO.
            </p>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="p-7 md:p-8">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <LockKeyhole className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 text-center">Se connecter à MAZIGHO</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Utilisez votre adresse e-mail et votre mot de passe MAZIGHO.
                </p>

                <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Adresse e-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="vous@exemple.ch"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password">Mot de passe</Label>
                      <Link href="/contact" className="text-xs font-medium text-orange-600 hover:text-orange-700">
                        Besoin d’aide ?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        minLength={1}
                        required
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(value => !value)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800"
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={login.isPending}
                    className="w-full bg-orange-500 text-white hover:bg-orange-600"
                  >
                    {login.isPending ? "Connexion en cours…" : "Se connecter"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Vous n’avez pas encore de compte ?{" "}
                  <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-700">
                    Créer un compte
                  </Link>
                </p>
              </CardContent>
            </Card>

            <div className="mt-7 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <p className="text-sm text-green-900">
                Votre mot de passe est transformé en hash sécurisé côté serveur. Il n’est jamais enregistré dans le code du site ni dans votre navigateur.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
