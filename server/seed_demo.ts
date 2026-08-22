import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { categories, banners } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";

const DEFAULT_BANNER_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/JZmuCtGTfIYUcFRd.jpg";

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL non définie.");
    return;
  }

  console.log("Connexion sécurisée à TiDB Cloud...");
  const connection = await mysql.createConnection({
    uri: url,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  const db = drizzle(connection, { schema, mode: 'default' });
  console.log("Connecté !");

  console.log("Démarrage de l'injection des données de démonstration...");

  // 1. Injection des Catégories
  const demoCategories = [
    { name: "High-Tech & Gadgets", slug: "high-tech-gadgets", description: "Accessoires téléphone, Gadgets innovants, Charge & Câbles", icon: "📱", displayOrder: 1 },
    { name: "Maison & Organisation", slug: "maison-organisation", description: "Rangement malin, Cuisine pratique, Nettoyage intelligent", icon: "🏠", displayOrder: 2 },
    { name: "Beauté & Bien-Être", slug: "beaute-bien-etre", description: "Soins visage, Massage & relaxation, Coiffure", icon: "💄", displayOrder: 3 },
    { name: "Sport & Fitness", slug: "sport-fitness", description: "Fitness à domicile, Yoga & pilates, Accessoires sport", icon: "🏋️", displayOrder: 4 },
    { name: "Auto & Accessoires", slug: "auto-accessoires", description: "Supports téléphone voiture, Nettoyage auto, Sécurité & assistance", icon: "🚗", displayOrder: 5 },
    { name: "Mode", slug: "mode", description: "Vêtements, Chaussures, Accessoires de mode", icon: "👗", displayOrder: 6 },
  ];

  for (const cat of demoCategories) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
    if (existing.length === 0) {
      console.log(`Création de la catégorie : ${cat.name}`);
      await db.insert(categories).values(cat);
    }
  }

  // 2. Injection des Bannières
  const demoBanners = [
    { title: "Découvrez nos Meilleures Offres", subtitle: "Simplifiez votre quotidien avec style", imageUrl: DEFAULT_BANNER_IMAGE, linkUrl: "/boutique", active: 1, displayOrder: 1 },
    { title: "Mode & Accessoires", subtitle: "Les dernières tendances de la saison", imageUrl: DEFAULT_BANNER_IMAGE, linkUrl: "/categorie/mode", active: 1, displayOrder: 2 },
    { title: "Beauté & Bien-Être", subtitle: "Prenez soin de vous avec nos produits premium", imageUrl: DEFAULT_BANNER_IMAGE, linkUrl: "/categorie/beaute-bien-etre", active: 1, displayOrder: 3 },
  ];

  for (const banner of demoBanners) {
    const existing = await db.select().from(banners).where(eq(banners.title, banner.title)).limit(1);
    if (existing.length === 0) {
      console.log(`Création de la bannière : ${banner.title}`);
      await db.insert(banners).values(banner);
    }
  }

  console.log("Injection terminée avec succès !");
  process.exit(0);
}

seed().catch(err => {
  console.error("Erreur lors de l'injection :", err);
  process.exit(1);
});
