import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type MarketingConsent = "unknown" | "granted" | "denied";

type MarketingConsentContextValue = {
  consent: MarketingConsent;
  isReady: boolean;
  grantMarketingConsent: () => void;
  denyMarketingConsent: () => void;
  resetMarketingConsent: () => void;
};

const STORAGE_KEY = "mazigho_marketing_consent_v1";
const MarketingConsentContext = createContext<MarketingConsentContextValue | null>(null);

export function MarketingConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<MarketingConsent>("unknown");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      setConsent(saved === "granted" || saved === "denied" ? saved : "unknown");
    } finally {
      setIsReady(true);
    }
  }, []);

  const setStoredConsent = (value: Exclude<MarketingConsent, "unknown">) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  };

  const value = useMemo<MarketingConsentContextValue>(() => ({
    consent,
    isReady,
    grantMarketingConsent: () => setStoredConsent("granted"),
    denyMarketingConsent: () => setStoredConsent("denied"),
    resetMarketingConsent: () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setConsent("unknown");
    },
  }), [consent, isReady]);

  return <MarketingConsentContext.Provider value={value}>{children}</MarketingConsentContext.Provider>;
}

export function useMarketingConsent() {
  const context = useContext(MarketingConsentContext);
  if (!context) throw new Error("useMarketingConsent must be used within MarketingConsentProvider");
  return context;
}
