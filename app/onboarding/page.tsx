"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, ArrowLeft, Check, Plus, X, Pill, ShieldCheck } from "lucide-react";

type Role = "user" | "pharmacist";
type Gender = "male" | "female";
type PregnancyStatus = "none" | "pregnant" | "nursing";

interface ProfileData {
  role: Role | null;
  licenseNumber: string;
  gender: Gender | null;
  birthYear: string;
  heightCm: string;
  weightKg: string;
  conditions: string[];
  allergies: string[];
  pregnancyStatus: PregnancyStatus;
}

const COMMON_CONDITIONS = [
  "고혈압", "당뇨", "고지혈증", "갑상선질환", "위장질환",
  "간질환", "신장질환", "심장질환", "천식", "관절염",
];

const COMMON_ALLERGIES = [
  "페니실린", "아스피린", "설파제", "해산물",
  "유제품", "견과류", "라텍스", "꽃가루",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfileData>({
    role: null,
    licenseNumber: "",
    gender: null,
    birthYear: "",
    heightCm: "",
    weightKg: "",
    conditions: [],
    allergies: [],
    pregnancyStatus: "none",
  });

  const isPharmacist = data.role === "pharmacist";
  // 약사: 역할선택 → 면허입력 → 완료 (2단계)
  // 유저: 역할선택 → 기본정보 → 건강정보 (3단계)
  const totalSteps = isPharmacist ? 2 : 3;

  const [customCondition, setCustomCondition] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");

  const toggleArrayItem = (field: "conditions" | "allergies", item: string) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((v) => v !== item)
        : [...prev[field], item],
    }));
  };

  const isStepValid = () => {
    if (step === 1) return data.role !== null;
    if (step === 2 && isPharmacist) return data.licenseNumber.trim().length >= 4;
    if (step === 2 && !isPharmacist) {
      return (
        data.gender !== null &&
        data.birthYear.length === 4 &&
        data.heightCm !== "" &&
        data.weightKg !== ""
      );
    }
    return true; // step 3 (건강정보)는 선택
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setSaving(false);
      return;
    }

    const birthDate = data.birthYear.length === 4 ? `${data.birthYear}-01-01` : null;

    const profilePayload: Record<string, unknown> = {
      id: user.id,
      role: data.role,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (isPharmacist) {
      profilePayload.license_number = data.licenseNumber.trim();
    } else {
      profilePayload.gender = data.gender;
      profilePayload.birth_date = birthDate;
      profilePayload.height_cm = data.heightCm ? Number(data.heightCm) : null;
      profilePayload.weight_kg = data.weightKg ? Number(data.weightKg) : null;
      profilePayload.conditions = data.conditions;
      profilePayload.allergies = data.allergies;
      profilePayload.pregnancy_status = data.pregnancyStatus;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (updateError) {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    router.push(isPharmacist ? "/pharmacist" : "/");
  };

  const handleNext = () => {
    if (step === totalSteps) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-dvh bg-white">
      {/* 상단 프로그레스 */}
      <div className="sticky top-0 z-50 bg-white px-6 pt-4 safe-top">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-brand">
            {step}/{totalSteps}
          </span>
          {!isPharmacist && step > 1 && (
            <button
              type="button"
              onClick={() => {
                if (step === totalSteps) handleSubmit();
                else router.push("/");
              }}
              className="text-sm text-gray-300 active:text-gray-500 transition-colors"
            >
              건너뛰기
            </button>
          )}
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* 폼 영역 */}
      <div className="px-6 pt-8 pb-4">
        {/* ── Step 1: 역할 선택 ── */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              어떤 분이세요?
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              맞춤 서비스를 제공하기 위해 필요해요.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setData((prev) => ({ ...prev, role: "user" }))}
                className={`w-full rounded-2xl p-5 text-left transition-all duration-150 ${
                  data.role === "user"
                    ? "bg-brand-light ring-2 ring-brand"
                    : "bg-gray-50 active:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    data.role === "user" ? "bg-brand" : "bg-gray-200"
                  }`}>
                    <Pill className={`w-6 h-6 ${data.role === "user" ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">일반 회원</p>
                    <p className="text-sm text-gray-400 mt-0.5">약사에게 복약 상담을 받고 싶어요</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setData((prev) => ({ ...prev, role: "pharmacist" }))}
                className={`w-full rounded-2xl p-5 text-left transition-all duration-150 ${
                  data.role === "pharmacist"
                    ? "bg-brand-light ring-2 ring-brand"
                    : "bg-gray-50 active:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    data.role === "pharmacist" ? "bg-brand" : "bg-gray-200"
                  }`}>
                    <ShieldCheck className={`w-6 h-6 ${data.role === "pharmacist" ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">약사</p>
                    <p className="text-sm text-gray-400 mt-0.5">상담에 답변하고 싶어요</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 (약사): 면허번호 ── */}
        {step === 2 && isPharmacist && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              약사 면허를 인증해주세요
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              면허번호를 입력하면 인증 후 활동할 수 있어요.
            </p>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              약사 면허번호
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="면허번호를 입력하세요"
              value={data.licenseNumber}
              onChange={(e) =>
                setData((prev) => ({ ...prev, licenseNumber: e.target.value }))
              }
              className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-4"
            />
            <p className="text-xs text-gray-300 leading-relaxed">
              입력하신 면허번호는 한국약사면허 인증에만 사용되며,
              인증이 완료되면 상담 답변이 가능해요.
            </p>
          </div>
        )}

        {/* ── Step 2 (유저): 기본 정보 ── */}
        {step === 2 && !isPharmacist && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              기본 정보를 알려주세요
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              맞춤 복약 상담을 위해 필요해요.
            </p>

            <label className="block text-sm font-semibold text-gray-700 mb-2">성별</label>
            <div className="flex gap-3 mb-6">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, gender: g }))}
                  className={`flex-1 h-12 rounded-xl font-semibold text-[0.9375rem] transition-all duration-150 ${
                    data.gender === g
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-gray-500 active:bg-gray-150"
                  }`}
                >
                  {g === "male" ? "남성" : "여성"}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">출생연도</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="예: 1990"
              value={data.birthYear}
              onChange={(e) => {
                const v = e.target.value.slice(0, 4);
                setData((prev) => ({ ...prev, birthYear: v }));
              }}
              className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">키 (cm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="170"
                  value={data.heightCm}
                  onChange={(e) => setData((prev) => ({ ...prev, heightCm: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">몸무게 (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="65"
                  value={data.weightKg}
                  onChange={(e) => setData((prev) => ({ ...prev, weightKg: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 (유저): 건강 정보 ── */}
        {step === 3 && !isPharmacist && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              건강 정보를 알려주세요
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              해당하는 항목을 선택해주세요. 없으면 넘어가도 돼요.
            </p>

            {/* 보유 질환 */}
            <label className="block text-sm font-semibold text-gray-700 mb-3">보유 질환</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_CONDITIONS.map((item) => {
                const selected = data.conditions.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem("conditions", item)}
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
              {data.conditions
                .filter((c) => !COMMON_CONDITIONS.includes(c))
                .map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem("conditions", item)}
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
                    if (!data.conditions.includes(customCondition.trim())) {
                      setData((prev) => ({
                        ...prev,
                        conditions: [...prev.conditions, customCondition.trim()],
                      }));
                    }
                    setCustomCondition("");
                  }
                }}
                className="flex-1 h-9 rounded-full border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => {
                  if (customCondition.trim() && !data.conditions.includes(customCondition.trim())) {
                    setData((prev) => ({
                      ...prev,
                      conditions: [...prev.conditions, customCondition.trim()],
                    }));
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
                const selected = data.allergies.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem("allergies", item)}
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
              {data.allergies
                .filter((a) => !COMMON_ALLERGIES.includes(a))
                .map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem("allergies", item)}
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
                    if (!data.allergies.includes(customAllergy.trim())) {
                      setData((prev) => ({
                        ...prev,
                        allergies: [...prev.allergies, customAllergy.trim()],
                      }));
                    }
                    setCustomAllergy("");
                  }
                }}
                className="flex-1 h-9 rounded-full border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => {
                  if (customAllergy.trim() && !data.allergies.includes(customAllergy.trim())) {
                    setData((prev) => ({
                      ...prev,
                      allergies: [...prev.allergies, customAllergy.trim()],
                    }));
                    setCustomAllergy("");
                  }
                }}
                className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors duration-150 flex-shrink-0"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* 임신/수유 여부 */}
            {data.gender === "female" && (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  임신/수유 여부
                </label>
                <div className="flex gap-2">
                  {([
                    { value: "none", label: "해당 없음" },
                    { value: "pregnant", label: "임신 중" },
                    { value: "nursing", label: "수유 중" },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, pregnancyStatus: value }))}
                      className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-150 ${
                        data.pregnancyStatus === value
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
          </div>
        )}

        {/* 버튼 */}
        {error && (
          <p className="text-sm text-red-500 text-center mt-6 mb-2">{error}</p>
        )}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-150 transition-all duration-150"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepValid() || saving}
            className="flex-1 h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-40"
          >
            {step === totalSteps
              ? saving
                ? "저장 중..."
                : "시작하기"
              : "다음"}
            {step < totalSteps && !saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="h-10 safe-bottom" />
      </div>
    </div>
  );
}
