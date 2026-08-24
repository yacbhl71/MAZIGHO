import type { StorefrontLocale } from "@/contexts/LocaleContext";

const names: Record<StorefrontLocale, Record<string, string>> = {
  fr: { CH: "Suisse", FR: "France", DE: "Allemagne", IT: "Italie", AT: "Autriche", BE: "Belgique", NL: "Pays-Bas", ES: "Espagne" },
  de: { CH: "Schweiz", FR: "Frankreich", DE: "Deutschland", IT: "Italien", AT: "Österreich", BE: "Belgien", NL: "Niederlande", ES: "Spanien" },
  it: { CH: "Svizzera", FR: "Francia", DE: "Germania", IT: "Italia", AT: "Austria", BE: "Belgio", NL: "Paesi Bassi", ES: "Spagna" },
  en: { CH: "Switzerland", FR: "France", DE: "Germany", IT: "Italy", AT: "Austria", BE: "Belgium", NL: "Netherlands", ES: "Spain" },
  es: { CH: "Suiza", FR: "Francia", DE: "Alemania", IT: "Italia", AT: "Austria", BE: "Bélgica", NL: "Países Bajos", ES: "España" },
  nl: { CH: "Zwitserland", FR: "Frankrijk", DE: "Duitsland", IT: "Italië", AT: "Oostenrijk", BE: "België", NL: "Nederland", ES: "Spanje" },
  ar: { CH: "سويسرا", FR: "فرنسا", DE: "ألمانيا", IT: "إيطاليا", AT: "النمسا", BE: "بلجيكا", NL: "هولندا", ES: "إسبانيا" },
};

export function getLocalizedCountryName(countryCode: string, locale: StorefrontLocale) {
  return names[locale][countryCode] || names.fr[countryCode] || countryCode;
}
