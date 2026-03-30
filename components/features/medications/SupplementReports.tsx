"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { SavedReport } from "@/types/medication";

interface SupplementReportsProps {
  savedReports: SavedReport[];
  viewingReport: string | null;
  onViewReport: (id: string | null) => void;
}

export default function SupplementReports({
  savedReports,
  viewingReport,
  onViewReport,
}: SupplementReportsProps) {
  const router = useRouter();

  return (
    <div className="px-5 mb-3">
      <button
        type="button"
        onClick={() => router.push("/supplement-coach")}
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 text-orange-600 font-semibold text-sm flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150"
      >
        영양제 코디네이터
      </button>

      {savedReports.length > 0 && (
        <div className="mt-2.5 space-y-2">
          {savedReports.map((r) => {
            const reportContent = r.messages?.[0]?.content ?? "";
            const preview = reportContent.replace(/\[[^\]]+\]/g, "").trim().slice(0, 60);
            const date = new Date(r.created_at);
            const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;

            return viewingReport === r.id ? (
              <div key={r.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <p className="text-sm font-bold text-gray-900">영양제 리포트</p>
                  <button
                    type="button"
                    onClick={() => onViewReport(null)}
                    className="text-xs text-gray-400 active:text-gray-600"
                  >
                    접기
                  </button>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-[0.8125rem] text-gray-700 leading-relaxed whitespace-pre-line">
                    {reportContent}
                  </p>
                </div>
              </div>
            ) : (
              <button
                key={r.id}
                type="button"
                onClick={() => onViewReport(r.id)}
                className="w-full bg-white rounded-xl px-4 py-3 shadow-card text-left active:scale-[0.99] transition-all duration-150"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    리포트 · {dateStr}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{preview || "영양제 분석 결과"}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
