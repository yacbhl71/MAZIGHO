export type AliExpressManifestOrder = {
  id: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingAddress: string;
};

export type AliExpressManifestItem = {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  productNameSnapshot: string | null;
  selectedOptions: string | null;
  supplierSnapshot: string | null;
  productName: string | null;
  supplier: string | null;
  supplierUrl: string | null;
};

type StringRecord = Record<string, string>;
type ShippingAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  countryCode: string;
  phone: string | null;
  email: string | null;
};

type AliExpressPreparationLine = {
  orderItemId: number;
  productName: string;
  quantity: number;
  customerLineAmountCents: number;
  supplierProductId: string;
  supplierVariantId: string | null;
  supplierUrl: string | null;
  selectedOptions: StringRecord;
  optionStatus: "mapped" | "human_selection_required" | "not_applicable";
  intendedCountryCode: string;
  urlSource: "order_snapshot" | "current_catalog" | "missing";
};

export type AliExpressPreparationManifest = {
  orderId: number;
  state: "not_eligible" | "blocked" | "ready_for_human_review";
  reason: string | null;
  paymentConfirmed: boolean;
  customerSaleTotalCents: number;
  shipping: ShippingAddress | null;
  lines: AliExpressPreparationLine[];
  nonAliExpressItemCount: number;
  warnings: string[];
  paymentPolicy: "human_checkout_only";
};

function parseObject(value: string | null): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value || "");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseSelectedOptions(value: string | null): { values: StringRecord; valid: boolean } {
  if (!value || !value.trim()) return { values: {}, valid: true };
  const record = parseObject(value);
  if (!record) return { values: {}, valid: false };
  let valid = true;
  const values = Object.entries(record).reduce<StringRecord>((result, [key, option]) => {
    const safeKey = key.trim().slice(0, 80);
    const safeValue = text(option).slice(0, 120);
    if (!safeKey || !safeValue) {
      valid = false;
      return result;
    }
    result[safeKey] = safeValue;
    return result;
  }, {});
  return { values, valid };
}

function parseAliExpressSnapshot(value: string | null) {
  const record = parseObject(value);
  if (text(record?.provider).toLowerCase() !== "aliexpress") return null;
  const supplierProductId = text(record?.supplierProductId);
  const supplierVariantId = text(record?.supplierVariantId) || null;
  const supplierUrl = text(record?.supplierUrl) || null;
  const countryCode = text(record?.countryCode).toUpperCase();
  return supplierProductId && /^[A-Z]{2}$/.test(countryCode) ? { supplierProductId, supplierVariantId, supplierUrl, countryCode } : null;
}

function isSafeAliExpressUrl(value: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && (hostname === "aliexpress.com" || hostname.endsWith(".aliexpress.com"));
  } catch {
    return false;
  }
}

function parseShippingAddress(value: string): ShippingAddress | null {
  const record = parseObject(value);
  const countryCode = text(record?.countryCode).toUpperCase();
  const shipping: ShippingAddress = {
    name: text(record?.name),
    line1: text(record?.line1),
    line2: text(record?.line2) || null,
    city: text(record?.city),
    state: text(record?.state) || null,
    postalCode: text(record?.postalCode),
    countryCode,
    phone: text(record?.phone) || null,
    email: text(record?.email) || null,
  };
  const complete = shipping.name && shipping.line1 && shipping.city && shipping.postalCode && /^[A-Z]{2}$/.test(shipping.countryCode);
  return complete ? shipping : null;
}

/**
 * Builds a read-only, operator-facing preparation manifest. It deliberately
 * contains no browser automation, checkout URL, payment action or API call.
 */
export function buildAliExpressPreparationManifest(order: AliExpressManifestOrder, items: AliExpressManifestItem[]): AliExpressPreparationManifest {
  const paymentConfirmed = order.paymentStatus === "paid";
  const shipping = parseShippingAddress(order.shippingAddress);
  const allAliExpressLines = items.flatMap(item => {
    const snapshot = parseAliExpressSnapshot(item.supplierSnapshot);
    if (!snapshot) return [];
    const parsedOptions = parseSelectedOptions(item.selectedOptions);
    const selectedOptions = parsedOptions.values;
    const snapshotUrl = isSafeAliExpressUrl(snapshot.supplierUrl) ? snapshot.supplierUrl : null;
    const currentCatalogUrl = snapshotUrl ? null : (item.supplier?.toLowerCase() === "aliexpress" && isSafeAliExpressUrl(item.supplierUrl) ? item.supplierUrl : null);
    const supplierUrl = snapshotUrl || currentCatalogUrl;
    const optionStatus = !parsedOptions.valid || (Object.keys(selectedOptions).length > 0 && !snapshot.supplierVariantId)
      ? "human_selection_required" as const
      : Object.keys(selectedOptions).length === 0 ? "not_applicable" as const : "mapped" as const;
    return [{
      orderItemId: item.id,
      productName: item.productNameSnapshot || item.productName || "Produit MAZIGHO",
      quantity: item.quantity,
      customerLineAmountCents: Number(item.priceAtPurchase) * Number(item.quantity),
      supplierProductId: snapshot.supplierProductId,
      supplierVariantId: snapshot.supplierVariantId,
      supplierUrl,
      selectedOptions,
      optionStatus,
      intendedCountryCode: snapshot.countryCode,
      urlSource: snapshotUrl ? "order_snapshot" as const : supplierUrl ? "current_catalog" as const : "missing" as const,
    }];
  });

  const warnings: string[] = [];
  if (!paymentConfirmed) warnings.push("Le paiement MAZIGHO n’est pas confirmé : aucune préparation fournisseur n’est autorisée.");
  if (order.status !== "processing") warnings.push("La commande doit être acceptée et au statut « en préparation » avant sa revue fournisseur.");
  if (!shipping) warnings.push("L’adresse de livraison confirmée est incomplète ; complétez-la avant toute action fournisseur.");
  if (!allAliExpressLines.length) warnings.push("Cette commande ne contient aucune ligne AliExpress suffisamment référencée dans son instantané de paiement.");
  if (allAliExpressLines.some(line => !line.supplierUrl)) warnings.push("Au moins une fiche fournisseur n’est pas disponible dans l’instantané ni le catalogue actuel.");
  if (allAliExpressLines.some(line => line.urlSource === "current_catalog")) warnings.push("Certaines URL viennent du catalogue actuel : vérifiez manuellement qu’elles correspondent à l’article vendu avant de poursuivre.");
  if (allAliExpressLines.some(line => line.optionStatus === "human_selection_required")) warnings.push("Certaines options client sont absentes, malformées ou non reliées à une variante fournisseur : choisissez-les et vérifiez-les manuellement sur AliExpress.");
  if (shipping && allAliExpressLines.some(line => line.intendedCountryCode !== shipping.countryCode)) warnings.push("La destination enregistrée au paiement ne correspond pas à l’adresse actuelle : ne poursuivez pas avant correction et nouvelle vérification de la livraison.");
  const nonAliExpressItemCount = Math.max(0, items.length - allAliExpressLines.length);
  if (nonAliExpressItemCount) warnings.push("Les autres lignes de la commande relèvent d’un autre circuit fournisseur et ne sont pas incluses dans ce manifeste AliExpress.");

  const countryMismatch = Boolean(shipping && allAliExpressLines.some(line => line.intendedCountryCode !== shipping.countryCode));
  const blocked = !paymentConfirmed || order.status !== "processing" || !shipping || !allAliExpressLines.length || allAliExpressLines.some(line => !line.supplierUrl) || countryMismatch;
  return {
    orderId: order.id,
    state: !allAliExpressLines.length ? "not_eligible" : blocked ? "blocked" : "ready_for_human_review",
    reason: !paymentConfirmed ? "ORDER_NOT_PAID" : order.status !== "processing" ? "ORDER_NOT_PROCESSING" : !shipping ? "SHIPPING_ADDRESS_INCOMPLETE" : !allAliExpressLines.length ? "NO_ALIEXPRESS_LINES" : allAliExpressLines.some(line => !line.supplierUrl) ? "ALIEXPRESS_URL_MISSING" : countryMismatch ? "DELIVERY_COUNTRY_CHANGED" : null,
    paymentConfirmed,
    customerSaleTotalCents: order.totalAmount,
    shipping,
    lines: allAliExpressLines,
    nonAliExpressItemCount,
    warnings,
    paymentPolicy: "human_checkout_only",
  };
}
