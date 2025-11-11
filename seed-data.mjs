import { drizzle } from "drizzle-orm/mysql2";
import { categories, products, productImages, reviews, users } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Début du peuplement de la base de données...");

  // Créer les catégories
  const categoriesData = [
    {
      name: "Vêtements",
      slug: "vetements",
      description: "Découvrez notre collection de vêtements premium alliant style, confort et qualité exceptionnelle.",
      imageUrl: null,
    },
    {
      name: "Cosmétiques",
      slug: "cosmetiques",
      description: "Des produits de beauté haut de gamme pour sublimer votre peau et révéler votre éclat naturel.",
      imageUrl: null,
    },
    {
      name: "Accessoires",
      slug: "accessoires",
      description: "Complétez votre look avec nos accessoires raffinés, pensés pour apporter la touche finale parfaite.",
      imageUrl: null,
    },
    {
      name: "Cadeaux",
      slug: "cadeaux",
      description: "Une sélection unique de cadeaux d'exception pour faire plaisir à vos proches.",
      imageUrl: null,
    },
    {
      name: "Jouets",
      slug: "jouets",
      description: "Des jouets éducatifs et créatifs de qualité supérieure pour éveiller l'imagination des enfants.",
      imageUrl: null,
    },
  ];

  console.log("📦 Insertion des catégories...");
  await db.insert(categories).values(categoriesData);
  const allCategories = await db.select().from(categories);
  console.log(`✅ ${allCategories.length} catégories créées`);

  // Créer des produits pour chaque catégorie
  const productsData = [];
  
  // Vêtements
  const vetementsCat = allCategories.find(c => c.slug === "vetements");
  productsData.push(
    {
      categoryId: vetementsCat.id,
      name: "Robe Élégante en Soie",
      slug: "robe-elegante-soie",
      description: "Une robe sophistiquée en soie naturelle, parfaite pour les occasions spéciales. Coupe ajustée et finitions impeccables.",
      price: 12900,
      originalPrice: 15900,
      stock: 15,
      featured: 1,
    },
    {
      categoryId: vetementsCat.id,
      name: "Chemise Premium en Lin",
      slug: "chemise-premium-lin",
      description: "Chemise en lin de qualité supérieure, respirante et confortable. Idéale pour un look décontracté chic.",
      price: 7900,
      stock: 25,
      featured: 1,
    },
    {
      categoryId: vetementsCat.id,
      name: "Pantalon Tailleur Classique",
      slug: "pantalon-tailleur-classique",
      description: "Pantalon tailleur intemporel, coupe droite élégante. Tissu de haute qualité pour un confort optimal.",
      price: 8900,
      stock: 20,
      featured: 0,
    },
    {
      categoryId: vetementsCat.id,
      name: "Veste en Laine Mérinos",
      slug: "veste-laine-merinos",
      description: "Veste chaude et élégante en laine mérinos. Design moderne et finitions soignées.",
      price: 18900,
      originalPrice: 22900,
      stock: 10,
      featured: 1,
    }
  );

  // Cosmétiques
  const cosmetiquesCat = allCategories.find(c => c.slug === "cosmetiques");
  productsData.push(
    {
      categoryId: cosmetiquesCat.id,
      name: "Sérum Anti-Âge Luxe",
      slug: "serum-anti-age-luxe",
      description: "Sérum concentré aux actifs naturels pour une peau visiblement plus jeune. Texture légère et absorption rapide.",
      price: 8900,
      stock: 30,
      featured: 1,
    },
    {
      categoryId: cosmetiquesCat.id,
      name: "Crème Hydratante Premium",
      slug: "creme-hydratante-premium",
      description: "Crème riche en actifs hydratants pour une peau douce et nourrie toute la journée.",
      price: 5900,
      stock: 40,
      featured: 1,
    },
    {
      categoryId: cosmetiquesCat.id,
      name: "Masque Purifiant Visage",
      slug: "masque-purifiant-visage",
      description: "Masque à l'argile pour purifier et détoxifier la peau en profondeur.",
      price: 3900,
      stock: 35,
      featured: 0,
    },
    {
      categoryId: cosmetiquesCat.id,
      name: "Huile Essentielle Bio",
      slug: "huile-essentielle-bio",
      description: "Huile essentielle 100% pure et bio pour le soin du visage et du corps.",
      price: 4500,
      stock: 25,
      featured: 0,
    }
  );

  // Accessoires
  const accessoiresCat = allCategories.find(c => c.slug === "accessoires");
  productsData.push(
    {
      categoryId: accessoiresCat.id,
      name: "Sac à Main en Cuir Italien",
      slug: "sac-main-cuir-italien",
      description: "Sac à main luxueux en cuir véritable italien. Design intemporel et fabrication artisanale.",
      price: 24900,
      originalPrice: 29900,
      stock: 8,
      featured: 1,
    },
    {
      categoryId: accessoiresCat.id,
      name: "Écharpe en Cachemire",
      slug: "echarpe-cachemire",
      description: "Écharpe douce et chaude en cachemire pur. Accessoire élégant pour l'hiver.",
      price: 12900,
      stock: 15,
      featured: 1,
    },
    {
      categoryId: accessoiresCat.id,
      name: "Lunettes de Soleil Design",
      slug: "lunettes-soleil-design",
      description: "Lunettes de soleil au design moderne avec protection UV maximale.",
      price: 15900,
      stock: 12,
      featured: 0,
    },
    {
      categoryId: accessoiresCat.id,
      name: "Montre Élégante",
      slug: "montre-elegante",
      description: "Montre au design raffiné avec bracelet en cuir véritable.",
      price: 29900,
      stock: 6,
      featured: 0,
    }
  );

  // Cadeaux
  const cadeauxCat = allCategories.find(c => c.slug === "cadeaux");
  productsData.push(
    {
      categoryId: cadeauxCat.id,
      name: "Coffret Cadeau Prestige",
      slug: "coffret-cadeau-prestige",
      description: "Coffret luxueux contenant une sélection de produits premium soigneusement choisis.",
      price: 9900,
      stock: 20,
      featured: 1,
    },
    {
      categoryId: cadeauxCat.id,
      name: "Bougie Parfumée Artisanale",
      slug: "bougie-parfumee-artisanale",
      description: "Bougie artisanale aux fragrances naturelles, fabriquée avec des cires végétales.",
      price: 3900,
      stock: 50,
      featured: 0,
    },
    {
      categoryId: cadeauxCat.id,
      name: "Carnet en Cuir Premium",
      slug: "carnet-cuir-premium",
      description: "Carnet élégant avec couverture en cuir véritable et papier de qualité.",
      price: 4900,
      stock: 30,
      featured: 0,
    },
    {
      categoryId: cadeauxCat.id,
      name: "Set de Thé Gourmet",
      slug: "set-the-gourmet",
      description: "Coffret de thés rares et raffinés du monde entier.",
      price: 5900,
      stock: 25,
      featured: 0,
    }
  );

  // Jouets
  const jouetsCat = allCategories.find(c => c.slug === "jouets");
  productsData.push(
    {
      categoryId: jouetsCat.id,
      name: "Puzzle en Bois Éducatif",
      slug: "puzzle-bois-educatif",
      description: "Puzzle en bois naturel pour développer la motricité et la logique des enfants.",
      price: 3900,
      stock: 40,
      featured: 1,
    },
    {
      categoryId: jouetsCat.id,
      name: "Jeu de Construction Premium",
      slug: "jeu-construction-premium",
      description: "Set de construction de qualité supérieure pour stimuler la créativité.",
      price: 7900,
      stock: 30,
      featured: 0,
    },
    {
      categoryId: jouetsCat.id,
      name: "Peluche Artisanale",
      slug: "peluche-artisanale",
      description: "Peluche douce fabriquée à la main avec des matériaux naturels.",
      price: 4900,
      stock: 25,
      featured: 0,
    },
    {
      categoryId: jouetsCat.id,
      name: "Instruments de Musique Enfant",
      slug: "instruments-musique-enfant",
      description: "Set d'instruments de musique pour initier les enfants à la musique.",
      price: 5900,
      stock: 20,
      featured: 0,
    }
  );

  console.log("🛍️ Insertion des produits...");
  await db.insert(products).values(productsData);
  const allProducts = await db.select().from(products);
  console.log(`✅ ${allProducts.length} produits créés`);

  console.log("✨ Peuplement terminé avec succès !");
}

seed()
  .then(() => {
    console.log("✅ Base de données peuplée avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur lors du peuplement:", error);
    process.exit(1);
  });
