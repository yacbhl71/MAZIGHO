import { ArrowRight, Home, Search, ShoppingBag, Sparkles } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocale, type StorefrontLocale } from "@/contexts/LocaleContext";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { MAZIGHO_BOUTIQUE_LOGO } from "@/const";

type NotFoundCopy = {
  eyebrow: string;
  title: string;
  body: string;
  home: string;
  shop: string;
  help: string;
  suggestions: string;
  shopLabel: string;
  contactLabel: string;
};

const copy: Record<StorefrontLocale, NotFoundCopy> = {
  fr: { eyebrow: "Erreur 404", title: "Cette page s’est égarée", body: "Le lien que vous avez suivi n’existe plus ou a changé d’adresse. Pas d’inquiétude : nos collections vous attendent toujours.", home: "Retour à l’accueil", shop: "Explorer la boutique", help: "Besoin d’aide ?", suggestions: "Vous pouvez retrouver votre chemin ici", shopLabel: "Voir la boutique", contactLabel: "Nous contacter" },
  de: { eyebrow: "Fehler 404", title: "Diese Seite ist nicht auffindbar", body: "Der von Ihnen aufgerufene Link existiert nicht mehr oder wurde verschoben. Unsere Kollektionen warten weiterhin auf Sie.", home: "Zur Startseite", shop: "Shop entdecken", help: "Brauchen Sie Hilfe?", suggestions: "Hier finden Sie zurück", shopLabel: "Zum Shop", contactLabel: "Kontakt" },
  it: { eyebrow: "Errore 404", title: "Questa pagina si è persa", body: "Il link che hai aperto non esiste più o ha cambiato indirizzo. Le nostre collezioni ti aspettano ancora.", home: "Torna alla home", shop: "Esplora il negozio", help: "Hai bisogno di aiuto?", suggestions: "Puoi ritrovare la strada qui", shopLabel: "Vai al negozio", contactLabel: "Contattaci" },
  en: { eyebrow: "Error 404", title: "This page has wandered off", body: "The link you followed no longer exists or has moved. Do not worry: our collections are still waiting for you.", home: "Back to home", shop: "Explore the shop", help: "Need help?", suggestions: "Find your way back here", shopLabel: "Visit the shop", contactLabel: "Contact us" },
  es: { eyebrow: "Error 404", title: "Esta página se ha perdido", body: "El enlace que has seguido ya no existe o ha cambiado de dirección. Nuestras colecciones siguen esperándote.", home: "Volver al inicio", shop: "Explorar la tienda", help: "¿Necesitas ayuda?", suggestions: "Puedes volver a empezar aquí", shopLabel: "Ver la tienda", contactLabel: "Contáctanos" },
  nl: { eyebrow: "Fout 404", title: "Deze pagina is verdwaald", body: "De link die u heeft gevolgd bestaat niet meer of is verhuisd. Onze collecties wachten nog steeds op u.", home: "Terug naar home", shop: "Ontdek de winkel", help: "Hulp nodig?", suggestions: "Vind hier uw weg terug", shopLabel: "Naar de winkel", contactLabel: "Neem contact op" },
  ar: { eyebrow: "خطأ 404", title: "هذه الصفحة ضلّت طريقها", body: "الرابط الذي فتحته لم يعد موجوداً أو تغيّر عنوانه. لا تقلق، ما زالت مجموعاتنا بانتظارك.", home: "العودة إلى الرئيسية", shop: "استكشف المتجر", help: "هل تحتاج إلى مساعدة؟", suggestions: "يمكنك العودة من هنا", shopLabel: "زيارة المتجر", contactLabel: "تواصل معنا" },
};

export default function NotFound() {
  const { locale } = useLocale();
  const { profile } = useDesignProfile(locale);
  const storeAvailability = trpc.storefront.getAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const t = copy[locale] ?? copy.fr;
  const brandName = profile.brandName?.trim() || "MAZIGHO";
  const brandLogoUrl = storeAvailability.data?.isPlatformStore ? MAZIGHO_BOUTIQUE_LOGO : (profile.brandLogoUrl?.trim() || "");
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <div dir={direction} className="min-h-screen bg-[#fffaf7] text-slate-900">
      <Header />
      <main className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-orange-200/55 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 bottom-4 h-80 w-80 rounded-full bg-teal-200/55 blur-3xl" />
        <section className="container relative mx-auto grid min-h-[590px] items-center gap-12 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> {t.eyebrow}</div>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{t.title}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{t.body}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/"><span className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-700"><Home className="h-4 w-4" /> {t.home}</span></Link>
              <Link href="/boutique"><span className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-700 bg-white px-6 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-50"><ShoppingBag className="h-4 w-4" /> {t.shop}</span></Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-600">
              <span className="font-medium text-slate-800">{t.suggestions}</span>
              <Link href="/boutique"><span className="inline-flex cursor-pointer items-center gap-1 font-semibold text-orange-700 hover:text-orange-800"><Search className="h-3.5 w-3.5" /> {t.shopLabel}</span></Link>
              <Link href="/contact"><span className="inline-flex cursor-pointer items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"><ArrowRight className="h-3.5 w-3.5" /> {t.contactLabel}</span></Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-7 shadow-2xl shadow-orange-950/10 sm:p-10">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] bg-orange-500" />
              <div className="relative flex items-center gap-3">
                {brandLogoUrl ? <img src={brandLogoUrl} alt="" className="h-11 w-11 rounded-xl border border-orange-100 bg-white object-contain p-1" /> : <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50"><span className="h-3.5 w-3.5 rounded-full bg-orange-500" /></div>}
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{brandName}</p><p className="mt-1 text-sm text-slate-500">{t.help}</p></div>
              </div>
              <div className="mt-10 text-[8.5rem] font-black leading-none tracking-[-0.1em] text-slate-950 sm:text-[10rem]">404</div>
              <div className="mt-2 h-2 w-28 rounded-full bg-gradient-to-r from-orange-500 to-teal-600" />
              <p className="mt-8 border-t border-slate-100 pt-6 text-sm leading-6 text-slate-500">{t.body}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
