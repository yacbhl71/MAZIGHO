import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, LogOut, Heart, ShoppingBag, Settings, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocalAuth } from "@/hooks/useLocalAuth";

export default function Account() {
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useLocalAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Chargement...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
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
            {!isAuthenticated ? (
              // Non-authenticated view
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
                    <Link href="/login">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-3">
                        Se connecter
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline" className="w-full">
                        Créer un compte
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Features */}
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Pourquoi créer un compte ?
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <ShoppingBag className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">
                            <strong>Suivi de commandes</strong> - Consultez l'historique de vos achats
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Heart className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">
                            <strong>Favoris</strong> - Sauvegardez vos produits préférés
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Settings className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">
                            <strong>Paramètres</strong> - Gérez vos informations personnelles
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              // Authenticated view
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-1">
                        {user?.firstName} {user?.lastName}
                      </h2>
                      <p className="text-sm text-gray-600 break-all">
                        {user?.email}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Menu Items */}
                <div className="md:col-span-2 space-y-4">
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
                  <Link href="/parametres">
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
                  </Link>

                  {/* Logout */}
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={handleLogout}
                  >
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
            )}

            {/* Info Section */}
            <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <h3 className="font-semibold text-gray-800 mb-2">
                💡 Astuce
              </h3>
              <p className="text-gray-700">
                {isAuthenticated
                  ? "Vous êtes connecté ! Vous pouvez maintenant accéder à tous vos services MAZIGHO."
                  : "Créez un compte pour bénéficier de fonctionnalités exclusives : suivi de commande, historique d'achat, liste de souhaits, et bien plus encore !"}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
