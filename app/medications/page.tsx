"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import {
  ArrowLeft,
  Plus,
  Pill,
  Pencil,
  Trash2,
  Check,
  ChevronRight,
  Camera,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

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

type MedType = "medicine" | "supplement";

interface Medication {
  id: string;
  name: string;
  type: MedType;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  is_active: boolean;
}

interface AiResult {
  name: string;
  type: string;
  dosage: string;
  frequency: string;
}

const FREQUENCY_OPTIONS = [
  "매일 1회",
  "매일 2회",
  "매일 3회",
  "필요시",
  "주 1회",
  "주 2~3회",
];

export default function MedicationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // AI 분석
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [showAiResults, setShowAiResults] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);

  // 폼
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<MedType>("medicine");
  const [formDosage, setFormDosage] = useState("");
  const [formFrequency, setFormFrequency] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchMedications = useCallback(async () => {
    const { data } = await supabase
      .from("medications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMedications(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const resetForm = () => {
    setFormName("");
    setFormType("medicine");
    setFormDosage("");
    setFormFrequency("");
    setFormNotes("");
    setEditingId(null);
    setShowForm(false);
    setAiResults([]);
    setShowAiResults(false);
  };

  const openEdit = (med: Medication) => {
    setFormName(med.name);
    setFormType(med.type);
    setFormDosage(med.dosage ?? "");
    setFormFrequency(med.frequency ?? "");
    setFormNotes(med.notes ?? "");
    setEditingId(med.id);
    setSelectedId(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const payload = {
      name: formName.trim(),
      type: formType,
      dosage: formDosage.trim() || null,
      frequency: formFrequency || null,
      notes: formNotes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (editingId) {
      await supabase.from("medications").update(payload).eq("id", editingId);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("medications")
          .insert({ ...payload, user_id: user.id });
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

  /* ── AI 사진 분석 ── */
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
        // 1개면 바로 폼에 채우기
        const item = results[0];
        setFormName(item.name);
        setFormType(item.type === "supplement" ? "supplement" : "medicine");
        setFormDosage(item.dosage);
        setFormFrequency(item.frequency);
        setShowForm(true);
      } else {
        // 여러 개면 선택 화면
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
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = "";
  };

  /* ── AI 결과 일괄 추가 ── */
  const handleBatchAdd = async (items: AiResult[]) => {
    setBatchSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBatchSaving(false);
      return;
    }

    const rows = items.map((item) => ({
      user_id: user.id,
      name: item.name.trim(),
      type: item.type === "supplement" ? "supplement" : "medicine",
      dosage: item.dosage.trim() || null,
      frequency: item.frequency.trim() || null,
      notes: null,
    }));

    await supabase.from("medications").insert(rows);
    await fetchMedications();
    setAiResults([]);
    setShowAiResults(false);
    setBatchSaving(false);
  };

  const medicines = medications.filter((m) => m.type === "medicine");
  const supplements = medications.filter((m) => m.type === "supplement");

  /* ━━━ AI 분석 결과 선택 화면 ━━━ */
  if (showAiResults && aiResults.length > 0) {
    return (
      <AiResultsScreen
        results={aiResults}
        saving={batchSaving}
        onAddAll={() => handleBatchAdd(aiResults)}
        onAddOne={(item) => {
          setFormName(item.name);
          setFormType(item.type === "supplement" ? "supplement" : "medicine");
          setFormDosage(item.dosage);
          setFormFrequency(item.frequency);
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

  /* ━━━ 추가/수정 폼 ━━━ */
  if (showForm) {
    const typeLabel = formType === "supplement" ? "영양제" : "약";

    return (
      <div className="min-h-dvh bg-white">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <button
              type="button"
              onClick={resetForm}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-base font-bold text-gray-900">
              {editingId ? `${typeLabel} 수정` : "추가하기"}
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
                onClick={() => fileInputRef.current?.click()}
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
                    <Sparkles className="w-4 h-4 text-brand/60" />
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-[0.6875rem] text-gray-400 text-center mt-1.5">
                약 상자, 처방전, 영양제 라벨 등을 촬영하세요
              </p>
            </div>
          )}

          {/* 종류 선택 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            종류
          </label>
          <div className="flex gap-3 mb-6">
            {(
              [
                { value: "medicine", label: "약", Icon: Pill },
                {
                  value: "supplement",
                  label: "영양제",
                  Icon: SupplementBottle,
                },
              ] as const
            ).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormType(value as MedType)}
                className={`flex-1 h-12 rounded-xl font-semibold text-[0.9375rem] flex items-center justify-center gap-2 transition-all duration-150 ${
                  formType === value
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-500 active:bg-gray-150"
                }`}
              >
                <Icon className="w-5 h-5" />
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
            placeholder="예: 타이레놀, 비타민D"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
          />

          {/* 복용량 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            복용량
          </label>
          <input
            type="text"
            placeholder="예: 1정, 2캡슐, 1포"
            value={formDosage}
            onChange={(e) => setFormDosage(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
          />

          {/* 복용 주기 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            복용 주기
          </label>
          <div className="flex flex-wrap gap-2 mb-6">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  setFormFrequency(formFrequency === opt ? "" : opt)
                }
                className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                  formFrequency === opt
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-600 active:bg-gray-150"
                }`}
              >
                {formFrequency === opt && (
                  <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                )}
                {opt}
              </button>
            ))}
          </div>

          {/* 메모 */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            메모
          </label>
          <textarea
            placeholder="복용 시 주의사항, 처방 이유 등"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
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
      </div>
    );
  }

  /* ━━━ 메인 리스트 ━━━ */
  return (
    <div className="min-h-dvh bg-surface">
      {/* 숨겨진 파일 인풋 (빈 상태에서도 사진 분석 가능) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

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
          <h1 className="text-base font-bold text-gray-900">내 약 서랍</h1>
          <div className="w-10" />
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
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                className="inline-flex items-center justify-center gap-2 h-12 bg-brand text-white font-semibold text-[0.9375rem] rounded-full active:brightness-95 transition-all duration-150 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                사진으로 추가
                <Sparkles className="w-4 h-4 opacity-60" />
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
            <div className="px-5 pt-5 mb-4">
              <div className="bg-white rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">
                      복용 중인 약/영양제
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {medications.length}
                      <span className="text-base font-medium text-gray-300 ml-1">
                        개
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-1">
                        <Pill className="w-5 h-5 text-brand" />
                      </div>
                      <span className="text-xs text-gray-400">
                        약 {medicines.length}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-1">
                        <SupplementBottle className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="text-xs text-gray-400">
                        영양제 {supplements.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 약 목록 */}
            {medicines.length > 0 && (
              <MedSection
                title="약"
                items={medicines}
                selectedId={selectedId}
                deleting={deleting}
                onSelect={setSelectedId}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}

            {/* 영양제 목록 */}
            {supplements.length > 0 && (
              <MedSection
                title="영양제"
                items={supplements}
                selectedId={selectedId}
                deleting={deleting}
                onSelect={setSelectedId}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}

            {/* 추가 버튼 */}
            <div className="px-5 mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                className="w-full h-12 rounded-2xl bg-brand-light/50 text-brand font-semibold text-sm flex items-center justify-center gap-2 active:bg-brand-light transition-all duration-150 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                사진으로 추가
                <Sparkles className="w-3.5 h-3.5 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full h-12 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:bg-gray-50 transition-all duration-150"
              >
                <Plus className="w-4 h-4" />
                직접 입력하기
              </button>
            </div>
          </>
        )}
      </main>

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

/* ── AI 분석 결과 선택 화면 ── */
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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
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
            <Sparkles className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {results.length}개를 찾았어요
            </p>
            <p className="text-xs text-gray-400">
              추가할 항목을 선택하세요
            </p>
          </div>
        </div>

        <div className="space-y-2.5 mb-6">
          {results.map((item, idx) => {
            const isSupp = item.type === "supplement";
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onAddOne(item)}
                className="w-full bg-surface rounded-2xl p-4 text-left active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSupp ? "bg-orange-50" : "bg-brand-light"
                    }`}
                  >
                    {isSupp ? (
                      <SupplementBottle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Pill className="w-5 h-5 text-brand" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[
                        isSupp ? "영양제" : "약",
                        item.dosage,
                        item.frequency,
                      ]
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

/* ── 섹션 컴포넌트 ── */
function MedSection({
  title,
  items,
  selectedId,
  deleting,
  onSelect,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Medication[];
  selectedId: string | null;
  deleting: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
}) {
  const isSupp = title === "영양제";

  return (
    <div className="px-5 mb-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </p>
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
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSupp ? "bg-orange-50" : "bg-brand-light"
                  }`}
                >
                  {isSupp ? (
                    <SupplementBottle className="w-5 h-5 text-orange-500" />
                  ) : (
                    <Pill className="w-5 h-5 text-brand" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9375rem] font-semibold text-gray-900 truncate">
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[med.dosage, med.frequency].filter(Boolean).join(" · ") ||
                      "복용 정보 미입력"}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-200 flex-shrink-0 transition-transform duration-200 ${
                    isSelected ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* 확장 영역: 메모 + 수정/삭제 */}
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
