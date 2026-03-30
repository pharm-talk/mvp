"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import {
  ArrowLeft,
  Plus,
  Pill,
  Calendar,
  Pencil,
  Trash2,
  Check,
  ChevronRight,
  Camera,
  ImagePlus,
  Loader2,
  X,
  Archive,
} from "lucide-react";

/* -- 영양제 통 아이콘 -- */
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

type MedCategory = "chronic" | "prescription" | "supplement";

interface Medication {
  id: string;
  name: string;
  type: string;
  category: MedCategory;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  archived: boolean;
}

interface AiResult {
  name: string;
  type: string;
  dosage: string;
  frequency: string;
}

const DAILY_COUNT_OPTIONS = ["1회", "2회", "3회", "필요시"];
const TIME_OPTIONS = ["아침", "점심", "저녁", "취침 전", "식전", "식후"];

const CATEGORY_CONFIG: {
  value: MedCategory;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    value: "chronic",
    label: "장기 복용",
    Icon: Calendar,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
  },
  {
    value: "prescription",
    label: "처방약",
    Icon: Pill,
    iconBg: "bg-brand-light",
    iconColor: "text-brand",
  },
  {
    value: "supplement",
    label: "영양제",
    Icon: SupplementBottle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
];

function getCategoryConfig(category: MedCategory) {
  return (
    CATEGORY_CONFIG.find((c) => c.value === category) ?? CATEGORY_CONFIG[1]
  );
}

/* -- 남은 일수 계산 -- */
function getDaysInfo(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const elapsedDays = Math.ceil(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const progress = Math.min(1, Math.max(0, elapsedDays / totalDays));
  const isExpired = now > end;
  return { totalDays, remainingDays, progress, isExpired };
}

function formatDateKR(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function MedicationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<MedCategory>("chronic");

  // 저장된 영양제 리포트
  const [savedReports, setSavedReports] = useState<{ id: string; title: string | null; messages: { role: string; content: string }[]; created_at: string }[]>([]);
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  // AI 분석
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [showAiResults, setShowAiResults] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);

  // 폼
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<MedCategory>("prescription");
  const [formDosage, setFormDosage] = useState("");
  const [formDailyCount, setFormDailyCount] = useState("");
  const [formTimes, setFormTimes] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const fetchMedications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("medications")
        .select("id, name, type, category, dosage, frequency, notes, is_active, start_date, end_date, archived")
        .order("created_at", { ascending: false });
      if (data) {
        setMedications(
          data.map((m: Record<string, unknown>) => ({
            ...m,
            category: (m.category as MedCategory) ?? mapTypeToCategory(m.type as string),
            archived: (m.archived as boolean) ?? false,
            start_date: (m.start_date as string) ?? null,
            end_date: (m.end_date as string) ?? null,
          })) as Medication[]
        );
      }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from("ai_chats")
      .select("id, title, messages, created_at")
      .eq("type", "food_drug")
      .not("title", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setSavedReports(data as typeof savedReports);
  }, [supabase]);

  useEffect(() => {
    fetchMedications();
    fetchReports();
  }, [fetchMedications, fetchReports]);

  const buildFrequencyString = (count: string, times: string[]) => {
    if (!count) return null;
    if (count === "필요시") return "필요시";
    const timePart = times.length > 0 ? ` (${times.join(", ")})` : "";
    return `1일 ${count}${timePart}`;
  };

  const parseFrequencyString = (freq: string | null): { count: string; times: string[] } => {
    if (!freq) return { count: "", times: [] };
    if (freq === "필요시") return { count: "필요시", times: [] };
    const countMatch = freq.match(/1일\s*(\d회)/);
    const timesMatch = freq.match(/\(([^)]+)\)/);
    return {
      count: countMatch ? countMatch[1] : freq.replace(/^매일\s*/, ""),
      times: timesMatch ? timesMatch[1].split(",").map((t) => t.trim()) : [],
    };
  };

  const resetForm = () => {
    setFormName("");
    setFormCategory("prescription");
    setFormDosage("");
    setFormDailyCount("");
    setFormTimes([]);
    setFormNotes("");
    setFormStartDate("");
    setFormEndDate("");
    setEditingId(null);
    setShowForm(false);
    setAiResults([]);
    setShowAiResults(false);
  };

  const openEdit = (med: Medication) => {
    const { count, times } = parseFrequencyString(med.frequency);
    setFormName(med.name);
    setFormCategory(med.category);
    setFormDosage(med.dosage ?? "");
    setFormDailyCount(count);
    setFormTimes(times);
    setFormNotes(med.notes ?? "");
    setFormStartDate(med.start_date ?? "");
    setFormEndDate(med.end_date ?? "");
    setEditingId(med.id);
    setSelectedId(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: formName.trim(),
      type: formCategory === "supplement" ? "supplement" : "medicine",
      category: formCategory,
      dosage: formDosage.trim() || null,
      frequency: buildFrequencyString(formDailyCount, formTimes),
      notes: formNotes.trim() || null,
      start_date: (formCategory === "prescription" || formCategory === "chronic") && formStartDate ? formStartDate : null,
      end_date: formCategory === "prescription" && formEndDate ? formEndDate : null,
      archived: false,
      updated_at: new Date().toISOString(),
    };
    if (editingId) {
      const { error } = await supabase.from("medications").update(payload).eq("id", editingId);
      if (error) {
        console.error("약 수정 실패:", error);
        alert("약 수정에 실패했어요: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("medications")
          .insert({ ...payload, user_id: user.id });
        if (error) {
          console.error("약 등록 실패:", error);
          alert("약 등록에 실패했어요: " + error.message);
          setSaving(false);
          return;
        }
      }
    }
    await fetchMedications();
    resetForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("medications").delete().eq("id", id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setSelectedId(null);
    setDeleting(null);
  };

  const handleArchive = async (id: string) => {
    await supabase
      .from("medications")
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    await fetchMedications();
    setSelectedId(null);
  };

  const handleUnarchive = async (id: string) => {
    await supabase
      .from("medications")
      .update({ archived: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    await fetchMedications();
    setSelectedId(null);
  };

  /* -- AI 사진 분석 -- */
  const handlePhotoAnalysis = async (file: File) => {
    setAnalyzing(true);
    setAiResults([]);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();
      const results: AiResult[] = data.medications ?? [];

      if (results.length === 0) {
        alert("사진에서 약/영양제 정보를 찾지 못했어요.\n다른 사진을 시도해보세요.");
        setAnalyzing(false);
        return;
      }

      if (results.length === 1) {
        const item = results[0];
        setFormName(item.name);
        setFormCategory(classifyAiResult(item));
        setFormDosage(item.dosage);
        const parsed = parseFrequencyString(item.frequency);
        setFormDailyCount(parsed.count);
        setFormTimes(parsed.times);
        setShowForm(true);
      } else {
        setAiResults(results);
        setShowAiResults(true);
      }
    } catch {
      alert("사진 분석 중 오류가 발생했어요.");
    }

    setAnalyzing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoAnalysis(file);
    e.target.value = "";
  };

  /* -- AI 결과 일괄 추가 -- */
  const handleBatchAdd = async (items: AiResult[]) => {
    setBatchSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBatchSaving(false);
      return;
    }

    const rows = items.map((item) => {
      const category = classifyAiResult(item);
      return {
        user_id: user.id,
        name: item.name.trim(),
        type: category === "supplement" ? "supplement" : "medicine",
        category,
        dosage: item.dosage.trim() || null,
        frequency: item.frequency.trim() || null,
        notes: null,
        archived: false,
      };
    });

    await supabase.from("medications").insert(rows);
    await fetchMedications();
    setAiResults([]);
    setShowAiResults(false);
    setBatchSaving(false);
  };


  // 카테고리별 필터링
  const activeMeds = medications.filter((m) => !m.archived);
  const archivedMeds = medications.filter((m) => m.archived);
  const filteredMeds = (showArchived ? archivedMeds : activeMeds).filter(
    (m) => m.category === activeTab
  );

  const countByCategory = (cat: MedCategory) =>
    activeMeds.filter((m) => m.category === cat).length;

  /* === AI 분석 결과 선택 화면 === */
  if (showAiResults && aiResults.length > 0) {
    return (
      <AiResultsScreen
        results={aiResults}
        saving={batchSaving}
        onAddAll={() => handleBatchAdd(aiResults)}
        onAddOne={(item) => {
          setFormName(item.name);
          setFormCategory(classifyAiResult(item));
          setFormDosage(item.dosage);
          const parsed2 = parseFrequencyString(item.frequency);
          setFormDailyCount(parsed2.count);
          setFormTimes(parsed2.times);
          setAiResults([]);
          setShowAiResults(false);
          setShowForm(true);
        }}
        onClose={() => {
          setAiResults([]);
          setShowAiResults(false);
        }}
      />
    );
  }

  /* === 추가/수정 폼 === */
  if (showForm) {
    const categoryLabel = getCategoryConfig(formCategory).label;

    return (
      <div className="min-h-dvh bg-white">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <button
              type="button"
              onClick={resetForm}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-base font-bold text-gray-900">
              {editingId ? `${categoryLabel} 수정` : "추가하기"}
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="max-w-lg mx-auto px-6 pt-6 pb-4">
          {/* AI 사진 입력 (새로 추가할 때만) */}
          {!editingId && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowPhotoSheet(true)}
                disabled={analyzing}
                className="w-full h-14 rounded-2xl border-2 border-dashed border-brand/30 bg-brand-light/30 flex items-center justify-center gap-2.5 active:bg-brand-light/50 transition-all duration-150 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 text-brand animate-spin" />
                    <span className="text-sm font-semibold text-brand">
                      AI가 분석하고 있어요...
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-brand" />
                    <span className="text-sm font-semibold text-brand">
                      사진으로 자동 입력
                    </span>
                  </>
                )}
              </button>
              <p className="text-[0.6875rem] text-gray-400 text-center mt-1.5">
                약 상자, 처방전, 영양제 라벨 등을 촬영하세요
              </p>
            </div>
          )}

          {/* 종류 선택 - 3개 카테고리 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            분류
          </label>
          <div className="flex gap-2 mb-6">
            {CATEGORY_CONFIG.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormCategory(value)}
                className={`flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all duration-150 ${
                  formCategory === value
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-500 active:bg-gray-150"
                }`}
              >
                <Icon className="w-[1.125rem] h-[1.125rem]" />
                {label}
              </button>
            ))}
          </div>

          {/* 제품명 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            제품명 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder={
              formCategory === "chronic" ? "예: 아모디핀, 메트포르민" :
              formCategory === "prescription" ? "예: 아목시실린, 타이레놀" :
              "예: 비타민D, 오메가3"
            }
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
          />

          {/* 1회 복용량 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            1회 복용량
          </label>
          <input
            type="text"
            placeholder="예: 1정, 2캡슐, 1포"
            value={formDosage}
            onChange={(e) => setFormDosage(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
          />

          {/* 하루 복용 횟수 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            하루 복용 횟수
          </label>
          <div className="flex gap-2 mb-4">
            {DAILY_COUNT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFormDailyCount(formDailyCount === opt ? "" : opt)}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-150 ${
                  formDailyCount === opt
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-600 active:bg-gray-150"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* 복용 시간대 (필요시 아니면 표시) */}
          {formDailyCount && formDailyCount !== "필요시" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                복용 시간대
              </label>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((opt) => {
                  const selected = formTimes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setFormTimes(
                          selected
                            ? formTimes.filter((t) => t !== opt)
                            : [...formTimes, opt]
                        )
                      }
                      className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                        selected
                          ? "bg-brand text-white"
                          : "bg-gray-100 text-gray-600 active:bg-gray-150"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 장기 복용: 복용 시작일 */}
          {formCategory === "chronic" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                복용 시작일
                <span className="text-xs text-gray-400 font-normal ml-1">선택</span>
              </label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
              />
              <p className="text-[0.6875rem] text-gray-400 mt-1">언제부터 드시고 있나요?</p>
            </div>
          )}

          {/* 처방약: 복용 기간 */}
          {formCategory === "prescription" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" />
                복용 기간
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">시작일</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">종료일</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 메모 (처방약은 "처방 사유", 나머지는 "메모") */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {formCategory === "prescription" ? "처방 사유" : "메모"}
            <span className="text-xs text-gray-400 font-normal ml-1">선택</span>
          </label>
          <textarea
            placeholder={
              formCategory === "prescription" ? "예: 감기, 장염, 치과 치료" :
              formCategory === "supplement" ? "예: 공복에 복용, 식후 30분" :
              "처방 사유나 특이사항"
            }
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
          />

          {/* 저장 버튼 */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!formName.trim() || saving}
            className="w-full h-12 mt-8 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center active:brightness-95 transition-all duration-150 disabled:opacity-40"
          >
            {saving ? "저장 중..." : editingId ? "수정 완료" : "추가하기"}
          </button>
          <div className="h-10 safe-bottom" />
        </div>

        {/* 사진 선택 바텀시트 (폼 안) */}
        {showPhotoSheet && (
          <PhotoBottomSheet
            onCamera={() => {
              setShowPhotoSheet(false);
              cameraInputRef.current?.click();
            }}
            onAlbum={() => {
              setShowPhotoSheet(false);
              albumInputRef.current?.click();
            }}
            onClose={() => setShowPhotoSheet(false)}
          />
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  /* === 메인 리스트 === */
  return (
    <div className="min-h-dvh bg-surface">
      {/* 숨겨진 파일 인풋 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

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
          <h1 className="text-base font-bold text-gray-900">내 약 서랍</h1>
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              showArchived ? "bg-brand-light" : "active:bg-gray-50"
            }`}
            aria-label={showArchived ? "복용 중 보기" : "복용 기록 보기"}
          >
            <Archive
              className={`w-5 h-5 ${showArchived ? "text-brand" : "text-gray-400"}`}
            />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {/* AI 분석 중 오버레이 */}
        {analyzing && (
          <div className="px-5 pt-5">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-card">
              <Loader2 className="w-5 h-5 text-brand animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  사진을 분석하고 있어요
                </p>
                <p className="text-xs text-gray-400">
                  약/영양제 정보를 자동으로 읽는 중...
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          /* 스켈레톤 */
          <div className="px-5 pt-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center pt-28 pb-8 px-5">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-5">
              <Pill className="w-9 h-9 text-gray-200" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              아직 등록된 약이 없어요
            </p>
            <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
              복용 중인 약이나 영양제를 등록하면
              <br />
              맞춤 상담을 받을 수 있어요
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[16rem]">
              <button
                type="button"
                onClick={() => setShowPhotoSheet(true)}
                disabled={analyzing}
                className="inline-flex items-center justify-center gap-2 h-12 bg-brand text-white font-semibold text-[0.9375rem] rounded-full active:brightness-95 transition-all duration-150 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                사진으로 추가
              </button>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 h-12 bg-white text-gray-700 font-semibold text-[0.9375rem] rounded-full shadow-card active:shadow-none active:scale-[0.98] transition-all duration-150"
              >
                <Plus className="w-5 h-5" />
                직접 입력하기
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <div className="px-5 pt-5 mb-2">
              <div className="bg-white rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">
                      {showArchived ? "복용 기록" : "복용 중인 약/영양제"}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {showArchived ? archivedMeds.length : activeMeds.length}
                      <span className="text-base font-medium text-gray-300 ml-1">개</span>
                    </p>
                  </div>
                  {!showArchived && (
                    <div className="flex gap-5">
                      {CATEGORY_CONFIG.map(({ value, Icon, iconBg, iconColor, label }) => (
                        <div key={value} className="text-center">
                          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-1`}>
                            <Icon className={`w-5 h-5 ${iconColor}`} />
                          </div>
                          <span className="text-[0.625rem] text-gray-400 leading-none whitespace-nowrap">
                            {label}
                          </span>
                          <p className="text-xs font-bold text-gray-700 mt-0.5">{countByCategory(value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="px-5 mb-3">
              <div className="flex bg-gray-100/80 rounded-xl p-1 gap-0.5">
                {CATEGORY_CONFIG.map(({ value, label }) => {
                  const count = showArchived
                    ? archivedMeds.filter((m) => m.category === value).length
                    : countByCategory(value);
                  const isActive = activeTab === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActiveTab(value)}
                      className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1 text-[0.75rem] leading-none font-semibold transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-400 active:text-gray-600"
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className={`text-[0.625rem] ${isActive ? "text-brand" : "text-gray-300"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 영양제 탭: 코디네이터 버튼 */}
            {activeTab === "supplement" && !showArchived && (
              <div className="px-5 mb-3">
                <button
                  type="button"
                  onClick={() => router.push("/supplement-coach")}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 text-orange-600 font-semibold text-sm flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150"
                >
                  영양제 코디네이터
                </button>

                {/* 저장된 리포트 */}
                {savedReports.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {savedReports.map((r) => {
                      const reportContent = r.messages?.[0]?.content ?? "";
                      const preview = reportContent.replace(/\[[^\]]+\]/g, "").trim().slice(0, 60);
                      const date = new Date(r.created_at);
                      const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;

                      return viewingReport === r.id ? (
                        <div key={r.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                          <div className="flex items-center justify-between px-4 pt-3 pb-2">
                            <p className="text-sm font-bold text-gray-900">영양제 리포트</p>
                            <button
                              type="button"
                              onClick={() => setViewingReport(null)}
                              className="text-xs text-gray-400 active:text-gray-600"
                            >
                              접기
                            </button>
                          </div>
                          <div className="px-4 pb-4">
                            <p className="text-[0.8125rem] text-gray-700 leading-relaxed whitespace-pre-line">
                              {reportContent}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setViewingReport(r.id)}
                          className="w-full bg-white rounded-xl px-4 py-3 shadow-card text-left active:scale-[0.99] transition-all duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">
                              리포트 · {dateStr}
                            </p>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{preview || "영양제 분석 결과"}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 약 목록 */}
            {filteredMeds.length > 0 ? (
              <MedSection
                items={filteredMeds}
                category={activeTab}
                selectedId={selectedId}
                deleting={deleting}
                showArchived={showArchived}
                onSelect={setSelectedId}
                onEdit={openEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-5">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-card flex items-center justify-center mb-3">
                  {(() => {
                    const config = getCategoryConfig(activeTab);
                    const CatIcon = config.Icon;
                    return <CatIcon className={`w-7 h-7 text-gray-200`} />;
                  })()}
                </div>
                <p className="text-sm text-gray-400 text-center">
                  {(() => {
                    if (activeTab === "chronic") return showArchived ? "이전 장기 복용약 기록이 없어요" : "등록된 장기 복용약이 없어요";
                    if (activeTab === "prescription") return showArchived ? "이전 처방약 기록이 없어요" : "등록된 처방약이 없어요";
                    return showArchived ? "이전 영양제 기록이 없어요" : "등록된 영양제가 없어요";
                  })()}
                </p>
              </div>
            )}

            {/* 추가 버튼 */}
            {!showArchived && (
              <div className="px-5 mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowPhotoSheet(true)}
                  disabled={analyzing}
                  className="w-full h-12 rounded-2xl bg-brand-light/50 text-brand font-semibold text-sm flex items-center justify-center gap-2 active:bg-brand-light transition-all duration-150 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  사진으로 추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormCategory(activeTab);
                    setShowForm(true);
                  }}
                  className="w-full h-12 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:bg-gray-50 transition-all duration-150"
                >
                  <Plus className="w-4 h-4" />
                  직접 입력하기
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 사진 선택 바텀시트 */}
      {showPhotoSheet && (
        <PhotoBottomSheet
          onCamera={() => {
            setShowPhotoSheet(false);
            cameraInputRef.current?.click();
          }}
          onAlbum={() => {
            setShowPhotoSheet(false);
            albumInputRef.current?.click();
          }}
          onClose={() => setShowPhotoSheet(false)}
        />
      )}

      {/* 삭제 확인 오버레이 */}
      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-end justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 safe-bottom animate-in slide-in-from-bottom">
            <p className="text-center text-base font-semibold text-gray-900 mb-6">
              삭제 중...
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

/* -- AI 결과에서 카테고리 추론 -- */
function classifyAiResult(item: AiResult): MedCategory {
  if (item.type === "supplement") return "supplement";
  // 만성질환 약 관련 키워드
  const chronicKeywords = [
    "혈압",
    "당뇨",
    "콜레스테롤",
    "고혈압",
    "고지혈",
    "갑상선",
    "탈모",
    "피나스테리드",
    "미녹시딜",
    "아스피린",
    "메트포르민",
    "암로디핀",
    "로사르탄",
    "아토르바스타틴",
    "심바스타틴",
    "레보티록신",
  ];
  const name = item.name.toLowerCase();
  if (chronicKeywords.some((kw) => name.includes(kw))) return "chronic";
  return "prescription";
}

/* -- 기존 type을 category로 매핑 (마이그레이션 호환) -- */
function mapTypeToCategory(type: string): MedCategory {
  if (type === "supplement") return "supplement";
  return "prescription";
}

/* -- 사진 선택 바텀시트 -- */
function PhotoBottomSheet({
  onCamera,
  onAlbum,
  onClose,
}: {
  onCamera: () => void;
  onAlbum: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
        <div className="px-5 pb-3">
          <p className="text-base font-bold text-gray-900 mb-4">사진 추가</p>
          <button
            type="button"
            onClick={onCamera}
            className="w-full h-[3.25rem] rounded-xl bg-gray-50 text-left px-4 flex items-center gap-3 active:bg-gray-100 transition-colors mb-2"
          >
            <Camera className="w-5 h-5 text-gray-600" />
            <span className="text-[0.9375rem] font-medium text-gray-900">
              카메라로 촬영
            </span>
          </button>
          <button
            type="button"
            onClick={onAlbum}
            className="w-full h-[3.25rem] rounded-xl bg-gray-50 text-left px-4 flex items-center gap-3 active:bg-gray-100 transition-colors mb-2"
          >
            <ImagePlus className="w-5 h-5 text-gray-600" />
            <span className="text-[0.9375rem] font-medium text-gray-900">
              앨범에서 선택
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl text-gray-400 font-medium text-sm mt-1"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

/* -- AI 분석 결과 선택 화면 -- */
function AiResultsScreen({
  results,
  saving,
  onAddAll,
  onAddOne,
  onClose,
}: {
  results: AiResult[];
  saving: boolean;
  onAddAll: () => void;
  onAddOne: (item: AiResult) => void;
  onClose: () => void;
}) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">분석 결과</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-5 pb-8">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center">
            <Check className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {results.length}개를 찾았어요
            </p>
            <p className="text-xs text-gray-400">추가할 항목을 선택하세요</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-6">
          {results.map((item, idx) => {
            const cat = classifyAiResult(item);
            const config = getCategoryConfig(cat);
            const CatIcon = config.Icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onAddOne(item)}
                className="w-full bg-surface rounded-2xl p-4 text-left active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
                  >
                    <CatIcon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[config.label, item.dosage, item.frequency]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddAll}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              추가하는 중...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {results.length}개 모두 추가
            </>
          )}
        </button>
        <p className="text-[0.6875rem] text-gray-400 text-center mt-2">
          항목을 탭하면 수정 후 개별 추가할 수 있어요
        </p>
      </div>
    </div>
  );
}

/* -- 처방약 진행률 바 -- */
function PrescriptionProgressBar({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}) {
  const info = getDaysInfo(startDate, endDate);
  if (!info) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">
          {formatDateKR(startDate)} ~ {formatDateKR(endDate)}
        </span>
        <span
          className={`font-semibold ${
            info.isExpired ? "text-red-400" : info.remainingDays <= 1 ? "text-orange-500" : "text-brand"
          }`}
        >
          {info.isExpired ? "복용 완료" : `${info.remainingDays}일 남음`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            info.isExpired ? "bg-gray-300" : info.remainingDays <= 1 ? "bg-orange-400" : "bg-brand"
          }`}
          style={{ width: `${Math.round(info.progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

/* -- 섹션 컴포넌트 -- */
function MedSection({
  items,
  category,
  selectedId,
  deleting,
  showArchived,
  onSelect,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
}: {
  items: Medication[];
  category: MedCategory;
  selectedId: string | null;
  deleting: string | null;
  showArchived: boolean;
  onSelect: (id: string | null) => void;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}) {
  const config = getCategoryConfig(category);
  const CatIcon = config.Icon;

  return (
    <div className="px-5 mb-2">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-gray-50">
        {items.map((med) => {
          const isSelected = selectedId === med.id;

          return (
            <div key={med.id}>
              <button
                type="button"
                onClick={() => onSelect(isSelected ? null : med.id)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
                >
                  <CatIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9375rem] font-semibold text-gray-900 truncate">
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[med.dosage, med.frequency].filter(Boolean).join(" · ") ||
                      "복용 정보 미입력"}
                  </p>
                  {category === "prescription" && !showArchived && (
                    <PrescriptionProgressBar
                      startDate={med.start_date}
                      endDate={med.end_date}
                    />
                  )}
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-200 flex-shrink-0 transition-transform duration-200 ${
                    isSelected ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* 확장 영역: 메모 + 수정/삭제/아카이브 */}
              {isSelected && (
                <div className="px-4 pb-3">
                  {med.notes && (
                    <p className="text-sm text-gray-400 bg-surface rounded-xl px-3.5 py-2.5 mb-3">
                      {med.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(med)}
                      className="flex-1 h-9 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium flex items-center justify-center gap-1.5 active:bg-gray-150 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      수정
                    </button>
                    {showArchived ? (
                      <button
                        type="button"
                        onClick={() => onUnarchive(med.id)}
                        className="flex-1 h-9 rounded-xl bg-brand-light text-brand text-sm font-medium flex items-center justify-center gap-1.5 active:bg-brand-light/80 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        복원
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onArchive(med.id)}
                        className="flex-1 h-9 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center gap-1.5 active:bg-gray-150 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        보관
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(med.id)}
                      disabled={deleting === med.id}
                      className="flex-1 h-9 rounded-xl bg-red-50 text-red-500 text-sm font-medium flex items-center justify-center gap-1.5 active:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

