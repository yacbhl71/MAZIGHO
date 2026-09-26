import { Download, FileDown, Loader2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const exportCards = [
  { kind: "catalogue" as const, title: "Catalogue", description: "Produits, catégories, statut, prix public et stock global.", detail: "Sans fournisseurs, coûts ni liens internes." },
  { kind: "stock" as const, title: "Stock", description: "Stock global, variantes, SKU interne et derniers changements.", detail: "Sans commandes, clients ni références fournisseur." },
  { kind: "orders" as const, title: "Commandes", description: "États opérationnels et lignes d’articles à préparer.", detail: "Sans client, adresse, suivi, paiement, taxe, prix ni fournisseur." },
] as const;

function downloadCsv(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export default function OwnerCsvExports() {
  const prepareExport = trpc.owner.prepareCsvExport.useMutation({
    onSuccess: exportFile => {
      downloadCsv(exportFile.fileName, exportFile.content);
      toast.success(`${exportFile.rowCount} ligne(s) préparée(s). Le téléchargement reste sur cet appareil.`);
    },
    onError: error => toast.error(error.message || "L’export n’a pas pu être préparé."),
  });

  return <div className="space-y-5">
    <Card className="border-teal-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileDown className="h-5 w-5 text-teal-700" /> Exports manuels de votre boutique</CardTitle>
        <CardDescription className="mt-1 max-w-3xl">Préparez un fichier CSV à la demande, exclusivement avec les données de votre boutique. Aucun fichier n’est stocké, publié ni envoyé par e-mail.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {exportCards.map(exportCard => <div key={exportCard.kind} className="flex min-h-64 flex-col rounded-xl border border-slate-200 bg-slate-50 p-5">
          <Download className="h-6 w-6 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-slate-950">{exportCard.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{exportCard.description}</p>
          <p className="mt-3 text-xs leading-5 text-slate-500">{exportCard.detail}</p>
          <Button className="mt-auto min-h-11 bg-teal-700 hover:bg-teal-800" disabled={prepareExport.isPending} onClick={() => prepareExport.mutate({ kind: exportCard.kind })}>{prepareExport.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Préparation…</> : <><Download className="mr-2 h-4 w-4" /> Télécharger le CSV</>}</Button>
        </div>)}
      </CardContent>
    </Card>
    <Card className="border-teal-100 bg-teal-50/50"><CardContent className="flex gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /><div className="text-sm leading-6 text-teal-950"><p className="font-semibold">Cadre de confidentialité</p><p className="mt-1">Ces exports sont limités à 2 000 produits ou 4 000 lignes opérationnelles par téléchargement. Les données clients, adresses, paiements, taxes, montants de commande, fournisseurs et secrets techniques sont volontairement exclus. Chaque préparation est inscrite dans le journal interne de la boutique.</p></div></CardContent></Card>
  </div>;
}
