import { useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { buildStoreCatalogueImportCsv, parseStoreCatalogueImportCsv, type StoreCatalogueImportRow } from "@shared/storeCatalogueImport";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function downloadTemplate() {
  const csv = buildStoreCatalogueImportCsv([{
    category: "Exemple de catégorie",
    name: "Exemple de produit",
    shortDescription: "Une accroche courte.",
    longDescription: "Une description détaillée de votre produit.",
    priceCents: 3990,
    stock: 10,
    dimensions: ["S", "M", "L"],
    imageUrl: "https://exemple.com/image.webp",
    featured: false,
  }]);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "modele-catalogue-boutique.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function OwnerCatalogueCsvImporter({ onImported }: { onImported: () => void }) {
  const [rawCsv, setRawCsv] = useState("");
  const parsed = rawCsv ? parseStoreCatalogueImportCsv(rawCsv) : null;
  const importer = trpc.owner.importCatalogueProducts.useMutation({
    onSuccess: result => {
      toast.success(`${result.imported} fiche(s) ajoutée(s), ${result.updated} fiche(s) mise(s) à jour.`);
      setRawCsv("");
      onImported();
    },
    onError: error => toast.error(error.message || "L’import n’a pas pu être réalisé."),
  });
  const canImport = Boolean(parsed?.rows.length && !parsed.issues.length && !importer.isPending);

  return <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-violet-950">Importer plusieurs fiches</p><p className="mt-1 max-w-3xl text-sm leading-6 text-violet-900">Chargez un CSV contrôlé : une fiche par ligne avec catégorie, prix, stock, dimensions, image HTTPS et mise à la une. Les catégories absentes sont créées uniquement dans votre boutique. Une fiche portant le même nom est mise à jour, sans toucher aux autres boutiques.</p></div><Button type="button" variant="outline" onClick={downloadTemplate} className="min-h-11 border-violet-300 bg-white text-violet-950 hover:bg-violet-100"><Download className="mr-2 h-4 w-4" /> Modèle CSV</Button></div>
    <Label className="mt-4 inline-flex min-h-11 w-fit cursor-pointer items-center rounded-md border border-violet-300 bg-white px-3 text-sm font-medium text-violet-950 hover:bg-violet-100"><FileUp className="mr-2 h-4 w-4" /> Charger un CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) void file.text().then(setRawCsv); event.currentTarget.value = ""; }} /></Label>
    {parsed ? <div className="mt-4 rounded-xl border border-violet-200 bg-white/80 p-3 text-sm"><p className="font-semibold text-violet-950">{parsed.rows.length} fiche(s) détectée(s)</p>{parsed.issues.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-800">{parsed.issues.slice(0, 8).map(issue => <li key={`${issue.line}-${issue.message}`}>Ligne {issue.line} : {issue.message}</li>)}</ul> : <p className="mt-1 text-violet-900">Contrôle réussi. Vérifiez les chiffres avant de confirmer l’import.</p>}<div className="mt-3 flex justify-end"><Button type="button" disabled={!canImport} onClick={() => importer.mutate({ rows: parsed.rows as StoreCatalogueImportRow[], acknowledged: true })} className="min-h-11 bg-violet-700 text-white hover:bg-violet-800">{importer.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Import en cours…</> : <><FileUp className="mr-2 h-4 w-4" /> Importer {parsed.rows.length} fiche(s)</>}</Button></div></div> : null}
  </section>;
}
