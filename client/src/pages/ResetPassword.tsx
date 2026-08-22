import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLoginUrl } from "@/const";

export default function ResetPassword() {
  const startSecureRecovery = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/login">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à la connexion</span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Récupérer votre accès
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              La récupération du compte est traitée par le fournisseur d’authentification sécurisé.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <KeyRound className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">Mot de passe oublié ?</h2>
                <p className="mt-3 text-gray-600">
                  MAZIGHO ne stocke pas de mots de passe dans le navigateur. Cliquez ci-dessous pour suivre le parcours de récupération proposé par le service d’authentification.
                </p>
                <Button
                  type="button"
                  onClick={startSecureRecovery}
                  className="mt-8 w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  Ouvrir le parcours sécurisé
                </Button>
              </CardContent>
            </Card>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5 text-left">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <p className="text-sm text-green-900">
                Ne communiquez jamais un code ou un mot de passe à un tiers, même s’il prétend représenter MAZIGHO.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
