import { describe, expect, it } from "vitest";
import { extractSupplierPreview, validateSupplierUrl } from "./dropshipping";

describe("dropshipping importer", () => {
  it("extrait les données JSON-LD et Open Graph", () => {
    const html = `
      <html><head>
        <title>Fallback title</title>
        <meta property="og:image" content="https://cdn.example.com/main.jpg" />
        <meta property="og:description" content="Description courte" />
        <script type="application/ld+json">
          {"@type":"Product","name":"Lampe berbère","description":"Description détaillée","image":["https://cdn.example.com/one.jpg"],"offers":{"price":"12.50","priceCurrency":"EUR"}}
        </script>
      </head></html>`;

    const result = extractSupplierPreview(html, "https://www.aliexpress.com/item/1005006066228784.html");
    expect(result.supplier).toBe("aliexpress");
    expect(result.supplierProductId).toBe("1005006066228784");
    expect(result.name).toBe("Lampe berbère");
    expect(result.sourcePriceCents).toBe(1250);
    expect(result.images).toHaveLength(2);
  });

  it("refuse les URL internes et les domaines non pris en charge", async () => {
    expect(() => validateSupplierUrl("http://127.0.0.1:3000/admin")).toThrow();
    const unsupportedUrl = "https://example.com/product/12345678";
    expect(validateSupplierUrl(unsupportedUrl)).toBe(unsupportedUrl);
    await expect(import("./dropshipping").then(({ previewSupplierProduct }) => previewSupplierProduct(unsupportedUrl))).rejects.toThrow();
  });
});
