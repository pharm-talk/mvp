"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MedicationInfo } from "@/types/medication";
import type { ProfileInfo } from "@/types/profile";

/* ── Types ── */

export type Phase = "intake" | "analyzing" | "chat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isReport?: boolean;
}

export interface IntakeStep {
  question: string;
  chips: string[];
  multiSelect: boolean;
}

/* ── Constants ── */

export const INTAKE_STEPS: IntakeStep[] = [
  {
    question: "안녕하세요! 영양제 코디네이터예요 💊\n어떤 건강 목표가 있으세요?",
    chips: [
      "피로 개선",
      "피부 관리",
      "면역력 강화",
      "뼈·관절",
      "수면 개선",
      "소화 개선",
      "눈 건강",
      "기타",
    ],
    multiSelect: true,
  },
  {
    question: "좋아요! 식습관은 어떠세요?",
    chips: [
      "규칙적으로 잘 먹어요",
      "불규칙해요",
      "외식이 많아요",
      "채식 위주예요",
      "다이어트 중이에요",
    ],
    multiSelect: false,
  },
  {
    question: "혹시 불편한 증상이 있으세요?",
    chips: [
      "만성 피로",
      "소화 불량",
      "불면·수면 장애",
      "피부 트러블",
      "관절 통증",
      "없어요",
    ],
    multiSelect: true,
  },
];

export const QUICK_SUGGESTIONS = [
  "추천 영양제 더 알려줘",
  "비타민D 얼마나 먹어?",
  "이거 부모님께 사드려도 돼?",
];

/* ── Hook ── */

export function useSupplementCoach() {
  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* State */
  const [phase, setPhase] = useState<Phase>("intake");
  const [intakeStep, setIntakeStep] = useState(0);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomText, setSymptomText] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [report, setReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [savedReport, setSavedReport] = useState<string | null>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [hasMedications, setHasMedications] = useState(true);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, phase, intakeStep, report, scrollToBottom]);

  /* Current intake selections based on step */
  const currentSelections =
    intakeStep === 0
      ? healthGoals
      : intakeStep === 1
        ? lifestyle
          ? [lifestyle]
          : []
        : symptoms;

  const currentStep = INTAKE_STEPS[intakeStep] as IntakeStep | undefined;

  /* ── Initial data load ── */
  const loadInitialData = useCallback(async () => {
    const [medsResult, profileResult] = await Promise.all([
      supabase
        .from("medications")
        .select("name, type, category, dosage, frequency")
        .eq("archived", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("gender, birth_date, conditions, allergies")
        .single(),
    ]);

    const meds = (medsResult.data ?? []) as MedicationInfo[];
    setMedications(meds);
    setHasMedications(meds.length > 0);

    if (profileResult.data) {
      setProfile(profileResult.data as ProfileInfo);
    }

    setPageLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /* ── Advance to next step ── */
  const advanceFromStep = (
    stepIdx: number,
    selectedValues: string[]
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant" as const,
        content: INTAKE_STEPS[stepIdx].question,
      },
      {
        role: "user" as const,
        content: selectedValues.join(", "),
      },
    ]);

    const nextStep = stepIdx + 1;
    if (nextStep < INTAKE_STEPS.length) {
      setIntakeStep(nextStep);
    } else {
      startAnalysis(
        stepIdx === 0 ? selectedValues : healthGoals,
        stepIdx === 1 ? selectedValues[0] : lifestyle,
        stepIdx === 2 ? selectedValues : symptoms
      );
    }
  };

  /* ── Chip toggle handler ── */
  const handleChipToggle = (chip: string) => {
    if (!currentStep) return;

    if (currentStep.multiSelect) {
      if (intakeStep === 0) {
        setHealthGoals((prev) =>
          prev.includes(chip)
            ? prev.filter((c) => c !== chip)
            : [...prev, chip]
        );
      } else if (intakeStep === 2) {
        if (chip === "없어요") {
          setSymptoms(["없어요"]);
        } else {
          setSymptoms((prev) => {
            const without = prev.filter((c) => c !== "없어요");
            return without.includes(chip)
              ? without.filter((c) => c !== chip)
              : [...without, chip];
          });
        }
      }
    } else {
      setLifestyle(chip);
      advanceFromStep(1, [chip]);
    }
  };

  /* ── Handle "다음" for multi-select ── */
  const handleNext = () => {
    if (intakeStep === 0 && healthGoals.length > 0) {
      advanceFromStep(0, healthGoals);
    } else if (intakeStep === 2) {
      const allSymptoms = [...symptoms];
      if (symptomText.trim()) {
        allSymptoms.push(symptomText.trim());
      }
      if (allSymptoms.length > 0) {
        setSymptoms(allSymptoms);
        advanceFromStep(2, allSymptoms);
      }
    }
  };

  /* ── Analysis ── */
  const startAnalysis = async (
    goals: string[],
    life: string,
    symp: string[]
  ) => {
    setPhase("analyzing");

    try {
      const res = await fetch("/api/supplement-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: medications.map((m) => ({
            name: m.name,
            type: m.type,
            category: m.category,
            dosage: m.dosage,
            frequency: m.frequency,
          })),
          profile: profile
            ? {
                gender: profile.gender,
                birth_date: profile.birth_date,
                conditions: profile.conditions,
                allergies: profile.allergies,
              }
            : null,
          health_goals: goals,
          lifestyle: life,
          symptoms: symp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "분석에 실패했습니다.");
      }

      setReport(data.report);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.report, isReport: true },
        { role: "assistant", content: "궁금한 게 더 있으면 물어보세요!" },
      ]);
      setPhase("chat");
    } catch {
      setReport(null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      ]);
      setPhase("chat");
    }
  };

  /* ── Follow-up chat ── */
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const contextMessages: ChatMessage[] = [];

      const intakeContext = [
        `건강 목표: ${healthGoals.join(", ")}`,
        `식습관: ${lifestyle}`,
        `불편 증상: ${symptoms.join(", ")}`,
      ].join("\n");

      if (report) {
        contextMessages.push({
          role: "assistant",
          content: `[문진 정보]\n${intakeContext}\n\n[영양제 분석 리포트]\n${report}`,
        });
      }

      contextMessages.push(
        ...newMessages.filter((m) => !m.isReport)
      );

      const res = await fetch("/api/food-drug-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: contextMessages,
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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "연결에 문제가 생겼어요. 다시 시도해주세요.",
        },
      ]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /* ── 리포트 생성 (대화 종합) ── */
  const generateFinalReport = async () => {
    setGeneratingReport(true);
    try {
      const conversationSummary = messages
        .filter((m) => !m.isReport)
        .map((m) => `${m.role === "user" ? "사용자" : "코디네이터"}: ${m.content}`)
        .join("\n");

      const res = await fetch("/api/food-drug-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `지금까지의 영양제 상담 대화를 종합해서 깔끔한 리포트로 정리해줘. 아래 형식으로 작성해줘:

[현재 복용 현황]
현재 복용 중인 약과 영양제 요약

[분석 결과]
상담에서 나온 주요 분석 내용

[추천 사항]
추천하는 영양제나 변경 사항

[주의 사항]
주의해야 할 상호작용이나 경고

---
대화 내용:
${report ? `[초기 분석 리포트]\n${report}\n\n` : ""}${conversationSummary}`,
            },
          ],
          medications: medications.map((m) => ({ name: m.name, type: m.type, dosage: m.dosage })),
          profile: profile ? { gender: profile.gender, birth_date: profile.birth_date, conditions: profile.conditions, allergies: profile.allergies } : null,
        }),
      });
      const data = await res.json();
      setSavedReport(data.message);
      setShowReportPreview(true);
    } catch {
      alert("리포트 생성에 실패했어요. 다시 시도해주세요.");
    }
    setGeneratingReport(false);
  };

  /* ── 리포트 저장 ── */
  const saveReport = async () => {
    if (!savedReport) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("ai_chats").insert({
      user_id: user.id,
      type: "food_drug",
      title: "영양제 코디네이터 리포트",
      messages: [
        { role: "assistant", content: savedReport },
        ...messages.filter((m) => !m.isReport),
      ],
    });

    setReportSaved(true);
  };

  /* ── 약사 검증 요청 ── */
  const requestPharmacistVerification = async () => {
    if (!savedReport) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("consultations").insert({
      user_id: user.id,
      type: "supplement",
      content: "영양제 코디네이터 분석 결과 검증 요청",
      health_snapshot: profile,
      medications_snapshot: medications,
      ai_report: savedReport,
      ai_report_at: new Date().toISOString(),
      status: "pending",
    }).select("id").single();

    if (data) {
      router.push(`/consultations/${data.id}`);
    }
  };

  /* ── 문진 중 텍스트 입력 처리 ── */
  const handleIntakeTextInput = (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();

    if (intakeStep === 0) {
      setHealthGoals([trimmed]);
      advanceFromStep(0, [trimmed]);
    } else if (intakeStep === 1) {
      setLifestyle(trimmed);
      advanceFromStep(1, [trimmed]);
    } else if (intakeStep === 2) {
      setSymptoms([trimmed]);
      advanceFromStep(2, [trimmed]);
    }
    setSymptomText("");
    setInput("");
  };

  const showInput = phase === "intake" || phase === "chat";
  const showNextButton =
    phase === "intake" &&
    currentStep?.multiSelect &&
    currentSelections.length > 0;

  return {
    /* refs */
    chatEndRef,
    inputRef,
    /* state */
    phase,
    intakeStep,
    messages,
    input,
    setInput,
    loading,
    pageLoading,
    report,
    generatingReport,
    savedReport,
    showReportPreview,
    setShowReportPreview,
    reportSaved,
    setReportSaved,
    hasMedications,
    symptomText,
    setSymptomText,
    /* derived */
    currentSelections,
    currentStep,
    showInput,
    showNextButton,
    /* actions */
    handleChipToggle,
    handleNext,
    handleSubmit,
    handleIntakeTextInput,
    sendMessage,
    generateFinalReport,
    saveReport,
    requestPharmacistVerification,
    router,
  };
}
