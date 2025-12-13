// Données statiques pour le site e-commerce

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  icon?: string;
  subcategories?: string[];
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  displayOrder: number;
}

export interface ProductOption {
  id: string;
  type: "size" | "color";
  label: string;
  value: string;
}

export interface Review {
  id: number;
  productId: number;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  featured: number;
  images: ProductImage[];
  reviews: Review[];
  averageRating: number;
  options?: ProductOption[];
}

// Catégories - Inspirées de Mazigho Shop
export const categories: Category[] = [
  {
    id: 1,
    name: "High-Tech & Gadgets",
    slug: "high-tech-gadgets",
    description: "Accessoires téléphone, Gadgets innovants, Charge & Câbles",
    imageUrl: null,
    icon: "📱",
    subcategories: ["Accessoires téléphone", "Gadgets innovants", "Charge & Câbles"],
  },
  {
    id: 2,
    name: "Maison & Organisation",
    slug: "maison-organisation",
    description: "Rangement malin, Cuisine pratique, Nettoyage intelligent",
    imageUrl: null,
    icon: "🏠",
    subcategories: ["Rangement malin", "Cuisine pratique", "Nettoyage intelligent"],
  },
  {
    id: 3,
    name: "Beauté & Bien-Être",
    slug: "beaute-bien-etre",
    description: "Soins visage, Massage & relaxation, Coiffure",
    imageUrl: null,
    icon: "💄",
    subcategories: ["Soins visage", "Massage & relaxation", "Coiffure"],
  },
  {
    id: 4,
    name: "Sport & Fitness",
    slug: "sport-fitness",
    description: "Fitness à domicile, Yoga & pilates, Accessoires sport",
    imageUrl: null,
    icon: "🏋️",
    subcategories: ["Fitness à domicile", "Yoga & pilates", "Accessoires sport"],
  },
  {
    id: 5,
    name: "Auto & Accessoires",
    slug: "auto-accessoires",
    description: "Supports téléphone voiture, Nettoyage auto, Sécurité & assistance",
    imageUrl: null,
    icon: "🚗",
    subcategories: ["Supports téléphone voiture", "Nettoyage auto", "Sécurité & assistance"],
  },
];

// Produits avec options et images multiples
export const products: Product[] = [
  {
    id: 1,
    categoryId: 1,
    name: "Chargeur Rapide USB-C",
    slug: "chargeur-rapide-usb-c",
    description: "Chargeur haute puissance avec technologie de charge rapide. Compatible avec tous les appareils USB-C.",
    longDescription: "Chargeur USB-C haute puissance 65W avec technologie de charge rapide avancée. Compatible avec tous les appareils USB-C modernes. Charge votre téléphone à 50% en seulement 30 minutes. Certifié et sécurisé avec protection contre les surcharges.",
    price: 2999,
    originalPrice: 3999,
    stock: 15,
    featured: 1,
    images: [
      { id: 1, productId: 1, imageUrl: "", displayOrder: 1 },
      { id: 2, productId: 1, imageUrl: "", displayOrder: 2 },
      { id: 3, productId: 1, imageUrl: "", displayOrder: 3 },
    ],
    reviews: [
      {
        id: 1,
        productId: 1,
        rating: 5,
        comment: "Excellent chargeur, très rapide et fiable !",
        userName: "Ahmed M.",
        createdAt: "2024-11-10",
      },
      {
        id: 2,
        productId: 1,
        rating: 5,
        comment: "Charge mon téléphone en 30 minutes, c'est incroyable !",
        userName: "Fatima L.",
        createdAt: "2024-11-08",
      },
    ],
    averageRating: 5,
    options: [
      { id: "color-1", type: "color", label: "Noir", value: "black" },
      { id: "color-2", type: "color", label: "Blanc", value: "white" },
      { id: "color-3", type: "color", label: "Gris", value: "gray" },
    ],
  },
  {
    id: 2,
    categoryId: 1,
    name: "Support Téléphone Voiture",
    slug: "support-telephone-voiture",
    description: "Support magnétique pour téléphone, fixation au tableau de bord. Rotation à 360°.",
    longDescription: "Support téléphone magnétique ultra-puissant pour voiture. Fixation facile au tableau de bord ou au pare-brise. Rotation à 360° pour une visibilité optimale. Aimants puissants qui ne rayent pas votre téléphone.",
    price: 1599,
    originalPrice: null,
    stock: 25,
    featured: 1,
    images: [
      { id: 4, productId: 2, imageUrl: "", displayOrder: 1 },
      { id: 5, productId: 2, imageUrl: "", displayOrder: 2 },
    ],
    reviews: [],
    averageRating: 4.5,
    options: [
      { id: "color-1", type: "color", label: "Noir", value: "black" },
      { id: "color-2", type: "color", label: "Argent", value: "silver" },
    ],
  },
  {
    id: 3,
    categoryId: 2,
    name: "Boîtes de Rangement",
    slug: "boites-rangement",
    description: "Set de 3 boîtes de rangement transparentes avec couvercle. Parfait pour l'organisation.",
    longDescription: "Set de 3 boîtes de rangement transparentes en plastique durable. Couvercles hermétiques pour une meilleure conservation. Parfait pour organiser votre cuisine, salle de bain ou placard. Empilables pour gagner de la place.",
    price: 2499,
    originalPrice: null,
    stock: 20,
    featured: 1,
    images: [
      { id: 6, productId: 3, imageUrl: "", displayOrder: 1 },
      { id: 7, productId: 3, imageUrl: "", displayOrder: 2 },
      { id: 8, productId: 3, imageUrl: "", displayOrder: 3 },
    ],
    reviews: [
      {
        id: 3,
        productId: 3,
        rating: 5,
        comment: "Très pratique et bien fabriquées !",
        userName: "Marie D.",
        createdAt: "2024-11-09",
      },
    ],
    averageRating: 5,
    options: [
      { id: "size-1", type: "size", label: "Petit", value: "small" },
      { id: "size-2", type: "size", label: "Moyen", value: "medium" },
      { id: "size-3", type: "size", label: "Grand", value: "large" },
    ],
  },
  {
    id: 4,
    categoryId: 2,
    name: "Ustensiles de Cuisine",
    slug: "ustensiles-cuisine",
    description: "Set complet d'ustensiles de cuisine en silicone de qualité alimentaire.",
    longDescription: "Set complet de 12 ustensiles de cuisine en silicone de qualité alimentaire. Résistant à la chaleur jusqu'à 250°C. Idéal pour tous les types de cuisson. Facile à nettoyer et durable.",
    price: 3499,
    originalPrice: 4999,
    stock: 10,
    featured: 1,
    images: [
      { id: 9, productId: 4, imageUrl: "", displayOrder: 1 },
      { id: 10, productId: 4, imageUrl: "", displayOrder: 2 },
      { id: 11, productId: 4, imageUrl: "", displayOrder: 3 },
      { id: 12, productId: 4, imageUrl: "", displayOrder: 4 },
    ],
    reviews: [],
    averageRating: 5,
    options: [
      { id: "color-1", type: "color", label: "Rose", value: "pink" },
      { id: "color-2", type: "color", label: "Bleu", value: "blue" },
      { id: "color-3", type: "color", label: "Vert", value: "green" },
    ],
  },
  {
    id: 5,
    categoryId: 3,
    name: "Masque Visage Hydratant",
    slug: "masque-visage-hydratant",
    description: "Masque hydratant premium pour tous les types de peau. Résultats visibles en 10 minutes.",
    longDescription: "Masque hydratant premium à base d'ingrédients naturels. Convient à tous les types de peau. Résultats visibles après une seule application. À utiliser 2-3 fois par semaine pour des résultats optimaux.",
    price: 1999,
    originalPrice: null,
    stock: 30,
    featured: 1,
    images: [
      { id: 13, productId: 5, imageUrl: "", displayOrder: 1 },
      { id: 14, productId: 5, imageUrl: "", displayOrder: 2 },
    ],
    reviews: [
      {
        id: 4,
        productId: 5,
        rating: 5,
        comment: "Ma peau est devenue très douce et hydratée !",
        userName: "Leila K.",
        createdAt: "2024-11-06",
      },
      {
        id: 5,
        productId: 5,
        rating: 4,
        comment: "Bon produit, légèrement cher mais efficace",
        userName: "Nadia S.",
        createdAt: "2024-11-04",
      },
    ],
    averageRating: 4.5,
    options: [
      { id: "size-1", type: "size", label: "50ml", value: "50ml" },
      { id: "size-2", type: "size", label: "100ml", value: "100ml" },
    ],
  },
  {
    id: 6,
    categoryId: 3,
    name: "Brosse Massage Cuir Chevelu",
    slug: "brosse-massage-cuir-chevelu",
    description: "Brosse de massage pour cuir chevelu avec vibration. Relaxation et bien-être garantis.",
    longDescription: "Brosse de massage électrique pour cuir chevelu avec 3 niveaux de vibration. Stimule la circulation sanguine et détend les muscles. Batterie rechargeable avec 2 heures d'autonomie. Idéale pour la relaxation quotidienne.",
    price: 2299,
    originalPrice: null,
    stock: 40,
    featured: 0,
    images: [
      { id: 15, productId: 6, imageUrl: "", displayOrder: 1 },
      { id: 16, productId: 6, imageUrl: "", displayOrder: 2 },
      { id: 17, productId: 6, imageUrl: "", displayOrder: 3 },
    ],
    reviews: [],
    averageRating: 4.5,
    options: [
      { id: "color-1", type: "color", label: "Rose", value: "pink" },
      { id: "color-2", type: "color", label: "Noir", value: "black" },
    ],
  },
  {
    id: 7,
    categoryId: 4,
    name: "Tapis de Yoga Premium",
    slug: "tapis-yoga-premium",
    description: "Tapis de yoga antidérapant avec sangle de transport. Épaisseur 6mm pour confort optimal.",
    longDescription: "Tapis de yoga premium en caoutchouc naturel. Antidérapant sur les deux côtés. Épaisseur 6mm pour un confort optimal. Sangle de transport incluse. Facile à nettoyer et durable.",
    price: 3999,
    originalPrice: null,
    stock: 35,
    featured: 1,
    images: [
      { id: 18, productId: 7, imageUrl: "", displayOrder: 1 },
      { id: 19, productId: 7, imageUrl: "", displayOrder: 2 },
      { id: 20, productId: 7, imageUrl: "", displayOrder: 3 },
    ],
    reviews: [
      {
        id: 6,
        productId: 7,
        rating: 5,
        comment: "Excellent tapis, très confortable et durable !",
        userName: "Sophie P.",
        createdAt: "2024-11-03",
      },
    ],
    averageRating: 5,
    options: [
      { id: "color-1", type: "color", label: "Noir", value: "black" },
      { id: "color-2", type: "color", label: "Gris", value: "gray" },
      { id: "color-3", type: "color", label: "Violet", value: "purple" },
    ],
  },
  {
    id: 8,
    categoryId: 4,
    name: "Haltères Ajustables",
    slug: "halteres-ajustables",
    description: "Paire d'haltères ajustables de 2kg à 10kg. Idéal pour l'entraînement à domicile.",
    longDescription: "Paire d'haltères ajustables avec poids de 2kg à 10kg. Système de verrouillage sécurisé. Poignées ergonomiques antidérapantes. Parfait pour tous les niveaux de fitness.",
    price: 4999,
    originalPrice: null,
    stock: 25,
    featured: 0,
    images: [
      { id: 21, productId: 8, imageUrl: "", displayOrder: 1 },
      { id: 22, productId: 8, imageUrl: "", displayOrder: 2 },
    ],
    reviews: [],
    averageRating: 4.5,
    options: [
      { id: "weight-1", type: "size", label: "2-5 kg", value: "2-5kg" },
      { id: "weight-2", type: "size", label: "5-10 kg", value: "5-10kg" },
    ],
  },
  {
    id: 9,
    categoryId: 5,
    name: "Support Téléphone Voiture Magnétique",
    slug: "support-telephone-voiture-magnetique",
    description: "Support magnétique ultra-puissant pour voiture. Fixation facile au tableau de bord.",
    longDescription: "Support téléphone magnétique ultra-puissant pour voiture. Aimants puissants qui ne rayent pas votre téléphone. Fixation facile au tableau de bord ou au pare-brise. Rotation à 360° pour une visibilité optimale.",
    price: 1899,
    originalPrice: 2499,
    stock: 8,
    featured: 1,
    images: [
      { id: 23, productId: 9, imageUrl: "", displayOrder: 1 },
      { id: 24, productId: 9, imageUrl: "", displayOrder: 2 },
      { id: 25, productId: 9, imageUrl: "", displayOrder: 3 },
    ],
    reviews: [
      {
        id: 7,
        productId: 9,
        rating: 5,
        comment: "Très solide et pratique ! Je le recommande !",
        userName: "Hassan B.",
        createdAt: "2024-11-05",
      },
    ],
    averageRating: 5,
    options: [
      { id: "color-1", type: "color", label: "Noir", value: "black" },
      { id: "color-2", type: "color", label: "Argent", value: "silver" },
      { id: "color-3", type: "color", label: "Or", value: "gold" },
    ],
  },
  {
    id: 10,
    categoryId: 5,
    name: "Produit Nettoyage Auto",
    slug: "produit-nettoyage-auto",
    description: "Produit nettoyant multi-usages pour voiture. Efficace sur tous les types de surfaces.",
    longDescription: "Produit nettoyant multi-usages pour voiture. Efficace sur la peinture, les vitres, les plastiques et les sièges. Formule écologique et biodégradable. Laisse un fini brillant et protecteur.",
    price: 999,
    originalPrice: null,
    stock: 15,
    featured: 0,
    images: [
      { id: 26, productId: 10, imageUrl: "", displayOrder: 1 },
      { id: 27, productId: 10, imageUrl: "", displayOrder: 2 },
    ],
    reviews: [],
    averageRating: 4.5,
    options: [
      { id: "size-1", type: "size", label: "500ml", value: "500ml" },
      { id: "size-2", type: "size", label: "1L", value: "1L" },
      { id: "size-3", type: "size", label: "5L", value: "5L" },
    ],
  },
];

// Bannières pour le carrousel
export const banners = [
  {
    id: 1,
    title: "Découvrez nos Meilleures Offres",
    subtitle: "Simplifiez votre quotidien avec style",
    image: null,
    buttonText: "Commander Maintenant",
    buttonLink: "/boutique",
  },
  {
    id: 2,
    title: "Technologie & Innovation",
    subtitle: "Les derniers gadgets et accessoires tech",
    image: null,
    buttonText: "Voir les Produits",
    buttonLink: "/categorie/high-tech-gadgets",
  },
  {
    id: 3,
    title: "Beauté & Bien-Être",
    subtitle: "Prenez soin de vous avec nos produits premium",
    image: null,
    buttonText: "Parcourir",
    buttonLink: "/categorie/beaute-bien-etre",
  },
];

// Fonctions utilitaires
export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}

export function getAllProducts(): Product[] {
  return products;
}

export function getFeaturedProducts(limit: number = 8): Product[] {
  return products.filter(p => p.featured === 1).slice(0, limit);
}

export function getProductsByCategory(categoryId: number): Product[] {
  return products.filter(p => p.categoryId === categoryId);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getBanners() {
  return banners;
}
