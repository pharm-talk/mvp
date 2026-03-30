"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ShieldCheck } from "@phosphor-icons/react";
import type { PublicConsultation } from "@/types/consultation";

/** 2단계 필터 구조: 상위 탭 → 하위 칩 */
const FILTER_TABS = [
  {
    key: "drug",
    label: "약 종류",
    children: ["혈압약", "당뇨약", "진통제", "해열제", "항생제", "수면제", "갑상선약", "피부과약", "여드름약", "위장약", "소화제", "감기약", "피임약", "골다공증약"],
  },
  {
    key: "supplement",
    label: "영양제",
    children: ["비타민D", "비타민C", "멀티비타민", "오메가3", "유산균", "칼슘", "철분", "엽산", "마그네슘", "홍삼", "멜라토닌", "콜라겐", "루테인", "밀크시슬"],
  },
  {
    key: "concern",
    label: "고민별",
    children: ["상호작용", "부작용", "복용법", "복용시간", "용량", "과다복용", "교차투여", "장기복용", "중복복용", "음주", "카페인", "음식궁합"],
  },
  {
    key: "target",
    label: "대상별",
    children: ["임산부", "수유부", "소아", "영유아", "노인", "만성질환자"],
  },
] as const;

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
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialTab = searchParams.get("tab") === "browse" ? "browse" : "mine";
  const [activeTab, setActiveTab] = useState<"mine" | "browse">(initialTab);

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const [publicConsultations, setPublicConsultations] = useState<PublicConsultation[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicFetched, setPublicFetched] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchConsultations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("consultations")
        .select("id, content, status, created_at, answered_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setConsultations(data);
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchPublicConsultations = useCallback(async () => {
    setPublicLoading(true);
    try {
      const { data } = await supabase
        .from("consultations")
        .select("id, content, ai_report, ai_report_at, answer, answered_at, verified_at, created_at, tags")
        .not("verified_at", "is", null)
        .order("verified_at", { ascending: false })
        .limit(30);
      if (data) {
        setPublicConsultations(data as PublicConsultation[]);
      }
    } catch {
      // fetch failed
    } finally {
      setPublicLoading(false);
      setPublicFetched(true);
    }
  }, [supabase]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  useEffect(() => {
    if (activeTab === "browse" && !publicFetched) {
      fetchPublicConsultations();
    }
  }, [activeTab, publicFetched, fetchPublicConsultations]);

  const handleTabChange = (tab: "mine" | "browse") => {
    setActiveTab(tab);
    router.replace(`/consultations?tab=${tab}`, { scroll: false });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}월 ${day}일`;
  };

  return (
    <div className="min-h-dvh bg-surface">
      {/* 헤더 */}
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
          <h1 className="text-base font-bold text-gray-900">상담</h1>
          <div className="w-10" />
        </div>

        {/* 탭 */}
        <div className="max-w-lg mx-auto flex border-b border-gray-100">
          <button
            type="button"
            onClick={() => handleTabChange("mine")}
            className={`flex-1 py-3 text-sm font-semibold text-center relative transition-colors duration-200 ${
              activeTab === "mine" ? "text-gray-900" : "text-gray-300"
            }`}
          >
            내 상담
            {activeTab === "mine" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2.5px] bg-gray-900 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("browse")}
            className={`flex-1 py-3 text-sm font-semibold text-center relative transition-colors duration-200 ${
              activeTab === "browse" ? "text-gray-900" : "text-gray-300"
            }`}
          >
            둘러보기
            {activeTab === "browse" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2.5px] bg-gray-900 rounded-full" />
            )}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {activeTab === "mine" ? (
          /* ── 내 상담 탭 ── */
          <>
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
          </>
        ) : (
          /* ── 둘러보기 탭 ── */
          <>
            {publicLoading ? (
              <div className="px-5 pt-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                    <div className="h-5 w-28 bg-gray-100 rounded mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-100 rounded" />
                      <div className="h-4 w-2/3 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : publicConsultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-28 pb-8 px-5">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-5">
                  <MessageCircle className="w-9 h-9 text-gray-200" />
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  아직 공개된 상담이 없어요
                </p>
                <p className="text-sm text-gray-400 text-center leading-relaxed">
                  약사 검증이 완료되면
                  <br />
                  다른 분들의 상담을 볼 수 있어요.
                </p>
              </div>
            ) : (
              <>
                {/* 1단계: 상위 탭 */}
                <div className="border-b border-gray-100">
                  <div className="max-w-lg mx-auto px-5 overflow-x-auto scrollbar-hide">
                    <div className="flex w-max">
                      <button
                        type="button"
                        onClick={() => { setActiveFilterTab(null); setSelectedTag(null); }}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap relative transition-colors duration-200 ${
                          activeFilterTab === null ? "text-gray-900" : "text-gray-300"
                        }`}
                      >
                        전체
                        {activeFilterTab === null && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gray-900 rounded-full" />
                        )}
                      </button>
                      {FILTER_TABS.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => {
                            if (activeFilterTab === tab.key) {
                              setActiveFilterTab(null);
                              setSelectedTag(null);
                            } else {
                              setActiveFilterTab(tab.key);
                              setSelectedTag(null);
                            }
                          }}
                          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap relative transition-colors duration-200 ${
                            activeFilterTab === tab.key ? "text-gray-900" : "text-gray-300"
                          }`}
                        >
                          {tab.label}
                          {activeFilterTab === tab.key && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gray-900 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2단계: 하위 칩 (탭 선택 시 펼쳐짐) */}
                {activeFilterTab && (
                  <div className="bg-gray-50/50 border-b border-gray-100">
                    <div className="max-w-lg mx-auto px-5 py-2.5 overflow-x-auto scrollbar-hide">
                      <div className="flex gap-2 w-max">
                        {FILTER_TABS.find((t) => t.key === activeFilterTab)?.children.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            className={`h-7 px-3 rounded-full text-[0.75rem] font-medium whitespace-nowrap transition-all duration-200 ${
                              selectedTag === tag
                                ? "bg-gray-900 text-white"
                                : "bg-white text-gray-500 border border-gray-200"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 상담 카드 */}
                <div className="px-5 pt-4 space-y-3">
                  {publicConsultations
                    .filter((c) => {
                      if (!activeFilterTab && !selectedTag) return true;
                      const tags = c.tags ?? [];
                      if (selectedTag) return tags.includes(selectedTag);
                      const tab = FILTER_TABS.find((t) => t.key === activeFilterTab);
                      if (!tab) return true;
                      return tags.some((t) => (tab.children as readonly string[]).includes(t));
                    })
                    .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => router.push(`/consultations/public/${c.id}`)}
                      className="w-full bg-white rounded-2xl p-4 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">
                          <ShieldCheck className="w-3 h-3" weight="duotone" />
                          약사 검증 완료
                        </span>
                        <span className="text-[0.6875rem] text-gray-300">
                          {formatDate(c.created_at)}
                        </span>
                      </div>
                      <p
                        className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-2"
                      >
                        {c.content}
                      </p>
                      {(c.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[0.625rem] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                            >
                              {tag}
                            </span>
                          ))}
                          {(c.tags ?? []).length > 3 && (
                            <span className="text-[0.625rem] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                              +{(c.tags ?? []).length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                  {publicConsultations.filter((c) => {
                      if (!activeFilterTab && !selectedTag) return true;
                      const tags = c.tags ?? [];
                      if (selectedTag) return tags.includes(selectedTag);
                      const tab = FILTER_TABS.find((t) => t.key === activeFilterTab);
                      if (!tab) return true;
                      return tags.some((t) => (tab.children as readonly string[]).includes(t));
                    }).length === 0 && (
                    <div className="text-center pt-12 pb-8">
                      <p className="text-sm text-gray-400">해당 조건의 상담이 없어요</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
