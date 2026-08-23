import { ShoppingBag, Mail } from "lucide-react";
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
            <h3 className="font-semibold text-white mb-4 text-lg">Besoin d’aide ?</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact">
                  <span className="flex items-start gap-2 text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    <Mail className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                    Écrivez-nous via le formulaire de contact
                  </span>
                </Link>
              </li>
              <li className="text-amber-100 text-sm leading-relaxed">
                Votre message est transmis directement à l’équipe MAZIGHO.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-amber-800 pt-8">
          <div className="grid gap-6 border-b border-amber-800 pb-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Informations légales</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Consultez nos informations essentielles</h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-100">Les conditions de vente, la confidentialité et les informations de livraison sont accessibles à tout moment.</p>
            </div>
            <nav aria-label="Informations légales" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link href="/conditions-generales"><span className="block cursor-pointer rounded-md border border-amber-700 bg-amber-900/40 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:border-orange-400 hover:bg-amber-900">Conditions générales</span></Link>
              <Link href="/livraison-retours"><span className="block cursor-pointer rounded-md border border-amber-700 bg-amber-900/40 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:border-orange-400 hover:bg-amber-900">Livraison et retours</span></Link>
              <Link href="/confidentialite"><span className="block cursor-pointer rounded-md border border-amber-700 bg-amber-900/40 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:border-orange-400 hover:bg-amber-900">Politique de confidentialité</span></Link>
              <Link href="/mentions-legales"><span className="block cursor-pointer rounded-md border border-amber-700 bg-amber-900/40 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:border-orange-400 hover:bg-amber-900">Mentions légales</span></Link>
            </nav>
          </div>

          <div className="grid grid-cols-1 gap-4 py-7 md:grid-cols-3">
            <div className="text-center md:text-left">
              <h4 className="mb-2 text-sm font-semibold text-white">Livraison Suisse & Europe</h4>
              <p className="text-xs text-amber-100">Les conditions sont précisées avant validation.</p>
            </div>
            <div className="text-center">
              <h4 className="mb-2 text-sm font-semibold text-white">Connexion sécurisée</h4>
              <p className="text-xs text-amber-100">Votre navigation est protégée par HTTPS.</p>
            </div>
            <div className="text-center md:text-right">
              <h4 className="mb-2 text-sm font-semibold text-white">Service client</h4>
              <p className="text-xs text-amber-100">Une question ? Utilisez notre formulaire.</p>
            </div>
          </div>

          <div className="border-t border-amber-800 pt-6 text-center">
            <p className="text-sm text-amber-100">© {new Date().getFullYear()} MAZIGHO. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
