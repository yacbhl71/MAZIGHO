export type ProductPublicationInput = {
  categoryId: string;
  name: string;
  description: string;
  longDescription: string;
  price: string;
  stock: string;
  images: string;
  status: "active" | "draft" | "archived";
};

export type ProductPublicationCheck = {
  id: "category" | "title" | "hook" | "detail" | "price" | "stock" | "image";
  label: string;
  complete: boolean;
  recommendation: string;
};

function normalizedText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseAmount(value: string) {
  const amount = Number(value.trim().replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
}

export function getProductPublicationChecks(product: ProductPublicationInput): ProductPublicationCheck[] {
  const descriptionLength = normalizedText(product.description).length;
  const detailLength = normalizedText(product.longDescription).length;
  const imageCount = product.images.split(/\r?\n/).map(line => line.trim()).filter(Boolean).length;
  const stock = Math.max(0, Math.floor(Number(product.stock) || 0));

  return [
    { id: "category", label: "Catégorie", complete: Boolean(product.categoryId), recommendation: "Choisissez l’univers principal du produit." },
    { id: "title", label: "Titre", complete: normalizedText(product.name).length >= 3, recommendation: "Écrivez un titre précis, facile à rechercher." },
    { id: "hook", label: "Accroche", complete: descriptionLength >= 40, recommendation: "Ajoutez une accroche claire d’au moins 40 caractères." },
    { id: "detail", label: "Description", complete: detailLength >= 180, recommendation: "Décrivez l’usage, la matière, les dimensions ou les points forts (environ 180 caractères)." },
    { id: "price", label: "Prix", complete: parseAmount(product.price) > 0, recommendation: "Ajoutez un prix de vente supérieur à zéro." },
    { id: "stock", label: "Stock", complete: stock > 0, recommendation: "Renseignez une quantité disponible avant de publier." },
    { id: "image", label: "Visuel", complete: imageCount > 0, recommendation: "Ajoutez au moins une image nette du produit." },
  ];
}

export function getProductPublicationReadiness(product: ProductPublicationInput) {
  const checks = getProductPublicationChecks(product);
  const completed = checks.filter(check => check.complete).length;
  const score = Math.round((completed / checks.length) * 100);
  const status = score === 100 ? "Prête à publier" : score >= 70 ? "Presque prête" : "À compléter";
  const description = normalizedText(product.description || product.longDescription).slice(0, 160);

  return {
    checks,
    completed,
    total: checks.length,
    score,
    status,
    searchDescription: description || "Ajoutez une accroche claire pour présenter ce produit.",
    activeWithoutEssentials: product.status === "active" && checks.some(check => ["price", "stock", "image"].includes(check.id) && !check.complete),
  };
}
