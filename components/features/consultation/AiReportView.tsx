import { AlertTriangle } from "lucide-react";
import { Robot, ShieldCheck } from "@phosphor-icons/react";

/* ── Types ── */

export interface AiReportSection {
  title: string;
  body: string;
}

/* ── parseAiReport ── */

export function parseAiReport(report: string): AiReportSection[] {
  const sections: AiReportSection[] = [];
  const pattern = /\[(.+?)\]\s*\n([\s\S]*?)(?=\n\[|$)/g;
  let match;

  while ((match = pattern.exec(report)) !== null) {
    sections.push({
      title: match[1].trim(),
      body: match[2].trim(),
    });
  }

  if (sections.length === 0 && report.trim()) {
    sections.push({ title: "분석", body: report.trim() });
  }

  return sections;
}

/* ── ReportSectionBody ── */

export function ReportSectionBody({
  text,
  textColor,
  dotColor,
}: {
  text: string;
  textColor: string;
  dotColor: string;
}) {
  const lines = text.split("\n").filter((l) => l.trim());
  const isList =
    lines.length > 1 && lines.some((l) => /^[-·]/.test(l.trim()));

  if (isList) {
    return (
      <ul className="space-y-1.5 pl-1">
        {lines.map((line, i) => (
          <li
            key={i}
            className={`flex gap-2.5 text-sm leading-[1.8] ${textColor}`}
          >
            <span className={`mt-0.5 flex-shrink-0 ${dotColor}`}>·</span>
            <span style={{ wordBreak: "keep-all" }}>
              {line.replace(/^[-·]\s*/, "")}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={`text-sm leading-[1.8] whitespace-pre-wrap ${textColor}`}
      style={{ wordBreak: "keep-all" }}
    >
      {text}
    </p>
  );
}

/* ── SectionBody ── */

export function SectionBody({
  text,
  isWarning,
}: {
  text: string;
  isWarning?: boolean;
}) {
  const lines = text.split("\n").filter((l) => l.trim());
  const isList =
    lines.length > 1 && lines.some((l) => /^[-·\d.]/.test(l.trim()));

  const textColor = isWarning ? "text-amber-800" : "text-gray-700";

  if (isList) {
    return (
      <ul className="space-y-2 pl-1">
        {lines.map((line, i) => (
          <li
            key={i}
            className={`flex gap-2.5 text-sm leading-[1.8] ${textColor}`}
          >
            <span
              className={`mt-0.5 flex-shrink-0 ${isWarning ? "text-amber-400" : "text-gray-300"}`}
            >
              ·
            </span>
            <span style={{ wordBreak: "keep-all" }}>
              {line.replace(/^[-·]\s*/, "").replace(/^\d+[.)]\s*/, "")}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={`text-sm leading-[1.8] whitespace-pre-wrap ${textColor}`}
      style={{ wordBreak: "keep-all" }}
    >
      {text}
    </p>
  );
}

/* ── AnswerReport ── */

export function AnswerReport({ content }: { content: string }) {
  const sectionPattern =
    /(?:^|\n)(?:\[(.+?)\]|#{1,3}\s+(.+?)|[*]{2}(.+?)[*]{2})\s*\n/g;
  const sections: { title: string; body: string }[] = [];

  let match;
  const titles: { title: string; index: number }[] = [];

  while ((match = sectionPattern.exec(content)) !== null) {
    titles.push({
      title: match[1] || match[2] || match[3],
      index: match.index,
    });
  }

  if (titles.length === 0) {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
    if (paragraphs.length <= 1) {
      return (
        <p
          className="text-[0.9375rem] text-gray-700 leading-[1.8] whitespace-pre-wrap"
          style={{ wordBreak: "keep-all" }}
        >
          {content}
        </p>
      );
    }
    return (
      <div className="space-y-4">
        {paragraphs.map((para, i) => {
          const lines = para.split("\n").filter((l) => l.trim());
          const isList =
            lines.length > 1 && lines.every((l) => /^[-·]/.test(l.trim()));
          if (isList) {
            return (
              <ul key={i} className="space-y-2 pl-1">
                {lines.map((line, j) => (
                  <li
                    key={j}
                    className="flex gap-2.5 text-[0.9375rem] text-gray-700 leading-[1.8]"
                  >
                    <span className="text-gray-300 mt-0.5 flex-shrink-0">
                      ·
                    </span>
                    <span style={{ wordBreak: "keep-all" }}>
                      {line.replace(/^[-·]\s*/, "")}
                    </span>
                  </li>
                ))}
              </ul>
            );
          }
          const isWarning =
            para.includes("주의") ||
            para.includes("금기") ||
            para.includes("부작용");
          if (isWarning) {
            return (
              <div key={i} className="bg-amber-50/80 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p
                    className="text-sm text-amber-800 leading-[1.8]"
                    style={{ wordBreak: "keep-all" }}
                  >
                    {para}
                  </p>
                </div>
              </div>
            );
          }
          return (
            <p
              key={i}
              className="text-[0.9375rem] text-gray-700 leading-[1.8] whitespace-pre-wrap"
              style={{ wordBreak: "keep-all" }}
            >
              {para}
            </p>
          );
        })}
      </div>
    );
  }

  const beforeFirst = content.slice(0, titles[0].index).trim();
  if (beforeFirst) {
    sections.push({ title: "", body: beforeFirst });
  }

  titles.forEach((t, i) => {
    const headerEnd = content.indexOf("\n", t.index + 1);
    const nextStart =
      i < titles.length - 1 ? titles[i + 1].index : content.length;
    const body = content.slice(headerEnd + 1, nextStart).trim();
    sections.push({ title: t.title, body });
  });

  const getIsWarning = (title: string) =>
    ["주의", "금기", "부작용"].some((k) => title.includes(k));

  return (
    <div className="space-y-5">
      {sections.map((section, i) => {
        const isWarning = section.title ? getIsWarning(section.title) : false;

        if (isWarning) {
          return (
            <div key={i} className="bg-amber-50/80 rounded-xl px-4 py-3">
              {section.title && (
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-bold text-amber-700">
                    {section.title}
                  </p>
                </div>
              )}
              <SectionBody text={section.body} isWarning />
            </div>
          );
        }

        return (
          <div key={i}>
            {section.title && (
              <p className="text-sm font-bold text-gray-900 mb-2">
                {section.title}
              </p>
            )}
            <SectionBody text={section.body} />
          </div>
        );
      })}
    </div>
  );
}

/* ── AiReportCard: AI 리포트 전체 카드 ── */

export function AiReportCard({
  aiReport,
  aiReportAt,
  formatDate,
  showVerificationStatus,
}: {
  aiReport: string;
  aiReportAt?: string | null;
  formatDate: (d: string) => string;
  showVerificationStatus?: boolean;
}) {
  const aiSections = parseAiReport(aiReport);

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Robot className="w-5 h-5 text-blue-500" weight="duotone" />
            <p className="text-sm font-bold text-gray-900">AI 분석 리포트</p>
          </div>
          {aiReportAt && (
            <span className="text-xs text-gray-300">
              {formatDate(aiReportAt)}
            </span>
          )}
        </div>
      </div>

      {/* 신뢰 문구 */}
      <div className="flex items-start gap-2 px-4 py-2.5 bg-blue-50/40 border-b border-blue-100/40">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[0.75rem] text-blue-600 leading-snug" style={{ wordBreak: "keep-all" }}>
          면허 인증 약사가 직접 참여해 만든 AI가 분석한 결과예요
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {aiSections.map((section, i) => {
          const isWarning =
            section.title.includes("주의") ||
            section.title.includes("금기") ||
            section.title.includes("부작용");
          const isSummary = section.title.includes("요약");

          if (isSummary) {
            return (
              <div key={i} className="bg-blue-50 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-blue-600 mb-1">
                  {section.title}
                </p>
                <p
                  className="text-sm text-blue-800 leading-relaxed"
                  style={{ wordBreak: "keep-all" }}
                >
                  {section.body}
                </p>
              </div>
            );
          }

          if (isWarning) {
            return (
              <div key={i} className="bg-amber-50/80 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold text-amber-700">
                    {section.title}
                  </p>
                </div>
                <ReportSectionBody
                  text={section.body}
                  textColor="text-amber-800"
                  dotColor="text-amber-400"
                />
              </div>
            );
          }

          return (
            <div key={i}>
              <p className="text-xs font-bold text-gray-600 mb-2">
                {section.title}
              </p>
              <ReportSectionBody
                text={section.body}
                textColor="text-gray-700"
                dotColor="text-gray-300"
              />
            </div>
          );
        })}

      </div>

      {showVerificationStatus && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs text-gray-500">약사님이 검증 중이에요</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── VerifiedAnswerCard: 약사 검증 완료 카드 ── */

export function VerifiedAnswerCard({
  answer,
  aiReport,
  verifiedAt,
  formatDate,
}: {
  answer: string | null;
  aiReport: string | null;
  verifiedAt: string;
  formatDate: (d: string) => string;
}) {
  const hasAnswer = !!answer;

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-4 py-3 border-b border-gray-100 bg-brand-light/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-5 h-5 text-brand"
              weight="duotone"
            />
            <p className="text-sm font-bold text-brand">약사 검증 완료</p>
          </div>
          <span className="text-xs text-gray-300">
            {formatDate(verifiedAt)}
          </span>
        </div>
      </div>

      {hasAnswer && answer !== aiReport && (
        <div className="px-4 py-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">
            약사 수정 답변
          </p>
          <AnswerReport content={answer} />
        </div>
      )}

      {hasAnswer && answer === aiReport && (
        <div className="px-4 py-3">
          <p
            className="text-sm text-gray-600 leading-relaxed"
            style={{ wordBreak: "keep-all" }}
          >
            약사가 AI 분석 리포트의 내용을 확인하고 검증했어요.
          </p>
        </div>
      )}
    </div>
  );
}
