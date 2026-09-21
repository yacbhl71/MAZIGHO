import type { StorefrontLocale } from "@/contexts/LocaleContext";

const names: Record<StorefrontLocale, Record<string, string>> = {
  fr: { CH: "Suisse", FR: "France", DE: "Allemagne", IT: "Italie", AT: "Autriche", BE: "Belgique", NL: "Pays-Bas", ES: "Espagne", DZ: "Algérie" },
  de: { CH: "Schweiz", FR: "Frankreich", DE: "Deutschland", IT: "Italien", AT: "Österreich", BE: "Belgien", NL: "Niederlande", ES: "Spanien", DZ: "Algerien" },
  it: { CH: "Svizzera", FR: "Francia", DE: "Germania", IT: "Italia", AT: "Austria", BE: "Belgio", NL: "Paesi Bassi", ES: "Spagna", DZ: "Algeria" },
  en: { CH: "Switzerland", FR: "France", DE: "Germany", IT: "Italy", AT: "Austria", BE: "Belgium", NL: "Netherlands", ES: "Spain", DZ: "Algeria" },
  es: { CH: "Suiza", FR: "Francia", DE: "Alemania", IT: "Italia", AT: "Austria", BE: "Bélgica", NL: "Países Bajos", ES: "España", DZ: "Argelia" },
  nl: { CH: "Zwitserland", FR: "Frankrijk", DE: "Duitsland", IT: "Italië", AT: "Oostenrijk", BE: "België", NL: "Nederland", ES: "Spanje", DZ: "Algerije" },
  ar: { CH: "سويسرا", FR: "فرنسا", DE: "ألمانيا", IT: "إيطاليا", AT: "النمسا", BE: "بلجيكا", NL: "هولندا", ES: "إسبانيا", DZ: "الجزائر" },
};

export function getLocalizedCountryName(countryCode: string, locale: StorefrontLocale) {
  return names[locale][countryCode] || names.fr[countryCode] || countryCode;
}
