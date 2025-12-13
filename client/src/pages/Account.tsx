import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, LogOut, Heart, ShoppingBag, Settings, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Account() {
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
            <div className="flex items-center gap-3 mb-4">
              <User className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Mon Compte
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Gérez votre profil, vos commandes et vos préférences
            </p>
          </div>
        </section>

        {/* Account Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Card */}
              <Card className="md:col-span-1">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                      Bienvenue !
                    </h2>
                    <p className="text-sm text-gray-600">
                      Connectez-vous pour accéder à votre compte
                    </p>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-3">
                    Se connecter
                  </Button>
                  <Button variant="outline" className="w-full">
                    Créer un compte
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Orders */}
                  <Link href="/commandes">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <ShoppingBag className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-1">
                              Mes Commandes
                            </h3>
                            <p className="text-sm text-gray-600">
                              Consultez l'historique de vos achats
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Favorites */}
                  <Link href="/favoris">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-red-100 p-3 rounded-lg">
                            <Heart className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-1">
                              Mes Favoris
                            </h3>
                            <p className="text-sm text-gray-600">
                              Accédez à vos produits préférés
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Settings */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <Settings className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">
                            Paramètres
                          </h3>
                          <p className="text-sm text-gray-600">
                            Modifiez vos informations personnelles
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logout */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <LogOut className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">
                            Déconnexion
                          </h3>
                          <p className="text-sm text-gray-600">
                            Quitter votre compte
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <h3 className="font-semibold text-gray-800 mb-2">
                💡 Astuce
              </h3>
              <p className="text-gray-700">
                Créez un compte pour bénéficier de fonctionnalités exclusives : suivi de commande, historique d'achat, 
                liste de souhaits, et bien plus encore !
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
