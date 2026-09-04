import { describe, expect, it } from "vitest";
import { buildDraftCsv, DRAFT_CSV_HEADERS } from "../client/src/lib/draftCsvExport";

describe("draft CSV export", () => {
  it("writes the requested UTF-8 BOM headers and a draft row", () => {
    const csv = buildDraftCsv([{
      id: 42,
      name: "Imprimante \"poche\"",
      description: "Description CJ brute",
      price: 3290,
      supplierWeightG: 70,
    }]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(DRAFT_CSV_HEADERS.map(header => `\"${header}\"`).join(","));
    expect(csv).toContain("\"MAZIGHO-42\"");
    expect(csv).toContain("\"Imprimante \"\"poche\"\"\"");
    expect(csv).toContain("\"32.90\"");
    expect(csv).toContain("\"70\"");
  });

  it("keeps optimisation columns empty and neutralizes spreadsheet formulas", () => {
    const csv = buildDraftCsv([{ id: 7, name: "=FORMULE()", price: 0, supplierWeightG: null }]);
    const row = csv.split("\r\n")[1] || "";

    expect(row).toContain("\"'=FORMULE()\"");
    expect(row).toContain("\"\",\"\"");
    expect(row).toContain("\"0\"");
  });
});
