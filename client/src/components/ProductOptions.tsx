import { useEffect, useState } from "react";

// Variantes stockées côté base et éditées dans l'admin au format { name, values }.
// Le nom du groupe arrive déjà traduit depuis le backend selon la langue active.
export interface ProductOptionGroup {
  name: string;
  values: string[];
}

interface ProductOptionsProps {
  options: ProductOptionGroup[];
  onSelectOptions: (selected: Record<string, string>) => void;
}

// Correspondance nom de couleur (multilingue) -> code couleur pour la pastille.
const COLOR_SWATCHES: Record<string, string> = {
  noir: "#1F2937", black: "#1F2937", schwarz: "#1F2937", nero: "#1F2937", negro: "#1F2937", zwart: "#1F2937",
  blanc: "#FFFFFF", white: "#FFFFFF", weiss: "#FFFFFF", bianco: "#FFFFFF", blanco: "#FFFFFF", wit: "#FFFFFF",
  gris: "#9CA3AF", gray: "#9CA3AF", grey: "#9CA3AF", grau: "#9CA3AF", grigio: "#9CA3AF", gris_argente: "#C0C0C0", argente: "#C0C0C0", silver: "#C0C0C0", argent: "#C0C0C0",
  or: "#D4AF37", dore: "#D4AF37", gold: "#D4AF37", oro: "#D4AF37",
  rose: "#EC4899", pink: "#EC4899", rosa: "#EC4899",
  rouge: "#DC2626", red: "#DC2626", rot: "#DC2626", rosso: "#DC2626", rojo: "#DC2626", rood: "#DC2626",
  bleu: "#2563EB", blue: "#2563EB", blau: "#2563EB", blu: "#2563EB", azul: "#2563EB", blauw: "#2563EB",
  vert: "#16A34A", green: "#16A34A", grun: "#16A34A", verde: "#16A34A", groen: "#16A34A",
  violet: "#7C3AED", purple: "#7C3AED", lila: "#7C3AED", viola: "#7C3AED", morado: "#7C3AED",
  jaune: "#EAB308", yellow: "#EAB308", gelb: "#EAB308", giallo: "#EAB308", amarillo: "#EAB308",
  orange: "#EA580C", arancione: "#EA580C", naranja: "#EA580C",
  marron: "#92400E", brown: "#92400E", braun: "#92400E", marrone: "#92400E", beige: "#D6C6A8",
  transparent: "#E5E7EB", clair: "#E5E7EB",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const COLOR_GROUP_KEYWORDS = ["couleur", "color", "colour", "farbe", "colore", "kleur", "لون"];

function isColorGroup(name: string) {
  const n = name.toLowerCase();
  return COLOR_GROUP_KEYWORDS.some((keyword) => n.includes(keyword));
}

function swatchFor(value: string): string | null {
  const key = normalize(value);
  if (COLOR_SWATCHES[key]) return COLOR_SWATCHES[key];
  const firstWord = key.split("_")[0];
  return COLOR_SWATCHES[firstWord] ?? null;
}

export default function ProductOptions({ options, onSelectOptions }: ProductOptionsProps) {
  const groups = (options || []).filter((group) => group && group.name && Array.isArray(group.values) && group.values.length > 0);
  const [selected, setSelected] = useState<Record<string, string>>({});

  // Présélectionne la première valeur de chaque groupe pour que le panier reçoive toujours un choix cohérent.
  useEffect(() => {
    const initial: Record<string, string> = {};
    groups.forEach((group) => { initial[group.name] = group.values[0]; });
    setSelected(initial);
    onSelectOptions(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(groups.map((group) => [group.name, group.values]))]);

  if (groups.length === 0) return null;

  const handleSelect = (groupName: string, value: string) => {
    const next = { ...selected, [groupName]: value };
    setSelected(next);
    onSelectOptions(next);
  };

  return (
    <div className="space-y-6" data-testid="product-options">
      {groups.map((group) => {
        const colorGroup = isColorGroup(group.name);
        return (
          <div key={group.name} data-testid={`product-option-group-${normalize(group.name)}`}>
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              {group.name}
              {selected[group.name] ? <span className="ml-2 font-normal text-gray-500">{selected[group.name]}</span> : null}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {group.values.map((value) => {
                const isSelected = selected[group.name] === value;
                const swatch = colorGroup ? swatchFor(value) : null;
                return (
                  <button
                    key={value}
                    type="button"
                    data-testid={`product-option-${normalize(group.name)}-${normalize(value)}`}
                    onClick={() => handleSelect(group.name, value)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                      isSelected ? "border-orange-500 bg-orange-50 text-orange-900" : "border-gray-200 text-gray-700 hover:border-orange-300"
                    }`}
                  >
                    {swatch ? (
                      <span className="h-5 w-5 rounded-full border border-gray-300" style={{ backgroundColor: swatch }} />
                    ) : null}
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
