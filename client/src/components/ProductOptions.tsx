import { useState } from "react";
import { ProductOption } from "@/data/mockData";

interface ProductOptionsProps {
  options: ProductOption[];
  onSelectOptions: (selected: Record<string, string>) => void;
}

export default function ProductOptions({ options, onSelectOptions }: ProductOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const colorOptions = options.filter(opt => opt.type === "color");
  const sizeOptions = options.filter(opt => opt.type === "size");

  const colorLabels: Record<string, string> = {
    black: "Noir",
    white: "Blanc",
    gray: "Gris",
    silver: "Argent",
    gold: "Or",
    pink: "Rose",
    blue: "Bleu",
    green: "Vert",
    purple: "Violet",
  };

  const colorValues: Record<string, string> = {
    black: "#1F2937",
    white: "#FFFFFF",
    gray: "#9CA3AF",
    silver: "#C0C0C0",
    gold: "#FFD700",
    pink: "#EC4899",
    blue: "#3B82F6",
    green: "#10B981",
    purple: "#8B5CF6",
  };

  const handleColorSelect = (option: ProductOption) => {
    const newSelected = { ...selectedOptions, color: option.value };
    setSelectedOptions(newSelected);
    onSelectOptions(newSelected);
  };

  const handleSizeSelect = (option: ProductOption) => {
    const newSelected = { ...selectedOptions, size: option.value };
    setSelectedOptions(newSelected);
    onSelectOptions(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Color Options */}
      {colorOptions.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Couleur
          </label>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((option) => {
              const colorKey = option.value as keyof typeof colorValues;
              const isSelected = selectedOptions.color === option.value;
              return (
                <button
                  key={option.id}
                  onClick={() => handleColorSelect(option)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{
                      backgroundColor: colorValues[colorKey] || option.value,
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {colorLabels[option.value] || option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Options */}
      {sizeOptions.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            {sizeOptions[0].type === "size" ? "Taille" : "Poids"}
          </label>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((option) => {
              const isSelected = selectedOptions.size === option.value;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSizeSelect(option)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-gray-200 text-gray-700 hover:border-orange-300"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
