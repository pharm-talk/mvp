"use client";

import { X, Check, ChevronRight, Plus, Loader2 } from "lucide-react";
import type { AiResult } from "@/types/medication";
import { classifyAiResult } from "./utils";
import { getCategoryConfig } from "./constants";

interface AiResultsScreenProps {
  results: AiResult[];
  saving: boolean;
  onAddAll: () => void;
  onAddOne: (item: AiResult) => void;
  onClose: () => void;
}

export default function AiResultsScreen({
  results,
  saving,
  onAddAll,
  onAddOne,
  onClose,
}: AiResultsScreenProps) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">분석 결과</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-5 pb-8">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center">
            <Check className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {results.length}개를 찾았어요
            </p>
            <p className="text-xs text-gray-400">추가할 항목을 선택하세요</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-6">
          {results.map((item, idx) => {
            const cat = classifyAiResult(item);
            const config = getCategoryConfig(cat);
            const CatIcon = config.Icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onAddOne(item)}
                className="w-full bg-surface rounded-2xl p-4 text-left active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
                  >
                    <CatIcon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[config.label, item.dosage, item.frequency]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddAll}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              추가하는 중...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {results.length}개 모두 추가
            </>
          )}
        </button>
        <p className="text-[0.6875rem] text-gray-400 text-center mt-2">
          항목을 탭하면 수정 후 개별 추가할 수 있어요
        </p>
      </div>
    </div>
  );
}
