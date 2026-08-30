/**
 * Odoo integration (JSON-RPC).
 *
 * Synchronises paid customer orders and their customer record towards an Odoo
 * instance. The integration is optional: when the ODOO_* environment variables
 * are not configured, every function degrades gracefully (no-op) so the Stripe
 * webhook and the rest of the app keep working.
 *
 * Reference: https://www.odoo.com/documentation/17.0/developer/reference/external_api.html
 */

const ODOO_REQUEST_TIMEOUT_MS = 15_000;

type OdooConfig = {
  url: string;
  db: string;
  username: string;
  secret: string; // password or API key
};

export type OdooStatus = {
  configured: boolean;
  provider: "Odoo";
  url: string | null;
  db: string | null;
  message: string;
};

export type OdooOrderLine = {
  name: string;
  quantity: number;
  /** Unit price expressed in the store currency (e.g. CHF), not in cents. */
  priceUnit: number;
  /** Stable mapping key -> Odoo product default_code (e.g. "MAZIGHO-42"). */
  reference?: string | null;
};

export type OdooCustomer = {
  name: string;
  email: string | null;
};

export type OdooSyncResult = {
  synced: boolean;
  skipped: boolean;
  partnerId?: number;
  saleOrderId?: number;
  reason?: string;
};

function readOdooConfig(): OdooConfig | null {
  const url = process.env.ODOO_URL?.trim().replace(/\/+$/, "");
  const db = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  const secret = (process.env.ODOO_API_KEY?.trim() || process.env.ODOO_PASSWORD?.trim()) ?? "";
  if (!url || !db || !username || !secret) return null;
  return { url, db, username, secret };
}

export function isOdooConfigured(): boolean {
  return readOdooConfig() !== null;
}

export function getOdooStatus(): OdooStatus {
  const config = readOdooConfig();
  return {
    configured: Boolean(config),
    provider: "Odoo",
    url: config?.url ?? null,
    db: config?.db ?? null,
    message: config
      ? "Odoo est configuré. Les commandes payées sont synchronisées automatiquement."
      : "Odoo n'est pas configuré. Ajoutez ODOO_URL, ODOO_DB, ODOO_USERNAME et ODOO_API_KEY (ou ODOO_PASSWORD) dans Vercel.",
  };
}

async function odooJsonRpc<T>(url: string, params: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${url}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: Date.now() }),
      signal: AbortSignal.timeout(ODOO_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error("ODOO_UNREACHABLE");
  }

  let payload: { result?: T; error?: { data?: { message?: string }; message?: string } } | null = null;
  try {
    payload = await response.json();
  } catch {
    throw new Error("ODOO_INVALID_RESPONSE");
  }

  if (!response.ok || payload?.error) {
    const detail = payload?.error?.data?.message || payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`ODOO_RPC_ERROR: ${detail}`);
  }
  return payload!.result as T;
}

let uidCache: { config: string; uid: number; cachedAt: number } | null = null;

async function authenticate(config: OdooConfig): Promise<number> {
  const cacheKey = `${config.url}|${config.db}|${config.username}`;
  if (uidCache && uidCache.config === cacheKey && Date.now() - uidCache.cachedAt < 30 * 60 * 1000) {
    return uidCache.uid;
  }
  const uid = await odooJsonRpc<number | false>(config.url, {
    service: "common",
    method: "authenticate",
    args: [config.db, config.username, config.secret, {}],
  });
  if (!uid || typeof uid !== "number") throw new Error("ODOO_AUTHENTICATION_FAILED");
  uidCache = { config: cacheKey, uid, cachedAt: Date.now() };
  return uid;
}

async function executeKw<T>(
  config: OdooConfig,
  uid: number,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  return odooJsonRpc<T>(config.url, {
    service: "object",
    method: "execute_kw",
    args: [config.db, uid, config.secret, model, method, args, kwargs],
  });
}

/** Verifies the Odoo credentials without exposing them to the browser. */
export async function verifyOdooConnection(): Promise<OdooStatus & { verified: boolean }> {
  const config = readOdooConfig();
  if (!config) return { ...getOdooStatus(), verified: false };
  try {
    await authenticate(config);
    return { ...getOdooStatus(), verified: true, message: "Connexion Odoo vérifiée." };
  } catch (error) {
    return { ...getOdooStatus(), verified: false, message: `La connexion Odoo a échoué : ${error instanceof Error ? error.message : "inconnue"}.` };
  }
}

async function findOrCreatePartner(config: OdooConfig, uid: number, customer: OdooCustomer): Promise<number> {
  if (customer.email) {
    const existing = await executeKw<number[]>(config, uid, "res.partner", "search", [[["email", "=", customer.email]]], { limit: 1 });
    if (existing.length > 0) return existing[0];
  }
  return executeKw<number>(config, uid, "res.partner", "create", [{
    name: customer.name || customer.email || "Client MAZIGHO",
    email: customer.email || false,
    customer_rank: 1,
    comment: "Client créé automatiquement depuis la boutique MAZIGHO.",
  }]);
}

/**
 * Maps a MAZIGHO order line to an Odoo product.product id. Reuses an existing
 * product matched on default_code (stable "MAZIGHO-<id>" reference) or exact
 * name, otherwise creates a saleable consumable product. Returns null on error
 * so the caller can fall back to ODOO_DEFAULT_PRODUCT_ID or the note summary.
 */
async function findOrCreateProduct(
  config: OdooConfig,
  uid: number,
  line: OdooOrderLine,
): Promise<number | null> {
  try {
    if (line.reference) {
      const byCode = await executeKw<number[]>(config, uid, "product.product", "search", [[["default_code", "=", line.reference]]], { limit: 1 });
      if (byCode.length > 0) return byCode[0];
    }
    const byName = await executeKw<number[]>(config, uid, "product.product", "search", [[["name", "=", line.name]]], { limit: 1 });
    if (byName.length > 0) return byName[0];
    return await executeKw<number>(config, uid, "product.product", "create", [{
      name: line.name,
      default_code: line.reference || false,
      list_price: line.priceUnit,
      type: "consu",
      sale_ok: true,
    }]);
  } catch {
    return null;
  }
}

/**
 * Synchronises a paid order and its customer to Odoo as a confirmed sale order.
 * Never throws to the caller: failures are reported in the returned result so
 * the Stripe webhook stays resilient.
 */
export async function syncOrderToOdoo(input: {
  orderReference: string;
  customer: OdooCustomer;
  lines: OdooOrderLine[];
  currency?: string;
  note?: string;
}): Promise<OdooSyncResult> {
  const config = readOdooConfig();
  if (!config) return { synced: false, skipped: true, reason: "ODOO_NOT_CONFIGURED" };

  try {
    const uid = await authenticate(config);
    const partnerId = await findOrCreatePartner(config, uid, input.customer);

    const summary = input.lines
      .map(line => `- ${line.quantity} x ${line.name} @ ${line.priceUnit.toFixed(2)} ${input.currency || "CHF"}`)
      .join("\n");
    const note = [`Commande boutique MAZIGHO ${input.orderReference}`, input.note, summary]
      .filter(Boolean)
      .join("\n");

    const saleOrderPayload: Record<string, unknown> = {
      partner_id: partnerId,
      client_order_ref: input.orderReference,
      note,
    };

    // Map each line to a real Odoo product so the sale order carries priced
    // lines. If a line cannot be mapped, fall back to ODOO_DEFAULT_PRODUCT_ID;
    // the itemised note above keeps the order readable in every case.
    const defaultProductId = Number.parseInt(process.env.ODOO_DEFAULT_PRODUCT_ID ?? "", 10);
    const fallbackProductId = Number.isInteger(defaultProductId) && defaultProductId > 0 ? defaultProductId : null;
    const orderLines: Array<[number, number, Record<string, unknown>]> = [];
    for (const line of input.lines) {
      const productId = (await findOrCreateProduct(config, uid, line)) ?? fallbackProductId;
      if (!productId) continue;
      orderLines.push([0, 0, {
        product_id: productId,
        name: line.name,
        product_uom_qty: line.quantity,
        price_unit: line.priceUnit,
      }]);
    }
    if (orderLines.length > 0) {
      saleOrderPayload.order_line = orderLines;
    }

    const saleOrderId = await executeKw<number>(config, uid, "sale.order", "create", [saleOrderPayload]);
    return { synced: true, skipped: false, partnerId, saleOrderId };
  } catch (error) {
    return { synced: false, skipped: false, reason: error instanceof Error ? error.message : "ODOO_UNKNOWN_ERROR" };
  }
}

// ---- Admin "Suivi Odoo" panel: read + CRUD helpers (admin-only at the router) ----
export type OdooPartnerRow = { id: number; name: string; email: string | false; phone: string | false; city: string | false; };
export type OdooOrderRow = { id: number; name: string; partner_id: [number, string] | false; amount_total: number; state: string; client_order_ref: string | false; date_order: string | false; };

export async function listOdooPartners(limit = 60): Promise<{ configured: boolean; partners: OdooPartnerRow[] }> {
  const config = readOdooConfig();
  if (!config) return { configured: false, partners: [] };
  const uid = await authenticate(config);
  const partners = await executeKw<OdooPartnerRow[]>(config, uid, "res.partner", "search_read", [[["customer_rank", ">", 0]]], { fields: ["id", "name", "email", "phone", "city"], limit, order: "id desc" });
  return { configured: true, partners };
}

export async function listOdooSaleOrders(limit = 60): Promise<{ configured: boolean; orders: OdooOrderRow[] }> {
  const config = readOdooConfig();
  if (!config) return { configured: false, orders: [] };
  const uid = await authenticate(config);
  const orders = await executeKw<OdooOrderRow[]>(config, uid, "sale.order", "search_read", [[]], { fields: ["id", "name", "partner_id", "amount_total", "state", "client_order_ref", "date_order"], limit, order: "id desc" });
  return { configured: true, orders };
}

export async function createOdooPartner(input: { name: string; email?: string; phone?: string }): Promise<{ id: number }> {
  const config = readOdooConfig();
  if (!config) throw new Error("ODOO_NOT_CONFIGURED");
  const uid = await authenticate(config);
  const id = await executeKw<number>(config, uid, "res.partner", "create", [{ name: input.name, email: input.email || false, phone: input.phone || false, customer_rank: 1 }]);
  return { id };
}

export async function updateOdooPartner(id: number, patch: { name?: string; email?: string; phone?: string }): Promise<{ success: boolean }> {
  const config = readOdooConfig();
  if (!config) throw new Error("ODOO_NOT_CONFIGURED");
  const uid = await authenticate(config);
  const values: Record<string, unknown> = {};
  if (patch.name !== undefined) values.name = patch.name;
  if (patch.email !== undefined) values.email = patch.email || false;
  if (patch.phone !== undefined) values.phone = patch.phone || false;
  await executeKw(config, uid, "res.partner", "write", [[id], values]);
  return { success: true };
}

export async function cancelOdooSaleOrder(id: number): Promise<{ success: boolean }> {
  const config = readOdooConfig();
  if (!config) throw new Error("ODOO_NOT_CONFIGURED");
  const uid = await authenticate(config);
  await executeKw(config, uid, "sale.order", "action_cancel", [[id]]);
  return { success: true };
}
