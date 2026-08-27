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
import { localeOptions, useLocale } from "@/contexts/LocaleContext";
import { t } from "@/lib/i18n";
import { getCreativeMenuCopy, getPublicCopy } from "@/lib/publicCopy";
import { getLocalizedCountryName } from "@/lib/countryLocale";
import { getLocalizedCategoryPresentation, getStandardCategoryFallbacks, getCreativeCategoryFallbacks } from "@/lib/categoryPresentation";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import ThemeToggle from "./ThemeToggle";

const countryFlags: Record<string, string> = { CH: "🇨🇭", FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹", AT: "🇦🇹", BE: "🇧🇪", NL: "🇳🇱", ES: "🇪🇸" };
const languageFlags: Record<string, string> = { fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", en: "🇬🇧", es: "🇪🇸", nl: "🇳🇱", ar: "🌐" };

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [location] = useLocation();
  
  const { getItemCount } = useCart();
  const { favorites } = useFavorites();
  const cartCount = getItemCount();
  const favoritesCount = favorites.length;
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";
  const { countryCode, setCountryCode } = useDeliveryCountry();
  const { locale, setLocale } = useLocale();
  const categoriesQuery = trpc.categories.getAll.useQuery(locale);
  const categories = categoriesQuery.data?.length
    ? categoriesQuery.data.map(category => getLocalizedCategoryPresentation(locale, category))
    : [...getStandardCategoryFallbacks(locale), ...getCreativeCategoryFallbacks(locale)];
  const standardCategories = categories.filter(category => category.catalogSection !== "creations");
  const creativeCategories = categories.filter(category => category.catalogSection === "creations");
  const { profile } = useDesignProfile();
  const copy = getPublicCopy(locale);
  const creativeCopy = getCreativeMenuCopy(locale);
  const savedNavigation = locale === "fr" ? undefined : profile.navigationTranslations[locale];
  const navigation = locale === "fr" ? {
    home: profile.navigationHome,
    shop: profile.navigationShop,
    categories: profile.navigationCategories,
    creations: profile.navigationCreations,
    contact: profile.navigationContact,
  } : savedNavigation ? {
    home: savedNavigation.navigationHome,
    shop: savedNavigation.navigationShop,
    categories: savedNavigation.navigationCategories,
    creations: savedNavigation.navigationCreations,
    contact: savedNavigation.navigationContact,
  } : {
    home: t(locale, "home"),
    shop: t(locale, "shop"),
    categories: t(locale, "categories"),
    creations: t(locale, "creations"),
    contact: t(locale, "contact"),
  };

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-white">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-7 gap-y-1 text-xs font-medium md:text-sm">
          <span>{t(locale, "topSelection")}</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/70 sm:block" aria-hidden="true" />
          <span>{t(locale, "topDelivery")}</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/70 sm:block" aria-hidden="true" />
          <span>{t(locale, "topQuote")}</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-3 py-2 xl:px-4 xl:py-2.5">
        <div className="flex items-center justify-between gap-2 xl:gap-3">
          {/* Logo */}
          <Link href="/" aria-label="Accueil MAZIGHO">
            <div className="group flex cursor-pointer items-center gap-1.5 border-r border-slate-200 pr-2 xl:pr-3">
              <span className="whitespace-nowrap text-base font-semibold tracking-[0.11em] text-orange-700 transition-colors group-hover:text-orange-800 xl:text-lg">MAZIGHO</span>
              <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden xl:flex flex-shrink-0 items-center gap-0">
            <Link href="/">
              <span className={`cursor-pointer font-medium text-xs px-1.5 py-1.5 rounded transition-colors ${
                isActive("/") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                {navigation.home}
              </span>
            </Link>

            <Link href="/boutique">
              <span className={`cursor-pointer font-medium text-xs px-1.5 py-1.5 rounded transition-colors ${
                isActive("/boutique") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                {navigation.shop}
              </span>
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group">
              <button
                type="button"
                aria-expanded={openDropdown === 1}
                onClick={() => setOpenDropdown(openDropdown === 1 ? null : 1)}
                className="flex items-center gap-0.5 rounded px-1.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-500"
              >
                {navigation.categories}
                <span className={`text-xs transition-transform ${openDropdown === 1 ? "rotate-180" : ""}`}>▼</span>
              </button>
              <div className={`absolute left-0 top-full z-50 mt-2 w-[420px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${openDropdown === 1 ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}>
                <div className="mb-3 border-b border-gray-100 pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">{t(locale, "exploreUniverse")}</p>
                  <p className="mt-1 text-xs text-gray-500">{copy.discovery.text}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {standardCategories.map((cat) => {
                    return <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div onClick={() => setOpenDropdown(null)} className="flex min-h-[58px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-orange-50">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">{(cat as any).icon || "✦"}</span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-800">{cat.name}</h3>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{cat.description}</p>
                        </div>
                      </div>
                    </Link>;
                  })}
                </div>
                <Link href="/boutique"><div onClick={() => setOpenDropdown(null)} className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold uppercase tracking-wider text-orange-500">{copy.discovery.allShop} <span>→</span></div></Link>
              </div>
            </div>

            {/* Collections créatives MAZIGHO : univers autonome, visible pour tous les pays. */}
            <div className="relative group">
              <button
                type="button"
                aria-expanded={openDropdown === 2}
                onClick={() => setOpenDropdown(openDropdown === 2 ? null : 2)}
                className={`flex items-center gap-0.5 rounded px-1.5 py-1.5 text-xs font-medium transition-colors ${isActive("/creations") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"}`}
              >
                {navigation.creations}
                <span className={`text-xs transition-transform ${openDropdown === 2 ? "rotate-180" : ""}`}>▼</span>
              </button>
              <div className={`absolute left-0 top-full z-50 mt-2 w-[380px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${openDropdown === 2 ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}>
                <div className="mb-3 border-b border-rose-100 pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">{creativeCopy.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{creativeCopy.intro}</p>
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
                <Link href="/creations"><div onClick={() => setOpenDropdown(null)} className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold uppercase tracking-wider text-orange-500">{creativeCopy.all} <span>→</span></div></Link>
              </div>
            </div>

            <Link href="/nouveautes">
              <span className={`cursor-pointer font-medium text-xs px-1.5 py-1.5 rounded transition-colors ${
                isActive("/nouveautes") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                {t(locale, "new")}
              </span>
            </Link>

            <Link href="/best-sellers">
              <span className={`cursor-pointer font-medium text-xs px-1.5 py-1.5 rounded transition-colors ${
                isActive("/best-sellers") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                {t(locale, "bestSellers")}
              </span>
            </Link>

            <Link href="/promos">
              <span className={`cursor-pointer border-b-2 px-1.5 py-1.5 text-xs font-medium transition-colors ${
                isActive("/promos") ? "border-orange-500 text-orange-500" : "border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                {t(locale, "promotions")}
              </span>
            </Link>

            <Link href="/contact">
              <span className={`cursor-pointer font-medium text-xs px-1.5 py-1.5 rounded transition-colors ${
                isActive("/contact") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"
              }`}>
                {navigation.contact}
              </span>
            </Link>

          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden xl:block w-32 flex-none mx-1">
            <SearchBar />
          </div>

          <div className="hidden xl:flex items-center rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600" title={`${t(locale, "deliveryCountry")} : ${getLocalizedCountryName(countryCode, locale)}`}><label className="sr-only" htmlFor="delivery-country">{t(locale, "deliveryCountry")}</label><select id="delivery-country" aria-label={`${t(locale, "deliveryCountry")} : ${getLocalizedCountryName(countryCode, locale)}`} value={countryCode} onChange={event => setCountryCode(event.target.value as typeof countryCode)} className="w-[4.65rem] bg-transparent font-semibold outline-none"><option disabled value="">🌐 --</option>{deliveryCountries.map(country => <option key={country.code} value={country.code}>{`${countryFlags[country.code] || "🌐"} ${country.code}`}</option>)}</select></div>

          <div className="hidden xl:flex items-center rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600" title={`${t(locale, "displayLanguage")} : ${localeOptions.find(option => option.code === locale)?.nativeLabel || locale}`}><label className="sr-only" htmlFor="storefront-language">{t(locale, "displayLanguage")}</label><select id="storefront-language" aria-label={`${t(locale, "displayLanguage")} : ${localeOptions.find(option => option.code === locale)?.nativeLabel || locale}`} value={locale} onChange={event => setLocale(event.target.value as typeof locale)} className="w-[4.65rem] bg-transparent font-semibold outline-none">{localeOptions.map(option => <option key={option.code} value={option.code}>{`${languageFlags[option.code] || "🌐"} ${option.code.toUpperCase()}`}</option>)}</select></div>

          {/* Right Icons */}
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Link href="/favoris" aria-label="Favoris">
              <div className="relative p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer hidden 2xl:block">
                <Heart className="h-5 w-5 text-gray-700" />
                {favoritesCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </div>
            </Link>
            <Link href="/panier" aria-label="Panier">
              <div className="relative p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
            <Link href="/mon-compte" aria-label={t(locale, "account")} className="hidden h-auto items-center gap-1.5 rounded-md bg-orange-700 px-2 py-1.5 text-xs font-medium text-white hover:bg-orange-800 sm:inline-flex">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>{t(locale, "account")}</span>
            </Link>
            {isAdmin && <Button asChild variant="outline" className="hidden 2xl:inline-flex gap-2 border-slate-300 bg-slate-900 text-sm text-white hover:bg-slate-800 hover:text-white"><Link href="/admin"><LayoutDashboard className="h-4 w-4" /><span>{t(locale, "admin")}</span></Link></Button>}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-1.5 hover:bg-gray-100 rounded-lg"
              aria-label={t(locale, isMenuOpen ? "closeMenu" : "openMenu")}
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
          <div className="xl:hidden mt-4 pb-4 border-t pt-4 space-y-2">
            <label className="mx-4 flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-slate-700"><MapPin className="h-4 w-4 text-orange-600" /><span className="font-medium">{t(locale, "deliverTo")}</span><select value={countryCode} onChange={event => setCountryCode(event.target.value as typeof countryCode)} className="ml-auto bg-transparent font-semibold outline-none">{deliveryCountries.map(country => <option key={country.code} value={country.code}>{getLocalizedCountryName(country.code, locale)}</option>)}</select></label>
            <label className="mx-4 flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-slate-700"><span className="text-base font-semibold text-orange-600" aria-hidden="true">A</span><span className="font-medium">{t(locale, "language")}</span><select value={locale} onChange={event => setLocale(event.target.value as typeof locale)} className="ml-auto bg-transparent font-semibold outline-none">{localeOptions.map(option => <option key={option.code} value={option.code}>{option.nativeLabel}</option>)}</select></label>
            <Link href="/">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                {navigation.home}
              </div>
            </Link>
            <Link href="/boutique">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                {navigation.shop}
              </div>
            </Link>

            {/* Mobile Categories */}
            <div className="space-y-1">
              <button
                onClick={() => setOpenDropdown(openDropdown === 0 ? null : 0)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded font-medium flex items-center justify-between text-sm"
              >
                {navigation.categories}
                <span className={`transition-transform text-xs ${openDropdown === 0 ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {openDropdown === 0 && (
                <div className="bg-gray-50 rounded space-y-1 p-2">
                  {standardCategories.map((cat) => {
                    return <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div className="px-4 py-2 hover:bg-white rounded cursor-pointer text-xs">
                        {(cat as any).icon || "📦"} {cat.name}
                      </div>
                    </Link>;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Link href="/creations">
                <div onClick={() => setIsMenuOpen(false)} className="px-4 py-2 hover:bg-rose-50 rounded cursor-pointer text-sm font-medium text-rose-700">{navigation.creations}</div>
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
                {t(locale, "new")}
              </div>
            </Link>

            <Link href="/best-sellers">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                {t(locale, "bestSellers")}
              </div>
            </Link>

            <Link href="/promos">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm text-orange-500 font-semibold">
                {t(locale, "promotions")}
              </div>
            </Link>

            <Link href="/contact">
              <div onClick={() => setIsMenuOpen(false)} className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                {navigation.contact}
              </div>
            </Link>


            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 mt-4 text-sm"><Link href="/mon-compte"><User className="h-4 w-4" /> {t(locale, "account")}</Link></Button>
            {isAdmin && <Button asChild variant="outline" className="mt-2 w-full gap-2 border-slate-300 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"><Link href="/admin"><LayoutDashboard className="h-4 w-4" /> {t(locale, "admin")}</Link></Button>}
          </div>
        )}
      </nav>
    </header>
  );
}
