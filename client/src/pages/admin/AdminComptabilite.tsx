import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, ReceiptText, ShieldCheck } from "lucide-react";

type Period = "month" | "quarter" | "year" | "custom";

const chf = (cents: number) => (cents / 100).toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const chfPlain = (cents: number) => (cents / 100).toFixed(2);

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  const v = String(value ?? "");
  return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function AdminComptabilite() {
  const utils = trpc.useUtils();
  const [period, setPeriod] = useState<Period>("month");
  const today = new Date();
  const [customFrom, setCustomFrom] = useState<string>(new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState<string>(today.toISOString().slice(0, 10));

  const range = useMemo(() => {
    const now = new Date();
    if (period === "month") return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    if (period === "quarter") { const q = Math.floor(now.getMonth() / 3); return { from: new Date(now.getFullYear(), q * 3, 1), to: new Date(now.getFullYear(), q * 3 + 3, 1) }; }
    if (period === "year") return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
    const from = customFrom ? new Date(`${customFrom}T00:00:00`) : new Date(now.getFullYear(), 0, 1);
    const to = customTo ? new Date(new Date(`${customTo}T00:00:00`).getTime() + 24 * 3600 * 1000) : new Date();
    return { from, to };
  }, [period, customFrom, customTo]);

  const reportQuery = trpc.admin.accounting.getVatReport.useQuery({ from: range.from, to: range.to });
  const vatConfigQuery = trpc.admin.accounting.getVatConfig.useQuery();

  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState("8.1");
  useEffect(() => {
    if (vatConfigQuery.data) {
      setVatEnabled(vatConfigQuery.data.enabled);
      setVatRate(String(vatConfigQuery.data.rate));
    }
  }, [vatConfigQuery.data]);

  const saveVat = trpc.admin.accounting.setVatConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration TVA enregistrée");
      utils.admin.accounting.getVatConfig.invalidate();
      utils.admin.accounting.getVatReport.invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer la configuration TVA"),
  });

  const report = reportQuery.data;
  const rows = report?.rows || [];
  const totals = report?.totals || { gross: 0, vat: 0, net: 0 };
  const vat = report?.vat || { enabled: false, rate: 8.1 };
  const threshold = report?.threshold;

  const periodLabel = period === "month" ? "mois-en-cours" : period === "quarter" ? "trimestre" : period === "year" ? "annee" : `${customFrom}_${customTo}`;

  const handleCsv = () => {
    const sep = ";";
    const header = ["Date commande", "Réf. transaction", "Montant Brut (CHF)", "Montant TVA (CHF)", "Montant Net (CHF)", "Pays de livraison"];
    const lines = [header.join(sep)];
    rows.forEach(r => lines.push([
      new Date(r.date).toLocaleDateString("fr-CH"),
      r.reference,
      chfPlain(r.gross),
      chfPlain(r.vatAmount),
      chfPlain(r.net),
      r.country,
    ].map(csvCell).join(sep)));
    lines.push(["TOTAL", "", chfPlain(totals.gross), chfPlain(totals.vat), chfPlain(totals.net), ""].map(csvCell).join(sep));
    if (!vat.enabled) lines.push([csvCell(report?.exemptionNote || "Exonéré de TVA selon l'art. 10 LTVA")].join(sep));
    triggerDownload(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }), `mazigho-comptabilite-${periodLabel}.csv`);
  };

  const handleExcel = () => {
    const head = ["Date commande", "Réf. transaction", "Montant Brut (CHF)", "Montant TVA (CHF)", "Montant Net (CHF)", "Pays de livraison"];
    const body = rows.map(r => `<tr><td>${new Date(r.date).toLocaleDateString("fr-CH")}</td><td>${r.reference}</td><td>${chfPlain(r.gross)}</td><td>${chfPlain(r.vatAmount)}</td><td>${chfPlain(r.net)}</td><td>${r.country}</td></tr>`).join("");
    const totalRow = `<tr style="font-weight:bold;background:#f1ebe4"><td>TOTAL</td><td></td><td>${chfPlain(totals.gross)}</td><td>${chfPlain(totals.vat)}</td><td>${chfPlain(totals.net)}</td><td></td></tr>`;
    const note = !vat.enabled ? `<p>${report?.exemptionNote || "Exonéré de TVA selon l'art. 10 LTVA"}</p>` : `<p>TVA appliquée : ${vat.rate}%</p>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><title>MAZIGHO Comptabilité</title></head><body><h3>MAZIGHO — Export comptable (${periodLabel})</h3><table border="1"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}${totalRow}</tbody></table>${note}</body></html>`;
    triggerDownload(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }), `mazigho-comptabilite-${periodLabel}.xls`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-comptabilite">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <FileSpreadsheet className="h-6 w-6 text-orange-500" /> Export comptable & TVA
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ventes encaissées (commandes payées), calcul de TVA et export CSV / Excel pour votre comptabilité suisse.
          </p>
        </div>

        {/* Seuil d'assujettissement 100'000 CHF */}
        <Card data-testid="threshold-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chiffre d'affaires {threshold?.year ?? new Date().getFullYear()} — seuil TVA (100'000 CHF)</CardTitle>
            <CardDescription>Suivi de votre CA annuel encaissé face au seuil d'assujettissement à la TVA suisse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-foreground" data-testid="ytd-sales">{chf(threshold?.ytdSales ?? 0)} CHF</span>
              <span className="text-sm text-muted-foreground">/ 100'000.00 CHF</span>
            </div>
            <Progress value={threshold?.percent ?? 0} className="h-3" data-testid="threshold-bar" />
            {threshold?.exceeded ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" data-testid="threshold-alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Seuil de 100'000 CHF dépassé : vous êtes probablement assujetti à la TVA. Consultez votre fiduciaire.</span>
              </div>
            ) : threshold?.alert ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" data-testid="threshold-alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Attention, vous approchez du seuil d'assujettissement à la TVA suisse ({chf(threshold.ytdSales)} / 100'000 CHF).</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Vous êtes en dessous du seuil. Aucune TVA obligatoire pour l'instant.</p>
            )}
          </CardContent>
        </Card>

        {/* Configuration TVA */}
        <Card data-testid="vat-config-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-slate-500" /> Régime de TVA</CardTitle>
            <CardDescription>Par défaut : franchise (taux 0 %, « Exonéré de TVA selon l'art. 10 LTVA », Brut = Net).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} data-testid="vat-toggle" id="vat-enabled" />
                <Label htmlFor="vat-enabled" className="cursor-pointer">
                  {vatEnabled ? "TVA activée" : "TVA désactivée (franchise)"}
                </Label>
              </div>
              <div className="flex items-end gap-3">
                <div className="w-36">
                  <Label htmlFor="vat-rate" className="text-xs text-muted-foreground">Taux normal CH (%)</Label>
                  <Input id="vat-rate" type="number" step="0.1" min="0" max="30" value={vatRate} onChange={e => setVatRate(e.target.value)} disabled={!vatEnabled} data-testid="vat-rate-input" />
                </div>
                <Button
                  onClick={() => saveVat.mutate({ enabled: vatEnabled, rate: Number(vatRate) || 0 })}
                  disabled={saveVat.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  data-testid="vat-save-btn"
                >
                  {saveVat.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </div>
            </div>
            {!vat.enabled && (
              <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">{report?.exemptionNote || "Exonéré de TVA selon l'art. 10 LTVA"}</p>
            )}
          </CardContent>
        </Card>

        {/* Filtres + export */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="h-4 w-4 text-slate-500" /> Ventes encaissées</CardTitle>
            <CardDescription>Filtrez par période et exportez pour votre comptabilité.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-48">
                  <Label className="text-xs text-muted-foreground">Période</Label>
                  <Select value={period} onValueChange={v => setPeriod(v as Period)}>
                    <SelectTrigger data-testid="period-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mois en cours</SelectItem>
                      <SelectItem value="quarter">Trimestre en cours</SelectItem>
                      <SelectItem value="year">Année civile</SelectItem>
                      <SelectItem value="custom">Plage personnalisée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {period === "custom" && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Du</Label>
                      <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} data-testid="custom-from" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Au</Label>
                      <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} data-testid="custom-to" />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCsv} disabled={rows.length === 0} data-testid="export-csv-btn">
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" onClick={handleExcel} disabled={rows.length === 0} data-testid="export-excel-btn">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                </Button>
              </div>
            </div>

            {reportQuery.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border" data-testid="vat-report-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Réf. transaction</TableHead>
                      <TableHead className="text-right">Brut (CHF)</TableHead>
                      <TableHead className="text-right">TVA (CHF)</TableHead>
                      <TableHead className="text-right">Net (CHF)</TableHead>
                      <TableHead>Pays</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          Aucune vente encaissée sur cette période.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {rows.map(r => (
                          <TableRow key={r.id} data-testid={`vat-row-${r.id}`}>
                            <TableCell>{new Date(r.date).toLocaleDateString("fr-CH")}</TableCell>
                            <TableCell className="max-w-[220px] truncate font-mono text-xs" title={r.reference}>{r.reference}</TableCell>
                            <TableCell className="text-right">{chf(r.gross)}</TableCell>
                            <TableCell className="text-right">{chf(r.vatAmount)}</TableCell>
                            <TableCell className="text-right">{chf(r.net)}</TableCell>
                            <TableCell><Badge variant="outline">{r.country}</Badge></TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50 font-semibold">
                          <TableCell colSpan={2}>TOTAL ({rows.length})</TableCell>
                          <TableCell className="text-right" data-testid="total-gross">{chf(totals.gross)}</TableCell>
                          <TableCell className="text-right" data-testid="total-vat">{chf(totals.vat)}</TableCell>
                          <TableCell className="text-right" data-testid="total-net">{chf(totals.net)}</TableCell>
                          <TableCell />
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
