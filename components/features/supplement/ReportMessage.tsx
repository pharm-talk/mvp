"use client";

import { ShieldCheck } from "lucide-react";
import { BotAvatar } from "./ChatComponents";

/* ── Section Styles ── */

export interface ReportSection {
  title: string;
  content: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const SECTION_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "현재 복용 현황": {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  "과잉 성분 주의": {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-400",
  },
  "부족한 영양소": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-400",
  },
  "약-영양제 상호작용": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-400",
  },
  추천: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-400",
  },
};

/* ── parseReport ── */

export function parseReport(report: string): ReportSection[] {
  const sections: ReportSection[] = [];
  const sectionRegex = /\[([^\]]+)\]\s*([\s\S]*?)(?=\[|$)/g;
  let match;

  while ((match = sectionRegex.exec(report)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const style = SECTION_STYLES[title] ?? {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    };

    if (content) {
      sections.push({
        title,
        content,
        bgColor: style.bg,
        textColor: style.text,
        borderColor: style.border,
      });
    }
  }

  return sections;
}

/* ── ReportSectionCard ── */

function ReportSectionCard({ section }: { section: ReportSection }) {
  const hasBorderAccent = section.borderColor !== "border-gray-200";
  return (
    <div
      className={`rounded-xl ${section.bgColor} ${
        hasBorderAccent
          ? `border-l-4 ${section.borderColor}`
          : `border ${section.borderColor}`
      } p-3.5`}
    >
      <p className={`text-xs font-bold ${section.textColor} mb-1.5`}>
        {section.title}
      </p>
      <p
        className={`text-[0.8125rem] leading-relaxed ${section.textColor} opacity-90 whitespace-pre-line`}
        style={{ wordBreak: "keep-all" }}
      >
        {section.content}
      </p>
    </div>
  );
}

/* ── ReportMessage ── */

export function ReportMessage({ report }: { report: string }) {
  const sections = parseReport(report);

  return (
    <div className="flex items-start gap-2 mb-3">
      <BotAvatar />
      <div className="flex-1 max-w-[90%]">
        <div className="bg-gray-50/60 rounded-2xl rounded-tl-md overflow-hidden border border-gray-100/80">
          <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
            <span className="text-[0.8125rem] font-bold text-gray-800">
              영양제 분석 리포트
            </span>
          </div>

          <div className="flex items-start gap-1.5 px-3.5 pb-2.5">
            <ShieldCheck className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[0.6875rem] text-blue-600 leading-snug" style={{ wordBreak: "keep-all" }}>
              면허 인증 약사가 직접 참여해 만든 AI가 분석한 결과예요
            </p>
          </div>

          <div className="px-4 pb-4 space-y-2.5">
            {sections.map((section, idx) => (
              <ReportSectionCard key={idx} section={section} />
            ))}

            {sections.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                분석 결과를 표시할 수 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
