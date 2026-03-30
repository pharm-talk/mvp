"use client";

import { X, Plus } from "lucide-react";

interface RemovableChipProps {
  label: string;
  variant?: "default" | "warning" | "danger";
  excluded: boolean;
  onToggle: () => void;
}

const VARIANT_STYLES = {
  default: "bg-white text-gray-600",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
};

export default function RemovableChip({
  label,
  variant = "default",
  excluded,
  onToggle,
}: RemovableChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-lg transition-all duration-150 ${
        excluded ? "bg-gray-100 text-gray-300 line-through" : VARIANT_STYLES[variant]
      }`}
    >
      {label}
      <span className="w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0">
        {excluded ? (
          <Plus className="w-3 h-3" />
        ) : (
          <X className="w-3 h-3 opacity-40" />
        )}
      </span>
    </button>
  );
}
