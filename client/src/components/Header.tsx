import { ShoppingBag, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { useState } from "react";
import { APP_TITLE } from "@/const";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Boutique", href: "/boutique" },
    { name: "À propos", href: "/a-propos" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <nav className="container mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <ShoppingBag className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-foreground">{APP_TITLE}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span className="text-foreground/80 hover:text-primary transition-colors cursor-pointer font-medium">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <span
                    className="text-foreground/80 hover:text-primary transition-colors cursor-pointer font-medium block py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
