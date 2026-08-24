import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DeliveryCountryProvider } from "./contexts/DeliveryCountryContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Creations from "./pages/Creations";
import Category from "./pages/Category";
import Product from "./pages/Product";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Nouveautes from "./pages/Nouveautes";
import BestSellers from "./pages/BestSellers";
import Promos from "./pages/Promos";
import Account from "./pages/Account";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminDropshipping from "./pages/admin/AdminDropshipping";
import AdminCjImport from "./pages/admin/AdminCjImport";
import AdminSuppliers from "./pages/admin/AdminSuppliers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLegal from "./pages/admin/AdminLegal";
import AdminCustomization from "./pages/admin/AdminCustomization";
import AdminAccounting from "./pages/admin/AdminAccounting";
import AdminContent from "./pages/admin/AdminContent";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminCreations from "./pages/admin/AdminCreations";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Favorites from "./pages/Favorites";
import Orders from "./pages/Orders";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FAQ from "./pages/FAQ";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ActivateAccount from "./pages/ActivateAccount";
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ShippingReturns from "./pages/ShippingReturns";

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
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
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
        <DeliveryCountryProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </DeliveryCountryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
