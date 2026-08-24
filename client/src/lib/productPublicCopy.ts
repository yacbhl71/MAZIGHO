import type { StorefrontLocale } from "@/contexts/LocaleContext";

type ProductPublicCopy = {
  reviewsTitle: string;
  basedOnReviews: (count: number) => string;
  noPublishedReviews: string;
  reviewSubmissionTitle: string;
  reviewSubmissionUnavailable: string;
  relatedProducts: string;
  color: string;
  size: string;
  weight: string;
  colors: Record<string, string>;
};

const colorKeys = ["black", "white", "gray", "silver", "gold", "pink", "blue", "green", "purple"] as const;
type ColorKey = (typeof colorKeys)[number];

const makeColors = (values: string[]): Record<ColorKey, string> =>
  Object.fromEntries(colorKeys.map((key, index) => [key, values[index]])) as Record<ColorKey, string>;

export const productPublicCopy: Record<StorefrontLocale, ProductPublicCopy> = {
  fr: {
    reviewsTitle: "Avis clients",
    basedOnReviews: (count) => `Basé sur ${count} avis`,
    noPublishedReviews: "Aucun avis publié pour le moment.",
    reviewSubmissionTitle: "Publication d’avis indisponible",
    reviewSubmissionUnavailable: "La soumission d’avis depuis le site n’est pas activée actuellement.",
    relatedProducts: "Produits similaires",
    color: "Couleur",
    size: "Taille",
    weight: "Poids",
    colors: makeColors(["Noir", "Blanc", "Gris", "Argent", "Or", "Rose", "Bleu", "Vert", "Violet"]),
  },
  de: {
    reviewsTitle: "Kundenbewertungen",
    basedOnReviews: (count) => `Basierend auf ${count} Bewertungen`,
    noPublishedReviews: "Derzeit sind keine Bewertungen veröffentlicht.",
    reviewSubmissionTitle: "Bewertung abgeben nicht verfügbar",
    reviewSubmissionUnavailable: "Das Absenden von Bewertungen über die Website ist derzeit nicht aktiviert.",
    relatedProducts: "Ähnliche Produkte",
    color: "Farbe",
    size: "Größe",
    weight: "Gewicht",
    colors: makeColors(["Schwarz", "Weiß", "Grau", "Silber", "Gold", "Rosa", "Blau", "Grün", "Violett"]),
  },
  it: {
    reviewsTitle: "Recensioni dei clienti",
    basedOnReviews: (count) => `Basato su ${count} recensioni`,
    noPublishedReviews: "Nessuna recensione è pubblicata al momento.",
    reviewSubmissionTitle: "Invio delle recensioni non disponibile",
    reviewSubmissionUnavailable: "L’invio di recensioni dal sito non è attivo al momento.",
    relatedProducts: "Prodotti simili",
    color: "Colore",
    size: "Taglia",
    weight: "Peso",
    colors: makeColors(["Nero", "Bianco", "Grigio", "Argento", "Oro", "Rosa", "Blu", "Verde", "Viola"]),
  },
  en: {
    reviewsTitle: "Customer reviews",
    basedOnReviews: (count) => `Based on ${count} reviews`,
    noPublishedReviews: "No reviews have been published yet.",
    reviewSubmissionTitle: "Review submission unavailable",
    reviewSubmissionUnavailable: "Submitting reviews through the website is not enabled at this time.",
    relatedProducts: "Related products",
    color: "Color",
    size: "Size",
    weight: "Weight",
    colors: makeColors(["Black", "White", "Gray", "Silver", "Gold", "Pink", "Blue", "Green", "Purple"]),
  },
  es: {
    reviewsTitle: "Opiniones de clientes",
    basedOnReviews: (count) => `Basado en ${count} opiniones`,
    noPublishedReviews: "Aún no hay opiniones publicadas.",
    reviewSubmissionTitle: "Envío de opiniones no disponible",
    reviewSubmissionUnavailable: "El envío de opiniones desde el sitio no está activado actualmente.",
    relatedProducts: "Productos similares",
    color: "Color",
    size: "Talla",
    weight: "Peso",
    colors: makeColors(["Negro", "Blanco", "Gris", "Plateado", "Dorado", "Rosa", "Azul", "Verde", "Morado"]),
  },
  nl: {
    reviewsTitle: "Klantbeoordelingen",
    basedOnReviews: (count) => `Gebaseerd op ${count} beoordelingen`,
    noPublishedReviews: "Er zijn momenteel geen beoordelingen gepubliceerd.",
    reviewSubmissionTitle: "Beoordeling insturen niet beschikbaar",
    reviewSubmissionUnavailable: "Het insturen van beoordelingen via de website is momenteel niet geactiveerd.",
    relatedProducts: "Vergelijkbare producten",
    color: "Kleur",
    size: "Maat",
    weight: "Gewicht",
    colors: makeColors(["Zwart", "Wit", "Grijs", "Zilver", "Goud", "Roze", "Blauw", "Groen", "Paars"]),
  },
  ar: {
    reviewsTitle: "آراء العملاء",
    basedOnReviews: (count) => `استناداً إلى ${count} تقييمات`,
    noPublishedReviews: "لا توجد تقييمات منشورة حالياً.",
    reviewSubmissionTitle: "إرسال التقييمات غير متاح",
    reviewSubmissionUnavailable: "لا تتوفر ميزة إرسال التقييمات عبر الموقع في الوقت الحالي.",
    relatedProducts: "منتجات مشابهة",
    color: "اللون",
    size: "المقاس",
    weight: "الوزن",
    colors: makeColors(["أسود", "أبيض", "رمادي", "فضي", "ذهبي", "وردي", "أزرق", "أخضر", "بنفسجي"]),
  },
};

export function getProductPublicCopy(locale: StorefrontLocale): ProductPublicCopy {
  return productPublicCopy[locale] ?? productPublicCopy.fr;
}
