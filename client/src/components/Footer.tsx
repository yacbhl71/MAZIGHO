import { ShoppingBag, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-amber-950 text-white mt-20">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-2 rounded">
                <span className="text-white text-lg font-bold">≡</span>
              </div>
              <span className="text-xl font-bold text-white">MAZIGHO</span>
            </div>
            <p className="text-amber-100 text-sm">
              Votre destination pour des produits premium de qualité exceptionnelle.
            </p>
            <div className="flex gap-4 pt-4">
              <a href="#" className="text-amber-100 hover:text-orange-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-amber-100 hover:text-orange-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-amber-100 hover:text-orange-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    Accueil
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/boutique">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    Boutique
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/a-propos">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    À propos
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    Contact
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">Catégories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/categorie/high-tech-gadgets">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    High-Tech & Gadgets
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/maison-organisation">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    Maison & Organisation
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/beaute-bien-etre">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    Beauté & Bien-Être
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/sport-fitness">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    Sport & Fitness
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/mode">
                  <span className="text-amber-100 hover:text-orange-500 transition-colors cursor-pointer text-sm">
                    Mode
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-amber-100 text-sm">
                <Mail className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                <span>contact@mazigho.fr</span>
              </li>
              <li className="flex items-start gap-2 text-amber-100 text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                <span>+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-start gap-2 text-amber-100 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                <span>123 Rue de la Mode, 75001 Paris</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amber-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-white mb-2 text-sm">Livraison Rapide</h4>
              <p className="text-amber-100 text-xs">Expédition sous 24h</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-2 text-sm">Paiement Sécurisé</h4>
              <p className="text-amber-100 text-xs">SSL 256-bit encrypté</p>
            </div>
            <div className="text-center md:text-right">
              <h4 className="font-semibold text-white mb-2 text-sm">Satisfait ou Remboursé</h4>
              <p className="text-amber-100 text-xs">30 jours pour changer d'avis</p>
            </div>
          </div>
          
          <div className="text-center border-t border-amber-800 pt-6">
            <p className="text-amber-100 text-sm mb-2">
              © {new Date().getFullYear()} MAZIGHO. Tous droits réservés.
            </p>
            <p className="text-amber-200 text-xs">
              Conditions d'utilisation • Politique de confidentialité • Mentions légales
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
