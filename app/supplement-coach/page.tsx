"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Pill,
  Plus,
  ArrowUp,
  Loader2,
  Check,
  FileText,
  X,
  ShieldCheck,
} from "lucide-react";
import { Robot, CircleNotch } from "@phosphor-icons/react";

/* ── Types ── */

type Phase = "intake" | "analyzing" | "chat";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isReport?: boolean;
}

interface MedicationInfo {
  name: string;
  type: string;
  category: string;
  dosage: string | null;
  frequency: string | null;
}

interface ProfileInfo {
  gender: string | null;
  birth_date: string | null;
  conditions: string[];
  allergies: string[];
}

interface ReportSection {
  title: string;
  content: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

interface IntakeStep {
  question: string;
  chips: string[];
  multiSelect: boolean;
}

/* ── Constants ── */

const INTAKE_STEPS: IntakeStep[] = [
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

const QUICK_SUGGESTIONS = [
  "추천 영양제 더 알려줘",
  "비타민D 얼마나 먹어?",
  "이거 부모님께 사드려도 돼?",
];

const SECTION_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "현재 복용 현황": {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  "과잉 성분 주의": {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-400",
  },
  "부족한 영양소": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-400",
  },
  "약-영양제 상호작용": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-400",
  },
  추천: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-400",
  },
};

/* ── Helpers ── */

function parseReport(report: string): ReportSection[] {
  const sections: ReportSection[] = [];
  const sectionRegex = /\[([^\]]+)\]\s*([\s\S]*?)(?=\[|$)/g;
  let match;

  while ((match = sectionRegex.exec(report)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const style = SECTION_STYLES[title] ?? {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    };

    if (content) {
      sections.push({
        title,
        content,
        bgColor: style.bg,
        textColor: style.text,
        borderColor: style.border,
      });
    }
  }

  return sections;
}

/* ── Sub-components ── */

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-brand/8 flex items-center justify-center flex-shrink-0">
      <Robot size={16} weight="duotone" className="text-brand" />
    </div>
  );
}

function TypingIndicator({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <BotAvatar />
      <div className="bg-gray-50/80 rounded-2xl rounded-tl-md px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span className="text-xs text-gray-400 ml-1">{text}</span>
        </div>
      </div>
    </div>
  );
}

function AiMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <BotAvatar />
      <div className="bg-gray-50/80 rounded-2xl rounded-tl-md px-3.5 pt-[0.6rem] pb-[0.65rem] max-w-[82%]">
        <p
          className="text-[0.875rem] text-gray-700 leading-[1.5] whitespace-pre-wrap"
          style={{ wordBreak: "keep-all" }}
        >
          {content}
        </p>
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="bg-brand/90 text-white rounded-2xl rounded-tr-md px-3.5 pt-[0.6rem] pb-[0.65rem] max-w-[82%]">
        <p className="text-[0.875rem] leading-[1.5]" style={{ wordBreak: "keep-all" }}>{content}</p>
      </div>
    </div>
  );
}

function ReportMessage({ report }: { report: string }) {
  const sections = parseReport(report);

  return (
    <div className="flex items-start gap-2 mb-3">
      <BotAvatar />
      <div className="flex-1 max-w-[90%]">
        <div className="bg-gray-50/60 rounded-2xl rounded-tl-md overflow-hidden border border-gray-100/80">
          <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
            <span className="text-[0.8125rem] font-bold text-gray-800">
              영양제 분석 리포트
            </span>
          </div>

          <div className="flex items-start gap-1.5 px-3.5 pb-2.5">
            <ShieldCheck className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[0.6875rem] text-blue-600 leading-snug" style={{ wordBreak: "keep-all" }}>
              면허 인증 약사가 직접 참여해 만든 AI가 분석한 결과예요
            </p>
          </div>

          <div className="px-4 pb-4 space-y-2.5">
            {sections.map((section, idx) => {
              const hasBorderAccent =
                section.borderColor !== "border-gray-200";
              return (
                <div
                  key={idx}
                  className={`rounded-xl ${section.bgColor} ${
                    hasBorderAccent
                      ? `border-l-4 ${section.borderColor}`
                      : `border ${section.borderColor}`
                  } p-3.5`}
                >
                  <p
                    className={`text-xs font-bold ${section.textColor} mb-1.5`}
                  >
                    {section.title}
                  </p>
                  <p
                    className={`text-[0.8125rem] leading-relaxed ${section.textColor} opacity-90 whitespace-pre-line`}
                    style={{ wordBreak: "keep-all" }}
                  >
                    {section.content}
                  </p>
                </div>
              );
            })}

            {sections.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                분석 결과를 표시할 수 없습니다.
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function ReportLoadingSkeleton() {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <BotAvatar />
      <div className="flex-1 max-w-[90%]">
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl p-3.5 space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ChipSelectorProps {
  chips: string[];
  selected: string[];
  multiSelect: boolean;
  onToggle: (chip: string) => void;
  disabled?: boolean;
}

function ChipSelector({
  chips,
  selected,
  multiSelect,
  onToggle,
  disabled,
}: ChipSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 ml-9 mb-2">
      {chips.map((chip) => {
        const isSelected = selected.includes(chip);
        return (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(chip)}
            className={`inline-flex items-center justify-center gap-1 h-9 px-3.5 rounded-full text-[0.8125rem] leading-none font-medium transition-all duration-200 active:scale-[0.97] ${
              isSelected
                ? "bg-brand/10 text-brand border border-brand/30"
                : "bg-white text-gray-600 border border-gray-150 active:border-gray-300"
            } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
            style={{ wordBreak: "keep-all" }}
          >
            {multiSelect && isSelected && (
              <Check className="w-3 h-3 flex-shrink-0" />
            )}
            {chip}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Page ── */

export default function SupplementCoachPage() {
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
      // Single select — auto advance
      setLifestyle(chip);
      advanceFromStep(1, [chip]);
    }
  };

  /* ── Advance to next step ── */
  const advanceFromStep = (
    stepIdx: number,
    selectedValues: string[]
  ) => {
    // Record user selection as a message
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
      // All intake done — start analysis
      startAnalysis(
        stepIdx === 0 ? selectedValues : healthGoals,
        stepIdx === 1 ? selectedValues[0] : lifestyle,
        stepIdx === 2 ? selectedValues : symptoms
      );
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

      // Include intake context
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

  /* ── 리포트 저장 (ai_chats 테이블에 별도 저장) ── */
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

  /* ── 약사 검증 요청 (상담으로 전환) ── */
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

  /* === Page loading skeleton === */
  if (pageLoading) {
    return (
      <div className="min-h-dvh bg-surface">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
          <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
            <div className="w-10" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="w-10" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-5 pt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1">
                <div className="h-16 bg-white rounded-2xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* === No medications registered === */
  if (!hasMedications) {
    return (
      <div className="min-h-dvh bg-surface">
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
            <h1 className="text-base font-bold text-gray-900">
              영양제 코디네이터
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center pt-28 pb-8 px-5 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-5">
            <Pill className="w-9 h-9 text-gray-200" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">
            먼저 약을 등록해주세요
          </p>
          <p
            className="text-sm text-gray-400 text-center mb-8 leading-relaxed"
            style={{ wordBreak: "keep-all" }}
          >
            복용 중인 약이나 영양제를 등록하면
            <br />
            맞춤 분석 리포트를 받아볼 수 있어요
          </p>
          <button
            type="button"
            onClick={() => router.push("/medications")}
            className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-brand text-white font-semibold text-[0.9375rem] rounded-full active:brightness-95 transition-all duration-150"
          >
            <Plus className="w-5 h-5" />
            약 등록하러 가기
          </button>
        </div>
      </div>
    );
  }

  /* 입력바는 문진 중에도 항상 표시 (칩 대신 직접 타이핑 가능) */
  const showInput = phase === "intake" || phase === "chat";
  const showNextButton =
    phase === "intake" &&
    currentStep?.multiSelect &&
    currentSelections.length > 0;

  /* 문진 중 텍스트 입력 처리 */
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

  /* ===  Main chat UI === */
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60 flex-shrink-0">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            영양제 코디네이터
          </h1>
          {phase === "chat" && report ? (
            <button
              type="button"
              onClick={generateFinalReport}
              disabled={generatingReport}
              className="h-8 px-3 rounded-lg bg-brand-light text-brand text-xs font-semibold flex items-center gap-1 active:bg-brand-light/80 transition-colors disabled:opacity-50"
            >
              {generatingReport ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              리포트
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full">
        <div className="px-5 pt-5 pb-4">
          {/* Rendered past messages (intake Q&A + report + chat) */}
          {messages.map((msg, idx) =>
            msg.isReport ? (
              <ReportMessage key={idx} report={msg.content} />
            ) : msg.role === "assistant" ? (
              <AiMessage key={idx} content={msg.content} />
            ) : (
              <UserMessage key={idx} content={msg.content} />
            )
          )}

          {/* Current intake question + chips */}
          {phase === "intake" && currentStep && (
            <>
              <AiMessage content={currentStep.question} />
              <ChipSelector
                chips={currentStep.chips}
                selected={currentSelections}
                multiSelect={currentStep.multiSelect}
                onToggle={handleChipToggle}
              />
              {/* 선택 완료 버튼은 하단 입력바 영역에 표시 */}
            </>
          )}

          {/* Analyzing phase */}
          {phase === "analyzing" && (
            <>
              <ReportLoadingSkeleton />
              <TypingIndicator text="분석 중이에요..." />
            </>
          )}

          {/* Report and error are now inside messages array */}

          {/* Loading indicator for follow-up chat */}
          {loading && <TypingIndicator text="생각하고 있어요..." />}

          {/* Quick suggestion chips in chat phase */}
          {phase === "chat" &&
            !loading &&
            report &&
            messages.filter((m) => m.role === "user").length < 4 && (
              <div className="flex flex-wrap gap-1.5 ml-9 mt-1 mb-3">
                {QUICK_SUGGESTIONS.filter(
                  (q) => !messages.some((m) => m.content === q)
                )
                  .slice(0, 3)
                  .map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="h-8 px-3.5 rounded-full bg-white text-[0.8125rem] font-medium text-gray-500 border border-gray-150 active:border-brand/30 active:text-brand active:scale-[0.97] transition-all duration-200"
                    >
                      {q}
                    </button>
                  ))}
              </div>
            )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 하단 영역 */}
      {showInput && (
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100/40 flex-shrink-0 safe-bottom">
          <div className="max-w-lg mx-auto px-4 py-3">
            {/* 다중선택 중이면 → "완료" 버튼으로 교체 */}
            {phase === "intake" && currentStep?.multiSelect && currentSelections.length > 0 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-11 rounded-2xl bg-brand text-white text-[0.9375rem] font-semibold flex items-center justify-center gap-2 active:brightness-95 transition-all duration-200"
              >
                {currentSelections.length}개 선택 완료
              </button>
            ) : (
              /* 일반 입력바 */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = phase === "intake" ? (symptomText || input) : input;
                  if (phase === "intake") {
                    handleIntakeTextInput(text);
                  } else {
                    sendMessage(text);
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={phase === "intake" ? symptomText : input}
                  onChange={(e) =>
                    phase === "intake"
                      ? setSymptomText(e.target.value)
                      : setInput(e.target.value)
                  }
                  placeholder={
                    phase === "intake"
                      ? "직접 입력해도 돼요"
                      : "영양제에 대해 물어보세요"
                  }
                  disabled={loading}
                  className="flex-1 h-11 rounded-2xl bg-gray-50/80 px-4 text-[0.875rem] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand/20 focus:bg-white transition-all duration-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (phase === "intake" ? !symptomText.trim() : !input.trim())
                  }
                  className="w-10 h-10 rounded-xl bg-brand/90 flex items-center justify-center active:bg-brand transition-all duration-200 disabled:opacity-30 flex-shrink-0"
                  aria-label="전송"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5 text-white" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── 리포트 미리보기 모달 ── */}
      {showReportPreview && savedReport && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-3xl max-h-[85dvh] flex flex-col safe-bottom">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900">영양제 리포트</h2>
              <button
                type="button"
                onClick={() => { setShowReportPreview(false); setReportSaved(false); }}
                className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 리포트 내용 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {parseReport(savedReport).map((section, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl ${section.bgColor} ${
                    section.borderColor !== "border-gray-200"
                      ? `border-l-4 ${section.borderColor}`
                      : `border ${section.borderColor}`
                  } p-3.5 mb-2.5`}
                >
                  <p className={`text-xs font-bold ${section.textColor} mb-1.5`}>{section.title}</p>
                  <p className={`text-[0.8125rem] leading-relaxed ${section.textColor} opacity-90 whitespace-pre-line`} style={{ wordBreak: "keep-all" }}>
                    {section.content}
                  </p>
                </div>
              ))}
              {parseReport(savedReport).length === 0 && (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" style={{ wordBreak: "keep-all" }}>
                  {savedReport}
                </p>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2.5">
              {!reportSaved ? (
                <button
                  type="button"
                  onClick={saveReport}
                  className="w-full h-12 rounded-2xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>리포트 저장하기</span>
                </button>
              ) : (
                <div className="w-full h-12 rounded-2xl bg-brand-light text-brand font-semibold text-[0.9375rem] flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>저장 완료</span>
                </div>
              )}
              <button
                type="button"
                onClick={requestPharmacistVerification}
                className="w-full h-12 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:bg-gray-50 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>약사에게 검증받기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
