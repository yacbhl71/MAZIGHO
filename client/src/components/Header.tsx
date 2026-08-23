import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, ShoppingCart, User, LayoutDashboard, MapPin } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import SearchBar from "./SearchBar";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/_core/hooks/useAuth";
import { deliveryCountries, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [location] = useLocation();
  
  const categoriesQuery = trpc.categories.getAll.useQuery();
  const categories = categoriesQuery.data || [];
  const { getItemCount } = useCart();
  const { favorites } = useFavorites();
  const cartCount = getItemCount();
  const favoritesCount = favorites.length;
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";
  const { countryCode, setCountryCode } = useDeliveryCountry();

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-6 text-xs md:text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <span>Une sélection pensée pour le quotidien</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🚚</span>
            <span>Livraison selon pays disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📦</span>
            <span>Coût et délai affichés par produit</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
              <div className="bg-gray-800 p-1.5 rounded">
                <span className="text-orange-500 text-lg font-bold">≡</span>
              </div>
              <span className="text-lg font-bold text-orange-500 hidden sm:inline whitespace-nowrap">
                MAZIGHO
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            <Link href="/">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/") ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              }`}>
                Accueil
              </span>
            </Link>

            <Link href="/boutique">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/boutique") ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              }`}>
                Boutique
              </span>
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group">
              <button
                type="button"
                aria-expanded={openDropdown === 1}
                onClick={() => setOpenDropdown(openDropdown === 1 ? null : 1)}
                className="flex items-center gap-1 rounded bg-orange-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-orange-200 hover:text-orange-600"
              >
                Catégories
                <span className={`text-xs transition-transform ${openDropdown === 1 ? "rotate-180" : ""}`}>▼</span>
              </button>
              <div className={`absolute left-0 top-full mt-2 w-[420px] rounded-2xl border border-orange-100 bg-white p-4 shadow-2xl transition-all duration-200 z-50 ${openDropdown === 1 ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}>
                <div className="mb-3 border-b border-gray-100 pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Explorer par univers</p>
                  <p className="mt-1 text-xs text-gray-500">Choisissez une catégorie pour découvrir sa sélection.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div onClick={() => setOpenDropdown(null)} className="flex min-h-[58px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-orange-50">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">{(cat as any).icon || "✦"}</span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-800">{cat.name}</h3>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{cat.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/boutique"><div onClick={() => setOpenDropdown(null)} className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-bold uppercase tracking-wider text-orange-600">Voir toutes les catégories <span>→</span></div></Link>
              </div>
            </div>

            <Link href="/nouveautes">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/nouveautes") ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              }`}>
                Nouveautés
              </span>
            </Link>

            <Link href="/best-sellers">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/best-sellers") ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              }`}>
                Best-sellers
              </span>
            </Link>

            <Link href="/promos">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded text-orange-500 transition-colors ${
                isActive("/promos") ? "bg-orange-50" : "hover:bg-orange-50"
              }`}>
                Promos
              </span>
            </Link>

            <Link href="/contact">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/contact") ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              }`}>
                Contact
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xs mx-4">
            <SearchBar />
          </div>

          <div className="hidden md:flex items-center gap-1 rounded-lg border border-orange-100 bg-orange-50 px-2 py-1.5 text-xs text-slate-700" title="Ce choix ne demande aucune adresse et sert uniquement à afficher les produits livrables."><MapPin className="h-3.5 w-3.5 text-orange-600" /><label className="sr-only" htmlFor="delivery-country">Pays de livraison</label><select id="delivery-country" value={countryCode} onChange={event => setCountryCode(event.target.value as typeof countryCode)} className="max-w-28 bg-transparent font-semibold outline-none"><option disabled value="">Pays</option>{deliveryCountries.map(country => <option key={country.code} value={country.code}>{country.label}</option>)}</select></div>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <Link href="/favoris">
              <div className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer hidden sm:block">
                <Heart className="h-5 w-5 text-gray-700" />
                {favoritesCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </div>
            </Link>
            <Link href="/panier">
              <div className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
            <Link href="/mon-compte">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white hidden sm:inline-flex gap-2 text-sm px-3 py-2 h-auto">
                <User className="h-4 w-4" />
                <span>Mon compte</span>
              </Button>
            </Link>
            {isAdmin && <Link href="/admin"><Button variant="outline" className="hidden xl:inline-flex gap-2 border-slate-300 bg-slate-900 text-sm text-white hover:bg-slate-800 hover:text-white"><LayoutDashboard className="h-4 w-4" /><span>Gestion MAZIGHO</span></Button></Link>}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-3">
          <SearchBar />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-2">
            <label className="mx-4 flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-slate-700"><MapPin className="h-4 w-4 text-orange-600" /><span className="font-medium">Livrer vers</span><select value={countryCode} onChange={event => setCountryCode(event.target.value as typeof countryCode)} className="ml-auto bg-transparent font-semibold outline-none">{deliveryCountries.map(country => <option key={country.code} value={country.code}>{country.label}</option>)}</select></label>
            <Link href="/">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                Accueil
              </div>
            </Link>
            <Link href="/boutique">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                Boutique
              </div>
            </Link>

            {/* Mobile Categories */}
            <div className="space-y-1">
              <button
                onClick={() => setOpenDropdown(openDropdown === 0 ? null : 0)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded font-medium flex items-center justify-between text-sm"
              >
                Catégories
                <span className={`transition-transform text-xs ${openDropdown === 0 ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {openDropdown === 0 && (
                <div className="bg-gray-50 rounded space-y-1 p-2">
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div className="px-4 py-2 hover:bg-white rounded cursor-pointer text-xs">
                        {(cat as any).icon || "📦"} {cat.name}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/nouveautes">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                Nouveautés
              </div>
            </Link>

            <Link href="/best-sellers">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                Best-sellers
              </div>
            </Link>

            <Link href="/promos">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm text-orange-500 font-semibold">
                Promos
              </div>
            </Link>

            <Link href="/contact">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                Contact
              </div>
            </Link>

            <Link href="/mon-compte"><Button className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 mt-4 text-sm"><User className="h-4 w-4" /> Mon compte</Button></Link>
            {isAdmin && <Link href="/admin"><Button variant="outline" className="mt-2 w-full gap-2 border-slate-300 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"><LayoutDashboard className="h-4 w-4" /> Gestion MAZIGHO</Button></Link>}
          </div>
        )}
      </nav>
    </header>
  );
}
