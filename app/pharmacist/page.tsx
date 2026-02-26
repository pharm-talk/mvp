"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  MessageCircle,
  ChevronRight,
  LogOut,
  Pill,
  Inbox,
} from "lucide-react";

type TabKey = "pending" | "mine" | "answered";

interface Consultation {
  id: string;
  content: string;
  type: string;
  status: string;
  pharmacist_id: string | null;
  created_at: string;
  health_snapshot: Record<string, unknown> | null;
  medications_snapshot: Array<{ name: string; type: string }> | null;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "대기 중" },
  { key: "mine", label: "내 상담" },
  { key: "answered", label: "답변 완료" },
];

export default function PharmacistDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [userId, setUserId] = useState<string>("");

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("consultations")
      .select("id, content, type, status, pharmacist_id, created_at, health_snapshot, medications_snapshot")
      .order("created_at", { ascending: false });

    if (data) setConsultations(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filtered = consultations.filter((c) => {
    if (activeTab === "pending") return c.status === "pending";
    if (activeTab === "mine") return c.pharmacist_id === userId && c.status === "assigned";
    return c.pharmacist_id === userId && (c.status === "answered" || c.status === "closed");
  });

  const pendingCount = consultations.filter((c) => c.status === "pending").length;
  const mineCount = consultations.filter(
    (c) => c.pharmacist_id === userId && c.status === "assigned"
  ).length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${month}월 ${day}일 ${hours}:${mins}`;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "방금 전";
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <div className="min-h-dvh bg-surface">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-[1.25rem] font-extrabold tracking-tight text-gray-900">
              팜톡
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-light text-brand text-[0.625rem] font-semibold">
              <ShieldCheck className="w-3 h-3" />
              약사
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* DEV: 유저뷰 전환 */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-7 px-2.5 rounded-full bg-blue-100 text-blue-700 text-[0.625rem] font-bold active:bg-blue-200 transition-colors"
            >
              유저뷰
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors duration-150"
              aria-label="로그아웃"
            >
              <LogOut className="w-[1.1rem] h-[1.1rem] text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-8">
        {/* 요약 카드 */}
        <div className="px-5 pt-5 mb-4">
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <p className="text-sm text-gray-400 mb-3">오늘의 현황</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">대기 중</p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-blue-500">{mineCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">답변 진행</p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-brand">
                  {consultations.filter((c) => c.pharmacist_id === userId && c.status === "answered").length}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">답변 완료</p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="px-5 mb-3">
          <div className="flex bg-white rounded-xl p-1 shadow-card">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  activeTab === tab.key
                    ? "bg-brand text-white"
                    : "text-gray-400 active:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 상담 목록 */}
        {loading ? (
          <div className="px-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
                <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                <div className="h-3 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 px-5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">
              {activeTab === "pending"
                ? "대기 중인 상담이 없어요"
                : activeTab === "mine"
                  ? "진행 중인 상담이 없어요"
                  : "답변 완료된 상담이 없어요"}
            </p>
          </div>
        ) : (
          <div className="px-5 space-y-3">
            {filtered.map((c) => {
              const medCount = c.medications_snapshot?.length ?? 0;
              const typeLabel = c.type === "supplement" ? "영양제" : "복약";

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => router.push(`/pharmacist/consultations/${c.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.type === "supplement"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-brand-light text-brand"
                      }`}>
                        {typeLabel} 상담
                      </span>
                      {c.status === "pending" && (
                        <span className="text-xs text-amber-500 font-medium">
                          {getTimeAgo(c.created_at)}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-200" />
                  </div>
                  <p className="text-[0.9375rem] font-medium text-gray-900 line-clamp-2 mb-2">
                    {c.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {medCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        복용약 {medCount}개
                      </span>
                    )}
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
