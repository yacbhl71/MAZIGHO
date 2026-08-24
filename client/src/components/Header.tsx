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
  const standardCategories = categories.filter(category => category.catalogSection !== "creations");
  const creativeCategories = categories.filter(category => category.catalogSection === "creations");
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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-white">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-7 gap-y-1 text-xs font-medium md:text-sm">
          <span>Une sélection pensée pour le quotidien</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/70 sm:block" aria-hidden="true" />
          <span>Livraison transparente selon la destination</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/70 sm:block" aria-hidden="true" />
          <span>Coût et délai confirmés avant achat</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 xl:gap-5">
          {/* Logo */}
          <Link href="/">
            <div className="group flex cursor-pointer items-center gap-2 border-r border-slate-200 pr-4 xl:pr-5" aria-label="Accueil MAZIGHO">
              <span className="whitespace-nowrap text-lg font-semibold tracking-[0.13em] text-orange-500 transition-colors group-hover:text-orange-600 sm:text-xl">MAZIGHO</span>
              <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex flex-shrink-0 items-center gap-0.5">
            <Link href="/">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                Accueil
              </span>
            </Link>

            <Link href="/boutique">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/boutique") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
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
                className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-500"
              >
                Catégories
                <span className={`text-xs transition-transform ${openDropdown === 1 ? "rotate-180" : ""}`}>▼</span>
              </button>
              <div className={`absolute left-0 top-full z-50 mt-2 w-[420px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${openDropdown === 1 ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}>
                <div className="mb-3 border-b border-gray-100 pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Explorer par univers</p>
                  <p className="mt-1 text-xs text-gray-500">Choisissez une catégorie pour découvrir sa sélection.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {standardCategories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div onClick={() => setOpenDropdown(null)} className="flex min-h-[58px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-orange-50">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">{(cat as any).icon || "✦"}</span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-800">{cat.name}</h3>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{cat.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/boutique"><div onClick={() => setOpenDropdown(null)} className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold uppercase tracking-wider text-orange-500">Voir toutes les catégories <span>→</span></div></Link>
              </div>
            </div>

            {/* Collections créatives MAZIGHO : univers autonome, visible pour tous les pays. */}
            <div className="relative group">
              <button
                type="button"
                aria-expanded={openDropdown === 2}
                onClick={() => setOpenDropdown(openDropdown === 2 ? null : 2)}
                className={`flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors ${isActive("/creations") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"}`}
              >
                Créations
                <span className={`text-xs transition-transform ${openDropdown === 2 ? "rotate-180" : ""}`}>▼</span>
              </button>
              <div className={`absolute left-0 top-full z-50 mt-2 w-[380px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${openDropdown === 2 ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}>
                <div className="mb-3 border-b border-rose-100 pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Collections créatives</p>
                  <p className="mt-1 text-xs text-gray-500">Un univers artistique séparé de la boutique fournisseurs.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {creativeCategories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div onClick={() => setOpenDropdown(null)} className="flex min-h-[54px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-orange-50">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">{(cat as any).icon || "✦"}</span>
                        <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-gray-800">{cat.name}</h3><p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{cat.description}</p></div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/creations"><div onClick={() => setOpenDropdown(null)} className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold uppercase tracking-wider text-orange-500">Voir toutes les créations <span>→</span></div></Link>
              </div>
            </div>

            <Link href="/nouveautes">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/nouveautes") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                Nouveautés
              </span>
            </Link>

            <Link href="/best-sellers">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/best-sellers") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                Best-sellers
              </span>
            </Link>

            <Link href="/promos">
              <span className={`cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/promos") ? "border-orange-500 text-orange-500" : "border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                Promos
              </span>
            </Link>

            <Link href="/contact">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/contact") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                Contact
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xs mx-4">
            <SearchBar />
          </div>

          <div className="hidden md:flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600" title="Ce choix ne demande aucune adresse et sert uniquement à afficher les produits livrables."><MapPin className="h-3.5 w-3.5 text-orange-500" /><label className="sr-only" htmlFor="delivery-country">Pays de livraison</label><select id="delivery-country" value={countryCode} onChange={event => setCountryCode(event.target.value as typeof countryCode)} className="max-w-28 bg-transparent font-semibold outline-none"><option disabled value="">Pays</option>{deliveryCountries.map(country => <option key={country.code} value={country.code}>{country.label}</option>)}</select></div>

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
              <Button className="hidden h-auto gap-2 bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600 sm:inline-flex">
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
                  {standardCategories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div className="px-4 py-2 hover:bg-white rounded cursor-pointer text-xs">
                        {(cat as any).icon || "📦"} {cat.name}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Link href="/creations">
                <div onClick={() => setIsMenuOpen(false)} className="px-4 py-2 hover:bg-rose-50 rounded cursor-pointer text-sm font-medium text-rose-700">Collections créatives</div>
              </Link>
              <button
                onClick={() => setOpenDropdown(openDropdown === 3 ? null : 3)}
                className="w-full text-left px-4 py-2 hover:bg-rose-50 rounded font-medium flex items-center justify-between text-xs text-rose-700"
              >
                Explorer les collections
                <span className={`transition-transform text-xs ${openDropdown === 3 ? "rotate-180" : ""}`}>▼</span>
              </button>
              {openDropdown === 3 && (
                <div className="bg-rose-50 rounded space-y-1 p-2">
                  {creativeCategories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div onClick={() => { setOpenDropdown(null); setIsMenuOpen(false); }} className="px-4 py-2 hover:bg-white rounded cursor-pointer text-xs">{(cat as any).icon || "✦"} {cat.name}</div>
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
