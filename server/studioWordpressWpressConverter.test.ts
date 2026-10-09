import { strToU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { convertStudioWordpressBackup, STUDIO_WORDPRESS_CONVERSION_LIMITS, StudioWordpressConversionError } from "../client/src/lib/studioWordpressWpressConverter";

const encoder = new TextEncoder();

function bytes(...parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.byteLength; }
  return output;
}

function wpressEntry(path: string, content: string) {
  const normalized = path.replace(/^\.\//, "");
  const segments = normalized.split("/");
  const name = segments.pop() || "";
  const prefix = segments.join("/") || ".";
  const body = strToU8(content);
  const header = new Uint8Array(4377);
  header.set(encoder.encode(name), 0);
  header.set(encoder.encode(String(body.byteLength)), 255);
  header.set(encoder.encode(prefix), 281);
  return bytes(header, body);
}

function wpressTerminalFooter(payloadBytes: number) {
  const footer = new Uint8Array(4377);
  footer.set(encoder.encode(String(payloadBytes)), 255);
  footer.set(encoder.encode("checksum"), 4369);
  return footer;
}

function asUpload(name: string, content: Uint8Array) {
  const blob = new Blob([content.buffer as ArrayBuffer]);
  return {
    name,
    size: blob.size,
    arrayBuffer: () => blob.arrayBuffer(),
    slice: (start?: number, end?: number) => blob.slice(start, end),
  };
}

function wordpressSql() {
  const post = ["1", "", "", "", "<p>Une description sûre.</p>", "Affiche test", "Courte description", "publish", "", "", "", "", "", "", "", "", "", "", "", "", "product", "", ""].map(value => `'${value}'`).join(",");
  return [
    `INSERT INTO wp_posts VALUES (${post});`,
    "INSERT INTO wp_postmeta VALUES ('1','1','_price','24.50'),('2','1','_stock','3'),('3','1','_featured','yes');",
  ].join("\n");
}

describe("Studio WordPress WPRESS converter", () => {
  it("converts a local WordPress backup into a controlled MAZIGHO archive", async () => {
    const backup = bytes(wpressEntry("database.sql", wordpressSql()));
    const converted = await convertStudioWordpressBackup(asUpload("catalogue.wpress", backup), "DZD");
    const archive = unzipSync(new Uint8Array(await converted.archive.arrayBuffer()));
    const catalogue = new TextDecoder().decode(archive["catalogue.csv"]);
    const manifest = new TextDecoder().decode(archive["manifest.json"]);

    expect(converted).toMatchObject({ productCount: 1, imageCount: 0, excludedImageCount: 0, sourceKind: "WooCommerce", currency: "DZD" });
    expect(converted.archiveBytes).toBeLessThanOrEqual(STUDIO_WORDPRESS_CONVERSION_LIMITS.maxOutputArchiveBytes);
    expect(converted.archiveName).toBe("catalogue-mazigho-import.zip");
    expect(catalogue).toContain("Affiche test");
    expect(catalogue).not.toContain("password");
    expect(manifest).toContain('"rightsConfirmed": false');
    expect(Object.keys(archive)).toEqual(expect.arrayContaining(["catalogue.csv", "manifest.json", "marque/wordpress-conversion-report.json"]));
  });

  it("accepts the All-in-One WP Migration terminal metadata footer", async () => {
    const payload = wpressEntry("database.sql", wordpressSql());
    const backup = bytes(payload, wpressTerminalFooter(payload.byteLength));

    const converted = await convertStudioWordpressBackup(asUpload("catalogue.wpress", backup));

    expect(converted).toMatchObject({ productCount: 1, sourceKind: "WooCommerce" });
  });

  it("refuses a WordPress backup containing unsafe traversal paths", async () => {
    const backup = bytes(wpressEntry("../database.sql", wordpressSql()));
    await expect(convertStudioWordpressBackup(asUpload("unsafe.wpress", backup))).rejects.toBeInstanceOf(StudioWordpressConversionError);
  });
});
