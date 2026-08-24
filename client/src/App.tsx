import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DeliveryCountryProvider } from "./contexts/DeliveryCountryContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import Home from "./pages/Home";
const Shop = lazy(() => import("./pages/Shop"));
const Creations = lazy(() => import("./pages/Creations"));
const Category = lazy(() => import("./pages/Category"));
const Product = lazy(() => import("./pages/Product"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Nouveautes = lazy(() => import("./pages/Nouveautes"));
const BestSellers = lazy(() => import("./pages/BestSellers"));
const Promos = lazy(() => import("./pages/Promos"));
const Account = lazy(() => import("./pages/Account"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminDropshipping = lazy(() => import("./pages/admin/AdminDropshipping"));
const AdminCjImport = lazy(() => import("./pages/admin/AdminCjImport"));
const AdminSuppliers = lazy(() => import("./pages/admin/AdminSuppliers"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminLegal = lazy(() => import("./pages/admin/AdminLegal"));
const AdminCustomization = lazy(() => import("./pages/admin/AdminCustomization"));
const AdminAccounting = lazy(() => import("./pages/admin/AdminAccounting"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminCreations = lazy(() => import("./pages/admin/AdminCreations"));
const AdminTranslations = lazy(() => import("./pages/admin/AdminTranslations"));
const AdminSimpleEditor = lazy(() => import("./pages/admin/AdminSimpleEditor"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Orders = lazy(() => import("./pages/Orders"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ActivateAccount = lazy(() => import("./pages/ActivateAccount"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const ShippingReturns = lazy(() => import("./pages/ShippingReturns"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function BrowserTitle() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split("?")[0];
    const adminTitles: Record<string, string> = {
      "/admin": "MAZIGHO Admin | Tableau de bord",
      "/admin/produits": "MAZIGHO Admin | Produits",
      "/admin/importation": "MAZIGHO Admin | Import fournisseur",
      "/admin/import-cj": "MAZIGHO Admin | Brouillon CJ",
      "/admin/fournisseurs": "MAZIGHO Admin | Hub fournisseurs",
      "/admin/categories": "MAZIGHO Admin | Catégories",
      "/admin/commandes": "MAZIGHO Admin | Commandes",
      "/admin/utilisateurs": "MAZIGHO Admin | Utilisateurs",
      "/admin/avis": "MAZIGHO Admin | Avis clients",
      "/admin/contenu": "MAZIGHO Admin | Contenu",
      "/admin/promotions": "MAZIGHO Admin | Promotions",
      "/admin/messages": "MAZIGHO Admin | Messages",
      "/admin/parametres": "MAZIGHO Admin | Paramètres",
      "/admin/legal": "MAZIGHO Admin | Informations légales",
      "/admin/personnalisation": "MAZIGHO Admin | Personnalisation",
      "/admin/creations": "MAZIGHO Admin | Collections créatives",
      "/admin/traductions": "MAZIGHO Admin | Langues & traductions",
      "/admin/editeur": "MAZIGHO Admin | Éditeur simple",
      "/admin/suivi-administratif": "MAZIGHO Admin | Suivi administratif",
    };
    const publicTitles: Record<string, string> = {
      "/": "MAZIGHO | Boutique en ligne",
      "/boutique": "Boutique | MAZIGHO",
      "/creations": "Collections créatives | MAZIGHO",
      "/nouveautes": "Nouveautés | MAZIGHO",
      "/best-sellers": "Meilleures ventes | MAZIGHO",
      "/meilleures-ventes": "Meilleures ventes | MAZIGHO",
      "/promos": "Promotions | MAZIGHO",
      "/panier": "Panier | MAZIGHO",
      "/commander": "Paiement sécurisé | MAZIGHO",
      "/mon-compte": "Mon compte | MAZIGHO",
      "/parametres": "Paramètres du compte | MAZIGHO",
      "/login": "Connexion | MAZIGHO",
      "/register": "Créer un compte | MAZIGHO",
      "/mot-de-passe-oublie": "Mot de passe oublié | MAZIGHO",
      "/reinitialiser-mot-de-passe": "Réinitialiser le mot de passe | MAZIGHO",
      "/activer-compte": "Activer votre compte | MAZIGHO",
      "/contact": "Contact | MAZIGHO",
      "/a-propos": "À propos | MAZIGHO",
      "/faq": "Aide | MAZIGHO",
      "/mentions-legales": "Mentions légales | MAZIGHO",
      "/confidentialite": "Confidentialité | MAZIGHO",
      "/conditions-generales": "Conditions générales | MAZIGHO",
      "/livraison-retours": "Livraison et retours | MAZIGHO",
    };

    document.title = adminTitles[pathname] || publicTitles[pathname] || "MAZIGHO | Boutique en ligne";
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <BrowserTitle />
      <Suspense fallback={null}>
        <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/boutique"} component={Shop} />
      <Route path={"/creations"} component={Creations} />
      <Route path={"/categorie/:slug"} component={Category} />
      <Route path={"/produit/:slug"} component={Product} />
      <Route path={"/a-propos"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/panier"} component={Cart} />
      <Route path={"/commander"} component={Checkout} />
      <Route path={"/commande-confirmation/:id"} component={OrderConfirmation} />
      <Route path={"/nouveautes"} component={Nouveautes} />
      <Route path={"/best-sellers"} component={BestSellers} />
      <Route path={"/meilleures-ventes"} component={BestSellers} />
      <Route path={"/promos"} component={Promos} />
      <Route path={"/mon-compte"} component={Account} />
      <Route path={"/favoris"} component={Favorites} />
      <Route path={"/commandes"} component={Orders} />
      <Route path={"/parametres"} component={SettingsPage} />
      <Route path="/login" component={Login} />
      <Route path="/mot-de-passe-oublie" component={ForgotPassword} />
      <Route path="/reinitialiser-mot-de-passe" component={ResetPassword} />
      <Route path="/activer-compte" component={ActivateAccount} />
      <Route path="/register" component={Register} />
      <Route path="/faq" component={FAQ} />
      <Route path="/mentions-legales" component={LegalNotice} />
      <Route path="/confidentialite" component={PrivacyPolicy} />
      <Route path="/conditions-generales" component={TermsAndConditions} />
      <Route path="/livraison-retours" component={ShippingReturns} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/admin/produits"} component={AdminProducts} />
        <Route path={"/admin/importation"} component={AdminDropshipping} />
        <Route path={"/admin/import-cj"} component={AdminCjImport} />
        <Route path={"/admin/fournisseurs"} component={AdminSuppliers} />
        <Route path={"/admin/categories"} component={AdminCategories} />
        <Route path={"/admin/commandes"} component={AdminOrders} />
        <Route path={"/admin/suivi-administratif"} component={AdminAccounting} />
        <Route path={"/admin/utilisateurs"} component={AdminUsers} />
        <Route path={"/admin/avis"} component={AdminReviews} />
        <Route path={"/admin/contenu"} component={AdminContent} />
        <Route path={"/admin/promotions"} component={AdminPromotions} />
        <Route path={"/admin/messages"} component={AdminMessages} />
        <Route path={"/admin/parametres"} component={AdminSettings} />
        <Route path={"/admin/legal"} component={AdminLegal} />
        <Route path={"/admin/personnalisation"} component={AdminCustomization} />
        <Route path={"/admin/creations"} component={AdminCreations} />
        <Route path={"/admin/traductions"} component={AdminTranslations} />
        <Route path={"/admin/editeur"} component={AdminSimpleEditor} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LocaleProvider>
          <DeliveryCountryProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </DeliveryCountryProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
