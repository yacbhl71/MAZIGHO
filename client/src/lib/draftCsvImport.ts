export const DRAFT_CSV_IMPORT_HEADERS = [
  "SKU",
  "Nouveau_Titre_Epure",
  "Accroche_SEO",
  "Description_Detaillee",
] as const;

export type DraftCsvImportUpdate = {
  sku: string;
  name?: string;
  description?: string;
  longDescription?: string;
};

export type DraftCsvImportResult = {
  updates: DraftCsvImportUpdate[];
  ignoredEmptyRows: number;
};

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += character;
  }

  if (inQuotes) throw new Error("Le CSV contient un champ entre guillemets non fermé.");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function textCell(value: string | undefined): string | undefined {
  const cleaned = (value ?? "").trim();
  return cleaned || undefined;
}

export function parseDraftCsvImport(text: string): DraftCsvImportResult {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("Le fichier CSV est vide ou ne contient aucune ligne de produit.");

  const headers = rows[0].map(header => header.trim());
  const indexes = Object.fromEntries(DRAFT_CSV_IMPORT_HEADERS.map(header => [header, headers.indexOf(header)])) as Record<(typeof DRAFT_CSV_IMPORT_HEADERS)[number], number>;
  const missingHeaders = DRAFT_CSV_IMPORT_HEADERS.filter(header => indexes[header] === -1);
  if (missingHeaders.length > 0) {
    throw new Error(`Colonnes obligatoires absentes : ${missingHeaders.join(", ")}.`);
  }

  const seenSkus = new Set<string>();
  const updates: DraftCsvImportUpdate[] = [];
  let ignoredEmptyRows = 0;

  rows.slice(1).forEach((row, rowOffset) => {
    const line = rowOffset + 2;
    const sku = textCell(row[indexes.SKU]);
    const name = textCell(row[indexes.Nouveau_Titre_Epure]);
    const description = textCell(row[indexes.Accroche_SEO]);
    const longDescription = textCell(row[indexes.Description_Detaillee]);

    if (!sku && !name && !description && !longDescription) {
      ignoredEmptyRows += 1;
      return;
    }
    if (!sku) throw new Error(`Ligne ${line} : le SKU MAZIGHO est obligatoire.`);
    if (!/^MAZIGHO-[1-9]\d*$/.test(sku)) {
      throw new Error(`Ligne ${line} : « ${sku} » n’est pas un SKU MAZIGHO valide.`);
    }
    if (seenSkus.has(sku)) throw new Error(`Ligne ${line} : le SKU ${sku} apparaît plusieurs fois.`);
    seenSkus.add(sku);

    if (!name && !description && !longDescription) {
      ignoredEmptyRows += 1;
      return;
    }
    updates.push({ sku, name, description, longDescription });
  });

  if (updates.length === 0) {
    throw new Error("Aucune ligne ne contient de texte éditorial à importer.");
  }
  if (updates.length > 100) {
    throw new Error("L’import est limité à 100 brouillons à la fois. Divisez le fichier en plusieurs lots.");
  }
  return { updates, ignoredEmptyRows };
}
