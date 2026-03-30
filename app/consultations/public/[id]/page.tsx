"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ShieldCheck } from "@phosphor-icons/react";
import type { PublicConsultation } from "@/types/consultation";
import {
  AiReportCard,
  VerifiedAnswerCard,
} from "@/components/features/consultation/AiReportView";
import { PublicConsultDisclaimer } from "@/components/ui/AiDisclaimer";

export default function PublicConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const id = params.id as string;

  const [consultation, setConsultation] = useState<PublicConsultation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConsultation = useCallback(async () => {
    const { data } = await supabase
      .from("consultations")
      .select("id, content, ai_report, ai_report_at, answer, answered_at, verified_at, created_at")
      .eq("id", id)
      .not("verified_at", "is", null)
      .single();
    if (data) setConsultation(data as PublicConsultation);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <div className="w-10 h-10" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="w-10" />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-5 pt-5 space-y-3">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <div className="h-4 w-16 bg-gray-100 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-2xl h-48 shadow-card animate-pulse" />
        </main>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-5">
        <p className="text-gray-400 mb-4">상담을 찾을 수 없어요.</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-brand font-semibold text-sm"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const hasAiReport = !!consultation.ai_report;
  const hasAnswer = !!consultation.answer;

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">다른 분의 상담</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 pb-10 safe-bottom">
        {/* Status + Date */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-light text-brand">
            <ShieldCheck className="w-3.5 h-3.5" weight="duotone" />
            약사 검증 완료
          </span>
          <span className="text-xs text-gray-300">
            {formatDate(consultation.created_at)}
          </span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-4 shadow-card mb-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">질문</p>
          <p
            className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"          >
            {consultation.content}
          </p>
        </div>

        {/* AI Analysis Report */}
        {hasAiReport && (
          <AiReportCard
            aiReport={consultation.ai_report as string}
            aiReportAt={consultation.ai_report_at}
            formatDate={formatDate}
          />
        )}

        {/* Pharmacist Verification */}
        {consultation.verified_at && (
          <VerifiedAnswerCard
            answer={consultation.answer}
            aiReport={consultation.ai_report}
            verifiedAt={consultation.verified_at}
            formatDate={formatDate}
          />
        )}

        {/* 면책 고지 */}
        <PublicConsultDisclaimer />

        {/* CTA */}
        <div className="bg-white rounded-2xl p-5 shadow-card mt-4">
          <p
            className="text-sm font-semibold text-gray-900 mb-1"          >
            나도 약사에게 상담받고 싶다면?
          </p>
          <p className="text-xs text-gray-400 mb-4">
            AI 즉시 분석 + 면허 약사 검증
          </p>
          <button
            type="button"
            onClick={() => router.push("/consultations/new")}
            className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150"
          >
            상담 요청하기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
