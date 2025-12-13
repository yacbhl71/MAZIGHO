import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { getAllCategories } from "@/data/mockData";
import SearchBar from "./SearchBar";
import { useCart } from "@/hooks/useCart";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [location] = useLocation();
  const categories = getAllCategories();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-6 text-xs md:text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <span>-10% avec code BIENVENUE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🚚</span>
            <span>Livraison Suisse & Europe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📦</span>
            <span>Retours gratuits 30 jours</span>
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
              <button className="font-medium text-sm text-gray-700 hover:text-orange-500 transition-colors flex items-center gap-1 bg-orange-100 px-3 py-2 rounded hover:bg-orange-200">
                Catégories
                <span className="text-xs">▼</span>
              </button>
              <div className="absolute left-0 mt-0 w-full min-w-max bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-4 z-50">
                <div className="grid grid-cols-2 gap-4 px-6">
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div className="cursor-pointer group/item py-2">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">{cat.icon}</span>
                          <div>
                            <h3 className="font-semibold text-sm text-gray-800 group-hover/item:text-orange-500 transition-colors">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                          </div>
                        </div>
                        {cat.subcategories && (
                          <ul className="text-xs text-gray-600 space-y-0.5 ml-7">
                            {cat.subcategories.slice(0, 3).map((sub, idx) => (
                              <li key={idx} className="hover:text-orange-500 transition-colors">
                                • {sub}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/a-propos">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/a-propos") ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              }`}>
                Nouveautés
              </span>
            </Link>

            <Link href="/a-propos">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded transition-colors ${
                isActive("/a-propos") ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              }`}>
                Best-sellers
              </span>
            </Link>

            <Link href="/a-propos">
              <span className={`cursor-pointer font-medium text-sm px-3 py-2 rounded text-orange-500 transition-colors ${
                isActive("/a-propos") ? "bg-orange-50" : "hover:bg-orange-50"
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

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              <Heart className="h-5 w-5 text-gray-700" />
            </button>
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
            <Button className="bg-orange-500 hover:bg-orange-600 text-white hidden sm:inline-flex gap-2 text-sm px-3 py-2 h-auto">
              <User className="h-4 w-4" />
              <span>Mon compte</span>
            </Button>

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
                        {cat.icon} {cat.name}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/contact">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                Contact
              </div>
            </Link>

            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 mt-4 text-sm">
              <User className="h-4 w-4" />
              Mon compte
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
