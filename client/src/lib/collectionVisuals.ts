export const collectionVisuals: Record<string, { imageUrl: string; alt: string }> = {
  "t-shirts-creatifs": {
    imageUrl: "/images/collections/category_tshirts.jpg",
    alt: "T-shirt blanc de collection créative dans un studio lumineux",
  },
  "sweats-creatifs": {
    imageUrl: "/images/collections/category_sweats.jpg",
    alt: "Sweat clair de collection créative présenté sur une table en bois",
  },
  "mugs-creatifs": {
    imageUrl: "/images/collections/category_mugs.jpg",
    alt: "Mugs de collection créative dans un intérieur européen minimaliste",
  },
  "affiches-creatives": {
    imageUrl: "/images/collections/category_posters.jpg",
    alt: "Affiche de paysage géométrique dans un cadre en bois",
  },
  "tote-bags-creatifs": {
    imageUrl: "/images/collections/category_tote_bags.jpg",
    alt: "Tote bag en coton de collection créative suspendu dans un studio lumineux",
  },
};

export function getCollectionVisual(slug: string) {
  return collectionVisuals[slug];
}
