import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocale, type StorefrontLocale } from "@/contexts/LocaleContext";

const legalUiCopy: Record<StorefrontLocale, { updatedAt: string; sourceNotice: string; nav: [string, string, string, string] }> = {
  fr: { updatedAt: "Dernière mise à jour", sourceNotice: "", nav: ["Mentions légales", "Confidentialité", "Conditions générales", "Livraison et retours"] },
  de: { updatedAt: "Letzte Aktualisierung", sourceNotice: "Der rechtliche Quelltext dieser Seite ist derzeit auf Französisch verfügbar. Eine geprüfte Rechtsübersetzung wird separat veröffentlicht.", nav: ["Impressum", "Datenschutz", "Allgemeine Geschäftsbedingungen", "Lieferung und Rückgabe"] },
  it: { updatedAt: "Ultimo aggiornamento", sourceNotice: "Il testo giuridico di riferimento di questa pagina è attualmente disponibile in francese. Una traduzione giuridica verificata sarà pubblicata separatamente.", nav: ["Note legali", "Privacy", "Condizioni generali", "Consegna e resi"] },
  en: { updatedAt: "Last updated", sourceNotice: "The reference legal text on this page is currently available in French. A reviewed legal translation will be published separately.", nav: ["Legal notice", "Privacy", "Terms and conditions", "Delivery and returns"] },
  es: { updatedAt: "Última actualización", sourceNotice: "El texto jurídico de referencia de esta página está disponible actualmente en francés. Se publicará por separado una traducción jurídica revisada.", nav: ["Aviso legal", "Privacidad", "Condiciones generales", "Entrega y devoluciones"] },
  nl: { updatedAt: "Laatst bijgewerkt", sourceNotice: "De juridische brontekst van deze pagina is momenteel in het Frans beschikbaar. Een gecontroleerde juridische vertaling wordt afzonderlijk gepubliceerd.", nav: ["Juridische informatie", "Privacy", "Algemene voorwaarden", "Levering en retouren"] },
  ar: { updatedAt: "آخر تحديث", sourceNotice: "النص القانوني المرجعي في هذه الصفحة متاح حالياً بالفرنسية. ستُنشر ترجمة قانونية مُراجعة بشكل منفصل.", nav: ["الإشعارات القانونية", "الخصوصية", "الشروط العامة", "التوصيل والإرجاع"] },
};

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  children: React.ReactNode;
};

export default function LegalLayout({ eyebrow, title, description, updatedAt, children }: LegalLayoutProps) {
  const { locale } = useLocale();
  const ui = legalUiCopy[locale] ?? legalUiCopy.fr;

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf7f2]">
      <Header />
      <main className="flex-1">
        <section className="border-b border-[#eadfd2] bg-white">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mx-auto max-w-4xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">{eyebrow}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
              <p className="mt-5 text-xs text-slate-500">{ui.updatedAt} : {updatedAt}</p>
              {locale !== "fr" && <p role="note" className="mt-3 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">{ui.sourceNotice}</p>}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:py-14">
          <article className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-[#eadfd2] bg-white p-6 text-[15px] leading-7 text-slate-700 md:p-10">
            {children}
          </article>
          <nav className="mx-auto mt-8 flex max-w-4xl flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-orange-700">
            <Link href="/mentions-legales"><span className="cursor-pointer hover:text-orange-500">{ui.nav[0]}</span></Link>
            <Link href="/confidentialite"><span className="cursor-pointer hover:text-orange-500">{ui.nav[1]}</span></Link>
            <Link href="/conditions-generales"><span className="cursor-pointer hover:text-orange-500">{ui.nav[2]}</span></Link>
            <Link href="/livraison-retours"><span className="cursor-pointer hover:text-orange-500">{ui.nav[3]}</span></Link>
          </nav>
        </section>
      </main>
      <Footer />
    </div>
  );
}
