"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import {
  ArrowLeft,
  ChevronRight,
  Pencil,
  Check,
  Plus,
  X,
  BriefcaseMedical,
  MessagesSquare,
  LogOut,
  User,
  Ruler,
  Calendar,
} from "lucide-react";

type Gender = "male" | "female";
type PregnancyStatus = "none" | "pregnant" | "nursing";

interface Profile {
  gender: Gender | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  conditions: string[];
  allergies: string[];
  pregnancy_status: PregnancyStatus;
}

const COMMON_CONDITIONS = [
  "고혈압", "당뇨", "고지혈증", "갑상선질환", "위장질환",
  "간질환", "신장질환", "심장질환", "천식", "관절염",
];

const COMMON_ALLERGIES = [
  "페니실린", "아스피린", "설파제", "해산물",
  "유제품", "견과류", "라텍스", "꽃가루",
];

export default function MyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");

  // 편집 폼 상태
  const [formGender, setFormGender] = useState<Gender | null>(null);
  const [formBirthYear, setFormBirthYear] = useState("");
  const [formHeight, setFormHeight] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formConditions, setFormConditions] = useState<string[]>([]);
  const [formAllergies, setFormAllergies] = useState<string[]>([]);
  const [formPregnancy, setFormPregnancy] = useState<PregnancyStatus>("none");
  const [customCondition, setCustomCondition] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email ?? "");

    const { data } = await supabase
      .from("profiles")
      .select("gender, birth_date, height_cm, weight_kg, conditions, allergies, pregnancy_status")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const startEdit = () => {
    if (!profile) return;
    setFormGender(profile.gender);
    setFormBirthYear(profile.birth_date ? profile.birth_date.split("-")[0] : "");
    setFormHeight(profile.height_cm?.toString() ?? "");
    setFormWeight(profile.weight_kg?.toString() ?? "");
    setFormConditions([...profile.conditions]);
    setFormAllergies([...profile.allergies]);
    setFormPregnancy(profile.pregnancy_status ?? "none");
    setCustomCondition("");
    setCustomAllergy("");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const birthDate = formBirthYear.length === 4 ? `${formBirthYear}-01-01` : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        gender: formGender,
        birth_date: birthDate,
        height_cm: formHeight ? Number(formHeight) : null,
        weight_kg: formWeight ? Number(formWeight) : null,
        conditions: formConditions,
        allergies: formAllergies,
        pregnancy_status: formPregnancy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      await fetchProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const toggleArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
    item: string
  ) => {
    setter(list.includes(item) ? list.filter((v) => v !== item) : [...list, item]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getBirthYear = () => profile?.birth_date?.split("-")[0] ?? null;
  const getAge = () => {
    const year = getBirthYear();
    if (!year) return null;
    return new Date().getFullYear() - Number(year) + 1;
  };

  /* ━━━ 건강정보 수정 모드 ━━━ */
  if (editing) {
    return (
      <div className="min-h-dvh bg-white">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
              aria-label="취소"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-base font-bold text-gray-900">건강정보 수정</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="max-w-lg mx-auto px-6 pt-6 pb-4">
          {/* 성별 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">성별</label>
          <div className="flex gap-3 mb-6">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFormGender(g)}
                className={`flex-1 h-12 rounded-xl font-semibold text-[0.9375rem] transition-all duration-150 ${
                  formGender === g
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-500 active:bg-gray-150"
                }`}
              >
                {g === "male" ? "남성" : "여성"}
              </button>
            ))}
          </div>

          {/* 출생연도 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">출생연도</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="예: 1990"
            value={formBirthYear}
            onChange={(e) => setFormBirthYear(e.target.value.slice(0, 4))}
            className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
          />

          {/* 키 / 몸무게 */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">키 (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="170"
                value={formHeight}
                onChange={(e) => setFormHeight(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">몸무게 (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="65"
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
              />
            </div>
          </div>

          {/* 보유 질환 */}
          <label className="block text-sm font-semibold text-gray-700 mb-3">보유 질환</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_CONDITIONS.map((item) => {
              const selected = formConditions.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem(setFormConditions, formConditions, item)}
                  className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                    selected
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-150"
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {item}
                </button>
              );
            })}
            {formConditions
              .filter((c) => !COMMON_CONDITIONS.includes(c))
              .map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem(setFormConditions, formConditions, item)}
                  className="h-9 px-4 rounded-full text-sm font-medium bg-brand text-white transition-all duration-150 flex items-center gap-1"
                >
                  {item}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
          </div>
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              placeholder="직접 입력"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customCondition.trim()) {
                  e.preventDefault();
                  if (!formConditions.includes(customCondition.trim())) {
                    setFormConditions((prev) => [...prev, customCondition.trim()]);
                  }
                  setCustomCondition("");
                }
              }}
              className="flex-1 h-9 rounded-full border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
            />
            <button
              type="button"
              onClick={() => {
                if (customCondition.trim() && !formConditions.includes(customCondition.trim())) {
                  setFormConditions((prev) => [...prev, customCondition.trim()]);
                  setCustomCondition("");
                }
              }}
              className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors duration-150 flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* 알레르기 */}
          <label className="block text-sm font-semibold text-gray-700 mb-3">알레르기</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_ALLERGIES.map((item) => {
              const selected = formAllergies.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem(setFormAllergies, formAllergies, item)}
                  className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                    selected
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-150"
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {item}
                </button>
              );
            })}
            {formAllergies
              .filter((a) => !COMMON_ALLERGIES.includes(a))
              .map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem(setFormAllergies, formAllergies, item)}
                  className="h-9 px-4 rounded-full text-sm font-medium bg-brand text-white transition-all duration-150 flex items-center gap-1"
                >
                  {item}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
          </div>
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              placeholder="직접 입력"
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customAllergy.trim()) {
                  e.preventDefault();
                  if (!formAllergies.includes(customAllergy.trim())) {
                    setFormAllergies((prev) => [...prev, customAllergy.trim()]);
                  }
                  setCustomAllergy("");
                }
              }}
              className="flex-1 h-9 rounded-full border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
            />
            <button
              type="button"
              onClick={() => {
                if (customAllergy.trim() && !formAllergies.includes(customAllergy.trim())) {
                  setFormAllergies((prev) => [...prev, customAllergy.trim()]);
                  setCustomAllergy("");
                }
              }}
              className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors duration-150 flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* 임신/수유 여부 */}
          {formGender === "female" && (
            <>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                임신/수유 여부
              </label>
              <div className="flex gap-2 mb-8">
                {([
                  { value: "none", label: "해당 없음" },
                  { value: "pregnant", label: "임신 중" },
                  { value: "nursing", label: "수유 중" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormPregnancy(value)}
                    className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-150 ${
                      formPregnancy === value
                        ? "bg-brand text-white"
                        : "bg-gray-100 text-gray-600 active:bg-gray-150"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 저장 버튼 */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "저장하기"}
            {!saving && <Check className="w-4 h-4" />}
          </button>
          <div className="h-10 safe-bottom" />
        </div>
      </div>
    );
  }

  /* ━━━ 메인 프로필 화면 ━━━ */
  return (
    <div className="min-h-dvh bg-surface">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">마이페이지</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {loading ? (
          /* 스켈레톤 */
          <div className="px-5 pt-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-44 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-20 bg-gray-100 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 프로필 카드 */}
            <div className="px-5 pt-5">
              <div className="bg-white rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                    <User className="w-7 h-7 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {email ? email.split("@")[0] : "사용자"}
                    </p>
                    <p className="text-sm text-gray-400 truncate">{email}</p>
                  </div>
                </div>

                {/* 기본 정보 요약 */}
                {profile && (profile.gender || profile.birth_date || profile.height_cm) && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    {profile.gender && (
                      <InfoChip
                        icon={<User className="w-3.5 h-3.5" />}
                        text={profile.gender === "male" ? "남성" : "여성"}
                      />
                    )}
                    {getAge() && (
                      <InfoChip
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        text={`${getAge()}세`}
                      />
                    )}
                    {profile.height_cm && profile.weight_kg && (
                      <InfoChip
                        icon={<Ruler className="w-3.5 h-3.5" />}
                        text={`${profile.height_cm}cm · ${profile.weight_kg}kg`}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 건강정보 */}
            <div className="px-5 mt-4">
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h2 className="text-sm font-bold text-gray-900">건강정보</h2>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex items-center gap-1 text-sm font-semibold text-brand active:opacity-70 transition-opacity"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    수정
                  </button>
                </div>

                <div className="px-5 pb-5 space-y-4">
                  {/* 보유 질환 */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">보유 질환</p>
                    {profile?.conditions && profile.conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.conditions.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center h-7 px-3 rounded-full bg-red-50 text-red-600 text-xs font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300">등록된 질환이 없어요</p>
                    )}
                  </div>

                  {/* 알레르기 */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">알레르기</p>
                    {profile?.allergies && profile.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.allergies.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center h-7 px-3 rounded-full bg-amber-50 text-amber-600 text-xs font-medium"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300">등록된 알레르기가 없어요</p>
                    )}
                  </div>

                  {/* 임신/수유 */}
                  {profile?.gender === "female" && profile.pregnancy_status !== "none" && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">임신/수유</p>
                      <span className="inline-flex items-center h-7 px-3 rounded-full bg-pink-50 text-pink-600 text-xs font-medium">
                        {profile.pregnancy_status === "pregnant" ? "임신 중" : "수유 중"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 메뉴 */}
            <div className="px-5 mt-4">
              <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-gray-50">
                <MenuItem
                  icon={<BriefcaseMedical className="w-5 h-5 text-brand" />}
                  iconBg="bg-brand-light"
                  label="내 약 서랍"
                  onClick={() => router.push("/medications")}
                />
                <MenuItem
                  icon={<MessagesSquare className="w-5 h-5 text-blue-500" />}
                  iconBg="bg-blue-50"
                  label="상담 내역"
                  onClick={() => router.push("/consultations")}
                />
              </div>
            </div>

            {/* 로그아웃 */}
            <div className="px-5 mt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-white rounded-2xl shadow-card px-5 py-4 flex items-center gap-3.5 active:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-[0.9375rem] font-medium text-gray-500">로그아웃</span>
              </button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/* ── 서브 컴포넌트 ── */

function InfoChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500">
      <span className="text-gray-300">{icon}</span>
      {text}
    </div>
  );
}

function MenuItem({
  icon,
  iconBg,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-5 py-4 active:bg-gray-50 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <span className="flex-1 text-[0.9375rem] font-semibold text-gray-900 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
    </button>
  );
}
