"use client";

import { Pencil, Trash2, ChevronRight, Archive, Flame } from "lucide-react";
import type { MedCategory, Medication } from "@/types/medication";
import { getCategoryConfig } from "./constants";
import PrescriptionProgressBar from "./PrescriptionProgressBar";

interface MedicationSectionProps {
  items: Medication[];
  category: MedCategory;
  selectedId: string | null;
  deleting: string | null;
  showArchived: boolean;
  onSelect: (id: string | null) => void;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  getLastTakenTime?: (id: string) => string | null;
  getStreak?: (id: string) => number;
}

export default function MedicationSection({
  items,
  category,
  selectedId,
  deleting,
  showArchived,
  onSelect,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  getLastTakenTime,
  getStreak,
}: MedicationSectionProps) {
  const config = getCategoryConfig(category);
  const CatIcon = config.Icon;

  return (
    <div className="px-5 mb-2">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-gray-50">
        {items.map((med) => {
          const isSelected = selectedId === med.id;

          return (
            <div key={med.id}>
              <button
                type="button"
                onClick={() => onSelect(isSelected ? null : med.id)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
                >
                  <CatIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9375rem] font-semibold text-gray-900 truncate">
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[med.dosage, med.frequency].filter(Boolean).join(" · ") ||
                      "복용 정보 미입력"}
                  </p>
                  {!showArchived && getLastTakenTime && getStreak && (() => {
                    const lastTime = getLastTakenTime(med.id);
                    const streak = getStreak(med.id);
                    if (!lastTime && streak === 0) return null;
                    return (
                      <div className="flex items-center gap-2 mt-1">
                        {lastTime && (
                          <span className="text-[0.6875rem] text-brand/70">
                            오늘 {lastTime} 복용
                          </span>
                        )}
                        {streak >= 2 && (
                          <span className="inline-flex items-center gap-0.5 text-[0.6875rem] text-orange-500 font-medium">
                            <Flame className="w-3 h-3" />
                            {streak}일 연속
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {category === "prescription" && !showArchived && (
                    <PrescriptionProgressBar
                      startDate={med.start_date}
                      endDate={med.end_date}
                    />
                  )}
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-200 flex-shrink-0 transition-transform duration-200 ${
                    isSelected ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* 확장 영역: 메모 + 수정/삭제/아카이브 */}
              {isSelected && (
                <div className="px-4 pb-3">
                  {med.notes && (
                    <p className="text-sm text-gray-400 bg-surface rounded-xl px-3.5 py-2.5 mb-3">
                      {med.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(med)}
                      className="flex-1 h-9 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium flex items-center justify-center gap-1.5 active:bg-gray-150 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      수정
                    </button>
                    {showArchived ? (
                      <button
                        type="button"
                        onClick={() => onUnarchive(med.id)}
                        className="flex-1 h-9 rounded-xl bg-brand-light text-brand text-sm font-medium flex items-center justify-center gap-1.5 active:bg-brand-light/80 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        복원
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onArchive(med.id)}
                        className="flex-1 h-9 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center gap-1.5 active:bg-gray-150 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        보관
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(med.id)}
                      disabled={deleting === med.id}
                      className="flex-1 h-9 rounded-xl bg-red-50 text-red-500 text-sm font-medium flex items-center justify-center gap-1.5 active:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
