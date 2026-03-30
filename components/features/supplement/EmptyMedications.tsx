"use client";

import { ArrowLeft, Pill, Plus } from "lucide-react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface EmptyMedicationsProps {
  router: AppRouterInstance;
}

export function EmptyMedications({ router }: EmptyMedicationsProps) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            영양제 코디네이터
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex flex-col items-center justify-center pt-28 pb-8 px-5 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-5">
          <Pill className="w-9 h-9 text-gray-200" />
        </div>
        <p className="text-lg font-bold text-gray-900 mb-1">
          먼저 약을 등록해주세요
        </p>
        <p
          className="text-sm text-gray-400 text-center mb-8 leading-relaxed"
          style={{ wordBreak: "keep-all" }}
        >
          복용 중인 약이나 영양제를 등록하면
          <br />
          맞춤 분석 리포트를 받아볼 수 있어요
        </p>
        <button
          type="button"
          onClick={() => router.push("/medications")}
          className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-brand text-white font-semibold text-[0.9375rem] rounded-full active:brightness-95 transition-all duration-150"
        >
          <Plus className="w-5 h-5" />
          약 등록하러 가기
        </button>
      </div>
    </div>
  );
}
