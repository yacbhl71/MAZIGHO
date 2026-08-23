import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export type DesignProfile = {
  paletteId: "terracotta" | "sage" | "midnight" | "rose";
  typographyId: "editorial" | "modern" | "classic";
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
  showDiscovery: boolean;
  showStory: boolean;
  showTestimonials: boolean;
  showEditorial: boolean;
};

export const defaultDesignProfile: DesignProfile = {
  paletteId: "terracotta",
  typographyId: "editorial",
  highlightEyebrow: "L'inspiration MAZIGHO",
  highlightTitle: "Des trouvailles qui embellissent le quotidien.",
  highlightText: "Mode, bien-être, maison et accessoires : une sélection pensée pour chaque moment.",
  highlightImageUrl: "/assets/home-lifestyle-top.jpg",
  storyTitle: "L’histoire inspirante de MAZIGHO.",
  storyText: "MAZIGHO est né d’une idée simple : rendre les bonnes découvertes plus accessibles. Nous aimons les objets utiles, les petits plaisirs et les détails qui donnent une touche plus douce à la journée.",
  storyImageUrl: "/assets/home-lifestyle-top.jpg",
  editorialEyebrow: "Sélection éditoriale",
  editorialTitle: "Le détail qui fait la différence.",
  editorialImageUrl: "/assets/home-editorial-divider.jpg",
  showDiscovery: true,
  showStory: true,
  showTestimonials: true,
  showEditorial: true,
};

export const designPalettes = {
  terracotta: {
    name: "Terracotta chaleureux",
    primary: "#ea580c",
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

export function useDesignProfile() {
  const query = trpc.design.get.useQuery();
  const profile = (query.data ?? defaultDesignProfile) as DesignProfile;
  const palette = designPalettes[profile.paletteId] ?? designPalettes.terracotta;
  const typography = designTypography[profile.typographyId] ?? designTypography.editorial;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--mazigho-primary", palette.primary);
    root.style.setProperty("--mazigho-accent", palette.accent);
    root.style.setProperty("--mazigho-soft", palette.soft);
    root.style.setProperty("--mazigho-body-font", typography.body);
    root.style.setProperty("--mazigho-heading-font", typography.heading);

    return () => {
      root.style.removeProperty("--mazigho-primary");
      root.style.removeProperty("--mazigho-accent");
      root.style.removeProperty("--mazigho-soft");
      root.style.removeProperty("--mazigho-body-font");
      root.style.removeProperty("--mazigho-heading-font");
    };
  }, [palette.accent, palette.primary, palette.soft, typography.body, typography.heading]);

  return { ...query, profile, palette, typography };
}
