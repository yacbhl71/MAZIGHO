import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useLocale, type StorefrontLocale } from "@/contexts/LocaleContext";

const copy: Record<StorefrontLocale, { title: string; text: string; detail: string; home: string }> = {
  fr: { title: "Page introuvable", text: "La page que vous recherchez n’existe pas.", detail: "Elle a peut-être été déplacée ou supprimée.", home: "Retour à l’accueil" },
  de: { title: "Seite nicht gefunden", text: "Die gesuchte Seite existiert nicht.", detail: "Sie wurde möglicherweise verschoben oder entfernt.", home: "Zur Startseite" },
  it: { title: "Pagina non trovata", text: "La pagina che cerchi non esiste.", detail: "Potrebbe essere stata spostata o rimossa.", home: "Torna alla home" },
  en: { title: "Page not found", text: "The page you are looking for does not exist.", detail: "It may have been moved or removed.", home: "Back to home" },
  es: { title: "Página no encontrada", text: "La página que buscas no existe.", detail: "Puede haberse movido o eliminado.", home: "Volver al inicio" },
  nl: { title: "Pagina niet gevonden", text: "De pagina die u zoekt bestaat niet.", detail: "De pagina kan zijn verplaatst of verwijderd.", home: "Terug naar home" },
  ar: { title: "الصفحة غير موجودة", text: "الصفحة التي تبحث عنها غير موجودة.", detail: "ربما تم نقلها أو حذفها.", home: "العودة إلى الرئيسية" },
};

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { locale } = useLocale();
  const t = copy[locale] ?? copy.fr;
  return <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"><Card className="mx-4 w-full max-w-lg border-0 bg-white/80 shadow-lg backdrop-blur-sm"><CardContent className="pb-8 pt-8 text-center"><div className="mb-6 flex justify-center"><div className="relative"><div className="absolute inset-0 animate-pulse rounded-full bg-red-100" /><AlertCircle className="relative h-16 w-16 text-red-500" /></div></div><h1 className="mb-2 text-4xl font-bold text-slate-900">404</h1><h2 className="mb-4 text-xl font-semibold text-slate-700">{t.title}</h2><p className="mb-8 leading-relaxed text-slate-600">{t.text}<br />{t.detail}</p><div id="not-found-button-group" className="flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => setLocation("/")} className="rounded-lg bg-blue-600 px-6 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"><Home className="mr-2 h-4 w-4" />{t.home}</Button></div></CardContent></Card></div>;
}
