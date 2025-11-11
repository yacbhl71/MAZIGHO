import { ShoppingBag, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">{APP_TITLE}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Votre destination pour des produits premium de qualité exceptionnelle.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Accueil
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/boutique">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Boutique
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/a-propos">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    À propos
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Contact
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Catégories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/categorie/vetements">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Vêtements
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/cosmetiques">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Cosmétiques
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/accessoires">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Accessoires
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/cadeaux">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Cadeaux
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/categorie/jouets">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">
                    Jouets
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <span>contact@boutique-premium.fr</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <span>+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>123 Rue de la Mode, 75001 Paris</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {APP_TITLE}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
