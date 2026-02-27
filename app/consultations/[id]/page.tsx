"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, CheckCircle2, Pill, AlertTriangle } from "lucide-react";

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
          <p
            className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
            style={{ wordBreak: "keep-all" }}
          >
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
            <p className="text-sm font-semibold text-amber-700 mb-1">
              약사 답변을 기다리고 있어요
            </p>
            <p className="text-xs text-amber-600/70">
              보통 12시간 이내에 답변이 도착합니다
            </p>
          </div>
        )}

        {/* 약사 답변 */}
        {consultation.answer && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-3">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">약사 답변</p>
                {consultation.answered_at && (
                  <span className="text-xs text-gray-300">
                    {formatDate(consultation.answered_at)}
                  </span>
                )}
              </div>
            </div>
            <div className="px-4 py-4">
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
            <p
              className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
              style={{ wordBreak: "keep-all" }}
            >
              {consultation.followup_question}
            </p>
          </div>
        )}

        {/* 추가 답변 */}
        {consultation.followup_answer && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-3">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">추가 답변</p>
            </div>
            <div className="px-4 py-4">
              <p
                className="text-[0.9375rem] text-gray-700 leading-relaxed whitespace-pre-wrap"
                style={{ wordBreak: "keep-all" }}
              >
                {consultation.followup_answer}
              </p>
            </div>
          </div>
        )}

        {/* 추가 질문 입력 */}
        {canFollowup && (
          <div className="bg-white rounded-2xl p-4 shadow-card mt-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              추가로 궁금한 점이 있나요?
            </p>
            <p className="text-xs text-gray-400 mb-3">
              이 상담에 대해 1회 추가 질문할 수 있어요
            </p>
            <textarea
              placeholder="궁금한 점을 작성해주세요"
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none mb-3"
            />
            <button
              type="button"
              onClick={handleFollowup}
              disabled={!followup.trim() || submittingFollowup}
              className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center active:brightness-95 transition-all duration-150 disabled:opacity-40"
            >
              {submittingFollowup ? "전송 중..." : "추가 질문 보내기"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── 약사 답변 본문 파싱 ── */
function AnswerReport({ content }: { content: string }) {
  const sectionPattern = /(?:^|\n)(?:\[(.+?)\]|#{1,3}\s+(.+?)|[*]{2}(.+?)[*]{2})\s*\n/g;
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
          const isList = lines.length > 1 && lines.every((l) => /^[-·•]/.test(l.trim()));
          if (isList) {
            return (
              <ul key={i} className="space-y-2 pl-1">
                {lines.map((line, j) => (
                  <li key={j} className="flex gap-2.5 text-[0.9375rem] text-gray-700 leading-[1.8]">
                    <span className="text-gray-300 mt-0.5 flex-shrink-0">·</span>
                    <span style={{ wordBreak: "keep-all" }}>{line.replace(/^[-·•]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            );
          }
          const isWarning =
            para.includes("주의") || para.includes("금기") || para.includes("부작용");
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
    const nextStart = i < titles.length - 1 ? titles[i + 1].index : content.length;
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
                  <p className="text-sm font-bold text-amber-700">{section.title}</p>
                </div>
              )}
              <SectionBody text={section.body} isWarning />
            </div>
          );
        }

        return (
          <div key={i}>
            {section.title && (
              <p className="text-sm font-bold text-gray-900 mb-2">{section.title}</p>
            )}
            <SectionBody text={section.body} />
          </div>
        );
      })}
    </div>
  );
}

function SectionBody({ text, isWarning }: { text: string; isWarning?: boolean }) {
  const lines = text.split("\n").filter((l) => l.trim());
  const isList = lines.length > 1 && lines.some((l) => /^[-·•\d.]/.test(l.trim()));

  const textColor = isWarning ? "text-amber-800" : "text-gray-700";

  if (isList) {
    return (
      <ul className="space-y-2 pl-1">
        {lines.map((line, i) => (
          <li key={i} className={`flex gap-2.5 text-sm leading-[1.8] ${textColor}`}>
            <span className={`mt-0.5 flex-shrink-0 ${isWarning ? "text-amber-400" : "text-gray-300"}`}>
              ·
            </span>
            <span style={{ wordBreak: "keep-all" }}>
              {line.replace(/^[-·•]\s*/, "").replace(/^\d+[.)]\s*/, "")}
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
