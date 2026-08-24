import source from "./publicCopy.json";
import type { StorefrontLocale } from "@/contexts/LocaleContext";

export const publicCopy = source;
export type PublicCopy = typeof source.fr;

export function getPublicCopy(locale: StorefrontLocale): PublicCopy {
  return publicCopy[locale] ?? publicCopy.fr;
}

export function interpolatePublicCopy(text: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    text,
  );
}
