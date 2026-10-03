import { useEffect, useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProductOptionDraft = {
  name: string;
  values: string[];
};

function normalizeValues(raw: string) {
  return Array.from(new Set(raw
    .split(/[\n,;]+/)
    .map(value => value.trim())
    .filter(Boolean)))
    .slice(0, 30);
}

function parseOptionDrafts(value: string): ProductOptionDraft[] {
  try {
    const parsed = JSON.parse(value);
    const rows: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? Object.entries(parsed).map(([name, values]) => ({ name, values }))
        : [];
    return rows.flatMap((entry): ProductOptionDraft[] => {
      const row = entry && typeof entry === "object" ? entry as { name?: unknown; values?: unknown } : {};
      const name = typeof row.name === "string" ? row.name : "";
      const rawValues = Array.isArray(row.values) ? row.values.filter((item: unknown): item is string => typeof item === "string") : [];
      const values: string[] = rawValues.length
        ? Array.from(new Set(rawValues.map((item: string) => item.trim()).filter(Boolean))).slice(0, 30)
        : [];
      return name || values.length ? [{ name, values }] : [];
    }).slice(0, 4);
  } catch {
    return [];
  }
}

function serializeOptionDrafts(options: ProductOptionDraft[]) {
  const normalized = options
    .map(option => ({ name: option.name.trim().slice(0, 60), values: option.values.map(value => value.trim()).filter(Boolean).slice(0, 30) }))
    .filter(option => option.name || option.values.length);
  return normalized.length ? JSON.stringify(normalized) : "";
}

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function OwnerProductOptionsEditor({ value, onChange }: Props) {
  const [options, setOptions] = useState<ProductOptionDraft[]>(() => parseOptionDrafts(value));

  useEffect(() => {
    setOptions(parseOptionDrafts(value));
  }, [value]);

  const update = (next: ProductOptionDraft[]) => {
    const bounded = next.slice(0, 4);
    setOptions(bounded);
    onChange(serializeOptionDrafts(bounded));
  };

  return <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4" aria-label="Choix proposés pour le produit">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-violet-950"><Tags className="h-4 w-4 text-violet-700" /> Choix proposés au client</p>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-violet-900">Ajoutez simplement les choix visibles, par exemple Couleur, Taille ou Format. Après l’enregistrement, le bouton « Variantes » permet de définir le stock et le prix de chaque déclinaison.</p>
      </div>
      <Button type="button" size="sm" variant="outline" className="min-h-10 w-full shrink-0 border-violet-300 bg-white text-violet-950 hover:bg-violet-100 sm:w-auto" disabled={options.length >= 4} onClick={() => update([...options, { name: "", values: [] }])}><Plus className="mr-2 h-4 w-4" /> Ajouter un choix</Button>
    </div>

    {options.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-white/70 p-4 text-sm leading-6 text-slate-600">Aucun choix à proposer pour le moment. Utilisez ce bloc pour les tailles, couleurs, formats ou parfums.</div> : <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
      {options.map((option, index) => <div key={`${index}-${option.name}`} className="rounded-xl border border-violet-100 bg-white p-3">
        <div className="flex items-center justify-between gap-3"><Label htmlFor={`owner-option-name-${index}`} className="text-sm font-semibold text-slate-950">Choix {index + 1}</Label><Button type="button" size="sm" variant="ghost" className="min-h-9 px-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => update(options.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="mr-1 h-4 w-4" /> Retirer</Button></div>
        <div className="mt-3 space-y-3"><div className="space-y-1"><Label htmlFor={`owner-option-name-${index}`} className="text-xs text-slate-600">Nom</Label><Input id={`owner-option-name-${index}`} value={option.name} maxLength={60} placeholder="Ex. Couleur" onChange={event => update(options.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></div><div className="space-y-1"><Label htmlFor={`owner-option-values-${index}`} className="text-xs text-slate-600">Valeurs</Label><Textarea id={`owner-option-values-${index}`} rows={3} value={option.values.join("\n")} placeholder={"Ex. Sauge\nBleu\nIvoire"} onChange={event => update(options.map((item, itemIndex) => itemIndex === index ? { ...item, values: normalizeValues(event.target.value) } : item))} /><p className="text-xs leading-5 text-slate-500">Une valeur par ligne, ou séparées par une virgule.</p></div></div>
      </div>)}
    </div>}
  </section>;
}
