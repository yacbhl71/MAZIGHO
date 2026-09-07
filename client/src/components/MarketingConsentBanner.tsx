import { Cookie, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";
import { useMarketingConsent } from "@/contexts/MarketingConsentContext";

type ConsentCopy = {
  title: string;
  body: string;
  accept: string;
  refuse: string;
  manage: string;
};

const copy: Record<string, ConsentCopy> = {
  fr: { title: "Vos choix de confidentialité", body: "Avec votre accord, nous pouvons activer des outils publicitaires Meta et TikTok pour mesurer les visites et améliorer nos campagnes. Vous pouvez refuser ou modifier votre choix à tout moment.", accept: "Accepter", refuse: "Refuser", manage: "Confidentialité" },
  de: { title: "Ihre Datenschutzwahl", body: "Mit Ihrer Zustimmung können wir Meta- und TikTok-Werbetools aktivieren, um Besuche zu messen und unsere Kampagnen zu verbessern. Sie können Ihre Wahl jederzeit ändern.", accept: "Akzeptieren", refuse: "Ablehnen", manage: "Datenschutz" },
  it: { title: "Le tue scelte sulla privacy", body: "Con il tuo consenso possiamo attivare gli strumenti pubblicitari Meta e TikTok per misurare le visite e migliorare le campagne. Puoi modificare la scelta in qualsiasi momento.", accept: "Accetta", refuse: "Rifiuta", manage: "Privacy" },
  en: { title: "Your privacy choices", body: "With your consent, we may activate Meta and TikTok advertising tools to measure visits and improve campaigns. You can change your choice at any time.", accept: "Accept", refuse: "Decline", manage: "Privacy" },
  es: { title: "Tus opciones de privacidad", body: "Con tu consentimiento, podemos activar herramientas publicitarias de Meta y TikTok para medir visitas y mejorar campañas. Puedes cambiar tu elección en cualquier momento.", accept: "Aceptar", refuse: "Rechazar", manage: "Privacidad" },
  nl: { title: "Uw privacykeuze", body: "Met uw toestemming kunnen we advertentietools van Meta en TikTok activeren om bezoeken te meten en campagnes te verbeteren. U kunt uw keuze altijd wijzigen.", accept: "Accepteren", refuse: "Weigeren", manage: "Privacy" },
  ar: { title: "خيارات الخصوصية الخاصة بك", body: "بموافقتك، يمكننا تفعيل أدوات Meta وTikTok الإعلانية لقياس الزيارات وتحسين الحملات. يمكنك تغيير اختيارك في أي وقت.", accept: "موافقة", refuse: "رفض", manage: "الخصوصية" },
};

export function MarketingConsentBanner() {
  const { locale } = useLocale();
  const { consent, isReady, grantMarketingConsent, denyMarketingConsent, resetMarketingConsent } = useMarketingConsent();
  const c = copy[locale] ?? copy.fr;

  if (!isReady) return null;

  if (consent !== "unknown") {
    return <button type="button" onClick={resetMarketingConsent} className="fixed bottom-3 left-3 z-50 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur hover:bg-slate-50" aria-label={c.manage}><ShieldCheck className="h-3.5 w-3.5 text-teal-700" /> {c.manage}</button>;
  }

  return <section className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-5 sm:p-5" aria-label={c.title}>
    <div className="flex gap-3">
      <div className="mt-0.5 rounded-full bg-orange-50 p-2 text-orange-700"><Cookie className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-slate-950">{c.title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-600">{c.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={denyMarketingConsent} variant="outline" className="border-slate-300 bg-white">{c.refuse}</Button>
          <Button type="button" onClick={grantMarketingConsent} className="bg-orange-500 hover:bg-orange-600">{c.accept}</Button>
        </div>
      </div>
      <button type="button" onClick={denyMarketingConsent} className="h-fit rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={c.refuse}><X className="h-4 w-4" /></button>
    </div>
  </section>;
}
