import { useState } from "react";
import { ProductOption } from "@/data/mockData";
import { useLocale } from "@/contexts/LocaleContext";
import { getProductPublicCopy } from "@/lib/productPublicCopy";

interface ProductOptionsProps {
  options: ProductOption[];
  onSelectOptions: (selected: Record<string, string>) => void;
}

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

export default function ProductOptions({ options, onSelectOptions }: ProductOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const { locale } = useLocale();
  const copy = getProductPublicCopy(locale);
  const colorOptions = options.filter((option) => option.type === "color");
  const sizeOptions = options.filter((option) => option.type === "size");

  const handleColorSelect = (option: ProductOption) => {
    const nextSelected = { ...selectedOptions, color: option.value };
    setSelectedOptions(nextSelected);
    onSelectOptions(nextSelected);
  };

  const handleSizeSelect = (option: ProductOption) => {
    const nextSelected = { ...selectedOptions, size: option.value };
    setSelectedOptions(nextSelected);
    onSelectOptions(nextSelected);
  };

  return <div className="space-y-6">
    {colorOptions.length > 0 && <div><label className="mb-3 block text-sm font-semibold text-gray-800">{copy.color}</label><div className="flex flex-wrap gap-3">{colorOptions.map((option) => {
      const isSelected = selectedOptions.color === option.value;
      return <button key={option.id} onClick={() => handleColorSelect(option)} className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 transition-all ${isSelected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}><span className="h-6 w-6 rounded-full border border-gray-300" style={{ backgroundColor: colorValues[option.value] || option.value }} /><span className="text-sm font-medium text-gray-700">{copy.colors[option.value] || option.label}</span></button>;
    })}</div></div>}
    {sizeOptions.length > 0 && <div><label className="mb-3 block text-sm font-semibold text-gray-800">{sizeOptions[0].type === "size" ? copy.size : copy.weight}</label><div className="flex flex-wrap gap-2">{sizeOptions.map((option) => {
      const isSelected = selectedOptions.size === option.value;
      return <button key={option.id} onClick={() => handleSizeSelect(option)} className={`rounded-lg border-2 px-4 py-2 font-medium transition-all ${isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 text-gray-700 hover:border-orange-300"}`}>{option.label}</button>;
    })}</div></div>}
  </div>;
}
