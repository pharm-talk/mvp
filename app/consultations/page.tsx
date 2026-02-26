"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import {
  ArrowLeft,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface Consultation {
  id: string;
  content: string;
  status: "pending" | "assigned" | "answered" | "closed";
  created_at: string;
  answered_at: string | null;
}

const STATUS_MAP = {
  pending: { label: "대기 중", color: "bg-amber-50 text-amber-600", icon: Clock },
  assigned: { label: "약사 배정", color: "bg-blue-50 text-blue-600", icon: MessageCircle },
  answered: { label: "답변 완료", color: "bg-brand-light text-brand", icon: CheckCircle2 },
  closed: { label: "종료", color: "bg-gray-100 text-gray-500", icon: CheckCircle2 },
};

export default function ConsultationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultations = useCallback(async () => {
    const { data } = await supabase
      .from("consultations")
      .select("id, content, status, created_at, answered_at")
      .order("created_at", { ascending: false });
    if (data) setConsultations(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${month}월 ${day}일 ${hours}:${mins}`;
  };

  return (
    <div className="min-h-dvh bg-surface">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">내 상담</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {loading ? (
          <div className="px-5 pt-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : consultations.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center pt-28 pb-8 px-5">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-5">
              <MessageCircle className="w-9 h-9 text-gray-200" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              아직 상담 내역이 없어요
            </p>
            <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
              면허 인증 약사에게
              <br />
              복약 상담을 받아보세요.
            </p>
            <button
              type="button"
              onClick={() => router.push("/consultations/new")}
              className="inline-flex items-center gap-2 h-12 px-6 bg-brand text-white font-semibold text-[0.9375rem] rounded-full active:brightness-95 transition-all duration-150"
            >
              <Plus className="w-5 h-5" />
              상담 요청하기
            </button>
          </div>
        ) : (
          <>
            {/* 새 상담 버튼 */}
            <div className="px-5 pt-5 mb-3">
              <button
                type="button"
                onClick={() => router.push("/consultations/new")}
                className="w-full h-12 rounded-2xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150"
              >
                <Plus className="w-5 h-5" />
                새 상담 요청
              </button>
            </div>

            {/* 상담 목록 */}
            <div className="px-5 space-y-3">
              {consultations.map((c) => {
                const statusInfo = STATUS_MAP[c.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => router.push(`/consultations/${c.id}`)}
                    className="w-full bg-white rounded-2xl p-4 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-300">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="text-[0.9375rem] font-medium text-gray-900 line-clamp-2 mb-1">
                      {c.content}
                    </p>
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-gray-300 flex items-center gap-0.5">
                        상세보기
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
