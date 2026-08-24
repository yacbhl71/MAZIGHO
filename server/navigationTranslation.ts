import { invokeLLM, listLLMModels } from "./_core/llm";
import { getDesignProfile, updateDesignProfile, type DesignProfile } from "./db";

export const NAVIGATION_TRANSLATION_LOCALES = ["de", "it", "en", "es", "nl", "ar"] as const;
export type NavigationTranslationLocale = typeof NAVIGATION_TRANSLATION_LOCALES[number];

type NavigationLabels = Pick<DesignProfile, "navigationHome" | "navigationShop" | "navigationCategories" | "navigationCreations" | "navigationContact">;

type TranslationRecord = { locale: NavigationTranslationLocale } & NavigationLabels;

const languageNames: Record<NavigationTranslationLocale, string> = {
  de: "allemand", it: "italien", en: "anglais", es: "espagnol", nl: "néerlandais", ar: "arabe moderne standard",
};

function responseText(content: string | unknown[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((part): part is { type: "text"; text: string } => typeof part === "object" && part !== null && "type" in part && "text" in part && (part as { type?: string }).type === "text" && typeof (part as { text?: unknown }).text === "string")
    .map(part => part.text)
    .join("\n");
}

async function chooseModel() {
  try {
    const { data } = await listLLMModels();
    return data.find(model => model.id === "gpt-5-mini")?.id ?? data.find(model => model.id.startsWith("gpt-5-"))?.id ?? data[0]?.id;
  } catch {
    return undefined;
  }
}

function validateTranslations(value: unknown, locales: NavigationTranslationLocale[]) {
  if (!value || typeof value !== "object" || !Array.isArray((value as { translations?: unknown }).translations)) throw new Error("Réponse de traduction incomplète.");
  const results = new Map<NavigationTranslationLocale, NavigationLabels>();
  for (const candidate of (value as { translations: unknown[] }).translations) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    const locale = record.locale;
    if (typeof locale !== "string" || !NAVIGATION_TRANSLATION_LOCALES.includes(locale as NavigationTranslationLocale) || !locales.includes(locale as NavigationTranslationLocale)) continue;
    const keys = ["navigationHome", "navigationShop", "navigationCategories", "navigationCreations", "navigationContact"] as const;
    if (!keys.every(key => typeof record[key] === "string" && record[key].trim().length > 0 && record[key].trim().length <= 40)) continue;
    results.set(locale as NavigationTranslationLocale, Object.fromEntries(keys.map(key => [key, String(record[key]).trim()])) as NavigationLabels);
  }
  const missing = locales.filter(locale => !results.has(locale));
  if (missing.length) throw new Error(`Traduction incomplète : ${missing.join(", ")}.`);
  return results;
}

export async function translateNavigationFromFrench(requestedLocales: NavigationTranslationLocale[]) {
  const locales = Array.from(new Set(requestedLocales)) as NavigationTranslationLocale[];
  if (!locales.length) throw new Error("Sélectionnez au moins une langue.");
  const source = await getDesignProfile();
  const model = await chooseModel();
  const result = await invokeLLM({
    ...(model ? { model } : {}),
    messages: [
      { role: "system", content: "Vous traduisez des libellés courts de navigation e-commerce du français vers les langues demandées. Ne créez aucune promesse commerciale. Conservez le nom MAZIGHO si présent. Chaque libellé doit rester naturel, clair, sans ponctuation inutile et ne pas dépasser 40 caractères. Pour l’arabe, utilisez l’arabe moderne standard. Répondez uniquement au JSON du schéma." },
      { role: "user", content: JSON.stringify({ sourceLocale: "fr", targetLocales: locales.map(locale => ({ code: locale, language: languageNames[locale] })), labels: { navigationHome: source.navigationHome, navigationShop: source.navigationShop, navigationCategories: source.navigationCategories, navigationCreations: source.navigationCreations, navigationContact: source.navigationContact } }) },
    ],
    outputSchema: {
      name: "navigation_translations",
      strict: true,
      schema: {
        type: "object",
        properties: { translations: { type: "array", minItems: locales.length, maxItems: locales.length, items: { type: "object", properties: { locale: { type: "string" }, navigationHome: { type: "string" }, navigationShop: { type: "string" }, navigationCategories: { type: "string" }, navigationCreations: { type: "string" }, navigationContact: { type: "string" } }, required: ["locale", "navigationHome", "navigationShop", "navigationCategories", "navigationCreations", "navigationContact"], additionalProperties: false } } },
        required: ["translations"], additionalProperties: false,
      },
    },
  });
  const parsed = JSON.parse(responseText(result.choices[0]?.message.content ?? ""));
  const translations = validateTranslations(parsed, locales);
  const navigationTranslations = { ...source.navigationTranslations, ...Object.fromEntries(translations) };
  return await updateDesignProfile({ ...source, navigationTranslations });
}
