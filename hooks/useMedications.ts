"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MedCategory, Medication, AiResult, SavedReport } from "@/types/medication";
import {
  buildFrequencyString,
  parseFrequencyString,
  classifyAiResult,
  mapTypeToCategory,
} from "@/components/features/medications/utils";

export interface MedicationFormState {
  name: string;
  category: MedCategory;
  dosage: string;
  dailyCount: string;
  times: string[];
  notes: string;
  startDate: string;
  endDate: string;
}

const INITIAL_FORM: MedicationFormState = {
  name: "",
  category: "prescription",
  dosage: "",
  dailyCount: "",
  times: [],
  notes: "",
  startDate: "",
  endDate: "",
};

export function useMedications() {
  const supabase = createClient();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<MedCategory>("chronic");
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  // 저장된 영양제 리포트
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  // AI 분석
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [showAiResults, setShowAiResults] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);

  // 폼 상태
  const [form, setForm] = useState<MedicationFormState>(INITIAL_FORM);

  const updateForm = useCallback(
    <K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

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
    if (data) setSavedReports(data as SavedReport[]);
  }, [supabase]);

  useEffect(() => {
    fetchMedications();
    fetchReports();
  }, [fetchMedications, fetchReports]);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
    setAiResults([]);
    setShowAiResults(false);
  }, []);

  const openEdit = useCallback((med: Medication) => {
    const { count, times } = parseFrequencyString(med.frequency);
    setForm({
      name: med.name,
      category: med.category,
      dosage: med.dosage ?? "",
      dailyCount: count,
      times,
      notes: med.notes ?? "",
      startDate: med.start_date ?? "",
      endDate: med.end_date ?? "",
    });
    setEditingId(med.id);
    setSelectedId(null);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      type: form.category === "supplement" ? "supplement" : "medicine",
      category: form.category,
      dosage: form.dosage.trim() || null,
      frequency: buildFrequencyString(form.dailyCount, form.times),
      notes: form.notes.trim() || null,
      start_date: (form.category === "prescription" || form.category === "chronic") && form.startDate ? form.startDate : null,
      end_date: form.category === "prescription" && form.endDate ? form.endDate : null,
      archived: false,
      updated_at: new Date().toISOString(),
    };
    if (editingId) {
      const { error } = await supabase.from("medications").update(payload).eq("id", editingId);
      if (error) {
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
          alert("약 등록에 실패했어요: " + error.message);
          setSaving(false);
          return;
        }
      }
    }
    await fetchMedications();
    resetForm();
    setSaving(false);
  }, [form, editingId, supabase, fetchMedications, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (!error) {
      setMedications((prev) => prev.filter((m) => m.id !== id));
      setSelectedId(null);
    }
    setDeleting(null);
  }, [supabase]);

  const handleArchive = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("medications")
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      await fetchMedications();
      setSelectedId(null);
    }
  }, [supabase, fetchMedications]);

  const handleUnarchive = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("medications")
      .update({ archived: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      await fetchMedications();
      setSelectedId(null);
    }
  }, [supabase, fetchMedications]);

  /* -- AI 사진 분석 -- */
  const handlePhotoAnalysis = useCallback(async (file: File) => {
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
        const parsed = parseFrequencyString(item.frequency);
        setForm({
          ...INITIAL_FORM,
          name: item.name,
          category: classifyAiResult(item),
          dosage: item.dosage,
          dailyCount: parsed.count,
          times: parsed.times,
        });
        setShowForm(true);
      } else {
        setAiResults(results);
        setShowAiResults(true);
      }
    } catch {
      alert("사진 분석 중 오류가 발생했어요.");
    }

    setAnalyzing(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handlePhotoAnalysis(file);
      e.target.value = "";
    },
    [handlePhotoAnalysis]
  );

  /* -- AI 결과 일괄 추가 -- */
  const handleBatchAdd = useCallback(async (items: AiResult[]) => {
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
  }, [supabase, fetchMedications]);

  const handleAddOneFromAi = useCallback((item: AiResult) => {
    const parsed = parseFrequencyString(item.frequency);
    setForm({
      ...INITIAL_FORM,
      name: item.name,
      category: classifyAiResult(item),
      dosage: item.dosage,
      dailyCount: parsed.count,
      times: parsed.times,
    });
    setAiResults([]);
    setShowAiResults(false);
    setShowForm(true);
  }, []);

  // 파생 데이터
  const activeMeds = medications.filter((m) => !m.archived);
  const archivedMeds = medications.filter((m) => m.archived);
  const filteredMeds = (showArchived ? archivedMeds : activeMeds).filter(
    (m) => m.category === activeTab
  );
  const countByCategory = (cat: MedCategory) =>
    activeMeds.filter((m) => m.category === cat).length;

  return {
    // refs
    cameraInputRef,
    albumInputRef,
    // 데이터
    medications,
    loading,
    activeMeds,
    archivedMeds,
    filteredMeds,
    countByCategory,
    savedReports,
    viewingReport,
    setViewingReport,
    // UI 상태
    showForm,
    setShowForm,
    editingId,
    selectedId,
    setSelectedId,
    saving,
    deleting,
    showArchived,
    setShowArchived,
    activeTab,
    setActiveTab,
    showPhotoSheet,
    setShowPhotoSheet,
    // AI 상태
    analyzing,
    aiResults,
    showAiResults,
    batchSaving,
    // 폼
    form,
    updateForm,
    // 핸들러
    resetForm,
    openEdit,
    handleSave,
    handleDelete,
    handleArchive,
    handleUnarchive,
    handleFileChange,
    handleBatchAdd,
    handleAddOneFromAi,
  };
}
