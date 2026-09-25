/**
 * Persistence helpers for store-scoped editable system pages.
 *
 * Data lives in the existing `storeSettings` table (one JSON document per
 * page and per store). This module deliberately stays separate from the large
 * `db.ts` barrel so the feature can be reviewed — and reverted — in isolation.
 */
import { and, eq } from "drizzle-orm";
import { storeSettings } from "../drizzle/schema";
import { getDb } from "./db";
import {
  STORE_SYSTEM_PAGE_SETTING_KEYS,
  parseContactPageContent,
  parseFaqItems,
  parseTextPageContent,
  type StoreContactPageContent,
  type StoreFaqItem,
  type StoreSystemPageId,
  type StoreTextPageContent,
} from "../shared/storeSystemPages";

export type StoreSystemPagesContent = {
  faq: StoreFaqItem[];
  contact: StoreContactPageContent | null;
  returns: StoreTextPageContent | null;
  about: StoreTextPageContent | null;
};

async function readSetting(storeId: number, key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const rows = await db
    .select({ value: storeSettings.value })
    .from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);
  return rows[0]?.value ?? null;
}

/** Loads every editable system page for a store. Missing content stays empty/null. */
export async function getStoreSystemPages(storeId: number): Promise<StoreSystemPagesContent> {
  const [faqRaw, contactRaw, returnsRaw, aboutRaw] = await Promise.all([
    readSetting(storeId, STORE_SYSTEM_PAGE_SETTING_KEYS.faq),
    readSetting(storeId, STORE_SYSTEM_PAGE_SETTING_KEYS.contact),
    readSetting(storeId, STORE_SYSTEM_PAGE_SETTING_KEYS.returns),
    readSetting(storeId, STORE_SYSTEM_PAGE_SETTING_KEYS.about),
  ]);
  return {
    faq: parseFaqItems(faqRaw),
    contact: parseContactPageContent(contactRaw),
    returns: parseTextPageContent(returnsRaw),
    about: parseTextPageContent(aboutRaw),
  };
}

/**
 * Replaces one system page. Passing an empty payload (empty FAQ list or null
 * page content) removes the custom version so the storefront falls back to
 * the default copy.
 */
export async function upsertStoreSystemPage(
  storeId: number,
  pageId: StoreSystemPageId,
  payload: StoreFaqItem[] | StoreContactPageContent | StoreTextPageContent | null,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const key = STORE_SYSTEM_PAGE_SETTING_KEYS[pageId];
  const isEmptyFaq = pageId === "faq" && Array.isArray(payload) && payload.length === 0;
  if (payload === null || isEmptyFaq) {
    await db
      .delete(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)));
    return;
  }
  const value = JSON.stringify(payload);
  await db
    .insert(storeSettings)
    .values({ storeId, key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
