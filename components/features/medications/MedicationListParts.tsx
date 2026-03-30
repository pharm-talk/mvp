"use client";

import { Pill, Camera, Plus } from "lucide-react";
import type { MedCategory, Medication } from "@/types/medication";
import { CATEGORY_CONFIG, getCategoryConfig } from "./constants";

/* -- 로딩 스켈레톤 -- */
export function LoadingSkeleton() {
  return (
    <div className="px-5 pt-5 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-100" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -- 빈 상태 -- */
export function EmptyState({
  analyzing,
  onPhotoAdd,
  onManualAdd,
}: {
  analyzing: boolean;
  onPhotoAdd: () => void;
  onManualAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center pt-28 pb-8 px-5">
      <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-5">
        <Pill className="w-9 h-9 text-gray-200" />
      </div>
      <p className="text-lg font-bold text-gray-900 mb-1">
        아직 등록된 약이 없어요
      </p>
      <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
        복용 중인 약이나 영양제를 등록하면
        <br />
        맞춤 상담을 받을 수 있어요
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[16rem]">
        <button
          type="button"
          onClick={onPhotoAdd}
          disabled={analyzing}
          className="inline-flex items-center justify-center gap-2 h-12 bg-brand text-white font-semibold text-[0.9375rem] rounded-full active:brightness-95 transition-all duration-150 disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          사진으로 추가
        </button>
        <button
          type="button"
          onClick={onManualAdd}
          className="inline-flex items-center justify-center gap-2 h-12 bg-white text-gray-700 font-semibold text-[0.9375rem] rounded-full shadow-card active:shadow-none active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="w-5 h-5" />
          직접 입력하기
        </button>
      </div>
    </div>
  );
}

/* -- 요약 카드 -- */
export function SummaryCard({
  showArchived,
  activeCount,
  archivedCount,
  countByCategory,
}: {
  showArchived: boolean;
  activeCount: number;
  archivedCount: number;
  countByCategory: (cat: MedCategory) => number;
}) {
  return (
    <div className="px-5 pt-5 mb-2">
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">
              {showArchived ? "복용 기록" : "복용 중인 약/영양제"}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {showArchived ? archivedCount : activeCount}
              <span className="text-base font-medium text-gray-300 ml-1">개</span>
            </p>
          </div>
          {!showArchived && (
            <div className="flex gap-5">
              {CATEGORY_CONFIG.map(({ value, Icon, iconBg, iconColor, label }) => (
                <div key={value} className="text-center">
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-1`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <span className="text-[0.625rem] text-gray-400 leading-none whitespace-nowrap">
                    {label}
                  </span>
                  <p className="text-xs font-bold text-gray-700 mt-0.5">{countByCategory(value)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -- 카테고리 탭 -- */
export function CategoryTabs({
  activeTab,
  showArchived,
  archivedMeds: archivedMedsList,
  countByCategory,
  onTabChange,
}: {
  activeTab: MedCategory;
  showArchived: boolean;
  archivedMeds: { category: string }[];
  countByCategory: (cat: MedCategory) => number;
  onTabChange: (tab: MedCategory) => void;
}) {
  return (
    <div className="px-5 mb-3">
      <div className="flex bg-gray-100/80 rounded-xl p-1 gap-0.5">
        {CATEGORY_CONFIG.map(({ value, label }) => {
          const count = showArchived
            ? archivedMedsList.filter((m) => m.category === value).length
            : countByCategory(value);
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onTabChange(value)}
              className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1 text-[0.75rem] leading-none font-semibold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 active:text-gray-600"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[0.625rem] ${isActive ? "text-brand" : "text-gray-300"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -- 빈 카테고리 상태 -- */
export function EmptyCategoryState({
  activeTab,
  showArchived,
}: {
  activeTab: MedCategory;
  showArchived: boolean;
}) {
  const config = getCategoryConfig(activeTab);
  const CatIcon = config.Icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-5">
      <div className="w-14 h-14 rounded-2xl bg-white shadow-card flex items-center justify-center mb-3">
        <CatIcon className="w-7 h-7 text-gray-200" />
      </div>
      <p className="text-sm text-gray-400 text-center">
        {activeTab === "chronic"
          ? showArchived ? "이전 장기 복용약 기록이 없어요" : "등록된 장기 복용약이 없어요"
          : activeTab === "prescription"
            ? showArchived ? "이전 처방약 기록이 없어요" : "등록된 처방약이 없어요"
            : showArchived ? "이전 영양제 기록이 없어요" : "등록된 영양제가 없어요"
        }
      </p>
    </div>
  );
}
