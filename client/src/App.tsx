import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Category from "./pages/Category";
import Product from "./pages/Product";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Nouveautes from "./pages/Nouveautes";
import BestSellers from "./pages/BestSellers";
import Promos from "./pages/Promos";
import Account from "./pages/Account";
import Favorites from "./pages/Favorites";
import Orders from "./pages/Orders";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import FAQ from "./pages/FAQ";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/boutique"} component={Shop} />
      <Route path={"/categorie/:slug"} component={Category} />
      <Route path={"/produit/:slug"} component={Product} />
      <Route path={"/a-propos"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/panier"} component={Cart} />
      <Route path={"/nouveautes"} component={Nouveautes} />
      <Route path={"/best-sellers"} component={BestSellers} />
      <Route path={"/promos"} component={Promos} />
      <Route path={"/mon-compte"} component={Account} />
      <Route path={"/favoris"} component={Favorites} />
      <Route path={"/commandes"} component={Orders} />
      <Route path={"/parametres"} component={SettingsPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/faq" component={FAQ} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
