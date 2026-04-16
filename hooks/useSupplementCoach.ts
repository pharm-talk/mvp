"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MedicationInfo } from "@/types/medication";
import type { ProfileInfo } from "@/types/profile";
import {
  TURN1_CHIPS,
  TURN2_CHIPS,
  TURN6_CHIPS,
  GOAL_FOLLOW_UP_QUESTIONS,
  MEDICATION_BASED_QUESTIONS,
} from "@/constants/supplement-flow";

/* ── Types ── */

export type Phase = "intake" | "analyzing" | "chat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isReport?: boolean;
}

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
  const [currentTurn, setCurrentTurn] = useState(1);

  // Turn 1: 건강 목표
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  // Turn 2: 약 서랍 확인
  const [medicationDrawerConfirmed, setMedicationDrawerConfirmed] = useState(false);
  const [medicationDrawerChanges, setMedicationDrawerChanges] = useState("");
  // Turn 3~5: 꼬리질문 답변
  const [goalAnswers, setGoalAnswers] = useState<Record<string, string>>({});
  const [currentGoalQuestionIndex, setCurrentGoalQuestionIndex] = useState(0);
  // 약 서랍 기반 추가 질문
  const [medicationBasedQuestion, setMedicationBasedQuestion] = useState<{
    question: string;
    chips: string[];
  } | null>(null);
  const [askedMedicationQuestion, setAskedMedicationQuestion] = useState(false);
  // Turn 6: 복용 편의
  const [dosagePreference, setDosagePreference] = useState("");

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
  }, [messages, loading, phase, currentTurn, report, scrollToBottom]);

  /* ── 현재 턴에 맞는 질문/칩 계산 ── */

  // 첫 번째 건강 목표의 꼬리질문 목록
  const followUpQuestions = useMemo(() => {
    if (healthGoals.length === 0) return [];
    const primaryGoal = healthGoals[0];
    return GOAL_FOLLOW_UP_QUESTIONS[primaryGoal] ?? [];
  }, [healthGoals]);

  // 약 서랍 기반 매칭 질문 찾기
  const findMedicationBasedQuestion = useCallback(() => {
    if (medications.length === 0) return null;
    const medNames = medications.map((m) => m.name.toLowerCase()).join(" ");
    for (const rule of MEDICATION_BASED_QUESTIONS) {
      if (medNames.includes(rule.keyword.toLowerCase())) {
        return { question: rule.question, chips: rule.chips };
      }
    }
    return null;
  }, [medications]);

  const getCurrentQuestionAndChips = useCallback((): {
    question: string;
    chips: string[];
    multiSelect: boolean;
  } => {
    switch (currentTurn) {
      case 1:
        return {
          question:
            "안녕하세요! 영양제 코디네이터예요 💊\n어떤 건강 목표가 있으세요?",
          chips: [...TURN1_CHIPS],
          multiSelect: true,
        };
      case 2: {
        const medCount = medications.filter((m) => m.type === "medication").length;
        const suppCount = medications.filter((m) => m.type === "supplement").length;
        const parts: string[] = [];
        if (medCount > 0) parts.push(`약 ${medCount}개`);
        if (suppCount > 0) parts.push(`영양제 ${suppCount}개`);
        const summary = parts.length > 0 ? parts.join(", ") : "";
        const prefix = summary
          ? `약 서랍에 ${summary} 등록되어 있네요!\n`
          : "";
        return {
          question: `${prefix}최근에 바뀐 게 있거나 빠진 것 있으세요?`,
          chips: [...TURN2_CHIPS],
          multiSelect: false,
        };
      }
      case 3:
      case 4:
      case 5: {
        // 꼬리질문 진행 중인지 확인
        if (currentGoalQuestionIndex < followUpQuestions.length) {
          const q = followUpQuestions[currentGoalQuestionIndex];
          return {
            question: q.question,
            chips: q.chips,
            multiSelect: false,
          };
        }
        // 꼬리질문 다 끝났으면 약 서랍 기반 질문
        if (!askedMedicationQuestion) {
          const medQ = medicationBasedQuestion ?? findMedicationBasedQuestion();
          if (medQ) {
            return {
              question: medQ.question,
              chips: medQ.chips,
              multiSelect: false,
            };
          }
        }
        // 아무 질문도 없으면 빈 상태 (바로 TURN 6으로 진행됨)
        return { question: "", chips: [], multiSelect: false };
      }
      case 6:
        return {
          question: "하루에 몇 알 정도 괜찮으세요?",
          chips: [...TURN6_CHIPS],
          multiSelect: false,
        };
      default:
        return { question: "", chips: [], multiSelect: false };
    }
  }, [
    currentTurn,
    medications,
    currentGoalQuestionIndex,
    followUpQuestions,
    askedMedicationQuestion,
    medicationBasedQuestion,
    findMedicationBasedQuestion,
  ]);

  const currentStepInfo = getCurrentQuestionAndChips();

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

  /* ── 메시지에 질문+답변 추가 헬퍼 ── */
  const appendQA = (question: string, answer: string, feedback?: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "assistant" as const, content: question },
      { role: "user" as const, content: answer },
      ...(feedback ? [{ role: "assistant" as const, content: feedback }] : []),
    ]);
  };

  /* ── 꼬리질문/약 서랍 질문 끝 → 다음 턴 이동 ── */
  const advanceFromFollowUp = useCallback(() => {
    // 꼬리질문이 아직 남아있으면 다음 꼬리질문
    // (currentGoalQuestionIndex는 이미 증가된 상태)
    // 이 함수는 칩 선택 후 호출되므로, 다음 질문이 있는지 체크
    const nextIdx = currentGoalQuestionIndex + 1;

    if (nextIdx < followUpQuestions.length) {
      // 다음 꼬리질문으로
      setCurrentGoalQuestionIndex(nextIdx);
      // 턴 번호도 적절히 올림 (3→4→5)
      setCurrentTurn((prev) => Math.min(prev + 1, 5) as number);
      return;
    }

    // 꼬리질문 끝 → 약 서랍 기반 질문 확인
    if (!askedMedicationQuestion) {
      const medQ = findMedicationBasedQuestion();
      if (medQ) {
        setMedicationBasedQuestion(medQ);
        setCurrentGoalQuestionIndex(nextIdx); // 꼬리질문 범위 넘김
        setCurrentTurn((prev) => Math.min(prev + 1, 5) as number);
        return;
      }
    }

    // 모든 질문 완료 → TURN 6
    setCurrentTurn(6);
  }, [
    currentGoalQuestionIndex,
    followUpQuestions.length,
    askedMedicationQuestion,
    findMedicationBasedQuestion,
  ]);

  /* ── Chip toggle handler ── */
  const handleChipToggle = (chip: string) => {
    switch (currentTurn) {
      case 1: {
        // 다중선택 토글
        setHealthGoals((prev) =>
          prev.includes(chip)
            ? prev.filter((c) => c !== chip)
            : [...prev, chip]
        );
        break;
      }
      case 2: {
        // 단일선택 → 바로 진행
        const questionText = currentStepInfo.question;
        appendQA(questionText, chip, "알겠어요! 그럼 몇 가지만 더 여쭤볼게요.");

        if (chip === "없어요, 그대로예요") {
          setMedicationDrawerConfirmed(true);
        }
        // "추가할 게 있어요" → 텍스트 입력 대기는 별도 처리
        // 일단 TURN 3으로 진행
        if (chip === "추가할 게 있어요") {
          // 텍스트 입력을 기다리지 않고 바로 다음으로
          // (사용자가 텍스트로 입력하면 handleIntakeTextInput에서 처리)
          setMedicationDrawerConfirmed(false);
        }

        // 꼬리질문이 있으면 TURN 3, 없으면 TURN 6
        if (followUpQuestions.length > 0) {
          setCurrentTurn(3);
          setCurrentGoalQuestionIndex(0);
        } else {
          // 꼬리질문 없으면 약 서랍 기반 질문 확인
          const medQ = findMedicationBasedQuestion();
          if (medQ) {
            setMedicationBasedQuestion(medQ);
            setCurrentTurn(3);
          } else {
            setCurrentTurn(6);
          }
        }
        break;
      }
      case 3:
      case 4:
      case 5: {
        // 단일선택 → goalAnswers에 저장
        const questionText = currentStepInfo.question;
        appendQA(questionText, chip);

        // 현재가 꼬리질문인지 약 서랍 기반 질문인지 구분
        if (currentGoalQuestionIndex < followUpQuestions.length) {
          // 꼬리질문 답변 저장
          const questionKey = followUpQuestions[currentGoalQuestionIndex].question;
          setGoalAnswers((prev) => ({ ...prev, [questionKey]: chip }));
          advanceFromFollowUp();
        } else {
          // 약 서랍 기반 질문 답변
          if (medicationBasedQuestion) {
            setGoalAnswers((prev) => ({
              ...prev,
              [medicationBasedQuestion.question]: chip,
            }));
          }
          setAskedMedicationQuestion(true);
          setCurrentTurn(6);
        }
        break;
      }
      case 6: {
        // 복용 편의 단일선택 → TURN 7 → 분석 시작
        const questionText = currentStepInfo.question;
        appendQA(questionText, chip, "좋아요! 지금까지 알려주신 정보로 맞춤 분석할게요 🔍");
        setDosagePreference(chip);
        setCurrentTurn(7);
        break;
      }
      default:
        break;
    }
  };

  /* ── Handle "완료" for TURN 1 multi-select ── */
  const handleNext = () => {
    if (currentTurn === 1 && healthGoals.length > 0) {
      const questionText = currentStepInfo.question;
      appendQA(questionText, healthGoals.join(", "), `좋아요! ${healthGoals[0]}${healthGoals.length > 1 ? ` 외 ${healthGoals.length - 1}개` : ""} 목표로 분석할게요.`);
      setCurrentTurn(2);
    }
  };

  /* ── TURN 7 → 분석 시작 ── */
  useEffect(() => {
    if (currentTurn === 7 && phase === "intake") {
      startAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn]);

  /* ── Analysis ── */
  const startAnalysis = async () => {
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
          health_goals: healthGoals,
          goal_answers: goalAnswers,
          dosage_preference: dosagePreference,
          medication_drawer_confirmed: medicationDrawerConfirmed,
          medication_drawer_changes: medicationDrawerChanges || undefined,
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
        {
          role: "assistant",
          content: "분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        },
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
        `꼬리질문 답변: ${JSON.stringify(goalAnswers)}`,
        `복용 편의: ${dosagePreference}`,
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
        .map(
          (m) =>
            `${m.role === "user" ? "사용자" : "코디네이터"}: ${m.content}`
        )
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("consultations")
      .insert({
        user_id: user.id,
        type: "supplement",
        content: "영양제 코디네이터 분석 결과 검증 요청",
        health_snapshot: profile,
        medications_snapshot: medications,
        ai_report: savedReport,
        ai_report_at: new Date().toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (data) {
      router.push(`/consultations/${data.id}`);
    }
  };

  /* ── 문진 중 텍스트 입력 처리 ── */
  const handleIntakeTextInput = (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();

    if (currentTurn === 1) {
      // 직접 입력한 건강 목표
      setHealthGoals([trimmed]);
      appendQA(currentStepInfo.question, trimmed);
      setCurrentTurn(2);
    } else if (currentTurn === 2) {
      // 약 서랍 변경 사항 텍스트 입력
      setMedicationDrawerChanges(trimmed);
      appendQA(currentStepInfo.question, trimmed);
      if (followUpQuestions.length > 0) {
        setCurrentTurn(3);
        setCurrentGoalQuestionIndex(0);
      } else {
        const medQ = findMedicationBasedQuestion();
        if (medQ) {
          setMedicationBasedQuestion(medQ);
          setCurrentTurn(3);
        } else {
          setCurrentTurn(6);
        }
      }
    } else if (currentTurn >= 3 && currentTurn <= 5) {
      // 꼬리질문에 직접 입력
      const questionText = currentStepInfo.question;
      appendQA(questionText, trimmed);

      if (currentGoalQuestionIndex < followUpQuestions.length) {
        const questionKey = followUpQuestions[currentGoalQuestionIndex].question;
        setGoalAnswers((prev) => ({ ...prev, [questionKey]: trimmed }));
        advanceFromFollowUp();
      } else {
        if (medicationBasedQuestion) {
          setGoalAnswers((prev) => ({
            ...prev,
            [medicationBasedQuestion.question]: trimmed,
          }));
        }
        setAskedMedicationQuestion(true);
        setCurrentTurn(6);
      }
    } else if (currentTurn === 6) {
      setDosagePreference(trimmed);
      appendQA(currentStepInfo.question, trimmed);
      setCurrentTurn(7);
    }

    setInput("");
  };

  const currentSelections = currentTurn === 1 ? healthGoals : [];

  const showInput = phase === "intake" || phase === "chat";
  const showNextButton =
    phase === "intake" &&
    currentTurn === 1 &&
    healthGoals.length > 0;

  return {
    /* refs */
    chatEndRef,
    inputRef,
    /* state */
    phase,
    currentTurn,
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
    /* derived */
    currentSelections,
    currentStepInfo,
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
