import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CampaignBar } from "@/components/CampaignBar";
import { Menu, X, Heart, ShoppingCart, User, LayoutDashboard, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
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
import { getLocalizedCategoryPresentation } from "@/lib/categoryPresentation";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import ThemeToggle from "./ThemeToggle";
import { MAZIGHO_BOUTIQUE_LOGO } from "@/const";

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
  const categories = (categoriesQuery.data || []).map(category => getLocalizedCategoryPresentation(locale, category));
  const standardCategories = categories.filter(category => category.catalogSection !== "creations");
  const creativeCategories = categories.filter(category => category.catalogSection === "creations");
  const { profile } = useDesignProfile();
  const storeAvailability = trpc.storefront.getAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const storeSeo = trpc.content.getStoreSeo.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const isPlatformStore = Boolean(storeAvailability.data?.isPlatformStore);
  useEffect(() => {
    if (!storeSeo.data || location.startsWith("/produit/")) return;
    document.title = storeSeo.data.title;
    let description = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = storeSeo.data.description;
  }, [location, storeSeo.data?.description, storeSeo.data?.title]);
  const brandName = profile.brandName?.trim() || "MAZIGHO";
  const brandMessage = profile.brandMessage?.trim() || "";
  const brandLogoUrl = profile.brandLogoUrl?.trim() || "";
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

  const navigationItems = (profile.navigationItems || []).filter(item => item.visible);
  const getNavigationItem = (id: string) => navigationItems.find(item => item.id === id);
  const navigationLabel = (id: string, fallback: string) => getNavigationItem(id)?.label?.trim() || fallback;
  const isNavigationVisible = (id: string) => Boolean(getNavigationItem(id));
  const customNavigationItems = navigationItems.filter(item => item.kind === "custom");
  const isActive = (path: string) => location === path;
  const fallbackNavigationLabels: Record<string, string> = { home: navigation.home, shop: navigation.shop, categories: navigation.categories, creations: navigation.creations, new: t(locale, "new"), "best-sellers": t(locale, "bestSellers"), promos: t(locale, "promotions"), contact: navigation.contact };
  const desktopLinkClass = (href: string) => `cursor-pointer border-b-2 px-1.5 py-1.5 text-xs font-medium transition-colors ${isActive(href) ? "border-orange-500 text-orange-500" : "border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"}`;
  const renderDesktopNavigationItem = (item: any) => {
    const label = item.label?.trim() || fallbackNavigationLabels[item.id] || "Menu";
    if (item.kind === "custom") return <a key={item.id} href={item.href} className={desktopLinkClass(item.href)} target={/^https:\/\//i.test(item.href) ? "_blank" : undefined} rel={/^https:\/\//i.test(item.href) ? "noreferrer" : undefined}>{label}</a>;
    if (item.id === "categories") return <div key={item.id} className="relative group"><button type="button" aria-expanded={openDropdown === 1} onClick={() => setOpenDropdown(openDropdown === 1 ? null : 1)} className="flex items-center gap-0.5 rounded px-1.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-500">{label}<span className={`text-xs transition-transform ${openDropdown === 1 ? "rotate-180" : ""}`}>▼</span></button><div className={`absolute left-0 top-full z-50 mt-2 w-[420px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${openDropdown === 1 ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}><div className="mb-3 border-b border-gray-100 pb-3"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">{t(locale, "exploreUniverse")}</p><p className="mt-1 text-xs text-gray-500">{copy.discovery.text}</p></div><div className="grid grid-cols-2 gap-2">{standardCategories.map(cat => <Link key={cat.id} href={`/categorie/${cat.slug}`}><div onClick={() => setOpenDropdown(null)} className="flex min-h-[58px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-orange-50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">{(cat as any).icon || "✦"}</span><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-gray-800">{cat.name}</h3><p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{cat.description}</p></div></div></Link>)}</div><Link href="/boutique"><div onClick={() => setOpenDropdown(null)} className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold uppercase tracking-wider text-orange-500">{copy.discovery.allShop} <span>→</span></div></Link></div></div>;
    if (item.id === "creations") return <div key={item.id} className="relative group"><button type="button" aria-expanded={openDropdown === 2} onClick={() => setOpenDropdown(openDropdown === 2 ? null : 2)} className={`flex items-center gap-0.5 rounded px-1.5 py-1.5 text-xs font-medium transition-colors ${isActive("/creations") ? "border-b-2 border-orange-500 text-orange-500" : "border-b-2 border-transparent text-slate-600 hover:border-orange-200 hover:text-orange-500"}`}>{label}<span className={`text-xs transition-transform ${openDropdown === 2 ? "rotate-180" : ""}`}>▼</span></button><div className={`absolute left-0 top-full z-50 mt-2 w-[380px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${openDropdown === 2 ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}><div className="mb-3 border-b border-rose-100 pb-3"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">{creativeCopy.title}</p><p className="mt-1 text-xs text-gray-500">{creativeCopy.intro}</p></div><div className="grid grid-cols-2 gap-2">{creativeCategories.map(cat => <Link key={cat.id} href={`/categorie/${cat.slug}`}><div onClick={() => setOpenDropdown(null)} className="flex min-h-[54px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-orange-50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">{(cat as any).icon || "✦"}</span><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-gray-800">{cat.name}</h3><p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{cat.description}</p></div></div></Link>)}</div><Link href="/creations"><div onClick={() => setOpenDropdown(null)} className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold uppercase tracking-wider text-orange-500">{creativeCopy.all} <span>→</span></div></Link></div></div>;
    return <Link key={item.id} href={item.href}><span className={desktopLinkClass(item.href)}>{label}</span></Link>;
  };
  const renderMobileNavigationItem = (item: any) => {
    const label = item.label?.trim() || fallbackNavigationLabels[item.id] || "Menu";
    const close = () => setIsMenuOpen(false);
    if (item.kind === "custom") return <a key={item.id} href={item.href} onClick={close} className="block rounded px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100" target={/^https:\/\//i.test(item.href) ? "_blank" : undefined} rel={/^https:\/\//i.test(item.href) ? "noreferrer" : undefined}>{label}</a>;
    if (item.id === "categories") return <div key={item.id} className="space-y-1"><button onClick={() => setOpenDropdown(openDropdown === 0 ? null : 0)} className="flex w-full items-center justify-between rounded px-4 py-2 text-left text-sm font-medium hover:bg-gray-100">{label}<span className={`text-xs transition-transform ${openDropdown === 0 ? "rotate-180" : ""}`}>▼</span></button>{openDropdown === 0 && <div className="space-y-1 rounded bg-gray-50 p-2">{standardCategories.map(cat => <Link key={cat.id} href={`/categorie/${cat.slug}`}><div onClick={close} className="cursor-pointer rounded px-4 py-2 text-xs hover:bg-white">{(cat as any).icon || "📦"} {cat.name}</div></Link>)}</div>}</div>;
    if (item.id === "creations") return <div key={item.id} className="space-y-1"><Link href="/creations"><div onClick={close} className="cursor-pointer rounded px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">{label}</div></Link><button onClick={() => setOpenDropdown(openDropdown === 3 ? null : 3)} className="flex w-full items-center justify-between rounded px-4 py-2 text-left text-xs font-medium text-rose-700 hover:bg-rose-50">Explorer les collections<span className={`text-xs transition-transform ${openDropdown === 3 ? "rotate-180" : ""}`}>▼</span></button>{openDropdown === 3 && <div className="space-y-1 rounded bg-rose-50 p-2">{creativeCategories.map(cat => <Link key={cat.id} href={`/categorie/${cat.slug}`}><div onClick={() => { setOpenDropdown(null); close(); }} className="cursor-pointer rounded px-4 py-2 text-xs hover:bg-white">{(cat as any).icon || "✦"} {cat.name}</div></Link>)}</div>}</div>;
    return <Link key={item.id} href={item.href}><div onClick={close} className={`cursor-pointer rounded px-4 py-2 text-sm ${item.id === "promos" ? "font-semibold text-orange-500 hover:bg-orange-50" : "text-slate-700 hover:bg-gray-100"}`}>{label}</div></Link>;
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <CampaignBar />
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
          <Link href="/" aria-label={`Accueil ${brandName}`}>
            <div className="group flex min-w-0 cursor-pointer items-center gap-2 border-r border-slate-200 pr-2 xl:pr-3">
              {isPlatformStore ? <div className="flex h-11 w-12 shrink-0 flex-col items-center justify-center" aria-label="MAZIGHO Boutique"><img src={MAZIGHO_BOUTIQUE_LOGO} alt="" className="h-7 w-7 object-contain" /><span className="mt-0.5 text-[8px] font-extrabold leading-none tracking-[0.16em] text-slate-900">MAZIGHO</span></div> : <>{brandLogoUrl ? <img src={brandLogoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-orange-100 bg-white object-contain p-0.5" /> : null}<span className="truncate whitespace-nowrap text-base font-semibold tracking-[0.11em] text-orange-700 transition-colors group-hover:text-orange-800 xl:text-lg">{brandName}</span>{!brandLogoUrl && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />}{brandMessage ? <span className="hidden max-w-44 truncate border-l border-orange-100 pl-2 text-[10px] font-medium text-slate-500 2xl:inline">{brandMessage}</span> : null}</>}
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden xl:flex flex-shrink-0 items-center gap-0">
            {navigationItems.map(renderDesktopNavigationItem)}
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
            {navigationItems.map(renderMobileNavigationItem)}

            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 mt-4 text-sm"><Link href="/mon-compte"><User className="h-4 w-4" /> {t(locale, "account")}</Link></Button>
            {isAdmin && <Button asChild variant="outline" className="mt-2 w-full gap-2 border-slate-300 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"><Link href="/admin"><LayoutDashboard className="h-4 w-4" /> {t(locale, "admin")}</Link></Button>}
          </div>
        )}
      </nav>
    </header>
  );
}
