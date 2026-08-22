import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Votre compte MAZIGHO est créé.");
      setLocation("/mon-compte");
    },
    onError: error => toast.error(error.message || "Création du compte impossible."),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    register.mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-r from-green-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à l'accueil</span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Créer un compte</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Créez votre compte directement chez MAZIGHO en quelques instants.
            </p>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="p-7 md:p-8">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <UserPlus className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 text-center">Votre compte MAZIGHO</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Vos informations servent uniquement à sécuriser votre accès et vos commandes.
                </p>

                <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nom</Label>
                    <Input id="register-name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Adresse e-mail</Label>
                    <Input id="register-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="vous@exemple.ch" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <div className="relative">
                      <Input id="register-password" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={10} required className="pr-11" />
                      <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Au moins 10 caractères.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirmation">Confirmer le mot de passe</Label>
                    <Input id="register-confirmation" type={showPassword ? "text" : "password"} value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" minLength={10} required />
                  </div>
                  <Button type="submit" disabled={register.isPending} className="w-full bg-orange-500 text-white hover:bg-orange-600">
                    {register.isPending ? "Création en cours…" : "Créer mon compte"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Vous avez déjà un compte ?{" "}
                  <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">Se connecter</Link>
                </p>
              </CardContent>
            </Card>
            <div className="mt-7 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <p className="text-sm text-green-900">Les rôles administrateur ne peuvent pas être demandés depuis ce formulaire : ils restent contrôlés par l’équipe MAZIGHO en base de données.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
