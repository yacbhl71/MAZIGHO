import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DeliveryCountryProvider } from "./contexts/DeliveryCountryContext";
import { MarketingConsentProvider } from "./contexts/MarketingConsentContext";
import { MarketingConsentBanner } from "./components/MarketingConsentBanner";
import { MarketingPixels } from "./components/MarketingPixels";
import { LocaleProvider } from "./contexts/LocaleContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { MaintenancePage } from "./components/MaintenancePage";
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
const AdminStudio = lazy(() => import("./pages/admin/AdminStudio"));
const AdminStudioPreview = lazy(() => import("./pages/admin/AdminStudioPreview"));
const AdminStudioOwnerWorkspacePreview = lazy(() => import("./pages/admin/AdminStudioOwnerWorkspacePreview"));
const AdminStudioOwnerBuilder = lazy(() => import("./pages/admin/AdminStudioOwnerBuilder"));
const AdminStudioOwnerPageEditor = lazy(() => import("./pages/admin/AdminStudioOwnerPageEditor"));
const AdminStudioPreparationChecklist = lazy(() => import("./pages/admin/AdminStudioPreparationChecklist"));
const AdminStudioOwnerNavigation = lazy(() => import("./pages/admin/AdminStudioOwnerNavigation"));
const AdminStudioOwnerFullPagePreview = lazy(() => import("./pages/admin/AdminStudioOwnerFullPagePreview"));
const AdminStudioLaunchCenter = lazy(() => import("./pages/admin/AdminStudioLaunchCenter"));
const AdminStudioOwnerCollections = lazy(() => import("./pages/admin/AdminStudioOwnerCollections"));
const AdminStudioOwnerProducts = lazy(() => import("./pages/admin/AdminStudioOwnerProducts"));
const AdminStudioOwnerProductOperations = lazy(() => import("./pages/admin/AdminStudioOwnerProductOperations"));
const AdminStudioOwnerPrivateCartSimulation = lazy(() => import("./pages/admin/AdminStudioOwnerPrivateCartSimulation"));
const AdminStudioOwnerCommercialPreflight = lazy(() => import("./pages/admin/AdminStudioOwnerCommercialPreflight"));
const AdminStudioOwnerSetupIsolationReview = lazy(() => import("./pages/admin/AdminStudioOwnerSetupIsolationReview"));
const AdminStudioOwnerManualCommercialPassageReview = lazy(() => import("./pages/admin/AdminStudioOwnerManualCommercialPassageReview"));
const AdminStudioOwnerCataloguePublication = lazy(() => import("./pages/admin/AdminStudioOwnerCataloguePublication"));
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
const AdminSetupWizard = lazy(() => import("./pages/admin/AdminSetupWizard"));
const AdminLegal = lazy(() => import("./pages/admin/AdminLegal"));
const AdminCustomization = lazy(() => import("./pages/admin/AdminCustomization"));
const AdminAccounting = lazy(() => import("./pages/admin/AdminAccounting"));
const AdminComptabilite = lazy(() => import("./pages/admin/AdminComptabilite"));
const AdminSystemHealth = lazy(() => import("./pages/admin/AdminSystemHealth"));
const AdminMaintenance = lazy(() => import("./pages/admin/AdminMaintenance"));
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns"));
const AdminConversion = lazy(() => import("./pages/admin/AdminConversion"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminCreations = lazy(() => import("./pages/admin/AdminCreations"));
const AdminTranslations = lazy(() => import("./pages/admin/AdminTranslations"));
const AdminSimpleEditor = lazy(() => import("./pages/admin/AdminSimpleEditor"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminOdoo = lazy(() => import("./pages/admin/AdminOdoo"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const StaffCatalog = lazy(() => import("./pages/admin/StaffCatalog"));
const StaffSupport = lazy(() => import("./pages/admin/StaffSupport"));
const StaffOrders = lazy(() => import("./pages/admin/StaffOrders"));
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

function StorefrontUnavailablePage() {
  useEffect(() => {
    document.title = "Boutique en préparation";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Accès temporairement fermé</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cette boutique est en préparation</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">Elle n’est pas encore ouverte au public. Aucun catalogue, panier, paiement ou espace d’administration n’est disponible sur cette adresse.</p>
      </div>
    </main>
  );
}

function BrowserTitle() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split("?")[0];
    const adminTitles: Record<string, string> = {
      "/admin": "MAZIGHO Admin | Tableau de bord",
      "/admin/studio": "MAZIGHO Studio | Console opérateur",
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
      "/admin/demarrage": "MAZIGHO Admin | Démarrage sécurisé",
      "/admin/legal": "MAZIGHO Admin | Informations légales",
      "/admin/personnalisation": "MAZIGHO Admin | Personnalisation",
      "/admin/creations": "MAZIGHO Admin | Collections créatives",
      "/admin/traductions": "MAZIGHO Admin | Langues & traductions",
      "/admin/editeur": "MAZIGHO Admin | Éditeur simple",
      "/admin/suivi-administratif": "MAZIGHO Admin | Suivi administratif",
      "/admin/comptabilite": "MAZIGHO Admin | Export comptable & TVA",
      "/admin/sante": "MAZIGHO Admin | Santé du système",
      "/admin/maintenance": "MAZIGHO Admin | Mode maintenance",
      "/admin/campagnes": "MAZIGHO Admin | Campagnes & bannières",
      "/admin/conversion": "MAZIGHO Admin | Taux de conversion",
      "/admin/seo": "MAZIGHO Admin | SEO & indexation",
      "/admin/audit": "MAZIGHO Admin | Journal d'audit",
      "/admin/paniers-abandonnes": "MAZIGHO Admin | Paniers abandonnés",
      "/admin/emails": "MAZIGHO Admin | E-mails transactionnels",
      "/admin/retours": "MAZIGHO Admin | Retours & remboursements",
      "/admin/catalogue-brouillons": "MAZIGHO | Éditeur catalogue",
      "/admin/assistance": "MAZIGHO | Service client",
      "/admin/operations-commandes": "MAZIGHO | Opérateur commandes",
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

    document.title = pathname.startsWith("/admin/studio/publication-catalogue/") ? "MAZIGHO Studio | Publication catalogue" : pathname.startsWith("/admin/studio/revue-passage/") ? "MAZIGHO Studio | Revue de passage" : pathname.startsWith("/admin/studio/revue-etancheite/") ? "MAZIGHO Studio | Revue d’étanchéité" : pathname.startsWith("/admin/studio/prevol-commercial/") ? "MAZIGHO Studio | Revue commerciale" : pathname.startsWith("/admin/studio/panier-simulation/") ? "MAZIGHO Studio | Panier simulé" : pathname.startsWith("/admin/studio/stock-fournisseurs/") ? "MAZIGHO Studio | Stock et fournisseur" : pathname.startsWith("/admin/studio/produits/") ? "MAZIGHO Studio | Fiches produits" : pathname.startsWith("/admin/studio/collections/") ? "MAZIGHO Studio | Collections de boutique" : pathname.startsWith("/admin/studio/lancement/") ? "MAZIGHO Studio | Centre de lancement" : pathname.startsWith("/admin/studio/page-preview/") ? "MAZIGHO Studio | Aperçu complet" : pathname.startsWith("/admin/studio/navigation/") ? "MAZIGHO Studio | Navigation de boutique" : pathname.startsWith("/admin/studio/checklist/") ? "MAZIGHO Studio | Checklist de préparation" : pathname.startsWith("/admin/studio/pages/") ? "MAZIGHO Studio | Éditeur de pages" : pathname.startsWith("/admin/studio/constructeur/") ? "MAZIGHO Studio | Créateur de boutique" : pathname.startsWith("/admin/studio/espace-proprietaire/") ? "MAZIGHO Studio | Aperçu panneau propriétaire" : pathname.startsWith("/admin/studio/apercu/") ? "MAZIGHO Studio | Aperçu privé" : adminTitles[pathname] || publicTitles[pathname] || "MAZIGHO | Boutique en ligne";
  }, [location]);

  return null;
}

function Router() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: maintenance } = trpc.content.getMaintenance.useQuery(undefined, { refetchInterval: 60000 });
  const storefrontAvailabilityQuery = trpc.storefront.getAvailability.useQuery(undefined, { refetchOnWindowFocus: false });
  const path = location.split("?")[0];
  const STAFF_ROLES = ["admin", "catalog_editor", "order_operator", "support_agent"];
  const isStaff = !!user && STAFF_ROLES.includes((user as any).role);
  const isExemptPath =
    path.startsWith("/admin") ||
    ["/login", "/register", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/activer-compte"].includes(path);
  const forcePreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview_maintenance") === "1";

  if (storefrontAvailabilityQuery.isLoading) {
    return <div className="min-h-screen bg-slate-950" aria-busy="true" />;
  }

  if (!storefrontAvailabilityQuery.data?.publicStorefront) {
    return <StorefrontUnavailablePage />;
  }

  if (maintenance && (forcePreview || (maintenance.enabled && !isStaff && !isExemptPath))) {
    return (
      <>
        <ScrollToTop />
        <MaintenancePage title={maintenance.title} message={maintenance.message} />
      </>
    );
  }

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
      <Route path={"/produit/:key"} component={Product} />
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
        <Route path={"/admin/studio/collections/:storeId"} component={AdminStudioOwnerCollections} />
        <Route path={"/admin/studio/produits/:storeId"} component={AdminStudioOwnerProducts} />
        <Route path={"/admin/studio/stock-fournisseurs/:storeId"} component={AdminStudioOwnerProductOperations} />
        <Route path={"/admin/studio/panier-simulation/:storeId"} component={AdminStudioOwnerPrivateCartSimulation} />
        <Route path={"/admin/studio/prevol-commercial/:storeId"} component={AdminStudioOwnerCommercialPreflight} />
        <Route path={"/admin/studio/revue-etancheite/:storeId"} component={AdminStudioOwnerSetupIsolationReview} />
        <Route path={"/admin/studio/revue-passage/:storeId"} component={AdminStudioOwnerManualCommercialPassageReview} />
        <Route path={"/admin/studio/publication-catalogue/:storeId"} component={AdminStudioOwnerCataloguePublication} />
        <Route path={"/admin/studio/lancement/:storeId"} component={AdminStudioLaunchCenter} />
        <Route path={"/admin/studio/page-preview/:storeId"} component={AdminStudioOwnerFullPagePreview} />
        <Route path={"/admin/studio/navigation/:storeId"} component={AdminStudioOwnerNavigation} />
        <Route path={"/admin/studio/checklist/:storeId"} component={AdminStudioPreparationChecklist} />
        <Route path={"/admin/studio/pages/:storeId"} component={AdminStudioOwnerPageEditor} />
        <Route path={"/admin/studio/constructeur/:storeId"} component={AdminStudioOwnerBuilder} />
        <Route path={"/admin/studio/espace-proprietaire/:storeId"} component={AdminStudioOwnerWorkspacePreview} />
        <Route path={"/admin/studio/apercu/:storeId"} component={AdminStudioPreview} />
        <Route path={"/admin/studio"} component={AdminStudio} />
        <Route path={"/admin/produits"} component={AdminProducts} />
        <Route path={"/admin/importation"} component={AdminDropshipping} />
        <Route path={"/admin/import-cj"} component={AdminCjImport} />
        <Route path={"/admin/fournisseurs"} component={AdminSuppliers} />
        <Route path={"/admin/categories"} component={AdminCategories} />
        <Route path={"/admin/commandes"} component={AdminOrders} />
        <Route path={"/admin/suivi-administratif"} component={AdminAccounting} />
        <Route path={"/admin/comptabilite"} component={AdminComptabilite} />
        <Route path={"/admin/sante"} component={AdminSystemHealth} />
        <Route path={"/admin/maintenance"} component={AdminMaintenance} />
        <Route path={"/admin/campagnes"} component={AdminCampaigns} />
        <Route path={"/admin/conversion"} component={AdminConversion} />
        <Route path={"/admin/utilisateurs"} component={AdminUsers} />
        <Route path={"/admin/avis"} component={AdminReviews} />
        <Route path={"/admin/contenu"} component={AdminContent} />
        <Route path={"/admin/promotions"} component={AdminPromotions} />
        <Route path={"/admin/messages"} component={AdminMessages} />
        <Route path={"/admin/parametres"} component={AdminSettings} />
        <Route path={"/admin/demarrage"} component={AdminSetupWizard} />
        <Route path={"/admin/legal"} component={AdminLegal} />
        <Route path={"/admin/personnalisation"} component={AdminCustomization} />
        <Route path={"/admin/creations"} component={AdminCreations} />
        <Route path={"/admin/traductions"} component={AdminTranslations} />
        <Route path={"/admin/editeur"} component={AdminSimpleEditor} />
        <Route path={"/admin/seo"} component={AdminSEO} />
        <Route path={"/admin/suivi-odoo"} component={AdminOdoo} />
        <Route path={"/admin/audit"} component={AdminAudit} />
        <Route path={"/admin/paniers-abandonnes"} component={AdminMarketing} />
        <Route path={"/admin/emails"} component={AdminEmails} />
        <Route path={"/admin/retours"} component={AdminReturns} />
        <Route path={"/admin/catalogue-brouillons"} component={StaffCatalog} />
        <Route path={"/admin/assistance"} component={StaffSupport} />
        <Route path={"/admin/operations-commandes"} component={StaffOrders} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
        </Switch>
      </Suspense>
      <MarketingPixels />
      <MarketingConsentBanner />
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
      <ThemeProvider defaultTheme="light" switchable>
        <LocaleProvider>
          <DeliveryCountryProvider>
            <MarketingConsentProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </MarketingConsentProvider>
          </DeliveryCountryProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
