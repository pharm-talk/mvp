"use client";

import { X, FileText, Check, ShieldCheck } from "lucide-react";
import { parseReport } from "./ReportMessage";

/* ── ReportModal ── */

interface ReportModalProps {
  savedReport: string;
  reportSaved: boolean;
  onClose: () => void;
  onSave: () => void;
  onRequestVerification: () => void;
}

export function ReportModal({
  savedReport,
  reportSaved,
  onClose,
  onSave,
  onRequestVerification,
}: ReportModalProps) {
  const sections = parseReport(savedReport);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
      <div className="w-full max-w-lg bg-white rounded-t-3xl max-h-[85dvh] flex flex-col safe-bottom">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">영양제 리포트</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 리포트 내용 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className={`rounded-xl ${section.bgColor} ${
                section.borderColor !== "border-gray-200"
                  ? `border-l-4 ${section.borderColor}`
                  : `border ${section.borderColor}`
              } p-3.5 mb-2.5`}
            >
              <p className={`text-xs font-bold ${section.textColor} mb-1.5`}>{section.title}</p>
              <p className={`text-[0.8125rem] leading-relaxed ${section.textColor} opacity-90 whitespace-pre-line`} style={{ wordBreak: "keep-all" }}>
                {section.content}
              </p>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" style={{ wordBreak: "keep-all" }}>
              {savedReport}
            </p>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2.5">
          {!reportSaved ? (
            <button
              type="button"
              onClick={onSave}
              className="w-full h-12 rounded-2xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>리포트 저장하기</span>
            </button>
          ) : (
            <div className="w-full h-12 rounded-2xl bg-brand-light text-brand font-semibold text-[0.9375rem] flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>저장 완료</span>
            </div>
          )}
          <button
            type="button"
            onClick={onRequestVerification}
            className="w-full h-12 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:bg-gray-50 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>약사에게 검증받기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
