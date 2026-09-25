import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export type NavigationLabels = {
  navigationHome: string;
  navigationShop: string;
  navigationCategories: string;
  navigationCreations: string;
  navigationContact: string;
};

export type ButtonRadius = "flat" | "rounded" | "full";
export type HeaderLayout = "inline" | "split" | "searchFirst";

export type StoreNavigationItem = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  kind: "system" | "custom";
};

export type HomeTextBanner = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
  enabled: boolean;
};

export type ReassuranceItem = {
  icon: "sparkles" | "check" | "arrow";
  title: string;
  text: string;
};

export type ProductReassuranceItem = {
  icon: "shield" | "truck";
  title: string;
  text: string;
};

export type FooterSocialLink = {
  id: "instagram" | "facebook" | "tiktok" | "youtube" | "pinterest" | "linkedin";
  url: string;
};

export type DesignProfile = {
  paletteId: "terracotta" | "sage" | "midnight" | "rose" | "violet";
  typographyId: "editorial" | "modern" | "classic";
  brandName: string;
  brandMessage: string;
  brandLogoUrl: string;
  faviconUrl: string;
  highlightEyebrow: string;
  highlightTitle: string;
  highlightText: string;
  highlightImageUrl: string;
  storyTitle: string;
  storyText: string;
  storyImageUrl: string;
  editorialEyebrow: string;
  editorialTitle: string;
  editorialImageUrl: string;
  navigationHome: string;
  navigationShop: string;
  navigationCategories: string;
  navigationCreations: string;
  navigationContact: string;
  navigationTranslations: Partial<Record<"de" | "it" | "en" | "es" | "nl" | "ar", NavigationLabels>>;
  navigationItems: StoreNavigationItem[];
  showDiscovery: boolean;
  showStory: boolean;
  showTestimonials: boolean;
  showEditorial: boolean;
  showFeatured: boolean;
  showReassurance: boolean;
  showClosing: boolean;
  reassuranceItems: ReassuranceItem[];
  discoveryEyebrow: string;
  discoveryTitle: string;
  discoveryText: string;
  discoveryAllShopLabel: string;
  discoveryAllShopUrl: string;
  discoveryBrowseShopLabel: string;
  discoveryBrowseShopUrl: string;
  testimonialsEyebrow: string;
  testimonialsTitle: string;
  testimonialsText: string;
  testimonialsCtaLabel: string;
  testimonialsCtaUrl: string;
  closingEyebrow: string;
  closingTitle: string;
  closingText: string;
  closingShopCtaLabel: string;
  closingShopCtaUrl: string;
  closingContactCtaLabel: string;
  closingContactCtaUrl: string;
  closingVisualValue: string;
  closingVisualText: string;
  closingImageUrl: string;
  cataloguePageCopyCustomized: boolean;
  promosTitle: string;
  promosLead: string;
  promosBannerTitle: string;
  promosBannerText: string;
  promosEmptyText: string;
  promosAllProductsLabel: string;
  newArrivalsTitle: string;
  newArrivalsLead: string;
  newArrivalsEmptyText: string;
  bestSellersTitle: string;
  bestSellersLead: string;
  bestSellersTopLabel: string;
  bestSellersEmptyText: string;
  showAnnouncement: boolean;
  announcementItems: string[];
  shopPageCopyCustomized: boolean;
  shopEyebrow: string;
  shopTitle: string;
  shopIntro: string;
  shopProductsEyebrow: string;
  shopProductsTitle: string;
  showShopEditorial: boolean;
  shopEditorialEyebrow: string;
  shopEditorialTitle: string;
  shopEditorialImageUrl: string;
  showShopReassurance: boolean;
  showProductReassurance: boolean;
  productReassuranceItems: ProductReassuranceItem[];
  cartEyebrow: string;
  cartTitle: string;
  cartIntro: string;
  checkoutEyebrow: string;
  checkoutTitle: string;
  checkoutIntro: string;
  checkoutPaymentNotice: string;
  customColorsEnabled: boolean;
  customPrimary: string;
  customAccent: string;
  customSoft: string;
  buttonRadius: ButtonRadius;
  headerLayout: HeaderLayout;
  footerDescription: string;
  footerNavigationTitle: string;
  footerCategoriesTitle: string;
  footerHelpTitle: string;
  footerContactText: string;
  footerContactUrl: string;
  footerDeliveryTitle: string;
  footerDeliveryText: string;
  footerSecureTitle: string;
  footerSecureText: string;
  footerServiceTitle: string;
  footerServiceText: string;
  footerCopyrightText: string;
  footerShowNavigation: boolean;
  footerShowCategories: boolean;
  footerShowHelp: boolean;
  footerShowReassurance: boolean;
  footerSocialLinks: FooterSocialLink[];
  homeOrder: string[];
  textBanners: HomeTextBanner[];
  contentTranslationReady?: boolean;
};

export const defaultDesignProfile: DesignProfile = {
  paletteId: "terracotta",
  typographyId: "editorial",
  brandName: "MAZIGHO",
  brandMessage: "",
  brandLogoUrl: "",
  faviconUrl: "",
  highlightEyebrow: "L'inspiration MAZIGHO",
  highlightTitle: "Des trouvailles qui embellissent le quotidien.",
  highlightText: "Mode, bien-être, maison et accessoires : une sélection pensée pour chaque moment.",
  highlightImageUrl: "/assets/home-lifestyle-top.webp",
  storyTitle: "L’histoire inspirante de MAZIGHO.",
  storyText: "MAZIGHO est né d’une idée simple : rendre les bonnes découvertes plus accessibles. Nous aimons les objets utiles, les petits plaisirs et les détails qui donnent une touche plus douce à la journée.",
  storyImageUrl: "/assets/home-lifestyle-top.webp",
  editorialEyebrow: "Sélection éditoriale",
  editorialTitle: "Le détail qui fait la différence.",
  editorialImageUrl: "/assets/home-editorial-divider.webp",
  navigationHome: "Accueil",
  navigationShop: "Boutique",
  navigationCategories: "Catégories",
  navigationCreations: "Créations",
  navigationContact: "Contact",
  navigationTranslations: {},
  navigationItems: [
    { id: "home", label: "", href: "/", visible: true, kind: "system" },
    { id: "shop", label: "", href: "/boutique", visible: true, kind: "system" },
    { id: "categories", label: "", href: "/boutique", visible: true, kind: "system" },
    { id: "creations", label: "", href: "/creations", visible: true, kind: "system" },
    { id: "new", label: "", href: "/nouveautes", visible: true, kind: "system" },
    { id: "best-sellers", label: "", href: "/best-sellers", visible: true, kind: "system" },
    { id: "promos", label: "", href: "/promos", visible: true, kind: "system" },
    { id: "contact", label: "", href: "/contact", visible: true, kind: "system" },
  ],
  showDiscovery: true,
  showStory: true,
  showTestimonials: true,
  showEditorial: true,
  showFeatured: true,
  showReassurance: true,
  showClosing: true,
  reassuranceItems: [
    { icon: "sparkles", title: "Une sélection qui a du sens", text: "Des trouvailles utiles pour le quotidien." },
    { icon: "check", title: "Prix affichés en CHF", text: "Une expérience pensée pour la Suisse." },
    { icon: "arrow", title: "Un parcours simple", text: "Du produit au panier en quelques clics." },
  ],
  discoveryEyebrow: "Explorer MAZIGHO",
  discoveryTitle: "Découvrez nos univers",
  discoveryText: "Six catégories visuelles pour passer directement de l’inspiration à la sélection qui vous ressemble.",
  discoveryAllShopLabel: "Voir toute la boutique",
  discoveryAllShopUrl: "/boutique",
  discoveryBrowseShopLabel: "Parcourir toute la boutique",
  discoveryBrowseShopUrl: "/boutique",
  testimonialsEyebrow: "La parole à nos clients",
  testimonialsTitle: "Vos retours font grandir MAZIGHO.",
  testimonialsText: "Aucun avis client vérifié n’est publié pour le moment.",
  testimonialsCtaLabel: "Découvrir la sélection",
  testimonialsCtaUrl: "/boutique",
  closingEyebrow: "L’esprit MAZIGHO",
  closingTitle: "Des trouvailles utiles, avec une expérience plus humaine.",
  closingText: "Nous mettons en avant des produits qui simplifient le quotidien, dans une boutique claire, chaleureuse et pensée pour accompagner chaque décision.",
  closingShopCtaLabel: "Découvrir la boutique",
  closingShopCtaUrl: "/boutique",
  closingContactCtaLabel: "Nous contacter",
  closingContactCtaUrl: "/contact",
  closingVisualValue: "",
  closingVisualText: "Une boutique locale dans sa façon de parler, ouverte sur les meilleures trouvailles.",
  closingImageUrl: "",
  cataloguePageCopyCustomized: false,
  promosTitle: "Promotions spéciales",
  promosLead: "Découvrez les réductions applicables aux produits dont la livraison est confirmée vers {country}.",
  promosBannerTitle: "Réductions affichées dans le prix",
  promosBannerText: "Aucun code promotionnel supplémentaire n’est actif actuellement.",
  promosEmptyText: "Aucune promotion n’est encore confirmée pour la livraison vers {country}.",
  promosAllProductsLabel: "Voir tous les produits",
  newArrivalsTitle: "Nouveautés",
  newArrivalsLead: "Découvrez les dernières nouveautés dont la livraison est confirmée vers {country}.",
  newArrivalsEmptyText: "Aucune nouveauté n’est encore confirmée pour la livraison vers {country}.",
  bestSellersTitle: "Best-sellers",
  bestSellersLead: "Une sélection affichée uniquement lorsque la livraison est confirmée vers {country}.",
  bestSellersTopLabel: "🏆 Top {rank}",
  bestSellersEmptyText: "Aucun best-seller n’est encore confirmé pour la livraison vers {country}.",
  showAnnouncement: true,
  announcementItems: ["Une sélection pensée pour le quotidien", "Prix tout compris · livraison offerte", "Coût et délai confirmés avant achat"],
  shopPageCopyCustomized: false,
  shopEyebrow: "La boutique",
  shopTitle: "Nos trouvailles du moment",
  shopIntro: "Découvrez une sélection de produits dont la livraison est confirmée vers {country}.",
  shopProductsEyebrow: "Prêts à découvrir",
  shopProductsTitle: "Les produits disponibles",
  showShopEditorial: true,
  shopEditorialEyebrow: "Notre sélection",
  shopEditorialTitle: "Des objets choisis pour accompagner votre quotidien.",
  shopEditorialImageUrl: "/assets/shop-editorial-hero.webp",
  showShopReassurance: true,
  showProductReassurance: true,
  productReassuranceItems: [
    { icon: "shield", title: "Achat préparé avec soin", text: "Les modalités de paiement sont précisées avant toute validation." },
    { icon: "truck", title: "Livraison et retours", text: "Les conditions propres à cette boutique sont affichées avant la commande." },
  ],
  cartEyebrow: "Votre sélection",
  cartTitle: "Votre panier",
  cartIntro: "Vérifiez vos produits avant de poursuivre vers la commande pour {country}.",
  checkoutEyebrow: "Commande vérifiée",
  checkoutTitle: "Préparez votre commande",
  checkoutIntro: "Vérifiez votre sélection et les conditions affichées avant toute demande de paiement.",
  checkoutPaymentNotice: "Le paiement en ligne n’est pas activé pour cette boutique.",
  customColorsEnabled: false,
  customPrimary: "#c2410c",
  customAccent: "#0f766e",
  customSoft: "#fbf7f2",
  buttonRadius: "rounded",
  headerLayout: "inline",
  footerDescription: "Votre destination pour des produits premium de qualité exceptionnelle.",
  footerNavigationTitle: "Navigation",
  footerCategoriesTitle: "Catégories",
  footerHelpTitle: "Besoin d’aide ?",
  footerContactText: "Écrivez-nous via le formulaire de contact",
  footerContactUrl: "/contact",
  footerDeliveryTitle: "Livraison Suisse & Europe",
  footerDeliveryText: "Les conditions sont précisées avant validation.",
  footerSecureTitle: "Connexion sécurisée",
  footerSecureText: "Votre navigation est protégée par HTTPS.",
  footerServiceTitle: "Service client",
  footerServiceText: "Une question ? Utilisez notre formulaire.",
  footerCopyrightText: "Tous droits réservés.",
  footerShowNavigation: true,
  footerShowCategories: true,
  footerShowHelp: true,
  footerShowReassurance: true,
  footerSocialLinks: [
    { id: "instagram", url: "" },
    { id: "facebook", url: "" },
    { id: "tiktok", url: "" },
    { id: "youtube", url: "" },
    { id: "pinterest", url: "" },
    { id: "linkedin", url: "" },
  ],
  homeOrder: ["discovery", "story", "testimonials", "editorial", "featured"],
  textBanners: [],
};

export const buttonRadiusValues: Record<ButtonRadius, string> = {
  flat: "0px",
  rounded: "0.75rem",
  full: "9999px",
};

export const homeSectionMeta: Record<string, { label: string; description: string }> = {
  discovery: { label: "Découvrez nos univers", description: "Grille illustrée des grandes catégories" },
  story: { label: "L’histoire MAZIGHO", description: "Section éditoriale avec grande image" },
  testimonials: { label: "Témoignages clients", description: "Section avis / paroles de clients" },
  editorial: { label: "Encart éditorial", description: "Bannière d’inspiration horizontale" },
  featured: { label: "Grille de produits vedettes", description: "Sélection de produits phares" },
};

export const designPalettes = {
  terracotta: {
    name: "Terracotta chaleureux",
    primary: "#c2410c",
    soft: "#fbf7f2",
    accent: "#0f766e",
    description: "Le style MAZIGHO actuel : chaleureux, élégant et polyvalent.",
  },
  sage: {
    name: "Sauge apaisant",
    primary: "#0f766e",
    soft: "#f4f8f3",
    accent: "#b45309",
    description: "Une ambiance naturelle, sereine et axée bien-être.",
  },
  midnight: {
    name: "Nuit moderne",
    primary: "#334155",
    soft: "#f6f8fb",
    accent: "#0284c7",
    description: "Un rendu net et contemporain pour un catalogue plus high-tech.",
  },
  rose: {
    name: "Rose poudré",
    primary: "#be185d",
    soft: "#fff6f8",
    accent: "#7c3aed",
    description: "Un univers doux et expressif, adapté à la beauté et aux accessoires.",
  },
  violet: {
    name: "Violet atelier",
    primary: "#6d28d9",
    soft: "#f7f3ff",
    accent: "#a855f7",
    description: "Un univers créatif et raffiné, adapté aux loisirs créatifs, à la mercerie et aux ateliers.",
  },
} as const;

export const designTypography = {
  editorial: {
    name: "Éditorial élégant",
    body: "Inter, sans-serif",
    heading: "'Playfair Display', Georgia, serif",
    preview: "Élégance et découverte",
  },
  modern: {
    name: "Moderne direct",
    body: "Arial, Helvetica, sans-serif",
    heading: "Arial, Helvetica, sans-serif",
    preview: "Clair et actuel",
  },
  classic: {
    name: "Classique raffiné",
    body: "Georgia, 'Times New Roman', serif",
    heading: "Georgia, 'Times New Roman', serif",
    preview: "Confiance et tradition",
  },
} as const;

export function useDesignProfile(locale: "fr" | "de" | "it" | "en" | "es" | "nl" | "ar" = "fr") {
  const query = trpc.design.get.useQuery(locale);
  const profile = (query.data ?? defaultDesignProfile) as DesignProfile;
  const basePalette = designPalettes[profile.paletteId] ?? designPalettes.terracotta;
  const palette = profile.customColorsEnabled
    ? {
        ...basePalette,
        primary: profile.customPrimary || basePalette.primary,
        accent: profile.customAccent || basePalette.accent,
        soft: profile.customSoft || basePalette.soft,
      }
    : basePalette;
  const typography = designTypography[profile.typographyId] ?? designTypography.editorial;
  const buttonRadius = buttonRadiusValues[profile.buttonRadius] ?? buttonRadiusValues.rounded;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--mazigho-primary", palette.primary);
    root.style.setProperty("--mazigho-accent", palette.accent);
    root.style.setProperty("--mazigho-soft", palette.soft);
    // Bridge a boutique palette to the semantic shadcn/Tailwind colours too.
    // Many existing storefront pages correctly use `bg-primary`, `bg-accent`
    // and `bg-background`; without this bridge they would keep MAZIGHO's
    // terracotta defaults while the header had already switched themes.
    root.style.setProperty("--primary", palette.accent);
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--accent", palette.primary);
    root.style.setProperty("--accent-foreground", "#ffffff");
    root.style.setProperty("--secondary", palette.soft);
    root.style.setProperty("--secondary-foreground", palette.primary);
    root.style.setProperty("--background", palette.soft);
    root.style.setProperty("--ring", palette.accent);
    root.style.setProperty("--sidebar-primary", palette.accent);
    root.style.setProperty("--sidebar-ring", palette.accent);
    root.style.setProperty("--mazigho-body-font", typography.body);
    root.style.setProperty("--mazigho-heading-font", typography.heading);
    root.style.setProperty("--mazigho-button-radius", buttonRadius);
    root.setAttribute("data-mazigho-theme", "");

    return () => {
      root.style.removeProperty("--mazigho-primary");
      root.style.removeProperty("--mazigho-accent");
      root.style.removeProperty("--mazigho-soft");
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-foreground");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--secondary-foreground");
      root.style.removeProperty("--background");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-ring");
      root.style.removeProperty("--mazigho-body-font");
      root.style.removeProperty("--mazigho-heading-font");
      root.style.removeProperty("--mazigho-button-radius");
      root.removeAttribute("data-mazigho-theme");
    };
  }, [palette.accent, palette.primary, palette.soft, typography.body, typography.heading, buttonRadius]);

  return { ...query, profile, palette, typography };
}
