import type { StorefrontLocale } from "@/contexts/LocaleContext";

export type LimitedStorefrontCopy = {
  announcements: [string, string, string];
  homeEyebrow: string;
  homeTitle: string;
  homeText: string;
  catalogueLink: string;
  shopEyebrow: string;
  shopTitle: string;
  shopIntro: string;
  productsEyebrow: string;
  productsTitle: string;
  productsText: string;
  productPriceTitle: string;
  productPriceText: string;
  productAvailability: string;
};

const copy: Record<StorefrontLocale, LimitedStorefrontCopy> = {
  fr: {
    announcements: ["Vitrine en préparation", "Commandes momentanément fermées", "Ouverture annoncée ici"],
    homeEyebrow: "La maison se prépare",
    homeTitle: "Un univers à découvrir",
    homeText: "La collection se prépare. Les références, leur prix et leur disponibilité seront confirmés à l’ouverture des commandes.",
    catalogueLink: "Découvrir l’univers",
    shopEyebrow: "Vitrine de découverte",
    shopTitle: "La collection se prépare",
    shopIntro: "Cette boutique partage son univers sans panier, commande ni paiement pour le moment.",
    productsEyebrow: "Aperçu de collection",
    productsTitle: "Références à venir",
    productsText: "Les commandes ne sont pas encore ouvertes. Revenez bientôt pour découvrir la sélection finalisée.",
    productPriceTitle: "Prix communiqué à l’ouverture",
    productPriceText: "Cette référence est présentée à titre d’aperçu ; elle ne peut pas encore être commandée.",
    productAvailability: "Disponibilité et conditions de livraison communiquées à l’ouverture des commandes.",
  },
  de: {
    announcements: ["Schaufenster in Vorbereitung", "Bestellungen derzeit geschlossen", "Eröffnung wird hier angekündigt"],
    homeEyebrow: "Die Marke bereitet sich vor",
    homeTitle: "Eine Welt zum Entdecken",
    homeText: "Die Kollektion wird vorbereitet. Artikel, Preise und Verfügbarkeit werden zur Eröffnung der Bestellungen bestätigt.",
    catalogueLink: "Die Welt entdecken",
    shopEyebrow: "Schaufenster zum Entdecken",
    shopTitle: "Die Kollektion wird vorbereitet",
    shopIntro: "Dieser Shop zeigt seine Welt derzeit ohne Warenkorb, Bestellung oder Zahlung.",
    productsEyebrow: "Kollektion im Überblick",
    productsTitle: "Kommende Artikel",
    productsText: "Bestellungen sind noch nicht geöffnet. Schauen Sie bald wieder vorbei, um die fertige Auswahl zu entdecken.",
    productPriceTitle: "Preis zur Eröffnung mitgeteilt",
    productPriceText: "Dieser Artikel wird als Vorschau gezeigt und kann noch nicht bestellt werden.",
    productAvailability: "Verfügbarkeit und Lieferbedingungen werden zur Eröffnung der Bestellungen mitgeteilt.",
  },
  it: {
    announcements: ["Vetrina in preparazione", "Ordini momentaneamente chiusi", "L’apertura sarà annunciata qui"],
    homeEyebrow: "La casa si prepara",
    homeTitle: "Un universo da scoprire",
    homeText: "La collezione è in preparazione. Referenze, prezzi e disponibilità saranno confermati all’apertura degli ordini.",
    catalogueLink: "Scopri l’universo",
    shopEyebrow: "Vetrina da scoprire",
    shopTitle: "La collezione è in preparazione",
    shopIntro: "Questo negozio condivide il suo universo senza carrello, ordine o pagamento per il momento.",
    productsEyebrow: "Anteprima della collezione",
    productsTitle: "Referenze in arrivo",
    productsText: "Gli ordini non sono ancora aperti. Torna presto per scoprire la selezione finale.",
    productPriceTitle: "Prezzo comunicato all’apertura",
    productPriceText: "Questa referenza è presentata come anteprima e non può ancora essere ordinata.",
    productAvailability: "Disponibilità e condizioni di consegna saranno comunicate all’apertura degli ordini.",
  },
  en: {
    announcements: ["Showcase in preparation", "Orders are currently closed", "The opening will be announced here"],
    homeEyebrow: "The house is getting ready",
    homeTitle: "A world to discover",
    homeText: "The collection is being prepared. Products, prices and availability will be confirmed when ordering opens.",
    catalogueLink: "Discover the world",
    shopEyebrow: "Discovery showcase",
    shopTitle: "The collection is being prepared",
    shopIntro: "This shop is sharing its world without a cart, ordering or payment for the moment.",
    productsEyebrow: "Collection preview",
    productsTitle: "Coming references",
    productsText: "Orders are not open yet. Please come back soon to discover the final selection.",
    productPriceTitle: "Price shared at opening",
    productPriceText: "This product is shown as a preview and cannot be ordered yet.",
    productAvailability: "Availability and delivery terms will be shared when ordering opens.",
  },
  es: {
    announcements: ["Vitrina en preparación", "Los pedidos están cerrados temporalmente", "La apertura se anunciará aquí"],
    homeEyebrow: "La casa se prepara",
    homeTitle: "Un universo por descubrir",
    homeText: "La colección se está preparando. Las referencias, los precios y la disponibilidad se confirmarán al abrir los pedidos.",
    catalogueLink: "Descubrir el universo",
    shopEyebrow: "Vitrina de descubrimiento",
    shopTitle: "La colección se está preparando",
    shopIntro: "Esta tienda comparte su universo sin carrito, pedidos ni pagos por el momento.",
    productsEyebrow: "Vista previa de la colección",
    productsTitle: "Referencias próximamente",
    productsText: "Los pedidos todavía no están abiertos. Vuelve pronto para descubrir la selección final.",
    productPriceTitle: "Precio comunicado en la apertura",
    productPriceText: "Esta referencia se muestra como vista previa y todavía no se puede pedir.",
    productAvailability: "La disponibilidad y las condiciones de entrega se comunicarán al abrir los pedidos.",
  },
  nl: {
    announcements: ["Etalage in voorbereiding", "Bestellingen zijn tijdelijk gesloten", "De opening wordt hier aangekondigd"],
    homeEyebrow: "Het huis maakt zich klaar",
    homeTitle: "Een wereld om te ontdekken",
    homeText: "De collectie wordt voorbereid. Artikelen, prijzen en beschikbaarheid worden bevestigd wanneer bestellingen openen.",
    catalogueLink: "Ontdek de wereld",
    shopEyebrow: "Ontdekkingsetalage",
    shopTitle: "De collectie wordt voorbereid",
    shopIntro: "Deze winkel deelt zijn wereld voorlopig zonder winkelwagen, bestellingen of betalingen.",
    productsEyebrow: "Voorproefje van de collectie",
    productsTitle: "Komende referenties",
    productsText: "Bestellingen zijn nog niet geopend. Kom binnenkort terug om de definitieve selectie te ontdekken.",
    productPriceTitle: "Prijs bij opening bekendgemaakt",
    productPriceText: "Dit artikel wordt als voorproefje getoond en kan nog niet worden besteld.",
    productAvailability: "Beschikbaarheid en leveringsvoorwaarden worden bij opening van de bestellingen meegedeeld.",
  },
  ar: {
    announcements: ["واجهة قيد التحضير", "الطلبات مغلقة مؤقتاً", "سيُعلن عن الافتتاح هنا"],
    homeEyebrow: "الدار تستعد",
    homeTitle: "عالم يستحق الاكتشاف",
    homeText: "يجري تحضير المجموعة. ستتأكد المنتجات والأسعار والتوفر عند فتح الطلبات.",
    catalogueLink: "اكتشف العالم",
    shopEyebrow: "واجهة للاكتشاف",
    shopTitle: "المجموعة قيد التحضير",
    shopIntro: "يعرض هذا المتجر عالمه حالياً من دون سلة أو طلبات أو دفع.",
    productsEyebrow: "لمحة عن المجموعة",
    productsTitle: "منتجات قادمة",
    productsText: "الطلبات لم تُفتح بعد. عُد قريباً لاكتشاف التشكيلة النهائية.",
    productPriceTitle: "يُعلن السعر عند الافتتاح",
    productPriceText: "يُعرض هذا المنتج للمعاينة فقط ولا يمكن طلبه بعد.",
    productAvailability: "سيُعلن عن التوفر وشروط التوصيل عند فتح الطلبات.",
  },
};

export function getLimitedStorefrontCopy(locale: StorefrontLocale): LimitedStorefrontCopy {
  return copy[locale] ?? copy.fr;
}
