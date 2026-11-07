import { z } from "zod";

export interface VisualSearchConfig {
  enabled: boolean;
  title: string;
  description: string;
}

export const defaultVisualSearchConfig: VisualSearchConfig = {
  enabled: true,
  title: "Recherche par Photo IA",
  description: "Envoyez une photo ou une capture d'écran d'un article pour trouver nos produits similaires.",
};

export const visualSearchConfigSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().min(1, "Titre requis"),
  description: z.string().default(""),
});
