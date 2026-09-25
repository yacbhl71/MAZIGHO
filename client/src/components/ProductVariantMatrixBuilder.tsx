import { useEffect, useMemo, useState } from "react";
import { Grid2x2Plus, Loader2, RotateCcw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductOption = { name: string; values: string[] };

type MatrixRow = {
  key: string;
  label: string;
  sku: string;
  stock: string;
  priceAdjustment: string;
  status: "active" | "inactive";
};

type VariantPayload = {
  label: string;
  sku: string | null;
  stock: number;
  priceAdjustmentCents: number;
  status: "active" | "inactive";
};

function normalizedLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
}

function skuPart(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
}

function buildRows(first: ProductOption, second: ProductOption, existingLabels: Set<string>, skuPrefix: string): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const firstValue of first.values) {
    for (const secondValue of second.values) {
      const label = `${first.name} : ${firstValue} · ${second.name} : ${secondValue}`;
      if (existingLabels.has(normalizedLabel(label))) continue;
      const skuParts = [skuPrefix.trim(), firstValue, secondValue].filter(Boolean).map(skuPart).filter(Boolean);
      rows.push({
        key: `${first.name}\u0000${firstValue}\u0000${second.name}\u0000${secondValue}`,
        label,
        sku: skuParts.join("-").slice(0, 100),
        stock: "0",
        priceAdjustment: "0",
        status: "active",
      });
    }
  }
  return rows;
}

export default function ProductVariantMatrixBuilder({
  options,
  existingLabels,
  currencyCode,
  pending,
  onCreate,
}: {
  options: ProductOption[];
  existingLabels: string[];
  currencyCode: string;
  pending: boolean;
  onCreate: (variants: VariantPayload[]) => Promise<{ created: number; skipped: number }>;
}) {
  const usableOptions = useMemo(() => options
    .map(option => ({ name: option.name.trim(), values: Array.from(new Set(option.values.map(value => value.trim()).filter(Boolean))).slice(0, 30) }))
    .filter(option => option.name && option.values.length), [options]);
  const [firstOptionName, setFirstOptionName] = useState("");
  const [secondOptionName, setSecondOptionName] = useState("");
  const [skuPrefix, setSkuPrefix] = useState("");
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const first = usableOptions[0]?.name || "";
    const second = usableOptions.find(option => option.name !== first)?.name || "";
    setFirstOptionName(current => usableOptions.some(option => option.name === current) ? current : first);
    setSecondOptionName(current => usableOptions.some(option => option.name === current && option.name !== first) ? current : second);
  }, [usableOptions]);

  const firstOption = usableOptions.find(option => option.name === firstOptionName);
  const secondOption = usableOptions.find(option => option.name === secondOptionName);
  const existing = useMemo(() => new Set(existingLabels.map(normalizedLabel)), [existingLabels]);
  const theoreticalCount = firstOption && secondOption && firstOption.name !== secondOption.name ? firstOption.values.length * secondOption.values.length : 0;

  const prepare = () => {
    setError("");
    setSuccess("");
    if (!firstOption || !secondOption || firstOption.name === secondOption.name) {
      setError("Choisissez deux choix différents, par exemple Couleur et Taille.");
      return;
    }
    if (theoreticalCount > 100) {
      setError(`Cette sélection créerait ${theoreticalCount} combinaisons. Réduisez les valeurs afin de rester sous 100 lignes.`);
      return;
    }
    const nextRows = buildRows(firstOption, secondOption, existing, skuPrefix);
    if (!nextRows.length) {
      setError("Toutes ces combinaisons existent déjà. Modifiez les choix ou gérez les lignes existantes ci-dessous.");
      return;
    }
    setRows(nextRows);
  };

  const updateRow = (key: string, patch: Partial<MatrixRow>) => {
    setRows(current => current.map(row => row.key === key ? { ...row, ...patch } : row));
  };

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!rows.length) return;
    const variants: VariantPayload[] = [];
    for (const row of rows) {
      const stock = Number(row.stock);
      const priceAdjustmentCents = Math.round(Number(row.priceAdjustment.replace(",", ".")) * 100);
      if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
        setError(`Stock invalide pour « ${row.label} ». Utilisez un entier entre 0 et 1 000 000.`);
        return;
      }
      if (!Number.isFinite(priceAdjustmentCents) || priceAdjustmentCents < -10_000_000 || priceAdjustmentCents > 10_000_000) {
        setError(`Ajustement de prix invalide pour « ${row.label} ».`);
        return;
      }
      variants.push({ label: row.label, sku: row.sku.trim() || null, stock, priceAdjustmentCents, status: row.status });
    }
    try {
      const result = await onCreate(variants);
      setRows([]);
      setSuccess(`${result.created} combinaison${result.created > 1 ? "s" : ""} créée${result.created > 1 ? "s" : ""}${result.skipped ? ` ; ${result.skipped} déjà existante${result.skipped > 1 ? "s" : ""} ignorée${result.skipped > 1 ? "s" : ""}` : ""}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La matrice n’a pas pu être créée.");
    }
  };

  if (usableOptions.length < 2) {
    return <section className="mt-4 rounded-xl border border-dashed border-violet-300 bg-violet-50/70 p-4 text-sm leading-6 text-violet-950"><p className="font-semibold">Matrice Couleur × Taille</p><p className="mt-1">Ajoutez d’abord au moins deux choix sur la fiche, par exemple <strong>Couleur</strong> et <strong>Taille</strong>. La matrice proposera ensuite une ligne de stock et de prix pour chaque combinaison.</p></section>;
  }

  return <section className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-violet-950"><Grid2x2Plus className="h-4 w-4" /> Générer une matrice de variantes</p><p className="mt-1 max-w-3xl text-xs leading-5 text-violet-900">Choisissez deux axes, puis ajustez le stock et le prix de chaque ligne avant création. Les combinaisons déjà présentes ne sont jamais écrasées.</p></div><Badge variant="outline" className="w-fit border-violet-200 bg-white text-violet-800">Maximum 100 lignes</Badge></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="space-y-1"><Label htmlFor="matrix-first-option">Premier choix</Label><select id="matrix-first-option" value={firstOptionName} onChange={event => { setFirstOptionName(event.target.value); setRows([]); setSuccess(""); }} className="h-10 w-full rounded-md border border-violet-200 bg-white px-3 text-sm">{usableOptions.map(option => <option key={option.name} value={option.name}>{option.name} ({option.values.length})</option>)}</select></div><div className="space-y-1"><Label htmlFor="matrix-second-option">Deuxième choix</Label><select id="matrix-second-option" value={secondOptionName} onChange={event => { setSecondOptionName(event.target.value); setRows([]); setSuccess(""); }} className="h-10 w-full rounded-md border border-violet-200 bg-white px-3 text-sm">{usableOptions.filter(option => option.name !== firstOptionName).map(option => <option key={option.name} value={option.name}>{option.name} ({option.values.length})</option>)}</select></div><div className="space-y-1"><Label htmlFor="matrix-sku-prefix">Préfixe référence (facultatif)</Label><Input id="matrix-sku-prefix" value={skuPrefix} maxLength={32} placeholder="Ex. ROBE" onChange={event => { setSkuPrefix(event.target.value); setRows([]); setSuccess(""); }} /></div></div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white/80 p-3"><p className="text-xs leading-5 text-violet-950">{firstOption && secondOption && firstOption.name !== secondOption.name ? `${firstOption.values.length} × ${secondOption.values.length} = ${theoreticalCount} combinaisons possibles.` : "Choisissez deux axes distincts."}</p><Button type="button" variant="outline" onClick={prepare} disabled={!firstOption || !secondOption || firstOption.name === secondOption.name || pending} className="min-h-10 border-violet-300 bg-white text-violet-950 hover:bg-violet-100"><Grid2x2Plus className="mr-2 h-4 w-4" /> Préparer la matrice</Button></div>
    {rows.length ? <div className="mt-4 overflow-hidden rounded-xl border border-violet-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-violet-100/70 text-left text-xs uppercase tracking-wide text-violet-950"><tr><th className="px-3 py-3 font-semibold">Combinaison</th><th className="px-3 py-3 font-semibold">Référence</th><th className="px-3 py-3 font-semibold">Stock</th><th className="px-3 py-3 font-semibold">Ajustement {currencyCode}</th><th className="px-3 py-3 font-semibold">Statut</th></tr></thead><tbody>{rows.map(row => <tr key={row.key} className="border-t border-violet-100"><td className="px-3 py-3 font-medium text-slate-950">{row.label}</td><td className="px-3 py-2"><Input value={row.sku} maxLength={100} onChange={event => updateRow(row.key, { sku: event.target.value })} placeholder="Facultatif" /></td><td className="px-3 py-2"><Input value={row.stock} type="number" inputMode="numeric" min="0" max="1000000" onChange={event => updateRow(row.key, { stock: event.target.value })} /></td><td className="px-3 py-2"><Input value={row.priceAdjustment} inputMode="decimal" onChange={event => updateRow(row.key, { priceAdjustment: event.target.value })} placeholder="0.00" /></td><td className="px-3 py-2"><select value={row.status} onChange={event => updateRow(row.key, { status: event.target.value as MatrixRow["status"] })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"><option value="active">Disponible</option><option value="inactive">Indisponible</option></select></td></tr>)}</tbody></table></div><div className="flex flex-col gap-3 border-t border-violet-200 bg-violet-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-violet-950">Le prix indiqué est un ajustement par rapport au prix de base. Saisissez <strong>0</strong> pour conserver le prix du produit.</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setRows([]); setError(""); }} disabled={pending}><RotateCcw className="mr-2 h-4 w-4" /> Annuler</Button><Button type="button" onClick={() => void submit()} disabled={pending} className="min-h-10 bg-violet-700 text-white hover:bg-violet-800">{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création…</> : <><Save className="mr-2 h-4 w-4" /> Créer {rows.length} ligne{rows.length > 1 ? "s" : ""}</>}</Button></div></div></div> : null}
    {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}{success ? <p className="mt-3 text-sm font-medium text-emerald-700">{success}</p> : null}
  </section>;
}
