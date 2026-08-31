import { invokeLLM, listLLMModels } from "./_core/llm";
import {
  getProductTranslationSource,
  isProductTranslationLocale,
  saveProductTranslation,
  type ProductTranslationLocale,
} from "./db";

export const PRODUCT_TRANSLATION_LANGUAGE_NAMES: Record<ProductTranslationLocale, string> = {
  de: "allemand",
  it: "italien",
  en: "anglais",
  es: "espagnol",
  nl: "néerlandais",
  ar: "arabe moderne standard",
};

type TranslationPayload = {
  locale: ProductTranslationLocale;
  name: string;
  description: string | null;
  longDescription: string | null;
  options: string | null;
};

function responseText(content: string | unknown[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((part): part is { type: "text"; text: string } =>
      typeof part === "object" && part !== null &&
      "type" in part && "text" in part &&
      (part as { type?: string }).type === "text" &&
      typeof (part as { text?: unknown }).text === "string"
    )
    .map(part => part.text)
    .join("\n");
}

function getSameJsonShape(source: unknown, translated: unknown): boolean {
  if (typeof source !== typeof translated) return false;
  if (source === null || translated === null) return source === translated;
  if (Array.isArray(source)) {
    return Array.isArray(translated) && source.length === translated.length &&
      source.every((item, index) => getSameJsonShape(item, translated[index]));
  }
  if (typeof source === "object") {
    if (Array.isArray(translated)) return false;
    const sourceRecord = source as Record<string, unknown>;
    const translatedRecord = translated as Record<string, unknown>;
    const sourceKeys = Object.keys(sourceRecord).sort();
    const translatedKeys = Object.keys(translatedRecord).sort();
    return sourceKeys.length === translatedKeys.length &&
      sourceKeys.every((key, index) => key === translatedKeys[index] && getSameJsonShape(sourceRecord[key], translatedRecord[key]));
  }
  if (typeof source === "number" || typeof source === "boolean") return source === translated;
  return true;
}

function validatedOptions(source: string | null, candidate: unknown): string | null {
  if (!source) return null;
  if (typeof candidate !== "string" || candidate.trim().length === 0) return source;
  try {
    const sourceJson = JSON.parse(source);
    const candidateJson = JSON.parse(candidate);
    return getSameJsonShape(sourceJson, candidateJson) ? candidate : source;
  } catch {
    // Options are occasionally plain text in older product records. Keep this source text intact.
    return source;
  }
}

function validatePayload(value: unknown, requestedLocales: ProductTranslationLocale[], sourceOptions: string | null): TranslationPayload[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { translations?: unknown }).translations)) {
    throw new Error("La réponse de traduction est incomplète.");
  }

  const byLocale = new Map<ProductTranslationLocale, TranslationPayload>();
  for (const item of (value as { translations: unknown[] }).translations) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.locale !== "string" || !isProductTranslationLocale(record.locale) || !requestedLocales.includes(record.locale)) continue;
    if (typeof record.name !== "string" || record.name.trim().length < 1 || record.name.length > 200) continue;
    const nullableText = (field: "description" | "longDescription") => {
      const candidate = record[field];
      return typeof candidate === "string" ? candidate.trim() : null;
    };
    byLocale.set(record.locale, {
      locale: record.locale,
      name: record.name.trim(),
      description: nullableText("description"),
      longDescription: nullableText("longDescription"),
      options: validatedOptions(sourceOptions, record.options),
    });
  }

  const missing = requestedLocales.filter(locale => !byLocale.has(locale));
  if (missing.length > 0) {
    throw new Error(`La traduction est incomplète pour : ${missing.join(", ")}.`);
  }
  return requestedLocales.map(locale => byLocale.get(locale)!);
}

async function chooseTranslationModel() {
  try {
    const { data } = await listLLMModels();
    return data.find(model => model.id === "gpt-4.1-mini")?.id
      ?? data.find(model => model.id === "gpt-5-mini")?.id
      ?? data.find(model => model.id.startsWith("gpt-5-"))?.id
      ?? data[0]?.id;
  } catch {
    // invokeLLM will safely use the deployment default if catalog discovery is temporarily unavailable.
    return undefined;
  }
}

export async function translateProductFromFrench(productId: number, requestedLocales: ProductTranslationLocale[]) {
  const uniqueLocales = Array.from(new Set(requestedLocales)) as ProductTranslationLocale[];
  if (uniqueLocales.length === 0) throw new Error("Sélectionnez au moins une langue à traduire.");
  if (uniqueLocales.some(locale => !isProductTranslationLocale(locale))) {
    throw new Error("Une langue de traduction demandée n’est pas prise en charge.");
  }

  const source = await getProductTranslationSource(productId);
  if (!source) throw new Error("Produit introuvable.");

  const model = await chooseTranslationModel();
  const result = await invokeLLM({
    ...(model ? { model } : {}),
    messages: [
      {
        role: "system",
        content: "Vous êtes un traducteur e-commerce professionnel. Traduisez uniquement le contenu fourni du français vers les langues demandées. Ne créez aucune promesse commerciale, caractéristique, certification, délai, garantie ou information produit. Conservez exactement les marques, noms propres, références, unités, tailles, nombres, pourcentages, devises et données techniques. Les champs options sont une chaîne JSON : conservez exactement toutes les clés, la structure et toutes les valeurs numériques ou booléennes ; traduisez seulement les valeurs textuelles destinées au client. Pour l’arabe, rédigez en arabe moderne naturel et ne translittérez pas inutilement les marques. Répondez uniquement au schéma JSON demandé.",
      },
      {
        role: "user",
        content: JSON.stringify({
          sourceLocale: "fr",
          targetLocales: uniqueLocales.map(locale => ({ code: locale, language: PRODUCT_TRANSLATION_LANGUAGE_NAMES[locale] })),
          product: {
            name: source.name,
            description: source.description,
            longDescription: source.longDescription,
            options: source.options,
          },
        }),
      },
    ],
    outputSchema: {
      name: "product_translations",
      strict: true,
      schema: {
        type: "object",
        properties: {
          translations: {
            type: "array",
            minItems: uniqueLocales.length,
            maxItems: uniqueLocales.length,
            items: {
              type: "object",
              properties: {
                locale: { type: "string" },
                name: { type: "string" },
                description: { type: ["string", "null"] },
                longDescription: { type: ["string", "null"] },
                options: { type: ["string", "null"] },
              },
              required: ["locale", "name", "description", "longDescription", "options"],
              additionalProperties: false,
            },
          },
        },
        required: ["translations"],
        additionalProperties: false,
      },
    },
  });

  const raw = responseText(result.choices[0]?.message.content ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Le service de traduction a renvoyé un format non exploitable. Réessayez.");
  }

  const translations = validatePayload(parsed, uniqueLocales, source.options);
  const saved = await Promise.all(translations.map(translation => saveProductTranslation({
    ...translation,
    productId,
    machineGenerated: true,
    sourceUpdatedAt: source.updatedAt,
  })));

  return saved.filter((translation): translation is NonNullable<typeof translation> => Boolean(translation));
}

export async function saveManualProductTranslation(input: TranslationPayload & { productId: number }) {
  const source = await getProductTranslationSource(input.productId);
  if (!source) throw new Error("Produit introuvable.");
  return await saveProductTranslation({
    ...input,
    options: validatedOptions(source.options, input.options),
    machineGenerated: false,
    sourceUpdatedAt: source.updatedAt,
  });
}
