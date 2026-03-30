"use client";

import { Pill } from "lucide-react";
import type { ConsultType } from "@/types/consultation";

/* ── 영양제 통 아이콘 ── */
export const SupplementBottle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="7" width="10" height="14" rx="2" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M7 12h10" />
  </svg>
);

interface ConsultTypeSelectorProps {
  consultType: ConsultType;
  onTypeChange: (type: ConsultType) => void;
}

export default function ConsultTypeSelector({
  consultType,
  onTypeChange,
}: ConsultTypeSelectorProps) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">상담 유형</label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onTypeChange("medication")}
          className={`flex-1 h-12 rounded-xl font-semibold text-[0.9375rem] flex items-center justify-center gap-2 transition-all duration-150 ${
            consultType === "medication"
              ? "bg-brand text-white"
              : "bg-gray-100 text-gray-500 active:bg-gray-150"
          }`}
        >
          <Pill className="w-5 h-5" />
          복약 상담
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("supplement")}
          className={`flex-1 h-12 rounded-xl font-semibold text-[0.9375rem] flex items-center justify-center gap-2 transition-all duration-150 ${
            consultType === "supplement"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-500 active:bg-gray-150"
          }`}
        >
          <SupplementBottle className="w-5 h-5" />
          영양제 상담
        </button>
      </div>
    </div>
  );
}
