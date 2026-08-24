import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const storefrontLocales = ["fr", "de", "it", "en", "es", "nl", "ar"] as const;
export type StorefrontLocale = typeof storefrontLocales[number];

export type LocaleOption = {
  code: StorefrontLocale;
  label: string;
  nativeLabel: string;
  direction: "ltr" | "rtl";
};

export const localeOptions: LocaleOption[] = [
  { code: "fr", label: "Français", nativeLabel: "Français", direction: "ltr" },
  { code: "de", label: "Allemand", nativeLabel: "Deutsch", direction: "ltr" },
  { code: "it", label: "Italien", nativeLabel: "Italiano", direction: "ltr" },
  { code: "en", label: "Anglais", nativeLabel: "English", direction: "ltr" },
  { code: "es", label: "Espagnol", nativeLabel: "Español", direction: "ltr" },
  { code: "nl", label: "Néerlandais", nativeLabel: "Nederlands", direction: "ltr" },
  { code: "ar", label: "Arabe", nativeLabel: "العربية", direction: "rtl" },
];

// Suggestions only. The customer always remains free to select any storefront language.
export const suggestedLocalesByCountry: Record<string, StorefrontLocale[]> = {
  CH: ["fr", "de", "it", "en"],
  BE: ["fr", "nl", "de", "en"],
  NL: ["nl", "en"],
  FR: ["fr", "en"],
  DE: ["de", "en"],
  AT: ["de", "en"],
  IT: ["it", "en"],
  ES: ["es", "en"],
};

type LocaleContextValue = {
  locale: StorefrontLocale;
  localeOption: LocaleOption;
  direction: "ltr" | "rtl";
  setLocale: (locale: StorefrontLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
const storageKey = "mazigho-storefront-locale";

function isStorefrontLocale(value: string | null): value is StorefrontLocale {
  return storefrontLocales.includes(value as StorefrontLocale);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<StorefrontLocale>(() => {
    if (typeof window === "undefined") return "fr";
    const stored = window.localStorage.getItem(storageKey);
    return isStorefrontLocale(stored) ? stored : "fr";
  });

  const localeOption = localeOptions.find(option => option.code === locale) ?? localeOptions[0];

  useEffect(() => {
    window.localStorage.setItem(storageKey, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = localeOption.direction;
  }, [locale, localeOption.direction]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    localeOption,
    direction: localeOption.direction,
    setLocale: setLocaleState,
  }), [locale, localeOption]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale doit être utilisé dans LocaleProvider");
  return context;
}
