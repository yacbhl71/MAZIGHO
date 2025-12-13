import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, Heart, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { getAllCategories } from "@/data/mockData";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [location] = useLocation();
  const categories = getAllCategories();

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-center gap-8 text-sm md:text-base flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span>-10% avec code BIENVENUE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🚚</span>
            <span>Livraison Suisse & Europe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span>Retours gratuits 30 jours</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="bg-gray-800 p-2 rounded">
                <span className="text-orange-500 text-xl font-bold">≡</span>
              </div>
              <span className="text-xl font-bold text-orange-500 hidden sm:inline">
                BOUTIQUE PREMIUM
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/">
              <span className={`cursor-pointer font-medium transition-colors ${
                isActive("/") ? "text-orange-500" : "text-gray-700 hover:text-orange-500"
              }`}>
                Accueil
              </span>
            </Link>

            <Link href="/boutique">
              <span className={`cursor-pointer font-medium transition-colors flex items-center gap-1 ${
                isActive("/boutique") ? "text-orange-500" : "text-gray-700 hover:text-orange-500"
              }`}>
                Boutique
              </span>
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="font-medium text-gray-700 hover:text-orange-500 transition-colors flex items-center gap-1 bg-orange-100 px-4 py-2 rounded">
                Catégories
                <span className="text-xs">▼</span>
              </button>
              <div className="absolute left-0 mt-0 w-96 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-4">
                <div className="grid grid-cols-2 gap-6 px-6">
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div className="cursor-pointer group/item">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800 group-hover/item:text-orange-500 transition-colors">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                          </div>
                        </div>
                        {cat.subcategories && (
                          <ul className="text-sm text-gray-600 space-y-1 ml-8">
                            {cat.subcategories.map((sub, idx) => (
                              <li key={idx} className="hover:text-orange-500 transition-colors">
                                {sub}
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
              <span className={`cursor-pointer font-medium transition-colors ${
                isActive("/a-propos") ? "text-orange-500" : "text-gray-700 hover:text-orange-500"
              }`}>
                Nouveautés
              </span>
            </Link>

            <Link href="/a-propos">
              <span className={`cursor-pointer font-medium transition-colors ${
                isActive("/a-propos") ? "text-orange-500" : "text-gray-700 hover:text-orange-500"
              }`}>
                Best-sellers
              </span>
            </Link>

            <Link href="/a-propos">
              <span className={`cursor-pointer font-medium text-orange-500 transition-colors ${
                isActive("/a-propos") ? "text-orange-600" : "hover:text-orange-600"
              }`}>
                Promos
              </span>
            </Link>

            <Link href="/contact">
              <span className={`cursor-pointer font-medium transition-colors ${
                isActive("/contact") ? "text-orange-500" : "text-gray-700 hover:text-orange-500"
              }`}>
                Contact
              </span>
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="h-5 w-5 text-gray-700" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              <Heart className="h-5 w-5 text-gray-700" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
            </button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white hidden sm:inline-flex gap-2">
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-3">
            <Link href="/">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer">
                Accueil
              </div>
            </Link>
            <Link href="/boutique">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer">
                Boutique
              </div>
            </Link>

            {/* Mobile Categories */}
            <div className="space-y-2">
              <button
                onClick={() => setOpenDropdown(openDropdown === 0 ? null : 0)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded font-medium flex items-center justify-between"
              >
                Catégories
                <span className={`transition-transform ${openDropdown === 0 ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {openDropdown === 0 && (
                <div className="bg-gray-50 rounded space-y-2 p-2">
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/categorie/${cat.slug}`}>
                      <div className="px-4 py-2 hover:bg-white rounded cursor-pointer text-sm">
                        {cat.icon} {cat.name}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/contact">
              <div className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer">
                Contact
              </div>
            </Link>

            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 mt-4">
              <User className="h-4 w-4" />
              Mon compte
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
