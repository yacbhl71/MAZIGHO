import { Mail } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/contexts/LocaleContext";
import { t } from "@/lib/i18n";
import { getDiscoveryTiles, getPublicCopy } from "@/lib/publicCopy";

const categoryRoutes = [
  "/categorie/high-tech-gadgets",
  "/categorie/maison-organisation",
  "/categorie/beaute-bien-etre",
  "/categorie/sport-fitness",
  "/categorie/mode",
];

export default function Footer() {
  const { locale } = useLocale();
  const copy = getPublicCopy(locale);
  const discoveryTiles = getDiscoveryTiles(locale);
  const categoryLabels = [discoveryTiles[4]?.title, discoveryTiles[2]?.title, discoveryTiles[1]?.title, discoveryTiles[3]?.title, discoveryTiles[0]?.title];

  return (
    <footer className="mt-20 bg-amber-950 text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2"><span className="text-xl font-semibold tracking-[0.13em] text-white">MAZIGHO</span><span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" /></div>
            <p className="text-amber-100 text-sm">{copy.footer.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">{copy.footer.navigation}</h3>
            <ul className="space-y-2">
              <li><Link href="/"><span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">{t(locale, "home")}</span></Link></li>
              <li><Link href="/boutique"><span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">{t(locale, "shop")}</span></Link></li>
              <li><Link href="/a-propos"><span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">{copy.footer.about}</span></Link></li>
              <li><Link href="/contact"><span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">{t(locale, "contact")}</span></Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">{copy.footer.categories}</h3>
            <ul className="space-y-2">{categoryLabels.map((label, index) => <li key={categoryRoutes[index]}><Link href={categoryRoutes[index]}><span className="text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm">{label || copy.footer.categoryLabels[index]}</span></Link></li>)}</ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">{copy.footer.help}</h3>
            <ul className="space-y-3">
              <li><Link href="/contact"><span className="flex items-start gap-2 text-amber-100 hover:text-orange-400 transition-colors cursor-pointer text-sm"><Mail className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />{copy.footer.contactForm}</span></Link></li>
              <li className="text-amber-100 text-sm leading-relaxed">{copy.footer.contactInfo}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amber-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center md:text-left"><h4 className="font-semibold text-white mb-2 text-sm">{copy.footer.deliveryTitle}</h4><p className="text-amber-100 text-xs">{copy.footer.deliveryText}</p></div>
            <div className="text-center"><h4 className="font-semibold text-white mb-2 text-sm">{copy.footer.secureTitle}</h4><p className="text-amber-100 text-xs">{copy.footer.secureText}</p></div>
            <div className="text-center md:text-right"><h4 className="font-semibold text-white mb-2 text-sm">{copy.footer.serviceTitle}</h4><p className="text-amber-100 text-xs">{copy.footer.serviceText}</p></div>
          </div>

          <div className="text-center border-t border-amber-800 pt-6">
            <p className="text-amber-100 text-sm mb-2">© {new Date().getFullYear()} MAZIGHO. {copy.footer.rights}</p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-amber-200">
              <Link href="/conditions-generales"><span className="cursor-pointer hover:text-orange-400">{copy.footer.terms}</span></Link><span aria-hidden="true">•</span>
              <Link href="/livraison-retours"><span className="cursor-pointer hover:text-orange-400">{copy.footer.returns}</span></Link><span aria-hidden="true">•</span>
              <Link href="/confidentialite"><span className="cursor-pointer hover:text-orange-400">{copy.footer.privacy}</span></Link><span aria-hidden="true">•</span>
              <Link href="/mentions-legales"><span className="cursor-pointer hover:text-orange-400">{copy.footer.legal}</span></Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
