export const ownerHelpCategories = [
  "start",
  "catalogue",
  "storefront",
  "operations",
  "access",
] as const;

export type OwnerHelpCategory = (typeof ownerHelpCategories)[number];

export const ownerHelpModuleIds = [
  "readiness",
  "simulation",
  "team",
  "catalogue",
  "stock",
  "themes",
  "vitrine",
  "navigation",
  "operations",
  "markets",
  "integrations",
  "settings",
] as const;

export type OwnerHelpModuleId = (typeof ownerHelpModuleIds)[number];

export type OwnerHelpArticle = {
  id: string;
  category: OwnerHelpCategory;
  title: string;
  summary: string;
  steps: readonly string[];
  caution?: string;
  target: OwnerHelpModuleId;
  actionLabel: string;
};

export const ownerHelpCategoryLabels: Readonly<Record<OwnerHelpCategory, string>> = {
  start: "Bien démarrer",
  catalogue: "Catalogue & stock",
  storefront: "Vitrine & contenu",
  operations: "Ouverture & opérations",
  access: "Accès & assistance",
};

/**
 * Local owner-facing guidance. These entries are deliberately static: opening
 * an article has no side effect, exposes no cross-store data and creates no
 * ticket. Every action links back to an existing store-scoped panel module.
 */
export const ownerHelpArticles: readonly OwnerHelpArticle[] = [
  {
    id: "prepare-opening",
    category: "start",
    title: "Préparer l’ouverture de ma boutique",
    summary: "Suivez les contrôles locaux avant une revue manuelle par MAZIGHO Studio.",
    steps: [
      "Ouvrez le Centre de préparation pour voir les éléments réellement manquants.",
      "Complétez la vitrine, le catalogue, le stock, la livraison, les informations légales et les marchés indiqués.",
      "Lorsque le jalon indique « Prête pour revue Studio », demandez l’examen du domaine et de l’ouverture à MAZIGHO Studio.",
    ],
    caution: "Ce jalon ne publie pas la boutique et n’active aucun paiement Live.",
    target: "readiness",
    actionLabel: "Ouvrir le Centre de préparation",
  },
  {
    id: "first-products",
    category: "catalogue",
    title: "Ajouter mes premiers produits",
    summary: "Créez une fiche produit claire ou importez un catalogue déjà préparé.",
    steps: [
      "Créez d’abord une catégorie, puis ajoutez le produit avec son titre, son prix et son statut.",
      "Ajoutez une image, une description courte et les informations utiles au client.",
      "Utilisez l’import CSV si plusieurs produits doivent être créés ou mis à jour en une fois.",
    ],
    target: "catalogue",
    actionLabel: "Ouvrir le catalogue",
  },
  {
    id: "variants-stock",
    category: "catalogue",
    title: "Gérer les tailles, couleurs et quantités",
    summary: "Attribuez un prix et un stock précis à chaque variante lorsque le produit existe en plusieurs versions.",
    steps: [
      "Dans la fiche produit, définissez les options utiles, par exemple Taille ou Couleur.",
      "Ajoutez les variantes et renseignez leur stock individuel, leur prix ajusté et leur statut.",
      "Utilisez ensuite Gestion du stock pour surveiller les quantités faibles et les ruptures.",
    ],
    caution: "Une variante active sans stock reste indisponible pour le client.",
    target: "stock",
    actionLabel: "Ouvrir la gestion du stock",
  },
  {
    id: "theme-and-style",
    category: "storefront",
    title: "Choisir un thème puis le personnaliser",
    summary: "Démarrez avec l’un des douze univers visuels, puis remplacez ce qui ne correspond pas à votre marque.",
    steps: [
      "Ouvrez Thèmes de vitrine et choisissez un univers proche de votre activité.",
      "Appliquez-le uniquement lorsque vous êtes prêt : les contenus de votre boutique restent modifiables ensuite.",
      "Ajustez ensuite le logo, les couleurs, les images et les textes depuis Vitrine.",
    ],
    target: "themes",
    actionLabel: "Voir les thèmes de vitrine",
  },
  {
    id: "hero-and-images",
    category: "storefront",
    title: "Changer le logo, les images et les textes d’accueil",
    summary: "Personnalisez les éléments vus en premier par les visiteurs sans toucher aux autres boutiques.",
    steps: [
      "Dans Vitrine, remplacez le logo, le favicon, les images et les textes de la page d’accueil.",
      "Enregistrez les textes et images, puis vérifiez le rendu dans Parcours de vitrine lorsque la boutique est ouverte.",
      "Utilisez des visuels dont vous possédez les droits et évitez les informations personnelles inutiles.",
    ],
    target: "vitrine",
    actionLabel: "Modifier la vitrine",
  },
  {
    id: "menu-navigation",
    category: "storefront",
    title: "Ajouter, cacher ou réorganiser des onglets",
    summary: "Le menu public peut s’adapter à votre activité et évoluer avec votre catalogue.",
    steps: [
      "Ouvrez Menu et onglets pour voir les entrées déjà présentes.",
      "Modifiez le libellé, la destination, la visibilité ou l’ordre selon votre besoin.",
      "Ajoutez un onglet uniquement lorsqu’il mène à une page ou un contenu utile au visiteur.",
    ],
    target: "navigation",
    actionLabel: "Gérer le menu",
  },
  {
    id: "delivery-and-returns",
    category: "operations",
    title: "Configurer la livraison et les retours",
    summary: "Définissez ce que vous pouvez réellement livrer avant d’ouvrir la vitrine.",
    steps: [
      "Choisissez les pays desservis et indiquez un tarif fixe ou une livraison incluse.",
      "Renseignez les délais de livraison et un résumé de vos conditions de retour.",
      "Vérifiez ensuite le résultat avec la Simulation panier, sans créer de commande réelle.",
    ],
    caution: "Les conditions publiées doivent correspondre à votre capacité réelle de livraison et de retour.",
    target: "operations",
    actionLabel: "Configurer la livraison",
  },
  {
    id: "markets-languages",
    category: "operations",
    title: "Choisir les pays et les langues visibles",
    summary: "Affichez seulement les marchés et langues que votre boutique est prête à servir.",
    steps: [
      "Gardez au moins une langue et un pays principaux actifs.",
      "Ajoutez les langues et pays utiles, puis décidez si les sélecteurs doivent être visibles.",
      "Contrôlez les textes publics et les conditions de livraison pour chaque marché affiché.",
    ],
    target: "markets",
    actionLabel: "Ouvrir Marchés & langues",
  },
  {
    id: "custom-domain",
    category: "operations",
    title: "Relier mon propre nom de domaine",
    summary: "Enregistrez votre domaine puis suivez le guide DNS préparé par MAZIGHO Studio.",
    steps: [
      "Saisissez uniquement un domaine dont vous contrôlez le registrar.",
      "Attendez le guide DNS de MAZIGHO Studio et recopiez les lignes indiquées dans votre espace registrar.",
      "Signalez que le guide a été lu : Studio vérifie ensuite le domaine et confirme séparément son rattachement.",
    ],
    caution: "MAZIGHO ne demande jamais votre mot de passe registrar et ne modifie pas votre DNS automatiquement.",
    target: "settings",
    actionLabel: "Ouvrir les réglages de domaine",
  },
  {
    id: "team-access",
    category: "access",
    title: "Inviter un membre de mon équipe",
    summary: "Déléguez un rôle limité à votre boutique, sans donner accès au Studio ou aux autres boutiques.",
    steps: [
      "Choisissez le rôle le plus restreint compatible avec la mission de la personne.",
      "Vérifiez deux fois l’adresse e-mail avant de préparer l’invitation.",
      "Conservez le lien d’activation de façon privée et bloquez l’accès si la collaboration s’arrête.",
    ],
    target: "team",
    actionLabel: "Gérer l’équipe",
  },
  {
    id: "payment-test",
    category: "access",
    title: "Comprendre les paiements de la boutique",
    summary: "Les essais Stripe Connect sont séparés de la facturation SaaS MAZIGHO et les paiements Live restent fermés.",
    steps: [
      "Ouvrez Intégrations pour consulter l’état Stripe Connect Test de votre boutique, si votre rôle le permet.",
      "Terminez uniquement les étapes demandées par Stripe Test et ne transmettez jamais de mot de passe ou clé dans un ticket.",
      "Attendez une décision officielle de MAZIGHO avant de considérer un paiement comme activé pour de vrai.",
    ],
    caution: "Lemon Squeezy sert uniquement à la facturation SaaS MAZIGHO ; il ne paie jamais les commandes de vos clients.",
    target: "integrations",
    actionLabel: "Voir les intégrations",
  },
  {
    id: "private-cart-simulation",
    category: "start",
    title: "Vérifier un panier sans faire de vente",
    summary: "Testez prix, variante, stock et livraison dans un parcours privé avant l’ouverture.",
    steps: [
      "Sélectionnez un produit et, si nécessaire, une variante active.",
      "Choisissez un pays de livraison réellement servi par votre boutique.",
      "Vérifiez le total et les messages affichés, puis corrigez les réglages concernés si besoin.",
    ],
    caution: "La simulation ne crée pas de commande, ne vide aucun stock et ne débite aucun client.",
    target: "simulation",
    actionLabel: "Ouvrir la Simulation panier",
  },
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Returns deterministic local help results; it performs no API or storage call. */
export function findOwnerHelpArticles(query: string, category: OwnerHelpCategory | "all" = "all") {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return ownerHelpArticles.filter(article => {
    if (category !== "all" && article.category !== category) return false;
    if (!terms.length) return true;
    const haystack = normalize([article.title, article.summary, article.caution ?? "", ...article.steps].join(" "));
    return terms.every(term => haystack.includes(term));
  });
}
