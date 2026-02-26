"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Send,
  Pill,
  Stethoscope,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

const SupplementBottle = ({ className }: { className?: string }) => (
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

interface Consultation {
  id: string;
  content: string;
  status: string;
  image_urls: string[];
  health_snapshot: Record<string, unknown> | null;
  medications_snapshot: Array<{
    name: string;
    type: string;
    dosage: string | null;
  }> | null;
  answer: string | null;
  answered_at: string | null;
  followup_question: string | null;
  followup_answer: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "대기 중", color: "bg-amber-50 text-amber-600" },
  assigned: { label: "약사 배정", color: "bg-blue-50 text-blue-600" },
  answered: { label: "답변 완료", color: "bg-brand-light text-brand" },
  closed: { label: "종료", color: "bg-gray-100 text-gray-500" },
};

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const id = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [followup, setFollowup] = useState("");
  const [submittingFollowup, setSubmittingFollowup] = useState(false);

  const fetchConsultation = useCallback(async () => {
    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", id)
      .single();
    if (data) setConsultation(data);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  const handleFollowup = async () => {
    if (!followup.trim() || !consultation) return;
    setSubmittingFollowup(true);

    await supabase
      .from("consultations")
      .update({
        followup_question: followup.trim(),
        followup_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultation.id);

    setConsultation((prev) =>
      prev ? { ...prev, followup_question: followup.trim() } : null
    );
    setFollowup("");
    setSubmittingFollowup(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-5">
        <p className="text-gray-400 mb-4">상담을 찾을 수 없어요.</p>
        <button
          type="button"
          onClick={() => router.push("/consultations")}
          className="text-brand font-semibold text-sm"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[consultation.status] ?? STATUS_MAP.pending;
  const meds = consultation.medications_snapshot ?? [];
  const canFollowup =
    consultation.status === "answered" && !consultation.followup_question;

  return (
    <div className="min-h-dvh bg-surface">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/consultations")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">상담 상세</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 pb-10 safe-bottom">
        {/* 상태 + 날짜 */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}
          >
            {consultation.status === "pending" ? (
              <Clock className="w-3 h-3" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {statusInfo.label}
          </span>
          <span className="text-xs text-gray-300">
            {formatDate(consultation.created_at)}
          </span>
        </div>

        {/* 내 질문 */}
        <div className="bg-white rounded-2xl p-4 shadow-card mb-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">내 질문</p>
          <p className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap">
            {consultation.content}
          </p>
        </div>

        {/* 전달된 복용약 */}
        {meds.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-card mb-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">
              전달된 복용약
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meds.map((med, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
                    med.type === "supplement"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-brand-light text-brand"
                  }`}
                >
                  {med.type === "supplement" ? (
                    <SupplementBottle className="w-3 h-3" />
                  ) : (
                    <Pill className="w-3 h-3" />
                  )}
                  {med.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 대기 중 안내 */}
        {consultation.status === "pending" && (
          <div className="bg-amber-50 rounded-2xl p-5 text-center mb-3">
            <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-amber-700 mb-1">
              약사 답변을 기다리고 있어요
            </p>
            <p className="text-xs text-amber-600/70">
              평균 12시간 이내에 답변이 도착해요.
            </p>
          </div>
        )}

        {/* 약사 답변 - 보고서식 */}
        {consultation.answer && (
          <div className="mb-3 space-y-3">
            {/* 보고서 헤더 */}
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">약사 상담 결과</p>
                    {consultation.answered_at && (
                      <p className="text-xs text-gray-300">
                        {formatDate(consultation.answered_at)}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full">
                  답변 완료
                </span>
              </div>
              <div className="h-px bg-gray-100 mb-3" />
              <AnswerReport content={consultation.answer} />
            </div>
          </div>
        )}

        {/* 추가 질문 */}
        {consultation.followup_question && (
          <div className="bg-white rounded-2xl p-4 shadow-card mb-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">
              추가 질문
            </p>
            <p className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap">
              {consultation.followup_question}
            </p>
          </div>
        )}

        {consultation.followup_answer && (
          <div className="bg-white rounded-2xl p-4 shadow-card mb-3 border-l-4 border-brand">
            <p className="text-xs font-semibold text-brand mb-2">
              추가 답변
            </p>
            <p className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap">
              {consultation.followup_answer}
            </p>
          </div>
        )}

        {/* 추가 질문 입력 (1회) */}
        {canFollowup && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">
              추가 질문 1회 가능해요.
            </p>
            <div className="flex gap-2">
              <textarea
                placeholder="추가로 궁금한 점을 입력하세요"
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                rows={2}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
              />
              <button
                type="button"
                onClick={handleFollowup}
                disabled={!followup.trim() || submittingFollowup}
                className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center active:brightness-95 transition-all duration-150 disabled:opacity-40 self-end"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── 약사 답변 보고서식 파싱 ── */
function AnswerReport({ content }: { content: string }) {
  // 섹션 구분: [제목] 또는 **제목** 또는 # 제목 패턴으로 분리
  const sectionPattern = /(?:^|\n)(?:\[(.+?)\]|#{1,3}\s+(.+?)|[*]{2}(.+?)[*]{2})\s*\n/g;
  const sections: { title: string; body: string }[] = [];

  let match;
  const titles: { title: string; index: number }[] = [];

  // 모든 섹션 헤더 위치 수집
  while ((match = sectionPattern.exec(content)) !== null) {
    titles.push({
      title: match[1] || match[2] || match[3],
      index: match.index,
    });
  }

  if (titles.length === 0) {
    // 섹션 구분이 없는 일반 텍스트 → 줄바꿈 기준으로 문단 분리
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
    if (paragraphs.length <= 1) {
      return (
        <p
          className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
          style={{ wordBreak: "keep-all" }}
        >
          {content}
        </p>
      );
    }
    return (
      <div className="space-y-4">
        {paragraphs.map((para, i) => {
          // 줄바꿈으로 시작하는 리스트 감지
          const lines = para.split("\n").filter((l) => l.trim());
          const isList = lines.length > 1 && lines.every((l) => /^[-·•]/.test(l.trim()));
          if (isList) {
            return (
              <ul key={i} className="space-y-1.5">
                {lines.map((line, j) => (
                  <li key={j} className="flex gap-2 text-[0.9375rem] text-gray-900 leading-relaxed">
                    <span className="text-brand mt-1 flex-shrink-0">·</span>
                    <span style={{ wordBreak: "keep-all" }}>{line.replace(/^[-·•]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            );
          }
          // 주의사항 감지
          const isWarning =
            para.includes("주의") || para.includes("금기") || para.includes("부작용");
          if (isWarning) {
            return (
              <div key={i} className="bg-amber-50 rounded-xl px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p
                    className="text-sm text-amber-800 leading-relaxed"
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
              className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
              style={{ wordBreak: "keep-all" }}
            >
              {para}
            </p>
          );
        })}
      </div>
    );
  }

  // 섹션이 있는 경우
  // 첫 섹션 전 내용
  const beforeFirst = content.slice(0, titles[0].index).trim();
  if (beforeFirst) {
    sections.push({ title: "", body: beforeFirst });
  }

  titles.forEach((t, i) => {
    const headerEnd = content.indexOf("\n", t.index + 1);
    const nextStart = i < titles.length - 1 ? titles[i + 1].index : content.length;
    const body = content.slice(headerEnd + 1, nextStart).trim();
    sections.push({ title: t.title, body });
  });

  const SECTION_ICONS: Record<string, string> = {
    답변: "answer",
    요약: "summary",
    주의: "warning",
    금기: "warning",
    부작용: "warning",
    복용법: "guide",
    권장: "guide",
    추천: "guide",
    참고: "info",
  };

  const getSectionType = (title: string) => {
    for (const [keyword, type] of Object.entries(SECTION_ICONS)) {
      if (title.includes(keyword)) return type;
    }
    return "default";
  };

  const sectionStyles: Record<string, string> = {
    warning: "bg-amber-50 border-amber-200",
    guide: "bg-brand-light border-brand/10",
    info: "bg-gray-50 border-gray-200",
    default: "bg-white border-gray-100",
    answer: "bg-white border-gray-100",
    summary: "bg-brand-light border-brand/10",
  };

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const type = section.title ? getSectionType(section.title) : "default";
        const style = sectionStyles[type] ?? sectionStyles.default;

        return (
          <div
            key={i}
            className={`rounded-xl border px-3.5 py-3 ${style}`}
          >
            {section.title && (
              <div className="flex items-center gap-1.5 mb-2">
                {type === "warning" && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                {type === "guide" && (
                  <ClipboardList className="w-3.5 h-3.5 text-brand" />
                )}
                <p
                  className={`text-sm font-bold ${
                    type === "warning" ? "text-amber-700" : "text-gray-900"
                  }`}
                >
                  {section.title}
                </p>
              </div>
            )}
            <ReportBody text={section.body} isWarning={type === "warning"} />
          </div>
        );
      })}
    </div>
  );
}

function ReportBody({ text, isWarning }: { text: string; isWarning?: boolean }) {
  const lines = text.split("\n").filter((l) => l.trim());
  const isList = lines.length > 1 && lines.some((l) => /^[-·•\d.]/.test(l.trim()));

  if (isList) {
    return (
      <ul className="space-y-1.5">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className={`mt-0.5 flex-shrink-0 ${isWarning ? "text-amber-500" : "text-brand"}`}>
              ·
            </span>
            <span
              className={isWarning ? "text-amber-800" : "text-gray-700"}
              style={{ wordBreak: "keep-all" }}
            >
              {line.replace(/^[-·•]\s*/, "").replace(/^\d+[.)]\s*/, "")}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={`text-sm leading-relaxed whitespace-pre-wrap ${
        isWarning ? "text-amber-800" : "text-gray-700"
      }`}
      style={{ wordBreak: "keep-all" }}
    >
      {text}
    </p>
  );
}
