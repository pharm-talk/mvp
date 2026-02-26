"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import {
  ShieldCheck,
  Bell,
  ArrowRight,
  ChevronRight,
  BriefcaseMedical,
  MessageCircle,
  MapPin,
  Plus,
  Clock,
  Star,
  Timer,
  Activity,
  Pill,
  MessagesSquare,
  LogOut,
} from "lucide-react";

/* ── 영양제 통 아이콘 (Lucide에 없어서 직접 제작) ── */
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

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [medCount, setMedCount] = useState<number>(0);
  const [consultCount, setConsultCount] = useState<number>(0);

  const fetchCounts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [medsRes, consultsRes] = await Promise.all([
      supabase
        .from("medications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["pending", "assigned"]),
    ]);

    setMedCount(medsRes.count ?? 0);
    setConsultCount(consultsRes.count ?? 0);
  }, [supabase]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-white">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <span className="text-[1.25rem] font-extrabold tracking-tight text-gray-900">
              팜톡
            </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => router.push("/notifications")}
              className="relative w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors duration-150"
              aria-label="알림"
            >
              <Bell className="w-[1.2rem] h-[1.2rem] text-gray-500" />
              {consultCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
            {/* DEV: 약사 대시보드 전환 */}
            <button
              type="button"
              onClick={() => router.push("/pharmacist")}
              className="h-7 px-2.5 rounded-full bg-amber-100 text-amber-700 text-[0.625rem] font-bold active:bg-amber-200 transition-colors"
            >
              약사뷰
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

      {/* ─── Main ─── */}
      <main className="max-w-lg mx-auto pb-24">
        {/* ── Hero Banner ── */}
        <section className="px-5 pt-4">
          <div className="bg-gradient-to-br from-[#16B364] to-[#0D9488] rounded-2xl px-6 py-6 text-white">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              지금 상담 가능
            </div>
            <h1 className="text-[1.375rem] font-bold leading-snug mb-1.5">
              복용 중인 약, 궁금한 건
              <br />
              약사에게 물어보세요
            </h1>
            <p className="text-[0.8125rem] text-white/70 mb-5">
              면허 인증 약사의 맞춤 복약 상담
            </p>
            <button
              type="button"
              onClick={() => router.push("/consultations/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand font-semibold text-sm rounded-full active:scale-[0.97] transition-transform duration-150"
            >
              상담 시작하기
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ── Trust Stats ── */}
        <section className="px-5 py-4">
          <div className="flex items-center justify-between px-1">
            <StatPill icon={<ShieldCheck className="w-3.5 h-3.5 text-brand" />} value="100%" label="인증 약사" />
            <div className="w-px h-6 bg-gray-100" />
            <StatPill icon={<MessagesSquare className="w-3.5 h-3.5 text-blue-500" />} value="2.3만+" label="상담 완료" />
            <div className="w-px h-6 bg-gray-100" />
            <StatPill icon={<Clock className="w-3.5 h-3.5 text-amber-500" />} value="12시간" label="평균 답변" />
            <div className="w-px h-6 bg-gray-100" />
            <StatPill icon={<Star className="w-3.5 h-3.5 text-yellow-400" />} value="4.9" label="만족도" />
          </div>
        </section>

        {/* ── 서비스 그리드 (2x2) ── */}
        <section className="px-5 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <ServiceCard
              icon={<Pill className="w-6 h-6" />}
              iconBg="bg-brand-light"
              iconColor="text-brand"
              title="복약 상담"
              desc="처방약 궁합 검토"
              onClick={() => router.push("/consultations/new?type=medication")}
            />
            <ServiceCard
              icon={<SupplementBottle className="w-6 h-6" />}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              title="영양제 상담"
              desc="영양제 조합 추천"
              onClick={() => router.push("/consultations/new?type=supplement")}
            />
            <ServiceCard
              icon={<MessageCircle className="w-6 h-6" />}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              title="약사에게 질문"
              desc="간단한 증상 상담"
              onClick={() => router.push("/consultations/new")}
            />
            <ServiceCard
              icon={<MapPin className="w-6 h-6" />}
              iconBg="bg-rose-50"
              iconColor="text-rose-500"
              title="내 주변 약국"
              desc="가까운 약국 찾기"
              onClick={() => router.push("/pharmacy")}
            />
          </div>
        </section>

        {/* ── 내 현황 ── */}
        <section className="bg-surface py-6 px-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">내 현황</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => router.push("/medications")}
              className="bg-white rounded-2xl p-4 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-3">
                <BriefcaseMedical className="w-5 h-5 text-brand" />
              </div>
              <p className="text-xs text-gray-400 mb-0.5">내 약 서랍</p>
              <p className="text-2xl font-bold text-gray-900 mb-3">
                {medCount}<span className="text-sm font-medium text-gray-300 ml-0.5">개</span>
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                <Plus className="w-3.5 h-3.5" />
                {medCount === 0 ? "약 등록하기" : "약 서랍 보기"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/consultations")}
              className="bg-white rounded-2xl p-4 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-400 mb-0.5">진행 중 상담</p>
              <p className="text-2xl font-bold text-gray-900 mb-3">
                {consultCount}<span className="text-sm font-medium text-gray-300 ml-0.5">건</span>
              </p>
              <span className="text-xs text-gray-300">
                {consultCount === 0 ? "상담을 시작해보세요" : "상담 목록 보기"}
              </span>
            </button>
          </div>
        </section>

        {/* ── 왜 팜톡인가요? ── */}
        <section className="px-5 py-2">
          <h2 className="text-base font-bold text-gray-900 mb-3">왜 팜톡인가요?</h2>
          <div className="space-y-2.5">
            <FeatureRow
              icon={<ShieldCheck className="w-5 h-5" />}
              iconBg="bg-brand-light"
              iconColor="text-brand"
              title="100% 면허 인증 약사"
              desc="모든 약사의 면허를 철저히 검증해요"
            />
            <FeatureRow
              icon={<Timer className="w-5 h-5" />}
              iconBg="bg-amber-50"
              iconColor="text-amber-500"
              title="평균 12시간 내 답변"
              desc="빠르고 상세한 답변을 받아보세요"
            />
            <FeatureRow
              icon={<Activity className="w-5 h-5" />}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              title="맞춤 복약 분석"
              desc="영양제 · 처방약 조합을 꼼꼼히 분석해요"
            />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

/* ═══════════════════════════════════════════
   서브 컴포넌트
   ═══════════════════════════════════════════ */

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-sm font-bold text-gray-900">{value}</span>
      </div>
      <span className="text-[0.625rem] text-gray-400">{label}</span>
    </div>
  );
}

function ServiceCard({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150"
    >
      <div
        className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-3`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-[0.9375rem] font-bold text-gray-900 mb-0.5">
        {title}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{desc}</p>
        <ChevronRight className="w-4 h-4 text-gray-200" />
      </div>
    </button>
  );
}

function FeatureRow({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-surface">
      <div
        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
