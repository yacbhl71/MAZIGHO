import { useMemo, useState } from "react";
import { Check, ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export type CatalogueFilterProduct = {
  id: number;
  categoryId: number;
  categoryIds?: Array<number | string>;
  price: number;
  stock: number;
  options?: unknown;
};

type Facet = { key: string; label: string; values: Array<{ value: string; count: number }> };

function parseOptions(value: unknown): Record<string, string[]> {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { return {}; }
  }
  if (!source || typeof source !== "object") return {};
  const result: Record<string, string[]> = {};
  const add = (key: unknown, raw: unknown) => {
    if (typeof key !== "string" || !key.trim()) return;
    const values = Array.isArray(raw) ? raw : [raw];
    const normalized = values.flatMap(item => typeof item === "string" || typeof item === "number" ? [String(item).trim()] : []).filter(Boolean);
    if (normalized.length) result[key.trim().slice(0, 40)] = Array.from(new Set([...(result[key.trim().slice(0, 40)] ?? []), ...normalized]));
  };
  if (Array.isArray(source)) {
    source.forEach(item => {
      if (!item || typeof item !== "object") return;
      const row = item as Record<string, unknown>;
      add(row.name ?? row.label ?? row.key, row.values ?? row.value ?? row.options);
    });
  } else {
    Object.entries(source as Record<string, unknown>).forEach(([key, raw]) => {
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const nested = raw as Record<string, unknown>;
        add(key, nested.values ?? nested.value ?? nested.options);
      } else add(key, raw);
    });
  }
  return result;
}

function displayFacetLabel(key: string) {
  const normalized = key.toLowerCase();
  if (["size", "taille", "dimension", "dimensions"].includes(normalized)) return "Taille";
  if (["color", "colour", "couleur"].includes(normalized)) return "Couleur";
  if (["theme", "thème", "style"].includes(normalized)) return "Thème";
  if (["type", "product_type", "type de produit"].includes(normalized)) return "Type";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function productMatchesCatalogueFilters(product: CatalogueFilterProduct, filters: { categoryId: string; availableOnly: boolean; priceRange: [number, number]; selectedOptions: Record<string, string[]> }) {
  if (filters.categoryId !== "all" && String(product.categoryId) !== filters.categoryId && !product.categoryIds?.map(String).includes(filters.categoryId)) return false;
  if (filters.availableOnly && product.stock <= 0) return false;
  if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;
  const options = parseOptions(product.options);
  return Object.entries(filters.selectedOptions).every(([key, selected]) => !selected.length || selected.some(value => options[key]?.includes(value)));
}

export default function StorefrontCatalogueFilters({
  products,
  categories,
  categoryLabel,
  allCategoriesLabel,
  sortLabel,
  sortOptions,
  value,
  onChange,
  formatPrice,
  primaryColor,
  hideCategory = false,
}: {
  products: CatalogueFilterProduct[];
  categories: Array<{ id: number; name: string }>;
  categoryLabel: string;
  allCategoriesLabel: string;
  sortLabel: string;
  sortOptions: Array<{ value: "featured" | "newest" | "price-asc" | "price-desc"; label: string }>;
  value: { categoryId: string; availableOnly: boolean; priceRange: [number, number]; selectedOptions: Record<string, string[]>; sortBy: "featured" | "newest" | "price-asc" | "price-desc" };
  onChange: (value: { categoryId: string; availableOnly: boolean; priceRange: [number, number]; selectedOptions: Record<string, string[]>; sortBy: "featured" | "newest" | "price-asc" | "price-desc" }) => void;
  formatPrice: (cents: number) => string;
  primaryColor: string;
  /** Category pages already have a fixed scope but keep the other useful facets. */
  hideCategory?: boolean;
}) {
  const bounds = useMemo<[number, number]>(() => {
    if (!products.length) return [0, 0];
    const prices = products.map(product => product.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);
  const facets = useMemo<Facet[]>(() => {
    const counts = new Map<string, Map<string, number>>();
    products.forEach(product => Object.entries(parseOptions(product.options)).forEach(([key, values]) => values.forEach(option => {
      const entries = counts.get(key) ?? new Map<string, number>();
      entries.set(option, (entries.get(option) ?? 0) + 1);
      counts.set(key, entries);
    })));
    return Array.from(counts.entries())
      .map(([key, values]) => ({ key, label: displayFacetLabel(key), values: Array.from(values.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value, "fr")) }))
      .filter(facet => facet.values.length > 1)
      .sort((a, b) => a.label.localeCompare(b.label, "fr"))
      .slice(0, 4);
  }, [products]);
  const [draftRange, setDraftRange] = useState<[number, number]>(value.priceRange);
  const activeCount = (!hideCategory && value.categoryId !== "all" ? 1 : 0) + (value.availableOnly ? 1 : 0) + Object.values(value.selectedOptions).filter(values => values.length).length + (value.priceRange[0] !== bounds[0] || value.priceRange[1] !== bounds[1] ? 1 : 0);
  const update = (patch: Partial<typeof value>) => onChange({ ...value, ...patch });
  const reset = () => { setDraftRange(bounds); onChange({ categoryId: hideCategory ? value.categoryId : "all", availableOnly: false, priceRange: bounds, selectedOptions: {}, sortBy: "featured" }); };
  const toggleFacet = (key: string, selected: string[], option: string) => update({ selectedOptions: { ...value.selectedOptions, [key]: selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option] } });

  return <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4" data-testid="shop-controls">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><SlidersHorizontal className="h-4 w-4" style={{ color: primaryColor }} /> Affiner</div>
        {!hideCategory && <Popover><PopoverTrigger asChild><Button variant="outline" className="min-h-11 rounded-xl border-slate-200 bg-white px-3 font-semibold text-slate-800 hover:bg-slate-50"><span>{categoryLabel}</span>{value.categoryId !== "all" && <span className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] text-white" style={{ backgroundColor: primaryColor }}>1</span>}<ChevronDown className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[min(23rem,calc(100vw-2rem))] rounded-2xl p-3"><p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-500">{categoryLabel}</p><div className="max-h-64 space-y-1 overflow-auto">{[{ id: "all", name: allCategoriesLabel }, ...categories.map(category => ({ id: String(category.id), name: category.name }))].map(category => <button key={category.id} type="button" onClick={() => update({ categoryId: category.id })} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50", value.categoryId === category.id && "bg-slate-50 font-semibold")}><span>{category.name}</span>{value.categoryId === category.id && <Check className="h-4 w-4" style={{ color: primaryColor }} />}</button>)}</div></PopoverContent></Popover>}
        <Popover><PopoverTrigger asChild><Button variant="outline" className="min-h-11 rounded-xl border-slate-200 bg-white px-3 font-semibold text-slate-800 hover:bg-slate-50"><span>Prix</span>{(value.priceRange[0] !== bounds[0] || value.priceRange[1] !== bounds[1]) && <span className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] text-white" style={{ backgroundColor: primaryColor }}>1</span>}<ChevronDown className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[min(25rem,calc(100vw-2rem))] rounded-2xl p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fourchette de prix</p><button type="button" onClick={() => { setDraftRange(bounds); update({ priceRange: bounds }); }} className="text-xs font-semibold hover:underline" style={{ color: primaryColor }}>Réinitialiser</button></div><div className="mt-4 grid grid-cols-2 gap-3"><Input inputMode="decimal" value={(draftRange[0] / 100).toFixed(2)} onChange={event => { const cents = Math.max(bounds[0], Math.min(draftRange[1], Math.round(Number(event.target.value.replace(",", ".")) * 100) || 0)); setDraftRange([cents, draftRange[1]]); }} onBlur={() => update({ priceRange: draftRange })} aria-label="Prix minimum" /><Input inputMode="decimal" value={(draftRange[1] / 100).toFixed(2)} onChange={event => { const cents = Math.min(bounds[1], Math.max(draftRange[0], Math.round(Number(event.target.value.replace(",", ".")) * 100) || 0)); setDraftRange([draftRange[0], cents]); }} onBlur={() => update({ priceRange: draftRange })} aria-label="Prix maximum" /></div><Slider className="mt-6" min={bounds[0]} max={Math.max(bounds[1], bounds[0] + 1)} step={100} value={draftRange} onValueChange={values => setDraftRange([values[0] ?? bounds[0], values[1] ?? bounds[1]])} onValueCommit={values => { const range: [number, number] = [values[0] ?? bounds[0], values[1] ?? bounds[1]]; setDraftRange(range); update({ priceRange: range }); }} /><div className="mt-3 flex justify-between text-xs text-slate-500"><span>{formatPrice(draftRange[0])}</span><span>{formatPrice(draftRange[1])}</span></div></PopoverContent></Popover>
        <Popover><PopoverTrigger asChild><Button variant="outline" className="min-h-11 rounded-xl border-slate-200 bg-white px-3 font-semibold text-slate-800 hover:bg-slate-50"><span>Disponibilité</span>{value.availableOnly && <span className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] text-white" style={{ backgroundColor: primaryColor }}>1</span>}<ChevronDown className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent align="start" className="w-72 rounded-2xl p-3"><label className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-slate-50"><Checkbox checked={value.availableOnly} onCheckedChange={checked => update({ availableOnly: checked === true })} /><span className="text-sm font-medium text-slate-800">Produits disponibles uniquement</span></label></PopoverContent></Popover>
        {facets.map(facet => { const selected = value.selectedOptions[facet.key] ?? []; return <Popover key={facet.key}><PopoverTrigger asChild><Button variant="outline" className="min-h-11 rounded-xl border-slate-200 bg-white px-3 font-semibold text-slate-800 hover:bg-slate-50"><span>{facet.label}</span>{selected.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] text-white" style={{ backgroundColor: primaryColor }}>{selected.length}</span>}<ChevronDown className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[min(25rem,calc(100vw-2rem))] rounded-2xl p-3"><p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-500">{facet.label}</p><div className="grid max-h-64 gap-1 overflow-auto sm:grid-cols-2">{facet.values.map(option => <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-slate-50"><Checkbox checked={selected.includes(option.value)} onCheckedChange={() => toggleFacet(facet.key, selected, option.value)} /><span className="min-w-0 flex-1 truncate text-sm text-slate-800">{option.value}</span><span className="text-xs text-slate-400">{option.count}</span></label>)}</div></PopoverContent></Popover>; })}
      </div>
      <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-sm text-slate-500">{sortLabel}</span><select data-testid="shop-sort" value={value.sortBy} onChange={event => update({ sortBy: event.target.value as typeof value.sortBy })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[var(--mazigho-accent)]">{sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{activeCount > 0 && <Button type="button" variant="ghost" className="min-h-11 px-3 text-slate-600 hover:bg-slate-100" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Tout effacer</Button>}</div>
    </div>
  </div>;
}
