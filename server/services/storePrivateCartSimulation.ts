import type { StudioProductDraft } from "./storeProductDraft";
import type { StudioProductOperationDraft } from "./storeProductOperationsDraft";

export type StudioPrivateCartLineInput = {
  productId: string;
  quantity: number;
};

export type StudioPrivateCartCollection = {
  id: string;
  title: string;
};

type SimulationStatus = "available" | "limited" | "unavailable";

const MAX_LINES = 24;
const MAX_QUANTITY_PER_LINE = 99;

function normalizeRequestedLines(value: unknown) {
  if (!Array.isArray(value)) return [] as StudioPrivateCartLineInput[];
  const seen = new Set<string>();
  const lines: StudioPrivateCartLineInput[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || lines.length >= MAX_LINES) continue;
    const item = entry as Record<string, unknown>;
    const productId = typeof item.productId === "string" ? item.productId.trim().slice(0, 32) : "";
    const quantity = typeof item.quantity === "number" && Number.isFinite(item.quantity) ? Math.round(item.quantity) : 0;
    if (!productId || seen.has(productId) || quantity < 1) continue;
    seen.add(productId);
    lines.push({ productId, quantity: Math.min(MAX_QUANTITY_PER_LINE, quantity) });
  }

  return lines;
}

function availabilityFor(operation: StudioProductOperationDraft | undefined) {
  if (!operation || operation.stockState === "to_confirm") {
    return { status: "unavailable" as const, maxQuantity: 0, message: "Disponibilité à confirmer avant le test." };
  }
  if (operation.stockState === "out_of_stock" || operation.stockQuantity < 1) {
    return { status: "unavailable" as const, maxQuantity: 0, message: "Cette fiche est indisponible dans la simulation." };
  }
  if (operation.stockState === "limited") {
    return { status: "limited" as const, maxQuantity: Math.min(MAX_QUANTITY_PER_LINE, operation.stockQuantity), message: "Quantité limitée dans la simulation." };
  }
  return { status: "available" as const, maxQuantity: Math.min(MAX_QUANTITY_PER_LINE, operation.stockQuantity), message: "Disponible pour le test privé." };
}

/**
 * Builds a read-only Studio cart simulation. It deliberately has no connection
 * to carts, customers, checkout, payment, orders or suppliers.
 */
export function buildStudioPrivateCartSimulation(input: {
  products: StudioProductDraft[];
  collections: StudioPrivateCartCollection[];
  operations: StudioProductOperationDraft[];
  lines: unknown;
}) {
  const collectionTitles = new Map(input.collections.map(collection => [collection.id, collection.title]));
  const operations = new Map(input.operations.map(operation => [operation.productId, operation]));
  const catalog = input.products.map(product => {
    const availability = availabilityFor(operations.get(product.id));
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      collectionTitle: collectionTitles.get(product.collectionId) || "Collection privée",
      priceCents: product.priceCents,
      featured: product.featured,
      ...availability,
    };
  });
  const catalogById = new Map(catalog.map(product => [product.id, product]));
  const requestedLines = normalizeRequestedLines(input.lines);

  const lines = requestedLines.map(requested => {
    const product = catalogById.get(requested.productId);
    if (!product) {
      return {
        productId: requested.productId,
        name: "Fiche indisponible",
        priceCents: 0,
        requestedQuantity: requested.quantity,
        acceptedQuantity: 0,
        lineTotalCents: 0,
        status: "unavailable" as SimulationStatus,
        message: "Cette fiche n’existe plus dans la préparation.",
      };
    }

    const acceptedQuantity = Math.min(requested.quantity, product.maxQuantity);
    const status: SimulationStatus = acceptedQuantity > 0 ? product.status : "unavailable";
    const message = acceptedQuantity === 0
      ? product.message
      : acceptedQuantity < requested.quantity
        ? `Quantité ajustée à ${acceptedQuantity} pour ce test privé.`
        : product.message;

    return {
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      requestedQuantity: requested.quantity,
      acceptedQuantity,
      lineTotalCents: product.priceCents * acceptedQuantity,
      status,
      message,
    };
  });

  const acceptedLines = lines.filter(line => line.acceptedQuantity > 0);
  const subtotalCents = acceptedLines.reduce((total, line) => total + line.lineTotalCents, 0);

  return {
    privateCartSimulation: true as const,
    publicStorefront: false as const,
    persistedCart: false as const,
    customerCreated: false as const,
    checkoutAvailable: false as const,
    paymentAvailable: false as const,
    orderCreated: false as const,
    supplierActionAvailable: false as const,
    catalog,
    lines,
    subtotalCents,
    itemCount: acceptedLines.reduce((total, line) => total + line.acceptedQuantity, 0),
    unavailableLineCount: lines.filter(line => line.acceptedQuantity === 0).length,
  };
}

export const studioPrivateCartSimulationLimits = {
  maxLines: MAX_LINES,
  maxQuantityPerLine: MAX_QUANTITY_PER_LINE,
} as const;
