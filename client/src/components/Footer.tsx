import { ShoppingBag, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#172B45] text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-sm bg-[#FFF9F0] p-1.5">
                <img src="/brand/mazigho-monogram.svg" alt="" aria-hidden="true" className="h-8 w-8" />
              </div>
              <span className="text-xl font-semibold tracking-[0.08em] text-white">MAZIGHO</span>
            </div>
            <p className="text-slate-200 text-sm">
              Votre destination pour des produits premium de qualité exceptionnelle.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    Accueil
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/boutique">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    Boutique
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/a-propos">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    À propos
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
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
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    High-Tech & Gadgets
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/maison-organisation">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    Maison & Organisation
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/beaute-bien-etre">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    Beauté & Bien-Être
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/sport-fitness">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    Sport & Fitness
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/mode">
                  <span className="text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
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
                  <span className="flex items-start gap-2 text-slate-200 hover:text-[#E6A46B] transition-colors cursor-pointer text-sm">
                    <Mail className="h-4 w-4 mt-0.5 text-[#E6A46B] flex-shrink-0" />
                    Écrivez-nous via le formulaire de contact
                  </span>
                </Link>
              </li>
              <li className="text-slate-200 text-sm leading-relaxed">
                Votre message est transmis directement à l’équipe MAZIGHO.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-white mb-2 text-sm">Livraison Suisse & Europe</h4>
              <p className="text-slate-200 text-xs">Les conditions sont précisées avant validation.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-2 text-sm">Connexion sécurisée</h4>
              <p className="text-slate-200 text-xs">Votre navigation est protégée par HTTPS.</p>
            </div>
            <div className="text-center md:text-right">
              <h4 className="font-semibold text-white mb-2 text-sm">Service client</h4>
              <p className="text-slate-200 text-xs">Une question ? Utilisez notre formulaire.</p>
            </div>
          </div>
          
          <div className="text-center border-t border-white/15 pt-6">
            <p className="text-slate-200 text-sm mb-2">
              © {new Date().getFullYear()} MAZIGHO. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-slate-300">
              <Link href="/conditions-generales"><span className="cursor-pointer hover:text-[#E6A46B]">Conditions générales</span></Link>
              <span aria-hidden="true">•</span>
              <Link href="/livraison-retours"><span className="cursor-pointer hover:text-[#E6A46B]">Livraison et retours</span></Link>
              <span aria-hidden="true">•</span>
              <Link href="/confidentialite"><span className="cursor-pointer hover:text-[#E6A46B]">Politique de confidentialité</span></Link>
              <span aria-hidden="true">•</span>
              <Link href="/mentions-legales"><span className="cursor-pointer hover:text-[#E6A46B]">Mentions légales</span></Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
