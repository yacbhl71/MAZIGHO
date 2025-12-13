
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
  {
    id: 6,
    name: "Mode",
    slug: "mode",
    description: "Vêtements, Chaussures, Accessoires de mode",
    imageUrl: null,
    icon: "👗",
    subcategories: ["Vêtements", "Chaussures", "Accessoires de mode", "Sacs à main", "Bijoux"],
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
    longDescription: "Support magnétique universel pour téléphone en voiture. Fixation simple au tableau de bord avec ventouse puissante. Rotation à 360° pour tous les angles. Compatible avec tous les téléphones.",
    price: 1599,
    originalPrice: 2499,
    stock: 25,
    featured: 1,
    images: [
      { id: 4, productId: 2, imageUrl: "", displayOrder: 1 },
      { id: 5, productId: 2, imageUrl: "", displayOrder: 2 },
    ],
    reviews: [
      {
        id: 3,
        productId: 2,
        rating: 4,
        comment: "Très pratique, bien fixé au tableau de bord",
        userName: "Hassan K.",
        createdAt: "2024-11-05",
      },
    ],
    averageRating: 4,
    options: [
      { id: "color-4", type: "color", label: "Noir", value: "black" },
      { id: "color-5", type: "color", label: "Gris", value: "gray" },
    ],
  },
  {
    id: 3,
    categoryId: 2,
    name: "Organiseur de Rangement",
    slug: "organiseur-rangement",
    description: "Boîte de rangement modulable avec compartiments ajustables.",
    longDescription: "Organiseur de rangement modulable avec compartiments ajustables. Parfait pour organiser votre maison. Matériau durable et facile à nettoyer.",
    price: 1299,
    originalPrice: 1899,
    stock: 30,
    featured: 1,
    images: [
      { id: 6, productId: 3, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [],
    averageRating: 0,
    options: [
      { id: "color-6", type: "color", label: "Blanc", value: "white" },
      { id: "color-7", type: "color", label: "Gris", value: "gray" },
    ],
  },
  {
    id: 4,
    categoryId: 3,
    name: "Crème Hydratante Premium",
    slug: "creme-hydratante-premium",
    description: "Crème hydratante pour tous les types de peau. Formule naturelle et efficace.",
    longDescription: "Crème hydratante premium avec ingrédients naturels. Hydrate en profondeur et laisse la peau douce et lumineuse. Convient à tous les types de peau.",
    price: 2999,
    originalPrice: 4499,
    stock: 50,
    featured: 1,
    images: [
      { id: 7, productId: 4, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [
      {
        id: 4,
        productId: 4,
        rating: 5,
        comment: "Ma peau est devenue très douce et hydratée !",
        userName: "Leila B.",
        createdAt: "2024-11-12",
      },
    ],
    averageRating: 5,
  },
  {
    id: 5,
    categoryId: 4,
    name: "Tapis de Yoga Premium",
    slug: "tapis-yoga-premium",
    description: "Tapis de yoga antidérapant avec sangle de transport.",
    longDescription: "Tapis de yoga premium antidérapant avec sangle de transport incluse. Épaisseur 6mm pour un confort optimal. Matériau écologique et durable.",
    price: 3999,
    originalPrice: 5999,
    stock: 20,
    featured: 1,
    images: [
      { id: 8, productId: 5, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [
      {
        id: 5,
        productId: 5,
        rating: 5,
        comment: "Excellent tapis, très confortable pour le yoga",
        userName: "Noor A.",
        createdAt: "2024-11-09",
      },
    ],
    averageRating: 5,
    options: [
      { id: "color-8", type: "color", label: "Rose", value: "pink" },
      { id: "color-9", type: "color", label: "Bleu", value: "blue" },
      { id: "color-10", type: "color", label: "Vert", value: "green" },
    ],
  },
  {
    id: 6,
    categoryId: 5,
    name: "Nettoyant Auto Écologique",
    slug: "nettoyant-auto-ecologique",
    description: "Nettoyant auto écologique et biodégradable.",
    longDescription: "Nettoyant auto écologique et biodégradable. Nettoie en profondeur sans endommager la peinture. Formule concentrée, économique et respectueuse de l'environnement.",
    price: 999,
    originalPrice: 1499,
    stock: 40,
    featured: 0,
    images: [
      { id: 9, productId: 6, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [],
    averageRating: 0,
  },
  {
    id: 7,
    categoryId: 1,
    name: "Câble USB-C Renforcé",
    slug: "cable-usb-c-renforce",
    description: "Câble USB-C renforcé avec gaine de protection.",
    longDescription: "Câble USB-C renforcé avec gaine de protection en nylon tressé. Durabilité garantie avec 10000+ cycles de flexion. Charge et synchronisation rapides.",
    price: 899,
    originalPrice: 1299,
    stock: 60,
    featured: 0,
    images: [
      { id: 10, productId: 7, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [],
    averageRating: 0,
    options: [
      { id: "color-11", type: "color", label: "Noir", value: "black" },
      { id: "color-12", type: "color", label: "Blanc", value: "white" },
    ],
  },
  {
    id: 8,
    categoryId: 2,
    name: "Conteneurs de Cuisine",
    slug: "conteneurs-cuisine",
    description: "Set de conteneurs hermétiques pour la cuisine.",
    longDescription: "Set de 3 conteneurs hermétiques pour la cuisine. Parfaits pour conserver les aliments frais. Matériau sans BPA et facile à nettoyer.",
    price: 1799,
    originalPrice: 2599,
    stock: 35,
    featured: 0,
    images: [
      { id: 11, productId: 8, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [],
    averageRating: 0,
    options: [
      { id: "color-13", type: "color", label: "Transparent", value: "white" },
    ],
  },
  {
    id: 9,
    categoryId: 3,
    name: "Masque Facial Hydratant",
    slug: "masque-facial-hydratant",
    description: "Masque facial hydratant avec extrait de miel.",
    longDescription: "Masque facial hydratant premium avec extrait de miel naturel. Hydrate et revitalise la peau en 15 minutes. Convient à tous les types de peau.",
    price: 1599,
    originalPrice: 2299,
    stock: 45,
    featured: 0,
    images: [
      { id: 12, productId: 9, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [],
    averageRating: 0,
  },
  {
    id: 10,
    categoryId: 4,
    name: "Haltères Ajustables",
    slug: "halteres-ajustables",
    description: "Paire d'haltères ajustables de 2kg à 10kg.",
    longDescription: "Paire d'haltères ajustables de 2kg à 10kg pour l'entraînement à domicile. Design compact et sécurisé. Parfait pour tous les niveaux de fitness.",
    price: 4999,
    originalPrice: 7499,
    stock: 15,
    featured: 0,
    images: [
      { id: 13, productId: 10, imageUrl: "", displayOrder: 1 },
    ],
    reviews: [],
    averageRating: 0,
    options: [
      { id: "color-14", type: "color", label: "Noir", value: "black" },
      { id: "color-15", type: "color", label: "Gris", value: "gray" },
    ],
  },
];

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((cat) => cat.slug === slug);
}

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((prod) => prod.slug === slug);
}

export function getProductsByCategory(categoryId: number): Product[] {
  return products.filter((prod) => prod.categoryId === categoryId);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((prod) => prod.featured === 1).slice(0, 8);
}


// Banners pour le carrousel
export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export const banners: Banner[] = [
  {
    id: 1,
    title: "Découvrez nos Meilleures Offres",
    subtitle: "Simplifiez votre quotidien avec style",
    buttonText: "Commander Maintenant",
    buttonLink: "/boutique",
  },
  {
    id: 2,
    title: "Mode & Accessoires",
    subtitle: "Les dernières tendances de la saison",
    buttonText: "Voir la Collection",
    buttonLink: "/categorie/mode",
  },
  {
    id: 3,
    title: "Beauté & Bien-Être",
    subtitle: "Prenez soin de vous avec nos produits premium",
    buttonText: "Découvrir",
    buttonLink: "/categorie/beaute-bien-etre",
  },
];

export function getBanners(): Banner[] {
  return banners;
}
