import * as db from "../db";
import { getCjAccessToken, prepareCjProductImport, quoteCjDelivery } from "../cjDropshipping";

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const CJ_REQUEST_TIMEOUT_MS = 12_000;
const USD_TO_CHF_ESTIMATE = 0.9;
const MIN_MARGIN_RATE = 0.1;

const COUNTRY_NAMES: Record<string, string> = {
  CH: "Switzerland",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  AT: "Austria",
  BE: "Belgium",
  NL: "Netherlands",
  ES: "Spain",
};

type ShippingAddress = {
  name: string;
  phone: string | null;
  email: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

type CjSupplierSnapshot = {
  provider: "CJdropshipping";
  supplierProductId: string;
  supplierVariantId: string;
  countryCode: string;
};

type PreparedLine = {
  itemId: number;
  productId: number;
  name: string;
  quantity: number;
  customerLineAmount: number;
  supplierProductId: string;
  variantId: string;
  variantSku: string | null;
  supplierUnitPriceUsd: number;
  logisticName: string;
  fromCountryCode: string;
  freightUsd: number;
  freightDelay: string | null;
  stockQuantity: number;
};

type CjCreateOrderData = {
  orderId?: string | number;
  orderNumber?: string;
  shipmentOrderId?: string | number;
  iossAmount?: string | number;
  iossTaxHandlingFee?: string | number;
  postageAmount?: string | number;
  productAmount?: string | number;
  actualPayment?: string | number;
  orderAmount?: string | number;
  orderStatus?: string;
  logisticsMiss?: boolean;
  interceptOrderReasons?: Array<{ code?: number; message?: string }>;
};

type CjCreateOrderResponse = {
  success?: boolean;
  result?: boolean;
  message?: string;
  code?: number;
  requestId?: string;
  data?: CjCreateOrderData | null;
};

function asNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toUsdCents(value: unknown): number | null {
  const amount = asNumber(value);
  return amount == null || amount < 0 ? null : Math.round(amount * 100);
}

function parseJsonObject(value: string | null): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value || "");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function parseShippingAddress(raw: string): ShippingAddress {
  const data = parseJsonObject(raw);
  const value = (name: string) => typeof data?.[name] === "string" ? data[name].trim() : "";
  const countryCode = value("countryCode").toUpperCase();
  const missing = [
    ["destinataire", value("name")],
    ["adresse", value("line1")],
    ["ville", value("city")],
    ["code postal", value("postalCode")],
    ["pays", countryCode],
  ].filter(([, content]) => !content).map(([label]) => label);
  if (missing.length || !/^[A-Z]{2}$/.test(countryCode) || !COUNTRY_NAMES[countryCode]) {
    throw new Error(`CJ_ADDRESS_INCOMPLETE:${missing.length ? missing.join(", ") : "pays de livraison non pris en charge"}`);
  }
  // CJ marks the province/state field as required. Stripe may not collect a
  // canton in every country, so the city is used as conservative fallback.
  const state = value("state") || value("city");
  return {
    name: value("name"),
    phone: value("phone") || null,
    email: value("email") || null,
    line1: value("line1"),
    line2: value("line2") || null,
    city: value("city"),
    state,
    postalCode: value("postalCode"),
    countryCode,
  };
}

function parseCjSupplierSnapshot(value: string | null): CjSupplierSnapshot {
  const data = parseJsonObject(value);
  const provider = typeof data?.provider === "string" ? data.provider : "";
  const supplierProductId = typeof data?.supplierProductId === "string" ? data.supplierProductId.trim() : "";
  const supplierVariantId = typeof data?.supplierVariantId === "string" ? data.supplierVariantId.trim() : "";
  const countryCode = typeof data?.countryCode === "string" ? data.countryCode.trim().toUpperCase() : "";
  if (provider !== "CJdropshipping" || !supplierProductId || !supplierVariantId || !/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error("CJ_MAPPING_INCOMPLETE");
  }
  return { provider: "CJdropshipping", supplierProductId, supplierVariantId, countryCode };
}

function assertNoUnmappedOptions(value: string | null) {
  const options = parseJsonObject(value);
  if (options && Object.keys(options).length > 0) throw new Error("CJ_VARIANT_OPTIONS_UNMAPPED");
}

async function preflightLine(item: db.CjSandboxPreparationInput["items"][number], expectedCountry: string): Promise<PreparedLine> {
  assertNoUnmappedOptions(item.selectedOptions);
  const snapshot = parseCjSupplierSnapshot(item.supplierSnapshot);
  if (snapshot.countryCode !== expectedCountry) throw new Error("CJ_DELIVERY_COUNTRY_CHANGED");

  // La fiche CJ peut dépendre du marché de destination. Utiliser le même
  // contexte que l’adresse finale évite de considérer à tort un produit
  // comme indisponible avant le calcul de livraison.
  const prepared = await prepareCjProductImport({
    productId: snapshot.supplierProductId,
    countryCode: expectedCountry,
  });
  const variant = prepared.variants.find(candidate => candidate.id === snapshot.supplierVariantId);
  if (!variant || !variant.supplierPriceUsd || variant.supplierPriceUsd <= 0) throw new Error("CJ_VARIANT_NOT_AVAILABLE");

  const quote = await quoteCjDelivery({
    productId: snapshot.supplierProductId,
    variantId: snapshot.supplierVariantId,
    countryCodes: [expectedCountry],
    quantity: item.quantity,
  });
  if (!quote.stock.checked || quote.stock.totalQuantity == null || quote.stock.totalQuantity < item.quantity) throw new Error("CJ_OUT_OF_STOCK");
  const option = quote.countries[0]?.options[0];
  if (!option || !option.logisticName || !option.fromCountryCode) throw new Error("CJ_DELIVERY_NOT_AVAILABLE");

  return {
    itemId: item.id,
    productId: item.productId,
    name: item.productNameSnapshot || `Produit MAZIGHO #${item.productId}`,
    quantity: item.quantity,
    customerLineAmount: item.priceAtPurchase * item.quantity,
    supplierProductId: snapshot.supplierProductId,
    variantId: snapshot.supplierVariantId,
    variantSku: variant.sku,
    supplierUnitPriceUsd: variant.supplierPriceUsd,
    logisticName: option.logisticName,
    fromCountryCode: option.fromCountryCode,
    freightUsd: option.costUsd,
    freightDelay: option.delay,
    stockQuantity: quote.stock.totalQuantity,
  };
}

function groupLinesByLogistics(lines: PreparedLine[]): PreparedLine[][] {
  const groups = new Map<string, PreparedLine[]>();
  for (const line of lines) {
    const key = `${line.logisticName}::${line.fromCountryCode}`;
    const group = groups.get(key) ?? [];
    group.push(line);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

async function createCjSandboxOrder(input: { orderId: number; externalReference: string; shipping: ShippingAddress; lines: PreparedLine[] }) {
  const access = await getCjAccessToken();
  const first = input.lines[0];
  const response = await fetch(`${CJ_API_BASE}/shopping/order/createOrderV2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": access.token,
    },
    body: JSON.stringify({
      orderNumber: input.externalReference,
      shippingZip: input.shipping.postalCode,
      shippingCountry: COUNTRY_NAMES[input.shipping.countryCode],
      shippingCountryCode: input.shipping.countryCode,
      shippingProvince: input.shipping.state,
      shippingCity: input.shipping.city,
      shippingCounty: "",
      shippingPhone: input.shipping.phone || "",
      shippingCustomerName: input.shipping.name,
      shippingAddress: input.shipping.line1,
      shippingAddress2: input.shipping.line2 || "",
      email: input.shipping.email || "",
      remark: `MAZIGHO sandbox order #${input.orderId}`,
      payType: 3,
      isSandbox: 1,
      logisticName: first.logisticName,
      fromCountryCode: first.fromCountryCode,
      platform: "Api",
      orderFlow: 1,
      products: input.lines.map(line => ({
        vid: line.variantId,
        sku: line.variantSku || undefined,
        quantity: line.quantity,
        storeLineItemId: String(line.itemId),
      })),
    }),
    signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
  });

  let payload: CjCreateOrderResponse | null = null;
  try {
    payload = await response.json() as CjCreateOrderResponse;
  } catch {
    throw new Error("CJ_INVALID_RESPONSE");
  }
  if (!response.ok || !(payload?.success || payload?.result) || !payload.data) {
    throw new Error(`CJ_ORDER_CREATE_FAILED:${payload?.code ?? "HTTP"}:${String(payload?.message || response.status).slice(0, 160)}`);
  }
  if (payload.data.logisticsMiss || (payload.data.interceptOrderReasons?.length ?? 0) > 0) {
    throw new Error("CJ_ORDER_INTERCEPTED");
  }
  return payload.data;
}

/**
 * Explicitly started by an order operator. This is intentionally limited to a
 * CJ sandbox order with payType=3. It does not debit a CJ balance, open a
 * payment URL, confirm a production order or update any customer-visible data.
 */
export async function prepareCjSandboxOrder(orderId: number) {
  const claim = await db.claimCjSandboxPreparation(orderId);
  if (!claim.claimed || !claim.input) {
    return { prepared: false, reason: claim.reason || "CJ_PREPARATION_NOT_AVAILABLE", supplierOrders: [] as Array<{ externalReference: string; providerOrderId: string | null }> };
  }

  try {
    const shipping = parseShippingAddress(claim.input.order.shippingAddress);
    const lines = await Promise.all(claim.input.items.map(item => preflightLine(item, shipping.countryCode)));
    const groups: PreparedLine[][] = groupLinesByLogistics(lines);
    const totalCustomerLines = lines.reduce((sum, line) => sum + line.customerLineAmount, 0);
    let allocatedCustomerAmount = 0;
    const records: db.CjSandboxSupplierOrderRecord[] = [];

    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      const groupCustomerGross = group.reduce((sum: number, line: PreparedLine) => sum + line.customerLineAmount, 0);
      const customerSaleAmount = index === groups.length - 1
        ? claim.input.order.totalAmount - allocatedCustomerAmount
        : Math.round(claim.input.order.totalAmount * groupCustomerGross / totalCustomerLines);
      allocatedCustomerAmount += customerSaleAmount;
      const externalReference = `MZGH-${orderId}-SBX-${index + 1}`;
      const response = await createCjSandboxOrder({ orderId, externalReference, shipping, lines: group });
      const expectedProductUsd = group.reduce((sum: number, line: PreparedLine) => sum + line.supplierUnitPriceUsd * line.quantity, 0);
      const expectedFreightUsd = group.reduce((sum: number, line: PreparedLine) => sum + line.freightUsd, 0);
      const supplierProductAmount = toUsdCents(response.productAmount) ?? Math.round(expectedProductUsd * 100);
      const supplierShippingAmount = toUsdCents(response.postageAmount) ?? Math.round(expectedFreightUsd * 100);
      const supplierTaxAmount = toUsdCents(response.iossAmount) ?? toUsdCents(response.iossTaxHandlingFee) ?? 0;
      const supplierTotalAmount = toUsdCents(response.actualPayment) ?? toUsdCents(response.orderAmount) ?? supplierProductAmount + supplierShippingAmount + supplierTaxAmount;
      const estimatedSupplierChf = Math.round(supplierTotalAmount * USD_TO_CHF_ESTIMATE);
      const marginRate = customerSaleAmount > 0 ? (customerSaleAmount - estimatedSupplierChf) / customerSaleAmount : -1;
      if (marginRate < MIN_MARGIN_RATE) throw new Error("CJ_MARGIN_BELOW_SAFETY_THRESHOLD");

      records.push({
        orderId,
        externalReference,
        providerOrderId: response.orderId == null ? null : String(response.orderId),
        providerOrderNumber: response.orderNumber ? String(response.orderNumber) : externalReference,
        providerShipmentOrderId: response.shipmentOrderId == null ? null : String(response.shipmentOrderId),
        supplierProductAmount,
        supplierShippingAmount,
        supplierTaxAmount,
        supplierTotalAmount,
        customerSaleAmount,
        quoteSnapshot: {
          mode: "sandbox",
          exchangeRateChf: USD_TO_CHF_ESTIMATE,
          expectedProductUsd,
          expectedFreightUsd,
          marginRate,
          logistics: { name: group[0].logisticName, fromCountryCode: group[0].fromCountryCode },
          lines: group.map((line: PreparedLine) => ({
            localOrderItemId: line.itemId,
            productId: line.productId,
            supplierProductId: line.supplierProductId,
            variantId: line.variantId,
            sku: line.variantSku,
            quantity: line.quantity,
            supplierUnitPriceUsd: line.supplierUnitPriceUsd,
            freightUsd: line.freightUsd,
            delay: line.freightDelay,
            stockQuantity: line.stockQuantity,
          })),
        },
        orderSnapshot: {
          mode: "sandbox",
          storeOrderId: orderId,
          supplierOrderStatus: response.orderStatus || null,
          logistics: { name: group[0].logisticName, fromCountryCode: group[0].fromCountryCode },
        },
      });
    }

    await db.completeCjSandboxPreparation(records);
    return {
      prepared: true,
      reason: null,
      supplierOrders: records.map(record => ({ externalReference: record.externalReference, providerOrderId: record.providerOrderId })),
    };
  } catch (error) {
    const code = error instanceof Error ? error.message : "CJ_PREPARATION_FAILED";
    await db.failCjSandboxPreparation(orderId, code);
    throw new Error(code);
  }
}

export function getCjFulfillmentSafetyStatus() {
  return {
    sandboxOnly: true,
    supplierPaymentEnabled: false,
    balanceDebitEnabled: false,
    description: "La préparation CJ est limitée au sandbox et à payType=3. Aucun paiement fournisseur ne peut être déclenché.",
  };
}
