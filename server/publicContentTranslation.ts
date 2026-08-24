import { invokeLLM, listLLMModels } from "./_core/llm";
import {
  getPublicContentTranslationSource,
  isPublicContentTranslationLocale,
  savePublicContentTranslation,
  type PublicContentPayload,
  type PublicContentTranslationLocale,
  type PublicContentType,
} from "./db";

const languageNames: Record<PublicContentTranslationLocale, string> = {
  de: "allemand",
  it: "italien",
  en: "anglais",
  es: "espagnol",
  nl: "néerlandais",
  ar: "arabe moderne standard",
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

function validateTranslations(value: unknown, locales: PublicContentTranslationLocale[], requiredKeys: string[]) {
  if (!value || typeof value !== "object" || !Array.isArray((value as { translations?: unknown }).translations)) throw new Error("Réponse de traduction incomplète.");
  const results = new Map<PublicContentTranslationLocale, PublicContentPayload>();
  for (const candidate of (value as { translations: unknown[] }).translations) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    if (typeof record.locale !== "string" || !isPublicContentTranslationLocale(record.locale) || !locales.includes(record.locale)) continue;
    if (!requiredKeys.every(key => typeof record[key] === "string" && String(record[key]).trim().length <= 1200)) continue;
    results.set(record.locale, Object.fromEntries(requiredKeys.map(key => [key, String(record[key]).trim()])));
  }
  const missing = locales.filter(locale => !results.has(locale));
  if (missing.length) throw new Error(`Traduction incomplète : ${missing.join(", ")}.`);
  return results;
}

export async function translatePublicContentFromFrench(contentType: PublicContentType, contentId: number, requestedLocales: PublicContentTranslationLocale[]) {
  const locales = Array.from(new Set(requestedLocales)) as PublicContentTranslationLocale[];
  if (!locales.length || locales.some(locale => !isPublicContentTranslationLocale(locale))) throw new Error("Sélectionnez au moins une langue prise en charge.");
  const source = await getPublicContentTranslationSource(contentType, contentId);
  if (!source) throw new Error("Source de contenu introuvable.");
  const fields = Object.keys(source.payload);
  const model = await chooseModel();
  const result = await invokeLLM({
    ...(model ? { model } : {}),
    messages: [
      {
        role: "system",
        content: "Vous traduisez exclusivement un contenu éditorial e-commerce du français vers les langues demandées. Ne créez aucune promesse commerciale, promotion, prix, garantie, délai, disponibilité, information légale ou caractéristique non fournie. Conservez exactement MAZIGHO, les marques, chiffres, unités, URL et termes techniques. Gardez la même structure de champs et traduisez chaque champ, même s’il est vide. Pour l’arabe, utilisez l’arabe moderne standard. Répondez uniquement au JSON demandé.",
      },
      {
        role: "user",
        content: JSON.stringify({ sourceLocale: "fr", contentType, targetLocales: locales.map(locale => ({ code: locale, language: languageNames[locale] })), fields, source: source.payload }),
      },
    ],
    outputSchema: {
      name: "public_content_translations",
      strict: true,
      schema: {
        type: "object",
        properties: {
          translations: {
            type: "array",
            minItems: locales.length,
            maxItems: locales.length,
            items: {
              type: "object",
              properties: Object.fromEntries([["locale", { type: "string" }], ...fields.map(field => [field, { type: "string" }])]),
              required: ["locale", ...fields],
              additionalProperties: false,
            },
          },
        },
        required: ["translations"],
        additionalProperties: false,
      },
    },
  });
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText(result.choices[0]?.message.content ?? ""));
  } catch {
    throw new Error("Le service de traduction a renvoyé un format non exploitable. Réessayez.");
  }
  const translations = validateTranslations(parsed, locales, fields);
  return await Promise.all(Array.from(translations.entries()).map(([locale, payload]) => savePublicContentTranslation({ contentType, contentId, locale, payload, machineGenerated: true })));
}
