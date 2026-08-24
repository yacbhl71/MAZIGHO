import { ShoppingBag, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-20 bg-amber-950 text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-[0.13em] text-white">MAZIGHO</span>
              <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
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
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    Accueil
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/boutique">
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    Boutique
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/a-propos">
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    À propos
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
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
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    High-Tech & Gadgets
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/maison-organisation">
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    Maison & Organisation
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/beaute-bien-etre">
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    Beauté & Bien-Être
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/sport-fitness">
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
                    Sport & Fitness
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/mode">
                  <span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">
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

        <div className="border-t border-amber-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-white mb-2 text-sm">Livraison Suisse & Europe</h4>
              <p className="text-amber-100 text-xs">Les conditions sont précisées avant validation.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-2 text-sm">Connexion sécurisée</h4>
              <p className="text-amber-100 text-xs">Votre navigation est protégée par HTTPS.</p>
            </div>
            <div className="text-center md:text-right">
              <h4 className="font-semibold text-white mb-2 text-sm">Service client</h4>
              <p className="text-amber-100 text-xs">Une question ? Utilisez notre formulaire.</p>
            </div>
          </div>
          
          <div className="text-center border-t border-amber-800 pt-6">
            <p className="text-amber-100 text-sm mb-2">
              © {new Date().getFullYear()} MAZIGHO. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-amber-200">
              <Link href="/conditions-generales"><span className="cursor-pointer hover:text-orange-400">Conditions générales</span></Link>
              <span aria-hidden="true">•</span>
              <Link href="/livraison-retours"><span className="cursor-pointer hover:text-orange-400">Livraison et retours</span></Link>
              <span aria-hidden="true">•</span>
              <Link href="/confidentialite"><span className="cursor-pointer hover:text-orange-400">Politique de confidentialité</span></Link>
              <span aria-hidden="true">•</span>
              <Link href="/mentions-legales"><span className="cursor-pointer hover:text-orange-400">Mentions légales</span></Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
