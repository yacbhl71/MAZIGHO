import fs from "node:fs/promises";

const source = {
  hero: {
    eyebrow: "MAZIGHO · sélection du moment",
    secondaryCta: "Voir les best-sellers",
    banners: {
      "Découvrez nos Meilleures Offres": { subtitle: "Simplifiez votre quotidien avec style", primaryCta: "Commander maintenant" },
      "Mode & Accessoires": { subtitle: "Les dernières tendances de la saison", primaryCta: "Voir la collection" },
      "Beauté & Bien-Être": { subtitle: "Prenez soin de vous avec nos produits premium", primaryCta: "Découvrir" },
    },
  },
  highlight: {
    eyebrow: "L’inspiration MAZIGHO",
    title: "Des trouvailles qui embellissent le quotidien.",
    text: "Mode, bien-être, maison et accessoires : une sélection pensée pour chaque moment.",
  },
  reassurance: [
    { title: "Une sélection qui a du sens", text: "Des trouvailles utiles pour le quotidien." },
    { title: "Prix affichés en CHF", text: "Une expérience pensée pour la Suisse." },
    { title: "Un parcours simple", text: "Du produit au panier en quelques clics." },
  ],
  discovery: {
    eyebrow: "Explorer MAZIGHO",
    title: "Découvrez nos univers",
    text: "Six catégories visuelles pour passer directement de l’inspiration à la sélection qui vous ressemble.",
    allShop: "Voir toute la boutique",
    browseShop: "Parcourir toute la boutique",
    tiles: [
      { title: "Mode & accessoires", description: "Les détails qui accompagnent votre style au quotidien." },
      { title: "Beauté & bien-être", description: "Des instants de soin et de confort à s’offrir." },
      { title: "Maison & cuisine", description: "Des objets simples qui facilitent les petits moments." },
      { title: "Sport & plein air", description: "Pour bouger, respirer et profiter davantage." },
      { title: "High-tech utile", description: "Des accessoires pensés pour rester connecté sans effort." },
      { title: "Mobilité & auto", description: "Les indispensables pour vos trajets et vos escapades." },
    ],
  },
  story: {
    eyebrow: "Notre inspiration",
    title: "L’histoire inspirante de MAZIGHO.",
    text: "MAZIGHO est né d’une idée simple : rendre les bonnes découvertes plus accessibles. Nous aimons les objets utiles, les petits plaisirs et les détails qui donnent une touche plus douce à la journée.",
    followup: "Notre sélection évolue avec les envies de la saison, entre mode, bien-être, maison et accessoires, afin de vous laisser explorer librement ce qui vous ressemble.",
    points: ["Choisir avec attention", "Simplifier la recherche", "Inspirer le quotidien"],
    cta: "Découvrir l’univers MAZIGHO",
    visualEyebrow: "L’esprit MAZIGHO",
    visualTitle: "Des trouvailles pour accompagner les moments qui comptent.",
    promiseEyebrow: "Notre promesse",
    promise: "De l’inspiration, simplement.",
  },
  testimonials: {
    eyebrow: "La parole à nos clients",
    title: "Vos retours font grandir MAZIGHO.",
    text: "Les avis approuvés seront présentés ici pour partager les expériences réelles de notre communauté.",
    cta: "Découvrir la sélection",
    items: [
      { title: "Votre expérience compte", text: "Les premiers avis authentiques de nos clients seront mis en avant ici après validation." },
      { title: "Des retours en toute confiance", text: "Chaque témoignage publié aide les autres visiteurs à faire leur choix sereinement." },
      { title: "Une boutique qui grandit avec vous", text: "Vos découvertes et vos retours inspirent les prochaines sélections MAZIGHO." },
    ],
  },
  editorial: { eyebrow: "Le détail qui fait la différence.", title: "Des objets choisis pour les petits moments qui comptent." },
  featured: {
    eyebrow: "La sélection du moment",
    title: "Produits phares",
    text: "Les articles dont la livraison est confirmée pour {country}.",
    catalogue: "Tout le catalogue",
    unavailable: "Aucun produit n’est encore confirmé pour la livraison vers {country}. La sélection sera affichée dès qu’un devis fournisseur aura été validé.",
    new: "Nouveau",
  },
  closing: {
    eyebrow: "L’esprit MAZIGHO",
    title: "Des trouvailles utiles, avec une expérience plus humaine.",
    text: "Nous mettons en avant des produits qui simplifient le quotidien, dans une boutique claire, chaleureuse et pensée pour accompagner chaque décision.",
    shopCta: "Découvrir la boutique",
    contactCta: "Nous contacter",
    chfText: "Une boutique locale dans sa façon de parler, ouverte sur les meilleures trouvailles.",
  },
  footer: {
    description: "Votre destination pour des produits premium de qualité exceptionnelle.",
    navigation: "Navigation",
    about: "À propos",
    categories: "Catégories",
    categoryLabels: ["High-tech & gadgets", "Maison & organisation", "Beauté & bien-être", "Sport & fitness", "Mode"],
    help: "Besoin d’aide ?",
    contactForm: "Écrivez-nous via le formulaire de contact",
    contactInfo: "Votre message est transmis directement à l’équipe MAZIGHO.",
    deliveryTitle: "Livraison Suisse & Europe",
    deliveryText: "Les conditions sont précisées avant validation.",
    secureTitle: "Connexion sécurisée",
    secureText: "Votre navigation est protégée par HTTPS.",
    serviceTitle: "Service client",
    serviceText: "Une question ? Utilisez notre formulaire.",
    rights: "Tous droits réservés.",
    terms: "Conditions générales",
    returns: "Livraison et retours",
    privacy: "Politique de confidentialité",
    legal: "Mentions légales",
  },
};

function sameShape(sourceValue, value) {
  if (typeof sourceValue !== typeof value) return false;
  if (sourceValue === null || value === null) return sourceValue === value;
  if (Array.isArray(sourceValue)) return Array.isArray(value) && sourceValue.length === value.length && sourceValue.every((item, index) => sameShape(item, value[index]));
  if (typeof sourceValue === "object") {
    const sourceKeys = Object.keys(sourceValue).sort();
    const valueKeys = Object.keys(value).sort();
    return sourceKeys.length === valueKeys.length && sourceKeys.every((key, index) => key === valueKeys[index] && sameShape(sourceValue[key], value[key]));
  }
  return typeof sourceValue === "string" ? typeof value === "string" && value.trim().length > 0 : sourceValue === value;
}

function schemaFor(value) {
  if (Array.isArray(value)) return { type: "array", items: value.length > 0 ? schemaFor(value[0]) : { type: "string" }, minItems: value.length, maxItems: value.length };
  if (value && typeof value === "object") {
    const properties = Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, schemaFor(nested)]));
    return { type: "object", properties, required: Object.keys(value), additionalProperties: false };
  }
  return { type: "string" };
}

const targetLanguages = { de: "German", it: "Italian", en: "English", es: "Spanish", nl: "Dutch", ar: "Modern Standard Arabic" };
const apiBase = process.env.OPENAI_API_BASE;
const apiKey = process.env.OPENAI_API_KEY;
if (!apiBase || !apiKey) throw new Error("The sandbox translation service is not configured.");

const response = await fetch(`${apiBase.replace(/\/$/, "")}/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: "gpt-5-mini",
    max_completion_tokens: 16000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mazigho_public_copy",
        strict: true,
        schema: {
          type: "object",
          properties: Object.fromEntries(Object.keys(targetLanguages).map(locale => [locale, schemaFor(source)])),
          required: Object.keys(targetLanguages),
          additionalProperties: false,
        },
      },
    },
    messages: [
      { role: "system", content: "You translate public e-commerce website copy. Return valid JSON only. Translate every string in the supplied French JSON into the requested target languages while preserving the exact JSON structure, array order, MAZIGHO, CHF, {country}, acronyms, factual meaning, and URL-independent labels. Do not invent claims, guarantees, delivery information, or product facts. Arabic must be natural Modern Standard Arabic. Keep titles concise." },
      { role: "user", content: JSON.stringify({ targetLanguages, source }) },
    ],
  }),
});
if (!response.ok) throw new Error(`Translation generation failed: ${response.status} ${await response.text()}`);
const payload = await response.json();
const text = payload?.choices?.[0]?.message?.content;
if (typeof text !== "string") throw new Error("Translation response contained no text.");
const translated = JSON.parse(text);
await fs.writeFile("/tmp/mazigho_public_copy_raw.json", JSON.stringify(translated, null, 2) + "\n");
for (const locale of Object.keys(targetLanguages)) {
  if (!sameShape(source, translated[locale])) throw new Error(`Invalid translation structure for ${locale}.`);
}
await fs.writeFile(new URL("../client/src/lib/publicCopy.json", import.meta.url), JSON.stringify({ fr: source, ...translated }, null, 2) + "\n");
console.log("Generated client/src/lib/publicCopy.json for", Object.keys(targetLanguages).join(", "));
