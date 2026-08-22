import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLoginUrl } from "@/const";

export default function Register() {
  const startSecureRegistration = () => {
    window.location.href = getLoginUrl();
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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Créer un compte
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Rejoignez MAZIGHO sans transmettre votre mot de passe à notre boutique.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <UserPlus className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">Créer votre compte MAZIGHO</h2>
                <p className="mt-3 text-gray-600">
                  L’inscription et la connexion passent par notre fournisseur d’authentification sécurisé. Les mots de passe ne sont jamais enregistrés dans le code ou le stockage du navigateur.
                </p>
                <Button
                  type="button"
                  onClick={startSecureRegistration}
                  className="mt-8 w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  Continuer vers l’inscription
                </Button>
                <p className="mt-5 text-xs text-gray-500">
                  Vous avez déjà un compte ? Le même bouton vous permet de vous connecter.
                </p>
              </CardContent>
            </Card>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5 text-left">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <p className="text-sm text-green-900">
                Les autorisations d’administration sont déterminées exclusivement par le rôle conservé en base de données et contrôlé côté serveur.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
