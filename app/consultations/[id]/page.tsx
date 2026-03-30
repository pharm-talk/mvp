"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, CheckCircle2, Pill } from "lucide-react";
import {
  AiReportCard,
  VerifiedAnswerCard,
} from "@/components/features/consultation/AiReportView";
import { AiDisclaimerFooter } from "@/components/ui/AiDisclaimer";

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
  ai_report: string | null;
  ai_report_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("consultations")
        .select("id, content, status, image_urls, health_snapshot, medications_snapshot, answer, answered_at, ai_report, ai_report_at, verified_by, verified_at, followup_question, followup_answer, created_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (data) setConsultation(data);
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  const handleFollowup = async () => {
    if (!followup.trim() || !consultation) return;
    setSubmittingFollowup(true);

    const { error } = await supabase
      .from("consultations")
      .update({
        followup_question: followup.trim(),
        followup_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultation.id);

    if (!error) {
      setConsultation((prev) =>
        prev ? { ...prev, followup_question: followup.trim() } : null
      );
      setFollowup("");
    }
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

  const hasAiReport = !!consultation.ai_report;
  const isVerified = !!consultation.verified_at;
  const hasAnswer = !!consultation.answer;
  const showWaiting = !hasAiReport && !hasAnswer;

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
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
        {/* Status + Date */}
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

        {/* My question */}
        <div className="bg-white rounded-2xl p-4 shadow-card mb-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">내 질문</p>
          <p
            className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"          >
            {consultation.content}
          </p>
        </div>

        {/* Medications snapshot */}
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

        {/* AI Analysis Report */}
        {hasAiReport && (
          <AiReportCard
            aiReport={consultation.ai_report as string}
            aiReportAt={consultation.ai_report_at}
            formatDate={formatDate}
            showVerificationStatus={!isVerified}
          />
        )}

        {/* Pharmacist Verification */}
        {isVerified && consultation.verified_at && (
          <VerifiedAnswerCard
            answer={consultation.answer}
            aiReport={consultation.ai_report}
            verifiedAt={consultation.verified_at}
            formatDate={formatDate}
          />
        )}

        {/* Waiting status */}
        {showWaiting && consultation.status === "pending" && (
          <div className="bg-amber-50 rounded-2xl p-5 text-center mb-3">
            <p className="text-sm font-semibold text-amber-700 mb-1">
              AI 분석 리포트를 생성 중이에요
            </p>
            <p className="text-xs text-amber-600/70">
              곧 분석 결과를 확인할 수 있어요
            </p>
          </div>
        )}

        {/* Followup question */}
        {consultation.followup_question && (
          <div className="bg-white rounded-2xl p-4 shadow-card mb-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">
              추가 질문
            </p>
            <p
              className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
            >
              {consultation.followup_question}
            </p>
          </div>
        )}

        {/* Followup answer */}
        {consultation.followup_answer && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-3">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">추가 답변</p>
            </div>
            <div className="px-4 py-4">
              <p
                className="text-[0.9375rem] text-gray-700 leading-relaxed whitespace-pre-wrap"
                >
                {consultation.followup_answer}
              </p>
            </div>
          </div>
        )}

        {/* Followup input */}
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

        {/* 면책 고지 */}
        {hasAiReport && <AiDisclaimerFooter />}
      </main>
    </div>
  );
}
