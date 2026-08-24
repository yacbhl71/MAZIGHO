import type { StorefrontLocale } from "@/contexts/LocaleContext";

type ProductPublicCopy = {
  reviewsTitle: string;
  basedOnReviews: (count: number) => string;
  noPublishedReviews: string;
  reviewSubmissionTitle: string;
  reviewSubmissionUnavailable: string;
  relatedProducts: string;
  addFavorite: string;
  removeFavorite: string;
  favoriteAdded: string;
  favoriteRemoved: string;
  share: string;
  linkCopied: string;
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
    addFavorite: "Ajouter aux favoris",
    removeFavorite: "Retirer des favoris",
    favoriteAdded: "Ajouté aux favoris sur cet appareil.",
    favoriteRemoved: "Retiré des favoris sur cet appareil.",
    share: "Partager ce produit",
    linkCopied: "Lien du produit copié.",
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
    addFavorite: "Zu Favoriten hinzufügen",
    removeFavorite: "Aus Favoriten entfernen",
    favoriteAdded: "Auf diesem Gerät zu Favoriten hinzugefügt.",
    favoriteRemoved: "Von diesem Gerät aus Favoriten entfernt.",
    share: "Dieses Produkt teilen",
    linkCopied: "Produktlink kopiert.",
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
    addFavorite: "Aggiungi ai preferiti",
    removeFavorite: "Rimuovi dai preferiti",
    favoriteAdded: "Aggiunto ai preferiti su questo dispositivo.",
    favoriteRemoved: "Rimosso dai preferiti su questo dispositivo.",
    share: "Condividi questo prodotto",
    linkCopied: "Link del prodotto copiato.",
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
    addFavorite: "Add to favorites",
    removeFavorite: "Remove from favorites",
    favoriteAdded: "Added to favorites on this device.",
    favoriteRemoved: "Removed from favorites on this device.",
    share: "Share this product",
    linkCopied: "Product link copied.",
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
    addFavorite: "Añadir a favoritos",
    removeFavorite: "Quitar de favoritos",
    favoriteAdded: "Añadido a favoritos en este dispositivo.",
    favoriteRemoved: "Eliminado de favoritos en este dispositivo.",
    share: "Compartir este producto",
    linkCopied: "Enlace del producto copiado.",
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
    addFavorite: "Aan favorieten toevoegen",
    removeFavorite: "Uit favorieten verwijderen",
    favoriteAdded: "Toegevoegd aan favorieten op dit apparaat.",
    favoriteRemoved: "Verwijderd uit favorieten op dit apparaat.",
    share: "Dit product delen",
    linkCopied: "Productlink gekopieerd.",
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
    addFavorite: "إضافة إلى المفضلة",
    removeFavorite: "إزالة من المفضلة",
    favoriteAdded: "تمت الإضافة إلى المفضلة على هذا الجهاز.",
    favoriteRemoved: "تمت الإزالة من المفضلة على هذا الجهاز.",
    share: "مشاركة هذا المنتج",
    linkCopied: "تم نسخ رابط المنتج.",
    color: "اللون",
    size: "المقاس",
    weight: "الوزن",
    colors: makeColors(["أسود", "أبيض", "رمادي", "فضي", "ذهبي", "وردي", "أزرق", "أخضر", "بنفسجي"]),
  },
};

export function getProductPublicCopy(locale: StorefrontLocale): ProductPublicCopy {
  return productPublicCopy[locale] ?? productPublicCopy.fr;
}
