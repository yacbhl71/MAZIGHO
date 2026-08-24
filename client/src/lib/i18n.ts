import type { StorefrontLocale } from "@/contexts/LocaleContext";

type MessageKey =
  | "topSelection" | "topDelivery" | "topQuote"
  | "home" | "shop" | "categories" | "creations" | "new" | "bestSellers" | "promotions" | "contact" | "account" | "admin"
  | "deliveryCountry" | "language" | "deliverTo" | "displayLanguage"
  | "shopEyebrow" | "shopTitle" | "shopIntro" | "viewBestSellers" | "readyToDiscover" | "currentProducts"
  | "deliverableCount" | "offer" | "freeDelivery" | "delivery" | "days" | "noProducts"
  | "exploreUniverse" | "findYourStyle" | "viewNew" | "discover"
  | "editorialSelection" | "pricesInChf" | "switzerlandEurope"
  | "noTranslation";

type MessageDictionary = Record<MessageKey, string>;

const messages: Record<StorefrontLocale, MessageDictionary> = {
  fr: {
    topSelection: "Une sélection pensée pour le quotidien", topDelivery: "Livraison transparente selon la destination", topQuote: "Coût et délai confirmés avant achat",
    home: "Accueil", shop: "Boutique", categories: "Catégories", creations: "Créations", new: "Nouveautés", bestSellers: "Best-sellers", promotions: "Promos", contact: "Contact", account: "Mon compte", admin: "Gestion MAZIGHO",
    deliveryCountry: "Pays de livraison", language: "Langue", deliverTo: "Livrer vers", displayLanguage: "Langue d’affichage",
    shopEyebrow: "La sélection MAZIGHO", shopTitle: "Notre Boutique", shopIntro: "Parcourez les produits dont la livraison est confirmée pour {country}.", viewBestSellers: "Voir les best-sellers", readyToDiscover: "Prêt à découvrir", currentProducts: "Nos produits du moment",
    deliverableCount: "{count} article(s) livrable(s) vers {country}", offer: "Offre", freeDelivery: "Livraison offerte", delivery: "Livraison", days: "jours", noProducts: "Aucun produit n’est encore confirmé pour la livraison vers {country}. Choisissez un autre pays ou revenez bientôt découvrir la sélection.",
    exploreUniverse: "Explorer par univers", findYourStyle: "Trouvez ce qui vous ressemble", viewNew: "Voir les nouveautés", discover: "Découvrir",
    editorialSelection: "Sélection éditoriale", pricesInChf: "Prix affichés en CHF", switzerlandEurope: "Livraison Suisse & Europe", noTranslation: "Cette fiche n’est pas encore disponible dans la langue choisie.",
  },
  de: {
    topSelection: "Eine Auswahl für den Alltag", topDelivery: "Transparente Lieferung je nach Zielort", topQuote: "Kosten und Lieferzeit vor dem Kauf bestätigt",
    home: "Startseite", shop: "Shop", categories: "Kategorien", creations: "Kreationen", new: "Neuheiten", bestSellers: "Bestseller", promotions: "Angebote", contact: "Kontakt", account: "Mein Konto", admin: "MAZIGHO Verwaltung",
    deliveryCountry: "Lieferland", language: "Sprache", deliverTo: "Liefern nach", displayLanguage: "Anzeigesprache",
    shopEyebrow: "Die MAZIGHO-Auswahl", shopTitle: "Unser Shop", shopIntro: "Entdecken Sie Produkte mit bestätigter Lieferung nach {country}.", viewBestSellers: "Bestseller ansehen", readyToDiscover: "Bereit zum Entdecken", currentProducts: "Unsere aktuellen Produkte",
    deliverableCount: "{count} lieferbare Artikel nach {country}", offer: "Angebot", freeDelivery: "Kostenlose Lieferung", delivery: "Lieferung", days: "Tage", noProducts: "Für {country} ist noch kein Produkt mit bestätigter Lieferung verfügbar. Wählen Sie ein anderes Land oder schauen Sie bald wieder vorbei.",
    exploreUniverse: "Nach Themen entdecken", findYourStyle: "Finden Sie, was zu Ihnen passt", viewNew: "Neuheiten ansehen", discover: "Entdecken",
    editorialSelection: "Redaktionelle Auswahl", pricesInChf: "Preise in CHF", switzerlandEurope: "Lieferung Schweiz & Europa", noTranslation: "Diese Produktseite ist in der gewählten Sprache noch nicht verfügbar.",
  },
  it: {
    topSelection: "Una selezione pensata per ogni giorno", topDelivery: "Consegna trasparente in base alla destinazione", topQuote: "Costi e tempi confermati prima dell’acquisto",
    home: "Home", shop: "Negozio", categories: "Categorie", creations: "Creazioni", new: "Novità", bestSellers: "Più venduti", promotions: "Promozioni", contact: "Contatto", account: "Il mio account", admin: "Gestione MAZIGHO",
    deliveryCountry: "Paese di consegna", language: "Lingua", deliverTo: "Consegna in", displayLanguage: "Lingua di visualizzazione",
    shopEyebrow: "La selezione MAZIGHO", shopTitle: "Il nostro negozio", shopIntro: "Scopri i prodotti con consegna confermata per {country}.", viewBestSellers: "Vedi i più venduti", readyToDiscover: "Pronto a scoprire", currentProducts: "I prodotti del momento",
    deliverableCount: "{count} articoli consegnabili in {country}", offer: "Offerta", freeDelivery: "Consegna gratuita", delivery: "Consegna", days: "giorni", noProducts: "Nessun prodotto ha ancora una consegna confermata per {country}. Scegli un altro Paese o torna presto a scoprire la selezione.",
    exploreUniverse: "Esplora per universo", findYourStyle: "Trova ciò che ti rispecchia", viewNew: "Vedi le novità", discover: "Scopri",
    editorialSelection: "Selezione editoriale", pricesInChf: "Prezzi in CHF", switzerlandEurope: "Consegna Svizzera e Europa", noTranslation: "Questa pagina prodotto non è ancora disponibile nella lingua scelta.",
  },
  en: {
    topSelection: "A selection made for everyday life", topDelivery: "Transparent delivery by destination", topQuote: "Cost and timing confirmed before purchase",
    home: "Home", shop: "Shop", categories: "Categories", creations: "Creations", new: "New arrivals", bestSellers: "Best sellers", promotions: "Offers", contact: "Contact", account: "My account", admin: "MAZIGHO management",
    deliveryCountry: "Delivery country", language: "Language", deliverTo: "Deliver to", displayLanguage: "Display language",
    shopEyebrow: "The MAZIGHO selection", shopTitle: "Our Shop", shopIntro: "Browse products with delivery confirmed for {country}.", viewBestSellers: "View best sellers", readyToDiscover: "Ready to discover", currentProducts: "Our current products",
    deliverableCount: "{count} item(s) deliverable to {country}", offer: "Offer", freeDelivery: "Free delivery", delivery: "Delivery", days: "days", noProducts: "No product has confirmed delivery to {country} yet. Choose another country or come back soon to discover the selection.",
    exploreUniverse: "Explore by universe", findYourStyle: "Find what suits you", viewNew: "View new arrivals", discover: "Discover",
    editorialSelection: "Editorial selection", pricesInChf: "Prices shown in CHF", switzerlandEurope: "Delivery to Switzerland & Europe", noTranslation: "This product page is not yet available in the selected language.",
  },
  es: {
    topSelection: "Una selección pensada para el día a día", topDelivery: "Entrega transparente según el destino", topQuote: "Coste y plazo confirmados antes de comprar",
    home: "Inicio", shop: "Tienda", categories: "Categorías", creations: "Creaciones", new: "Novedades", bestSellers: "Más vendidos", promotions: "Ofertas", contact: "Contacto", account: "Mi cuenta", admin: "Gestión MAZIGHO",
    deliveryCountry: "País de entrega", language: "Idioma", deliverTo: "Entregar en", displayLanguage: "Idioma de visualización",
    shopEyebrow: "La selección MAZIGHO", shopTitle: "Nuestra tienda", shopIntro: "Explora productos con entrega confirmada para {country}.", viewBestSellers: "Ver más vendidos", readyToDiscover: "Listo para descubrir", currentProducts: "Nuestros productos actuales",
    deliverableCount: "{count} artículo(s) disponibles para entrega en {country}", offer: "Oferta", freeDelivery: "Envío gratuito", delivery: "Entrega", days: "días", noProducts: "Aún no hay productos con entrega confirmada para {country}. Elige otro país o vuelve pronto para descubrir la selección.",
    exploreUniverse: "Explorar por universos", findYourStyle: "Encuentra lo que te representa", viewNew: "Ver novedades", discover: "Descubrir",
    editorialSelection: "Selección editorial", pricesInChf: "Precios mostrados en CHF", switzerlandEurope: "Entrega en Suiza y Europa", noTranslation: "Esta página de producto aún no está disponible en el idioma seleccionado.",
  },
  nl: {
    topSelection: "Een selectie voor elke dag", topDelivery: "Transparante levering per bestemming", topQuote: "Kosten en levertijd bevestigd vóór aankoop",
    home: "Home", shop: "Winkel", categories: "Categorieën", creations: "Creaties", new: "Nieuw", bestSellers: "Bestsellers", promotions: "Aanbiedingen", contact: "Contact", account: "Mijn account", admin: "MAZIGHO beheer",
    deliveryCountry: "Land van levering", language: "Taal", deliverTo: "Leveren naar", displayLanguage: "Weergavetaal",
    shopEyebrow: "De MAZIGHO-selectie", shopTitle: "Onze winkel", shopIntro: "Bekijk producten met bevestigde levering naar {country}.", viewBestSellers: "Bestsellers bekijken", readyToDiscover: "Klaar om te ontdekken", currentProducts: "Onze producten van het moment",
    deliverableCount: "{count} artikel(en) leverbaar naar {country}", offer: "Aanbieding", freeDelivery: "Gratis levering", delivery: "Levering", days: "dagen", noProducts: "Er is nog geen product met bevestigde levering naar {country}. Kies een ander land of kom binnenkort terug om de selectie te ontdekken.",
    exploreUniverse: "Ontdek per wereld", findYourStyle: "Vind wat bij je past", viewNew: "Nieuw bekijken", discover: "Ontdekken",
    editorialSelection: "Redactionele selectie", pricesInChf: "Prijzen in CHF", switzerlandEurope: "Levering in Zwitserland & Europa", noTranslation: "Deze productpagina is nog niet beschikbaar in de gekozen taal.",
  },
  ar: {
    topSelection: "تشكيلة مختارة للحياة اليومية", topDelivery: "توصيل واضح بحسب وجهة الشحن", topQuote: "تأكيد التكلفة والمدة قبل الشراء",
    home: "الرئيسية", shop: "المتجر", categories: "الفئات", creations: "الإبداعات", new: "وصل حديثاً", bestSellers: "الأكثر مبيعاً", promotions: "العروض", contact: "اتصل بنا", account: "حسابي", admin: "إدارة MAZIGHO",
    deliveryCountry: "بلد التوصيل", language: "اللغة", deliverTo: "التوصيل إلى", displayLanguage: "لغة العرض",
    shopEyebrow: "تشكيلة MAZIGHO", shopTitle: "متجرنا", shopIntro: "تصفح المنتجات التي تم تأكيد توصيلها إلى {country}.", viewBestSellers: "عرض الأكثر مبيعاً", readyToDiscover: "جاهز للاكتشاف", currentProducts: "منتجاتنا الحالية",
    deliverableCount: "{count} منتج/منتجات قابلة للتوصيل إلى {country}", offer: "عرض", freeDelivery: "توصيل مجاني", delivery: "التوصيل", days: "أيام", noProducts: "لا يوجد حتى الآن منتج تم تأكيد توصيله إلى {country}. اختر بلداً آخر أو عد قريباً لاكتشاف التشكيلة.",
    exploreUniverse: "استكشف حسب العالم", findYourStyle: "اعثر على ما يناسبك", viewNew: "عرض الجديد", discover: "اكتشف",
    editorialSelection: "اختيار تحريري", pricesInChf: "الأسعار معروضة بالفرنك السويسري", switzerlandEurope: "توصيل إلى سويسرا وأوروبا", noTranslation: "هذه الصفحة غير متاحة بعد باللغة المختارة.",
  },
};

export function t(locale: StorefrontLocale, key: MessageKey, values: Record<string, string | number> = {}) {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    messages[locale]?.[key] ?? messages.fr[key],
  );
}
