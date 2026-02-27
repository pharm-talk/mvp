"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  X,
  Pill,
  ChevronDown,
  ChevronUp,
  Camera,
  ImagePlus,
  Check,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  Wand2,
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

/* ── 타입 ── */
interface Profile {
  gender: string | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  conditions: string[];
  allergies: string[];
  pregnancy_status: string;
}

interface Medication {
  id: string;
  name: string;
  type: "medicine" | "supplement";
  dosage: string | null;
  frequency: string | null;
}

interface ExtractedMed {
  name: string;
  dosage: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ConsultType = "medication" | "supplement";

/* ── 유형별 가이드 질문 ── */
const MEDICATION_TOPICS = [
  { value: "interaction", label: "약 궁합 확인" },
  { value: "side_effect", label: "부작용 상담" },
  { value: "dosage", label: "복용법 문의" },
  { value: "alternative", label: "대체약 상담" },
  { value: "other", label: "기타" },
] as const;

const SUPPLEMENT_GOALS = [
  { value: "recommend", label: "영양제 추천" },
  { value: "combination", label: "조합 검토" },
  { value: "fatigue", label: "피로 회복" },
  { value: "immunity", label: "면역력" },
  { value: "skin", label: "피부/모발" },
  { value: "bone", label: "뼈/관절" },
  { value: "digestion", label: "소화/장건강" },
  { value: "sleep", label: "수면" },
  { value: "other", label: "기타" },
] as const;

const MEDICATION_SYMPTOMS = [
  "두통", "어지러움", "소화불량", "메스꺼움", "피부발진",
  "졸림", "불면", "근육통", "식욕변화", "기타",
];

export default function NewConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  const initialType: ConsultType =
    searchParams.get("type") === "supplement" ? "supplement" : "medication";

  /* ── 데이터 ── */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  /* ── 폼 ── */
  const [consultType, setConsultType] = useState<ConsultType>(initialType);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [content, setContent] = useState("");

  /* ── AI 질문 도우미 ── */
  const [showAssist, setShowAssist] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedContent, setSuggestedContent] = useState("");

  const openAssist = async () => {
    setShowAssist(true);
    if (chatMessages.length > 0) return;
    setChatLoading(true);
    const greeting: ChatMessage = {
      role: "user",
      content:
        consultType === "supplement"
          ? "영양제 상담을 받고 싶은데 뭘 물어봐야 할지 모르겠어요."
          : "약에 대해 상담받고 싶은데 어떻게 질문해야 할지 모르겠어요.",
    };
    const msgs = [greeting];
    setChatMessages(msgs);
    try {
      const res = await fetch("/api/consult-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          consultType,
          medications: medications.map((m) => ({
            name: m.name,
            type: m.type,
            dosage: m.dosage,
          })),
          profile: profile
            ? {
                gender: profile.gender,
                birth_date: profile.birth_date,
                conditions: profile.conditions,
                allergies: profile.allergies,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }
      if (data.suggestedContent) {
        setSuggestedContent(data.suggestedContent);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "연결에 문제가 생겼어요. 다시 시도해주세요." },
      ]);
    }
    setChatLoading(false);
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const msgs = [...chatMessages, userMsg];
    setChatMessages(msgs);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/consult-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          consultType,
          medications: medications.map((m) => ({
            name: m.name,
            type: m.type,
            dosage: m.dosage,
          })),
          profile: profile
            ? {
                gender: profile.gender,
                birth_date: profile.birth_date,
                conditions: profile.conditions,
                allergies: profile.allergies,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }
      if (data.suggestedContent) {
        setSuggestedContent(data.suggestedContent);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "연결에 문제가 생겼어요. 다시 시도해주세요." },
      ]);
    }
    setChatLoading(false);
  };

  const applySuggestion = () => {
    setContent(suggestedContent);
    setSuggestedContent("");
    setShowAssist(false);
  };

  const [summarizing, setSummarizing] = useState(false);

  const applyConversationSummary = async () => {
    setSummarizing(true);
    const summaryRequest: ChatMessage = {
      role: "user",
      content: "지금까지 이야기한 내용을 바탕으로 약사에게 물어볼 질문을 깔끔하게 정리해줘.",
    };
    const msgs = [...chatMessages, summaryRequest];
    try {
      const res = await fetch("/api/consult-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          consultType,
          medications: medications.map((m) => ({
            name: m.name,
            type: m.type,
            dosage: m.dosage,
          })),
          profile: profile
            ? {
                gender: profile.gender,
                birth_date: profile.birth_date,
                conditions: profile.conditions,
                allergies: profile.allergies,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (data.suggestedContent) {
        setSuggestedContent(data.suggestedContent);
        setChatMessages((prev) => [
          ...prev,
          summaryRequest,
          { role: "assistant", content: data.message || "정리된 내용을 확인해주세요." },
        ]);
      } else if (data.message) {
        // 제안 마커 없이 온 경우 메시지 자체를 적용
        setContent(data.message);
        setShowAssist(false);
      }
    } catch {
      // 실패 시 대화 내용만이라도 적용
      const userMessages = chatMessages
        .filter((m) => m.role === "user")
        .map((m) => m.content);
      setContent(userMessages.map((m) => `- ${m}`).join("\n"));
      setShowAssist(false);
    }
    setSummarizing(false);
  };

  useEffect(() => {
    // 메시지가 2개 이상일 때만 스크롤 (첫 진입 시 상단 유지)
    if (chatEndRef.current && chatMessages.length > 2) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  // 모바일에서 키보드가 바로 올라오면 화면이 밀리므로 auto-focus 하지 않음

  /* ── 이미지 + AI 분석 ── */
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMed[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  /* ── 데이터 fetch ── */
  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, medsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("gender, birth_date, height_cm, weight_kg, conditions, allergies, pregnancy_status")
        .eq("id", user.id)
        .single(),
      supabase
        .from("medications")
        .select("id, name, type, dosage, frequency")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (medsRes.data) setMedications(medsRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── 유형 변경 시 가이드 초기화 ── */
  const handleTypeChange = (type: ConsultType) => {
    setConsultType(type);
    setSelectedTopics([]);
    setSelectedGoals([]);
    setSymptoms([]);
  };

  /* ── 토글 헬퍼 ── */
  const toggleItem = (list: string[], item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(list.includes(item) ? list.filter((v) => v !== item) : [...list, item]);
  };

  /* ── 이미지 ── */
  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 5) return;

    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    setImagePreviews(newImages.map((f) => URL.createObjectURL(f)));

    // 마지막 추가된 파일들에 대해 AI 분석
    for (const file of files) {
      await analyzeImage(file);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    if (newImages.length === 0) {
      setExtractedMeds([]);
      setAnalysisComplete(false);
    }
  };

  /* ── AI Vision 분석 ── */
  const [analysisError, setAnalysisError] = useState("");

  const analyzeImage = async (file: File) => {
    setAnalyzing(true);
    setAnalysisComplete(false);
    setAnalysisError("");

    try {
      // File → base64 data URL
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

      if (!res.ok) {
        setAnalysisError(data.error ?? "분석에 실패했습니다.");
        setAnalyzing(false);
        return;
      }

      if (data.medications && data.medications.length > 0) {
        setExtractedMeds((prev) => {
          // 중복 제거
          const existing = new Set(prev.map((m) => m.name));
          const newMeds = data.medications.filter(
            (m: ExtractedMed) => !existing.has(m.name)
          );
          return [...prev, ...newMeds];
        });
        setAnalysisComplete(true);
      } else {
        setAnalysisError(
          consultType === "supplement"
            ? "이미지에서 영양제 정보를 찾지 못했어요."
            : "이미지에서 약 정보를 찾지 못했어요."
        );
      }
    } catch {
      setAnalysisError("네트워크 오류가 발생했습니다.");
    }
    setAnalyzing(false);
  };

  const removeExtracted = (index: number) => {
    setExtractedMeds((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── 제출 ── */
  const buildContent = () => {
    const parts: string[] = [];

    if (consultType === "medication" && selectedTopics.length > 0) {
      const topicLabels = selectedTopics.map(
        (t) => MEDICATION_TOPICS.find((mt) => mt.value === t)?.label ?? t
      );
      parts.push(`[상담 주제] ${topicLabels.join(", ")}`);
    }

    if (consultType === "medication" && symptoms.length > 0) {
      parts.push(`[증상] ${symptoms.join(", ")}`);
    }

    if (consultType === "supplement" && selectedGoals.length > 0) {
      const goalLabels = selectedGoals.map(
        (g) => SUPPLEMENT_GOALS.find((sg) => sg.value === g)?.label ?? g
      );
      parts.push(`[상담 목적] ${goalLabels.join(", ")}`);
    }

    if (extractedMeds.length > 0) {
      const medLines = extractedMeds.map((m) => `  - ${m.name} (${m.dosage})`).join("\n");
      parts.push(`[사진에서 인식된 약]\n${medLines}`);
    }

    if (content.trim()) {
      parts.push(`[상세 내용]\n${content.trim()}`);
    }

    return parts.join("\n\n");
  };

  const canSubmit =
    content.trim().length > 0 ||
    selectedTopics.length > 0 ||
    selectedGoals.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    // 이미지 업로드 (Supabase Storage)
    const uploadedUrls: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("consultation-images")
        .upload(path, file, { contentType: file.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("consultation-images")
          .getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const fullContent = buildContent();

    const { error } = await supabase.from("consultations").insert({
      user_id: user.id,
      type: consultType,
      content: fullContent,
      image_urls: uploadedUrls,
      health_snapshot: profile,
      medications_snapshot: medications,
    });

    if (!error) {
      router.push("/consultations");
    }
    setSubmitting(false);
  };

  /* ── 유틸 ── */
  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return new Date().getFullYear() - new Date(birthDate).getFullYear();
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const age = getAge(profile?.birth_date ?? null);

  return (
    <div className="min-h-dvh bg-white">
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
          <h1 className="text-base font-bold text-gray-900">상담 요청</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 pb-10 safe-bottom">
        {/* ── 건강정보 요약 (접기/펼치기) ── */}
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="w-full bg-surface rounded-2xl px-4 py-3.5 flex items-center justify-between mb-5 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
              <Pill className="w-4 h-4 text-brand" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">
                내 건강정보 · 복용약 {medications.length}개
              </p>
              <p className="text-xs text-gray-400">약사에게 자동으로 전달돼요</p>
            </div>
          </div>
          {showInfo ? (
            <ChevronUp className="w-4 h-4 text-gray-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-300" />
          )}
        </button>

        {showInfo && (
          <div className="bg-surface rounded-2xl px-4 py-4 mb-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">건강정보</p>
              <div className="flex flex-wrap gap-1.5">
                {profile?.gender && (
                  <InfoChip label={profile.gender === "male" ? "남성" : "여성"} />
                )}
                {age && <InfoChip label={`${age}세`} />}
                {profile?.height_cm && <InfoChip label={`${profile.height_cm}cm`} />}
                {profile?.weight_kg && <InfoChip label={`${profile.weight_kg}kg`} />}
                {profile?.conditions?.map((c) => (
                  <InfoChip key={c} label={c} variant="warning" />
                ))}
                {profile?.allergies?.map((a) => (
                  <InfoChip key={a} label={`알레르기: ${a}`} variant="danger" />
                ))}
                {profile?.pregnancy_status === "pregnant" && (
                  <InfoChip label="임신 중" variant="warning" />
                )}
                {profile?.pregnancy_status === "nursing" && (
                  <InfoChip label="수유 중" variant="warning" />
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">복용 중인 약 · 영양제</p>
              {medications.length === 0 ? (
                <p className="text-xs text-gray-300">
                  등록된 약이 없어요.{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/medications")}
                    className="text-brand font-semibold"
                  >
                    약 서랍에서 추가
                  </button>
                </p>
              ) : (
                <div className="space-y-1.5">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center gap-2 bg-white rounded-xl px-3 py-2"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          med.type === "supplement" ? "bg-orange-50" : "bg-brand-light"
                        }`}
                      >
                        {med.type === "supplement" ? (
                          <SupplementBottle className="w-3.5 h-3.5 text-orange-500" />
                        ) : (
                          <Pill className="w-3.5 h-3.5 text-brand" />
                        )}
                      </div>
                      <span className="text-sm text-gray-900 font-medium truncate">
                        {med.name}
                      </span>
                      {med.dosage && (
                        <span className="text-xs text-gray-400 flex-shrink-0">{med.dosage}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 상담 유형 ── */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">상담 유형</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("medication")}
              className={`flex-1 h-12 rounded-xl font-semibold text-[0.9375rem] flex items-center justify-center gap-2 transition-all duration-150 ${
                consultType === "medication"
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-500 active:bg-gray-150"
              }`}
            >
              <Pill className="w-5 h-5" />
              복약 상담
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("supplement")}
              className={`flex-1 h-12 rounded-xl font-semibold text-[0.9375rem] flex items-center justify-center gap-2 transition-all duration-150 ${
                consultType === "supplement"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-500 active:bg-gray-150"
              }`}
            >
              <SupplementBottle className="w-5 h-5" />
              영양제 상담
            </button>
          </div>
        </div>

        {/* ── 유형별 가이드 질문 ── */}
        {consultType === "medication" ? (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              어떤 상담이 필요하세요?
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {MEDICATION_TOPICS.map(({ value, label }) => {
                const selected = selectedTopics.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleItem(selectedTopics, value, setSelectedTopics)}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                      selected
                        ? "bg-brand text-white"
                        : "bg-gray-100 text-gray-600 active:bg-gray-150"
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 부작용 선택 시 증상 칩 */}
            {selectedTopics.includes("side_effect") && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  어떤 증상이 있나요?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MEDICATION_SYMPTOMS.map((symptom) => {
                    const selected = symptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleItem(symptoms, symptom, setSymptoms)}
                        className={`h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 ${
                          selected
                            ? "bg-red-500 text-white"
                            : "bg-red-50 text-red-600 active:bg-red-100"
                        }`}
                      >
                        {symptom}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              어떤 도움이 필요하세요?
            </label>
            <div className="flex flex-wrap gap-2">
              {SUPPLEMENT_GOALS.map(({ value, label }) => {
                const selected = selectedGoals.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleItem(selectedGoals, value, setSelectedGoals)}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                      selected
                        ? "bg-orange-500 text-white"
                        : "bg-orange-50 text-orange-600 active:bg-orange-100"
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── AI 질문 도우미 버튼 ── */}
        <button
          type="button"
          onClick={openAssist}
          className="w-full mb-5 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 active:bg-gray-100 transition-colors duration-150"
        >
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-[1.125rem] h-[1.125rem] text-brand" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              뭘 물어봐야 할지 모르겠어요
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              AI가 대화를 통해 질문 정리를 도와드려요
            </p>
          </div>
        </button>

        {/* ── 자유 입력 ── */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            궁금한 점을 자유롭게 적어주세요
          </label>
          <textarea
            placeholder={
              consultType === "medication"
                ? "예: 혈압약이랑 소화제 같이 먹어도 되나요?\n요즘 약 먹고 나서 어지러운데 괜찮은 건지..."
                : "예: 비타민D랑 마그네슘 같이 먹어도 되나요?\n피로가 심한데 어떤 영양제가 도움될까요?"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-300 placeholder:leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
          />
          <p className="text-xs text-gray-300 mt-1.5 text-right">{content.length}자</p>
        </div>

        {/* ── 사진 첨부 + AI 분석 ── */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {consultType === "supplement"
              ? "사진으로 영양제 인식하기"
              : "사진으로 약 인식하기"}
            <span className="text-gray-300 font-normal ml-1">(선택)</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            {consultType === "supplement"
              ? "영양제 병, 패키지 사진을 올리면 AI가 성분을 추출해요"
              : "처방전, 약 봉투 사진을 올리면 AI가 약 정보를 추출해요"}
          </p>

          <div className="flex gap-2 flex-wrap">
            {imagePreviews.map((src, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100"
              >
                <img src={src} alt={`첨부 ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => setShowPhotoSheet(true)}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 active:bg-gray-50 transition-colors"
              >
                <ImagePlus className="w-5 h-5 text-gray-300" />
                <span className="text-[0.625rem] text-gray-300">{images.length}/5</span>
              </button>
            )}
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageAdd}
            className="hidden"
          />
          <input
            ref={albumInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageAdd}
            className="hidden"
          />

          {/* AI 분석 결과 */}
          {analyzing && (
            <div className="mt-3 bg-brand-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-brand animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-brand">
                AI가 {consultType === "supplement" ? "영양제" : "약"} 정보를 분석하고 있어요
              </p>
                <p className="text-xs text-brand/60">잠시만 기다려주세요...</p>
              </div>
            </div>
          )}

          {analysisError && !analyzing && (
            <div className="mt-3 bg-gray-50 rounded-2xl px-4 py-3.5">
              <p className="text-sm text-gray-500">{analysisError}</p>
              <p className="text-xs text-gray-400 mt-1">
                직접 {consultType === "supplement" ? "영양제" : "약"} 이름을 입력하셔도 돼요.
              </p>
            </div>
          )}

          {analysisComplete && extractedMeds.length > 0 && (
            <div className="mt-3 bg-brand-light rounded-2xl px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-brand" />
                <p className="text-sm font-semibold text-brand">
                  인식된 {consultType === "supplement" ? "영양제" : "약"} 정보
                </p>
              </div>
              <div className="space-y-2">
                {extractedMeds.map((med, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.dosage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExtracted(i)}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-brand/60 mt-2">
                잘못 인식된 항목은 X로 제거할 수 있어요
              </p>
            </div>
          )}
        </div>

        {/* ── 제출 ── */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-40"
        >
          {submitting ? "요청 중..." : "상담 요청하기"}
        </button>
        <div className="h-6" />
      </main>

      {/* ── 사진 선택 바텀시트 ── */}
      {showPhotoSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={() => setShowPhotoSheet(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-5 pb-3">
              <p className="text-base font-bold text-gray-900 mb-4">사진 추가</p>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSheet(false);
                  cameraInputRef.current?.click();
                }}
                className="w-full h-[3.25rem] rounded-xl bg-gray-50 text-left px-4 flex items-center gap-3 active:bg-gray-100 transition-colors mb-2"
              >
                <Camera className="w-5 h-5 text-gray-600" />
                <span className="text-[0.9375rem] font-medium text-gray-900">카메라로 촬영</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSheet(false);
                  albumInputRef.current?.click();
                }}
                className="w-full h-[3.25rem] rounded-xl bg-gray-50 text-left px-4 flex items-center gap-3 active:bg-gray-100 transition-colors mb-2"
              >
                <ImagePlus className="w-5 h-5 text-gray-600" />
                <span className="text-[0.9375rem] font-medium text-gray-900">앨범에서 선택</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPhotoSheet(false)}
                className="w-full h-12 rounded-xl text-gray-400 font-medium text-sm mt-1"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI 질문 도우미 오버레이 ── */}
      {showAssist && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          {/* 오버레이 헤더 */}
          <header className="flex-shrink-0 border-b border-gray-100/60">
            <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => setShowAssist(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
                aria-label="닫기"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-brand" />
                <h2 className="text-base font-bold text-gray-900">질문 정리 도우미</h2>
              </div>
              <div className="w-10" />
            </div>
          </header>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto px-5 py-4 max-w-lg mx-auto w-full">
            <div className="space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                    style={{ wordBreak: "keep-all" }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 제안된 상담 내용 */}
            {suggestedContent && (
              <div className="mt-4 bg-brand-light border border-brand/10 rounded-2xl px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-brand" />
                  <p className="text-sm font-semibold text-brand">정리된 상담 내용</p>
                </div>
                <p
                  className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3"
                  style={{ wordBreak: "keep-all" }}
                >
                  {suggestedContent}
                </p>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="w-full h-10 rounded-xl bg-brand text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:brightness-95 transition-all duration-150"
                >
                  <Check className="w-4 h-4" />
                  이 내용으로 상담하기
                </button>
                <p className="text-xs text-brand/50 text-center mt-2">
                  적용 후 직접 수정할 수도 있어요
                </p>
              </div>
            )}
          </div>

          {/* 대화 내용 적용 버튼 */}
          {chatMessages.length >= 2 && !suggestedContent && (
            <div className="flex-shrink-0 px-4 pt-2 pb-0 max-w-lg mx-auto w-full">
              <button
                type="button"
                onClick={applyConversationSummary}
                disabled={summarizing || chatLoading}
                className="w-full h-9 rounded-xl border border-brand/20 text-brand text-sm font-medium flex items-center justify-center gap-1.5 active:bg-brand-light transition-colors duration-150 disabled:opacity-40"
              >
                {summarizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    질문을 정리하고 있어요...
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    지금까지 내용으로 질문 정리하기
                  </>
                )}
              </button>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white safe-bottom">
            <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                placeholder="고민을 말해주세요..."
                className="flex-1 h-11 rounded-full bg-gray-100 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="w-10 h-10 rounded-full bg-brand flex items-center justify-center flex-shrink-0 active:brightness-90 transition-all duration-150 disabled:opacity-40"
                aria-label="보내기"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 정보 칩 ── */
function InfoChip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "warning" | "danger";
}) {
  const styles = {
    default: "bg-white text-gray-600",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-600",
  };

  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${styles[variant]}`}>
      {label}
    </span>
  );
}
