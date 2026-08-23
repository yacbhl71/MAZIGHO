import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const deliveryCountries = [
  { code: "CH", label: "Suisse" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Allemagne" },
  { code: "IT", label: "Italie" },
  { code: "AT", label: "Autriche" },
  { code: "BE", label: "Belgique" },
  { code: "NL", label: "Pays-Bas" },
  { code: "ES", label: "Espagne" },
] as const;

export type DeliveryCountryCode = (typeof deliveryCountries)[number]["code"];

export type DeliveryProfile = {
  countryCode: string;
  customerShippingCost: number;
  supplierShippingCost: number;
  deliveryMethod?: string | null;
  minDeliveryDays?: number | null;
  maxDeliveryDays?: number | null;
};

type DeliveryCountryContextValue = {
  countryCode: DeliveryCountryCode;
  countryLabel: string;
  setCountryCode: (countryCode: DeliveryCountryCode) => void;
};

const DeliveryCountryContext = createContext<DeliveryCountryContextValue | null>(null);
const storageKey = "mazigho-delivery-country";

export function DeliveryCountryProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCode] = useState<DeliveryCountryCode>("CH");

  useEffect(() => {
    const savedCountry = window.localStorage.getItem(storageKey);
    if (deliveryCountries.some(country => country.code === savedCountry)) {
      setCountryCode(savedCountry as DeliveryCountryCode);
    }
  }, []);

  const value = useMemo(() => ({
    countryCode,
    countryLabel: deliveryCountries.find(country => country.code === countryCode)?.label || "Suisse",
    setCountryCode: (nextCountry: DeliveryCountryCode) => {
      setCountryCode(nextCountry);
      window.localStorage.setItem(storageKey, nextCountry);
    },
  }), [countryCode]);

  return <DeliveryCountryContext.Provider value={value}>{children}</DeliveryCountryContext.Provider>;
}

export function useDeliveryCountry() {
  const context = useContext(DeliveryCountryContext);
  if (!context) throw new Error("useDeliveryCountry must be used within DeliveryCountryProvider");
  return context;
}

export function getDeliveryProfileForCountry(profiles: DeliveryProfile[] | null | undefined, countryCode: string) {
  return profiles?.find(profile => profile.countryCode === countryCode) || null;
}
