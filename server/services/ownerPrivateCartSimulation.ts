import { calculateCheckoutShipping, type CheckoutShippingPolicy } from "./checkoutShippingPolicy";
import { calculateConvertedCartTotals, type StoreCurrencyConfig } from "../../shared/storeCurrency";

type OwnerSimulationProduct = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status: string;
  featured: number | boolean;
};

type OwnerSimulationVariant = {
  id: number;
  productId: number;
  label: string;
  priceAdjustmentCents: number;
  stock: number;
};

export type OwnerPrivateCartLineInput = {
  productId: number;
  variantId?: number;
  quantity: number;
};

type SimulationStatus = "available" | "limited" | "unavailable";

const MAX_LINES = 24;
const MAX_QUANTITY_PER_LINE = 99;
const LIMITED_STOCK_THRESHOLD = 5;

function normalizeLines(value: unknown): OwnerPrivateCartLineInput[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const lines: OwnerPrivateCartLineInput[] = [];

  for (const valueLine of value) {
    if (!valueLine || typeof valueLine !== "object" || lines.length >= MAX_LINES) continue;
    const line = valueLine as Record<string, unknown>;
    const productId = typeof line.productId === "number" && Number.isInteger(line.productId) && line.productId > 0 ? line.productId : 0;
    const variantId = typeof line.variantId === "number" && Number.isInteger(line.variantId) && line.variantId > 0 ? line.variantId : undefined;
    const quantity = typeof line.quantity === "number" && Number.isFinite(line.quantity) ? Math.round(line.quantity) : 0;
    const key = `${productId}:${variantId ?? "base"}`;
    if (!productId || seen.has(key) || quantity < 1) continue;
    seen.add(key);
    lines.push({ productId, variantId, quantity: Math.min(MAX_QUANTITY_PER_LINE, quantity) });
  }

  return lines;
}

function availabilityFor(input: { product: OwnerSimulationProduct; variant?: OwnerSimulationVariant }) {
  if (input.product.status !== "active") {
    return { status: "unavailable" as const, maxQuantity: 0, message: "Cette fiche n’est pas active dans le catalogue." };
  }
  const priceCents = Number(input.product.price) + Number(input.variant?.priceAdjustmentCents ?? 0);
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return { status: "unavailable" as const, maxQuantity: 0, message: "Ajoutez un prix de vente valide avant la simulation." };
  }
  const stock = Number(input.variant?.stock ?? input.product.stock);
  if (!Number.isInteger(stock) || stock < 1) {
    return { status: "unavailable" as const, maxQuantity: 0, message: "Cette sélection est en rupture de stock." };
  }
  if (stock <= LIMITED_STOCK_THRESHOLD) {
    return { status: "limited" as const, maxQuantity: Math.min(MAX_QUANTITY_PER_LINE, stock), message: "Quantité limitée par le stock actuel." };
  }
  return { status: "available" as const, maxQuantity: Math.min(MAX_QUANTITY_PER_LINE, stock), message: "Disponible pour cette simulation privée." };
}

/**
 * Read-only simulation based on a boutique's actual owner catalogue. It is not
 * connected to visitor carts, customer accounts, payment sessions, orders,
 * suppliers, fulfilment, or any external service.
 */
export function buildOwnerPrivateCartSimulation(input: {
  products: OwnerSimulationProduct[];
  variants: OwnerSimulationVariant[];
  lines: unknown;
  shippingPolicy: CheckoutShippingPolicy;
  currency: StoreCurrencyConfig;
}) {
  const variantsByProduct = new Map<number, OwnerSimulationVariant[]>();
  for (const variant of input.variants) {
    const current = variantsByProduct.get(variant.productId) ?? [];
    current.push(variant);
    variantsByProduct.set(variant.productId, current);
  }

  const offers = input.products.flatMap(product => {
    const variants = variantsByProduct.get(product.id) ?? [];
    const availableVariants = variants.length > 0 ? variants : [undefined];
    return availableVariants.map(variant => {
      const availability = availabilityFor({ product, variant });
      return {
        productId: product.id,
        variantId: variant?.id,
        name: product.name,
        description: product.description || "",
        variantLabel: variant?.label ?? null,
        featured: Boolean(product.featured),
        unitAmountChf: Number(product.price) + Number(variant?.priceAdjustmentCents ?? 0),
        stock: Number(variant?.stock ?? product.stock),
        ...availability,
      };
    });
  });
  const offerByKey = new Map(offers.map(offer => [`${offer.productId}:${offer.variantId ?? "base"}`, offer]));

  const lines = normalizeLines(input.lines).map(requested => {
    const offer = offerByKey.get(`${requested.productId}:${requested.variantId ?? "base"}`);
    if (!offer) {
      return {
        ...requested,
        name: "Sélection indisponible",
        variantLabel: null,
        requestedQuantity: requested.quantity,
        acceptedQuantity: 0,
        unitAmountChf: 0,
        lineTotalChf: 0,
        status: "unavailable" as SimulationStatus,
        message: "Cette fiche ou cette variante n’est plus disponible dans la boutique.",
      };
    }
    const acceptedQuantity = Math.min(requested.quantity, offer.maxQuantity);
    const status = acceptedQuantity > 0 ? offer.status : "unavailable" as const;
    return {
      productId: offer.productId,
      variantId: offer.variantId,
      name: offer.name,
      variantLabel: offer.variantLabel,
      requestedQuantity: requested.quantity,
      acceptedQuantity,
      unitAmountChf: offer.unitAmountChf,
      lineTotalChf: offer.unitAmountChf * acceptedQuantity,
      status,
      message: acceptedQuantity === 0
        ? offer.message
        : acceptedQuantity < requested.quantity
          ? `Quantité ajustée à ${acceptedQuantity} selon le stock actuel.`
          : offer.message,
    };
  });

  const acceptedLines = lines.filter(line => line.acceptedQuantity > 0);
  const subtotalChf = acceptedLines.reduce((total, line) => total + line.lineTotalChf, 0);
  const shipping = input.shippingPolicy.countryServed
    ? calculateCheckoutShipping(subtotalChf, input.shippingPolicy)
    : { shippingAmountCents: 0, freeShippingApplied: false };
  const converted = calculateConvertedCartTotals({
    lines: acceptedLines.map(line => ({ unitAmountChf: line.unitAmountChf, quantity: line.acceptedQuantity })),
    shippingAmountChf: shipping.shippingAmountCents,
    currency: input.currency,
  });

  return {
    privateCartSimulation: true as const,
    persistedCart: false as const,
    customerCreated: false as const,
    checkoutAvailable: false as const,
    paymentAvailable: false as const,
    orderCreated: false as const,
    supplierActionAvailable: false as const,
    currencyCode: input.currency.code,
    catalog: offers.map(offer => ({
      ...offer,
      unitAmountCents: Math.round((offer.unitAmountChf * input.currency.rateBps) / 10_000),
    })),
    lines: lines.map(line => ({
      ...line,
      unitAmountCents: Math.round((line.unitAmountChf * input.currency.rateBps) / 10_000),
      lineTotalCents: Math.round((line.lineTotalChf * input.currency.rateBps) / 10_000),
    })),
    itemCount: acceptedLines.reduce((total, line) => total + line.acceptedQuantity, 0),
    unavailableLineCount: lines.filter(line => line.acceptedQuantity === 0).length,
    delivery: {
      countryServed: input.shippingPolicy.countryServed,
      servedCountries: input.shippingPolicy.servedCountries,
      deliveryLeadTime: input.shippingPolicy.deliveryLeadTime,
      returnsSummary: input.shippingPolicy.returnsSummary,
      mode: input.shippingPolicy.mode,
      freeShippingApplied: shipping.freeShippingApplied,
    },
    totals: {
      subtotalCents: converted.subtotal,
      shippingCents: converted.shipping,
      totalCents: converted.total,
    },
  };
}

export const ownerPrivateCartSimulationLimits = {
  maxLines: MAX_LINES,
  maxQuantityPerLine: MAX_QUANTITY_PER_LINE,
} as const;
