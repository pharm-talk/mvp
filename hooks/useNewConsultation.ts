"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  ConsultType,
  ChatMessage,
  ExtractedMed,
} from "@/types/consultation";
import {
  MEDICATION_TOPICS,
  SUPPLEMENT_GOALS,
} from "@/types/consultation";

/* ── 로컬 타입 (DB 스키마 매핑) ── */
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

export type { Profile, Medication };

export function useNewConsultation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const initialType: ConsultType =
    searchParams.get("type") === "supplement" ? "supplement" : "medication";

  /* ── 데이터 ── */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [excludedHealthKeys, setExcludedHealthKeys] = useState<Set<string>>(new Set());
  const [excludedMedIds, setExcludedMedIds] = useState<Set<string>>(new Set());

  const toggleHealthKey = (key: string) => {
    setExcludedHealthKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleMedId = (id: string) => {
    setExcludedMedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
  const [summarizing, setSummarizing] = useState(false);

  const buildAssistPayload = (msgs: ChatMessage[]) => ({
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
  });

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
        body: JSON.stringify(buildAssistPayload(msgs)),
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
        body: JSON.stringify(buildAssistPayload(msgs)),
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
        body: JSON.stringify(buildAssistPayload(msgs)),
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
        setContent(data.message);
        setShowAssist(false);
      }
    } catch {
      const userMessages = chatMessages
        .filter((m) => m.role === "user")
        .map((m) => m.content);
      setContent(userMessages.map((m) => `- ${m}`).join("\n"));
      setShowAssist(false);
    }
    setSummarizing(false);
  };

  useEffect(() => {
    if (chatEndRef.current && chatMessages.length > 2) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  /* ── 이미지 + AI 분석 ── */
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMed[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const analyzeImage = async (file: File) => {
    setAnalyzing(true);
    setAnalysisComplete(false);
    setAnalysisError("");

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

      if (!res.ok) {
        setAnalysisError(data.error ?? "분석에 실패했습니다.");
        setAnalyzing(false);
        return;
      }

      if (data.medications && data.medications.length > 0) {
        setExtractedMeds((prev) => {
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

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 5) return;

    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    setImagePreviews(newImages.map((f) => URL.createObjectURL(f)));

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

  const removeExtracted = (index: number) => {
    setExtractedMeds((prev) => prev.filter((_, i) => i !== index));
  };

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
        .select("id, name, type, dosage, frequency, category")
        .eq("user_id", user.id)
        .eq("archived", false)
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

  /* ── 제출 ── */
  const buildContent = () => {
    const parts: string[] = [];

    if (consultType === "medication" && selectedTopics.length > 0) {
      const topicLabels = selectedTopics.map(
        (t) => (MEDICATION_TOPICS as readonly { value: string; label: string }[]).find((mt) => mt.value === t)?.label ?? t
      );
      parts.push(`[상담 주제] ${topicLabels.join(", ")}`);
    }

    if (consultType === "medication" && symptoms.length > 0) {
      parts.push(`[증상] ${symptoms.join(", ")}`);
    }

    if (consultType === "supplement" && selectedGoals.length > 0) {
      const goalLabels = selectedGoals.map(
        (g) => (SUPPLEMENT_GOALS as readonly { value: string; label: string }[]).find((sg) => sg.value === g)?.label ?? g
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

    const { data: insertedData, error } = await supabase
      .from("consultations")
      .insert({
        user_id: user.id,
        type: consultType,
        content: fullContent,
        image_urls: uploadedUrls,
        health_snapshot: profile ? {
          ...profile,
          gender: excludedHealthKeys.has("gender") ? null : profile.gender,
          birth_date: excludedHealthKeys.has("age") ? null : profile.birth_date,
          height_cm: excludedHealthKeys.has("height") ? null : profile.height_cm,
          weight_kg: excludedHealthKeys.has("weight") ? null : profile.weight_kg,
          conditions: excludedHealthKeys.has("conditions") ? [] : profile.conditions,
          allergies: excludedHealthKeys.has("allergies") ? [] : profile.allergies,
          pregnancy_status: excludedHealthKeys.has("pregnancy") ? null : profile.pregnancy_status,
        } : null,
        medications_snapshot: medications.filter((m) => !excludedMedIds.has(m.id)),
      })
      .select("id")
      .single();

    if (!error && insertedData) {
      try {
        const analyzeRes = await fetch("/api/consult-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consultType,
            question: fullContent,
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
                  pregnancy_status: profile.pregnancy_status,
                }
              : null,
          }),
        });
        const analyzeData = await analyzeRes.json();
        if (analyzeData.report) {
          await supabase
            .from("consultations")
            .update({
              ai_report: analyzeData.report,
              ai_report_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", insertedData.id);
        }
      } catch {
        // AI report generation failed — consultation still saved
      }

      router.push("/consultations");
    }
    setSubmitting(false);
  };

  /* ── 유틸 ── */
  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return new Date().getFullYear() - new Date(birthDate).getFullYear();
  };

  return {
    // refs
    cameraInputRef,
    albumInputRef,
    chatEndRef,
    chatInputRef,
    // router
    router,
    // data
    profile,
    medications,
    loading,
    submitting,
    showInfo,
    setShowInfo,
    showPhotoSheet,
    setShowPhotoSheet,
    excludedHealthKeys,
    toggleHealthKey,
    excludedMedIds,
    toggleMedId,
    // form
    consultType,
    handleTypeChange,
    selectedTopics,
    setSelectedTopics,
    selectedGoals,
    setSelectedGoals,
    symptoms,
    setSymptoms,
    content,
    setContent,
    toggleItem,
    // AI assist
    showAssist,
    setShowAssist,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    suggestedContent,
    summarizing,
    openAssist,
    sendChatMessage,
    applySuggestion,
    applyConversationSummary,
    // images
    images,
    imagePreviews,
    analyzing,
    extractedMeds,
    analysisComplete,
    analysisError,
    handleImageAdd,
    removeImage,
    removeExtracted,
    // submit
    canSubmit,
    handleSubmit,
    // util
    getAge,
  };
}
