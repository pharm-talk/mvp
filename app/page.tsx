"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import {
  Bell,
  ArrowRight,
  ChevronRight,
  Users,
  LogOut,
  Clock,
  Pill,
  BriefcaseMedical,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Timer,
  Activity,
  Calendar,
} from "lucide-react";
import { Robot } from "@phosphor-icons/react";
import type { PublicConsultationPreview } from "@/types/consultation";

/* ── 영양제 통 아이콘 ── */
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

interface MedCounts {
  chronic: number;
  prescription: number;
  supplement: number;
}

interface FamilyMember {
  nickname: string;
  medCount: number;
}

interface RecentConsultation {
  id: string;
  content: string;
  status: string;
  ai_report: string | null;
  verified_at: string | null;
  created_at: string;
}

interface HealthInfo {
  gender: string | null;
  age: number | null;
  conditions: string[];
}

/* ── Skeleton ── */
function HomePageSkeleton() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <div className="h-5 w-12 bg-gray-100 rounded-lg animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto pb-24">
        <section className="px-5 pt-4">
          <div className="w-full h-[180px] bg-gray-100 rounded-2xl animate-pulse" />
        </section>
        <section className="px-5 pt-3">
          <div className="h-14 bg-white rounded-2xl shadow-card animate-pulse" />
        </section>
        <section className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

/* ── Page ── */
export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [medCounts, setMedCounts] = useState<MedCounts>({ chronic: 0, prescription: 0, supplement: 0 });
  const [consultCount, setConsultCount] = useState(0);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [hasHealthInfo, setHasHealthInfo] = useState(true);
  const [healthInfo, setHealthInfo] = useState<HealthInfo>({ gender: null, age: null, conditions: [] });
  const [publicConsultations, setPublicConsultations] = useState<PublicConsultationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [medsRes, consultsRes, familyRes, recentRes, profileRes, publicRes] = await Promise.all([
      supabase.from("medications").select("category").eq("user_id", user.id).eq("archived", false),
      supabase.from("consultations").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["pending", "assigned"]),
      supabase.from("family_members").select("group_id, nickname").eq("user_id", user.id),
      supabase.from("consultations").select("id, content, status, ai_report, verified_at, created_at").eq("user_id", user.id).in("status", ["pending", "assigned", "answered"]).order("created_at", { ascending: false }).limit(3),
      supabase.from("profiles").select("gender, birth_date, conditions, allergies").eq("id", user.id).single(),
      supabase.from("consultations").select("id, content, verified_at, created_at, tags").not("verified_at", "is", null).order("verified_at", { ascending: false }).limit(3),
    ]);

    // 건강정보
    if (profileRes.data) {
      const p = profileRes.data;
      const filled = p.gender || p.birth_date || (p.conditions && p.conditions.length > 0);
      setHasHealthInfo(!!filled);
      if (filled) {
        const age = p.birth_date ? new Date().getFullYear() - new Date(p.birth_date).getFullYear() : null;
        setHealthInfo({ gender: p.gender, age, conditions: p.conditions ?? [] });
      }
    } else {
      setHasHealthInfo(false);
    }

    const meds = medsRes.data ?? [];
    setMedCounts({
      chronic: meds.filter((m) => m.category === "chronic").length,
      prescription: meds.filter((m) => m.category === "prescription").length,
      supplement: meds.filter((m) => m.category === "supplement").length,
    });
    setConsultCount(consultsRes.count ?? 0);
    setRecentConsultations((recentRes.data as RecentConsultation[]) ?? []);
    setPublicConsultations((publicRes.data as PublicConsultationPreview[]) ?? []);

    if (familyRes.data && familyRes.data.length > 0) {
      const groupIds = [...new Set(familyRes.data.map((f) => f.group_id))];
      const { data: otherMembers } = await supabase.from("family_members").select("user_id, nickname").in("group_id", groupIds).neq("user_id", user.id);
      if (otherMembers && otherMembers.length > 0) {
        const uniqueMembers = otherMembers.reduce<Record<string, string>>((acc, m) => {
          if (!acc[m.user_id]) acc[m.user_id] = m.nickname ?? "가족";
          return acc;
        }, {});
        const memberIds = Object.keys(uniqueMembers);
        const { data: memberMeds } = await supabase.from("medications").select("user_id").in("user_id", memberIds).eq("archived", false);
        const memberMedCounts = (memberMeds ?? []).reduce<Record<string, number>>((acc, m) => {
          acc[m.user_id] = (acc[m.user_id] ?? 0) + 1;
          return acc;
        }, {});
        setFamilyMembers(memberIds.map((id) => ({ nickname: uniqueMembers[id], medCount: memberMedCounts[id] ?? 0 })));
      }
    }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const totalMeds = medCounts.chronic + medCounts.prescription + medCounts.supplement;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const getConsultStatus = (c: RecentConsultation) => {
    if (c.verified_at) return { label: "약사 검증 완료", color: "bg-brand-light text-brand", icon: <ShieldCheck className="w-3 h-3" /> };
    if (c.ai_report) return { label: "AI 분석 완료", color: "bg-blue-50 text-blue-600", icon: <Robot size={12} weight="duotone" /> };
    return { label: "분석 중", color: "bg-amber-50 text-amber-600", icon: <Clock className="w-3 h-3" /> };
  };

  if (loading) return <HomePageSkeleton />;

  return (
    <div className="min-h-dvh bg-surface">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <img src="/logo-flat-logos/png-512.png" alt="팜톡" className="h-20" />
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => router.push("/notifications")} className="relative w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors" aria-label="알림">
              <Bell className="w-[1.2rem] h-[1.2rem] text-gray-500" />
              {consultCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            <button type="button" onClick={() => router.push("/pharmacist")} className="h-9 px-3 rounded-full bg-amber-100 text-amber-700 text-xs font-bold active:bg-amber-200 transition-colors">약사뷰</button>
            <button type="button" onClick={handleLogout} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors" aria-label="로그아웃">
              <LogOut className="w-[1.1rem] h-[1.1rem] text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {/* ── 약 서랍 히어로 ── */}
        <section className="px-5 pt-4">
          <button
            type="button"
            onClick={() => router.push("/medications")}
            className="w-full bg-gradient-to-br from-[#16B364] to-[#0D9488] rounded-2xl px-6 py-5 text-left active:scale-[0.99] transition-transform duration-150"
          >
            {totalMeds > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-xs font-medium mb-1">내 약 서랍</p>
                    <p className="text-white text-[1.75rem] font-bold leading-none">
                      {totalMeds}<span className="text-base font-medium text-white/50 ml-1">개</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <BriefcaseMedical className="w-5 h-5 text-white/80" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {[
                    { label: "장기 복용", count: medCounts.chronic },
                    { label: "처방약", count: medCounts.prescription },
                    { label: "영양제", count: medCounts.supplement },
                  ].map((item) => (
                    <div key={item.label} className="flex-1 bg-white/10 rounded-xl py-2.5 text-center">
                      <p className="text-base font-bold text-white leading-none">{item.count}</p>
                      <p className="text-[0.625rem] text-white/50 mt-1 leading-none whitespace-nowrap">{item.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-[0.6875rem] mt-3 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  AI 상호작용 체크 · 약사 검증 지원
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-[0.6875rem] font-medium text-white/90 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  내 약 서랍
                </div>
                <h2 className="text-[1.25rem] font-bold text-white leading-snug mb-1">
                  처방전 사진 한 장이면
                  <br />
                  약 등록부터 상호작용 체크까지
                </h2>
                <p className="text-white/60 text-[0.8125rem] mb-4">AI 분석 + 면허 약사 검증</p>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand font-semibold text-sm rounded-full">
                  시작하기
                  <ArrowRight className="w-4 h-4" />
                </span>
              </>
            )}
          </button>
        </section>

        {/* ── 내 건강정보 ── */}
        <section className="px-5 pt-3">
          <button
            type="button"
            onClick={() => router.push("/my")}
            className="w-full bg-white rounded-2xl px-4 py-3.5 shadow-card text-left active:scale-[0.99] transition-all duration-150"
          >
            {hasHealthInfo ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
                  <Activity className="w-[1.125rem] h-[1.125rem] text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] font-semibold text-gray-800">내 건강정보</p>
                  <p className="text-[0.6875rem] text-gray-400 mt-0.5 truncate">
                    {[
                      healthInfo.gender === "male" ? "남성" : healthInfo.gender === "female" ? "여성" : null,
                      healthInfo.age ? `${healthInfo.age}세` : null,
                      ...healthInfo.conditions.slice(0, 2),
                    ].filter(Boolean).join(" · ") || "정보를 확인하세요"}
                    {healthInfo.conditions.length > 2 && ` 외 ${healthInfo.conditions.length - 2}개`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-[1.125rem] h-[1.125rem] text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] font-semibold text-gray-800">건강정보 등록하기</p>
                  <p className="text-[0.6875rem] text-gray-400 mt-0.5">더 정확한 분석을 받을 수 있어요</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
              </div>
            )}
          </button>
        </section>

        {/* ── 빠른 실행 ── */}
        <section className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <button type="button" onClick={() => router.push("/medications")} className="bg-white rounded-2xl p-4 shadow-card flex flex-col items-center gap-2.5 active:scale-[0.97] transition-all duration-150">
              <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center">
                <Pill className="w-6 h-6 text-brand" />
              </div>
              <span className="text-xs font-semibold text-gray-700">약 등록</span>
            </button>
            <button type="button" onClick={() => router.push("/consultations/new")} className="bg-white rounded-2xl p-4 shadow-card flex flex-col items-center gap-2.5 active:scale-[0.97] transition-all duration-150">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-gray-700">상담하기</span>
            </button>
            <button type="button" onClick={() => router.push("/pharmacy")} className="bg-white rounded-2xl p-4 shadow-card flex flex-col items-center gap-2.5 active:scale-[0.97] transition-all duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-rose-500" />
              </div>
              <span className="text-xs font-semibold text-gray-700">약국 찾기</span>
            </button>
          </div>
        </section>

        {/* ── 영양제 코디네이터 ── */}
        <section className="px-5 pt-3">
          <button
            type="button"
            onClick={() => router.push("/supplement-coach")}
            className="w-full bg-white rounded-2xl shadow-card px-5 py-4 text-left active:scale-[0.99] transition-all duration-150"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <SupplementBottle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.9375rem] font-bold text-gray-900">영양제 코디네이터</p>
                <p className="text-xs text-gray-400 mt-0.5">내 약과 건강 상태에 맞는 영양제 추천</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
            </div>
          </button>
        </section>

        {/* ── 진행 중 상담 ── */}
        {recentConsultations.length > 0 && (
          <section className="px-5 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[0.9375rem] font-bold text-gray-900">진행 중 상담</h2>
              <button type="button" onClick={() => router.push("/consultations")} className="text-xs text-gray-400 font-medium flex items-center gap-0.5">
                전체보기 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {recentConsultations.map((c) => {
                const s = getConsultStatus(c);
                return (
                  <button key={c.id} type="button" onClick={() => router.push(`/consultations/${c.id}`)} className="w-full bg-white rounded-2xl p-4 shadow-card text-left active:scale-[0.99] transition-all duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.icon}{s.label}</span>
                      <span className="text-[0.6875rem] text-gray-300">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{c.content}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 가족 현황 ── */}
        {familyMembers.length > 0 && (
          <section className="px-5 pt-5">
            <button type="button" onClick={() => router.push("/family")} className="w-full bg-white rounded-2xl p-4 shadow-card text-left active:scale-[0.99] transition-all duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">가족 약 서랍</p>
                  <p className="text-xs text-gray-400 truncate">{familyMembers.map((m) => m.nickname).join(", ")}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
              </div>
            </button>
          </section>
        )}

        {/* ── 다른 분들의 상담 ── */}
        {publicConsultations.length > 0 && (
          <section className="px-5 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[0.9375rem] font-bold text-gray-900">다른 분들의 상담</h2>
              <button type="button" onClick={() => router.push("/consultations?tab=browse")} className="text-xs text-gray-400 font-medium flex items-center gap-0.5">
                더보기 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {publicConsultations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => router.push(`/consultations/public/${c.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-card text-left active:scale-[0.99] transition-all duration-150"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">
                      <ShieldCheck className="w-3 h-3" />
                      약사 검증 완료
                    </span>
                    <span className="text-[0.6875rem] text-gray-300">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{c.content}</p>
                  {(c.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.tags ?? []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[0.625rem] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 팜톡이 특별한 이유 ── */}
        <section className="px-5 pt-5 pb-2">
          <h2 className="text-[0.9375rem] font-bold text-gray-900 mb-3">팜톡이 특별한 이유</h2>
          <div className="space-y-2">
            <FeatureRow icon={<Activity className="w-[1.125rem] h-[1.125rem]" />} iconBg="bg-blue-50" iconColor="text-blue-500" title="AI가 즉시 분석, 약사가 검증" desc="AI 리포트 후 면허 약사가 직접 검증" />
            <FeatureRow icon={<ShieldCheck className="w-[1.125rem] h-[1.125rem]" />} iconBg="bg-brand-light" iconColor="text-brand" title="100% 면허 인증 약사" desc="모든 약사의 면허를 철저히 검증" />
            <FeatureRow icon={<Timer className="w-[1.125rem] h-[1.125rem]" />} iconBg="bg-amber-50" iconColor="text-amber-500" title="빠른 답변" desc="AI 즉시, 약사 검증 평균 12시간 내" />
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

function FeatureRow({ icon, iconBg, iconColor, title, desc }: { icon: React.ReactNode; iconBg: string; iconColor: string; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
