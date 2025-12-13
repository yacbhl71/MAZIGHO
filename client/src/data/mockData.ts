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
  price: number;
  originalPrice: number | null;
  stock: number;
  featured: number;
  images: ProductImage[];
  reviews: Review[];
  averageRating: number;
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

// Produits
export const products: Product[] = [
  {
    id: 1,
    categoryId: 1,
    name: "Chargeur Rapide USB-C",
    slug: "chargeur-rapide-usb-c",
    description: "Chargeur haute puissance avec technologie de charge rapide. Compatible avec tous les appareils USB-C.",
    price: 2999,
    originalPrice: 3999,
    stock: 15,
    featured: 1,
    images: [],
    reviews: [
      {
        id: 1,
        productId: 1,
        rating: 5,
        comment: "Excellent chargeur, très rapide !",
        userName: "Ahmed M.",
        createdAt: "2024-11-10",
      },
    ],
    averageRating: 5,
  },
  {
    id: 2,
    categoryId: 1,
    name: "Support Téléphone Voiture",
    slug: "support-telephone-voiture",
    description: "Support magnétique pour téléphone, fixation au tableau de bord. Rotation à 360°.",
    price: 1599,
    originalPrice: null,
    stock: 25,
    featured: 1,
    images: [],
    reviews: [],
    averageRating: 4.5,
  },
  {
    id: 3,
    categoryId: 2,
    name: "Boîtes de Rangement",
    slug: "boites-rangement",
    description: "Set de 3 boîtes de rangement transparentes avec couvercle. Parfait pour l'organisation.",
    price: 2499,
    originalPrice: null,
    stock: 20,
    featured: 1,
    images: [],
    reviews: [],
    averageRating: 4.5,
  },
  {
    id: 4,
    categoryId: 2,
    name: "Ustensiles de Cuisine",
    slug: "ustensiles-cuisine",
    description: "Set complet d'ustensiles de cuisine en silicone de qualité alimentaire.",
    price: 3499,
    originalPrice: 4999,
    stock: 10,
    featured: 1,
    images: [],
    reviews: [],
    averageRating: 5,
  },
  {
    id: 5,
    categoryId: 3,
    name: "Masque Visage Hydratant",
    slug: "masque-visage-hydratant",
    description: "Masque hydratant premium pour tous les types de peau. Résultats visibles en 10 minutes.",
    price: 1999,
    originalPrice: null,
    stock: 30,
    featured: 1,
    images: [],
    reviews: [
      {
        id: 5,
        productId: 5,
        rating: 5,
        comment: "Très efficace, ma peau est douce !",
        userName: "Fatima L.",
        createdAt: "2024-11-06",
      },
    ],
    averageRating: 5,
  },
  {
    id: 6,
    categoryId: 3,
    name: "Brosse Massage Cuir Chevelu",
    slug: "brosse-massage-cuir-chevelu",
    description: "Brosse de massage pour cuir chevelu avec vibration. Relaxation et bien-être garantis.",
    price: 2299,
    originalPrice: null,
    stock: 40,
    featured: 0,
    images: [],
    reviews: [],
    averageRating: 4.5,
  },
  {
    id: 7,
    categoryId: 4,
    name: "Tapis de Yoga Premium",
    slug: "tapis-yoga-premium",
    description: "Tapis de yoga antidérapant avec sangle de transport. Épaisseur 6mm pour confort optimal.",
    price: 3999,
    originalPrice: null,
    stock: 35,
    featured: 1,
    images: [],
    reviews: [],
    averageRating: 4.5,
  },
  {
    id: 8,
    categoryId: 4,
    name: "Haltères Ajustables",
    slug: "halteres-ajustables",
    description: "Paire d'haltères ajustables de 2kg à 10kg. Idéal pour l'entraînement à domicile.",
    price: 4999,
    originalPrice: null,
    stock: 25,
    featured: 0,
    images: [],
    reviews: [],
    averageRating: 4.5,
  },
  {
    id: 9,
    categoryId: 5,
    name: "Support Téléphone Voiture Magnétique",
    slug: "support-telephone-voiture-magnetique",
    description: "Support magnétique ultra-puissant pour voiture. Fixation facile au tableau de bord.",
    price: 1899,
    originalPrice: 2499,
    stock: 8,
    featured: 1,
    images: [],
    reviews: [
      {
        id: 6,
        productId: 9,
        rating: 5,
        comment: "Très solide et pratique !",
        userName: "Mohamed R.",
        createdAt: "2024-11-05",
      },
    ],
    averageRating: 5,
  },
  {
    id: 10,
    categoryId: 5,
    name: "Produit Nettoyage Auto",
    slug: "produit-nettoyage-auto",
    description: "Produit nettoyant multi-usages pour voiture. Efficace sur tous les types de surfaces.",
    price: 999,
    originalPrice: null,
    stock: 15,
    featured: 0,
    images: [],
    reviews: [],
    averageRating: 4.5,
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
