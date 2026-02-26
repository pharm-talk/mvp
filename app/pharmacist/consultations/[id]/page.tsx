"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Pill,
  Send,
  User,
  Wand2,
  Loader2,
  FileText,
  PenLine,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

interface HealthSnapshot {
  gender?: string;
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  conditions?: string[];
  allergies?: string[];
  pregnancy_status?: string;
}

interface MedSnapshot {
  name: string;
  type: string;
  dosage: string | null;
  frequency: string | null;
}

interface Consultation {
  id: string;
  user_id: string;
  content: string;
  type: string;
  status: string;
  pharmacist_id: string | null;
  health_snapshot: HealthSnapshot | null;
  medications_snapshot: MedSnapshot[] | null;
  answer: string | null;
  answered_at: string | null;
  followup_question: string | null;
  followup_answer: string | null;
  created_at: string;
}

export default function PharmacistConsultationDetail() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const id = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(true);

  const fetchConsultation = useCallback(async () => {
    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", id)
      .single();
    if (data) setConsultation(data);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  /* 상담 배정 */
  const handleAssign = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !consultation) return;
    setSubmitting(true);
    await supabase
      .from("consultations")
      .update({
        pharmacist_id: user.id,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultation.id);
    setConsultation((prev) =>
      prev ? { ...prev, pharmacist_id: user.id, status: "assigned" } : null
    );
    setSubmitting(false);
  };

  /* 답변 제출 */
  const handleAnswer = async () => {
    if (!answer.trim() || !consultation) return;
    setSubmitting(true);
    await supabase
      .from("consultations")
      .update({
        answer: answer.trim(),
        status: "answered",
        answered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultation.id);
    setConsultation((prev) =>
      prev
        ? {
            ...prev,
            answer: answer.trim(),
            status: "answered",
            answered_at: new Date().toISOString(),
          }
        : null
    );
    setAnswer("");
    setSubmitting(false);
  };

  /* 추가질문 답변 */
  const handleFollowupAnswer = async () => {
    if (!followupAnswer.trim() || !consultation) return;
    setSubmitting(true);
    await supabase
      .from("consultations")
      .update({
        followup_answer: followupAnswer.trim(),
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultation.id);
    setConsultation((prev) =>
      prev
        ? { ...prev, followup_answer: followupAnswer.trim(), status: "closed" }
        : null
    );
    setFollowupAnswer("");
    setSubmitting(false);
  };

  /* AI 도우미 */
  const callAiAssist = async (
    mode: "draft" | "polish" | "followup",
    target: "answer" | "followup"
  ) => {
    if (!consultation) return;
    setAiLoading(true);

    const body: Record<string, unknown> = {
      mode,
      consultType: consultation.type,
      question: consultation.content,
      medications: consultation.medications_snapshot ?? [],
      health: consultation.health_snapshot,
    };

    if (mode === "polish") {
      body.draft = target === "answer" ? answer : followupAnswer;
    }
    if (mode === "followup") {
      body.previousAnswer = consultation.answer;
      body.followupQuestion = consultation.followup_question;
    }

    try {
      const res = await fetch("/api/pharmacist-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.content) {
        if (target === "answer") {
          setAnswer(data.content);
        } else {
          setFollowupAnswer(data.content);
        }
      }
    } catch {
      // 실패 시 무시
    }
    setAiLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getAge = (birthDate?: string) => {
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

  if (!consultation) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-5">
        <p className="text-gray-400 mb-4">상담을 찾을 수 없어요.</p>
        <button
          type="button"
          onClick={() => router.push("/pharmacist")}
          className="text-brand font-semibold text-sm"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  const health = consultation.health_snapshot;
  const meds = consultation.medications_snapshot ?? [];
  const age = getAge(health?.birth_date);
  const isPending = consultation.status === "pending";
  const isAssigned = consultation.status === "assigned";
  const hasFollowup =
    consultation.followup_question && !consultation.followup_answer;
  const typeLabel = consultation.type === "supplement" ? "영양제" : "복약";
  const typeColor =
    consultation.type === "supplement"
      ? "bg-orange-50 text-orange-600"
      : "bg-brand-light text-brand";

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push("/pharmacist")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">상담 상세</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-10 safe-bottom">
        {/* ── 상단 요약 바 ── */}
        <div className="bg-white px-5 py-3.5 border-b border-gray-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>
                {typeLabel} 상담
              </span>
              <StatusBadge status={consultation.status} />
            </div>
            <span className="text-xs text-gray-300">
              {formatDate(consultation.created_at)}
            </span>
          </div>
        </div>

        <div className="px-5 pt-4 space-y-3">
          {/* ── 환자 정보 카드 (접기/펼치기) ── */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPatientInfo(!showPatientInfo)}
              className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">환자 정보</p>
                  <p className="text-xs text-gray-400">
                    {[
                      health?.gender === "male" ? "남" : health?.gender === "female" ? "여" : null,
                      age ? `${age}세` : null,
                      meds.length > 0 ? `복용약 ${meds.length}개` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "정보 없음"}
                  </p>
                </div>
              </div>
              {showPatientInfo ? (
                <ChevronUp className="w-4 h-4 text-gray-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-300" />
              )}
            </button>

            {showPatientInfo && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                {/* 건강 정보 */}
                {health && (
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-gray-400 mb-2">건강 정보</p>
                    <div className="flex flex-wrap gap-1.5">
                      {health.gender && (
                        <InfoChip
                          label={health.gender === "male" ? "남성" : "여성"}
                        />
                      )}
                      {age && <InfoChip label={`${age}세`} />}
                      {health.height_cm && (
                        <InfoChip label={`${health.height_cm}cm`} />
                      )}
                      {health.weight_kg && (
                        <InfoChip label={`${health.weight_kg}kg`} />
                      )}
                      {health.conditions?.map((c) => (
                        <InfoChip key={c} label={c} variant="warning" />
                      ))}
                      {health.allergies?.map((a) => (
                        <InfoChip
                          key={a}
                          label={`알레르기: ${a}`}
                          variant="danger"
                        />
                      ))}
                      {health.pregnancy_status === "pregnant" && (
                        <InfoChip label="임신 중" variant="warning" />
                      )}
                      {health.pregnancy_status === "nursing" && (
                        <InfoChip label="수유 중" variant="warning" />
                      )}
                    </div>
                  </div>
                )}

                {/* 복용약 */}
                {meds.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      복용 중인 약
                    </p>
                    <div className="space-y-1.5">
                      {meds.map((med, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              med.type === "supplement"
                                ? "bg-orange-50"
                                : "bg-brand-light"
                            }`}
                          >
                            {med.type === "supplement" ? (
                              <SupplementBottle className="w-3.5 h-3.5 text-orange-500" />
                            ) : (
                              <Pill className="w-3.5 h-3.5 text-brand" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900">
                              {med.name}
                            </span>
                            {(med.dosage || med.frequency) && (
                              <span className="text-xs text-gray-400 ml-2">
                                {[med.dosage, med.frequency]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 상담 내용 ── */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">
              환자 상담 내용
            </p>
            <p
              className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
              style={{ wordBreak: "keep-all" }}
            >
              {consultation.content}
            </p>
          </div>

          {/* ── 대기 중 → 상담 받기 ── */}
          {isPending && (
            <div className="bg-white rounded-2xl shadow-card p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                아직 배정되지 않은 상담이에요
              </p>
              <p className="text-xs text-gray-400 mb-4">
                상담을 받으면 답변을 작성할 수 있어요
              </p>
              <button
                type="button"
                onClick={handleAssign}
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center active:brightness-95 transition-all duration-150 disabled:opacity-60"
              >
                {submitting ? "배정 중..." : "이 상담 받기"}
              </button>
            </div>
          )}

          {/* ── 답변 작성 영역 ── */}
          {isAssigned && !consultation.answer && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {/* 답변 작성 헤더 */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                    <PenLine className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">답변 작성</p>
                    <p className="text-xs text-gray-400">
                      직접 작성하거나, 초안을 뽑아서 수정하세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* AI 도우미 버튼들 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => callAiAssist("draft", "answer")}
                    disabled={aiLoading}
                    className="flex-1 h-10 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5 active:bg-gray-100 transition-colors duration-150 disabled:opacity-40"
                  >
                    {aiLoading && !answer ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    초안 뽑기
                  </button>
                  <button
                    type="button"
                    onClick={() => callAiAssist("polish", "answer")}
                    disabled={aiLoading || !answer.trim()}
                    className="flex-1 h-10 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5 active:bg-gray-100 transition-colors duration-150 disabled:opacity-40"
                  >
                    {aiLoading && answer ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    다듬어주기
                  </button>
                </div>

                {aiLoading && (
                  <div className="bg-brand-light rounded-xl px-3.5 py-3 flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 text-brand animate-spin flex-shrink-0" />
                    <p className="text-sm text-brand font-medium">
                      답변을 준비하고 있어요...
                    </p>
                  </div>
                )}

                {/* 텍스트 영역 */}
                <textarea
                  placeholder={`환자에게 전달할 답변을 작성해주세요.\n\n러프하게 적어도 '다듬어주기'로 깔끔하게 정리할 수 있어요.`}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 placeholder:leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-300">{answer.length}자</p>
                  {answer.trim() && (
                    <p className="text-xs text-gray-400">
                      내용을 수정한 뒤 전송하세요
                    </p>
                  )}
                </div>

                {/* 미리보기 (답변이 있을 때) */}
                {answer.trim() && (
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      환자에게 보이는 형태
                    </p>
                    <AnswerPreview content={answer} />
                  </div>
                )}

                {/* 전송 버튼 */}
                <button
                  type="button"
                  onClick={handleAnswer}
                  disabled={!answer.trim() || submitting}
                  className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      답변 전송하기
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── 내 답변 (이미 답변한 경우) ── */}
          {consultation.answer && (
            <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-brand">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-brand">내 답변</p>
                {consultation.answered_at && (
                  <span className="text-xs text-gray-300">
                    {formatDate(consultation.answered_at)}
                  </span>
                )}
              </div>
              <p
                className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
                style={{ wordBreak: "keep-all" }}
              >
                {consultation.answer}
              </p>
            </div>
          )}

          {/* ── 추가 질문 ── */}
          {consultation.followup_question && (
            <div className="bg-white rounded-2xl shadow-card p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">
                환자 추가 질문
              </p>
              <p
                className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
                style={{ wordBreak: "keep-all" }}
              >
                {consultation.followup_question}
              </p>
            </div>
          )}

          {/* 추가 답변 (이미 답변한 경우) */}
          {consultation.followup_answer && (
            <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-brand">
              <p className="text-xs font-semibold text-brand mb-2">추가 답변</p>
              <p
                className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap"
                style={{ wordBreak: "keep-all" }}
              >
                {consultation.followup_answer}
              </p>
            </div>
          )}

          {/* ── 추가질문 답변 작성 ── */}
          {hasFollowup && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      추가 질문 답변
                    </p>
                    <p className="text-xs text-gray-400">
                      환자가 추가 질문을 남겼어요
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* AI 도우미 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => callAiAssist("followup", "followup")}
                    disabled={aiLoading}
                    className="flex-1 h-10 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5 active:bg-gray-100 transition-colors duration-150 disabled:opacity-40"
                  >
                    {aiLoading && !followupAnswer ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    초안 뽑기
                  </button>
                  <button
                    type="button"
                    onClick={() => callAiAssist("polish", "followup")}
                    disabled={aiLoading || !followupAnswer.trim()}
                    className="flex-1 h-10 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5 active:bg-gray-100 transition-colors duration-150 disabled:opacity-40"
                  >
                    {aiLoading && followupAnswer ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    다듬어주기
                  </button>
                </div>

                {aiLoading && (
                  <div className="bg-brand-light rounded-xl px-3.5 py-3 flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 text-brand animate-spin flex-shrink-0" />
                    <p className="text-sm text-brand font-medium">
                      답변을 준비하고 있어요...
                    </p>
                  </div>
                )}

                <textarea
                  placeholder="추가 질문에 대한 답변을 작성해주세요."
                  value={followupAnswer}
                  onChange={(e) => setFollowupAnswer(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
                />

                <button
                  type="button"
                  onClick={handleFollowupAnswer}
                  disabled={!followupAnswer.trim() || submitting}
                  className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      답변 전송하기
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── 상태 뱃지 ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; style: string }> = {
    pending: { label: "대기 중", style: "bg-amber-50 text-amber-600" },
    assigned: { label: "답변 진행", style: "bg-blue-50 text-blue-600" },
    answered: { label: "답변 완료", style: "bg-brand-light text-brand" },
    closed: { label: "종료", style: "bg-gray-100 text-gray-500" },
  };
  const info = map[status] ?? map.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${info.style}`}
    >
      {status === "pending" ? (
        <Clock className="w-3 h-3" />
      ) : (
        <CheckCircle2 className="w-3 h-3" />
      )}
      {info.label}
    </span>
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
    default: "bg-gray-50 text-gray-600",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

/* ── 답변 미리보기 (환자에게 보이는 형태) ── */
function AnswerPreview({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());

  if (paragraphs.length <= 1) {
    return (
      <p
        className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
        style={{ wordBreak: "keep-all" }}
      >
        {content}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {paragraphs.map((para, i) => {
        // [섹션 제목] 패턴 감지
        const sectionMatch = para.match(/^\[(.+?)\]\s*([\s\S]*)$/);
        if (sectionMatch) {
          const title = sectionMatch[1];
          const body = sectionMatch[2].trim();
          const isWarning =
            title.includes("주의") || title.includes("금기");

          return (
            <div key={i}>
              <p
                className={`text-xs font-bold mb-1 ${
                  isWarning ? "text-amber-600" : "text-brand"
                }`}
              >
                {title}
              </p>
              <p
                className="text-sm text-gray-600 leading-relaxed"
                style={{ wordBreak: "keep-all" }}
              >
                {body}
              </p>
            </div>
          );
        }

        return (
          <p
            key={i}
            className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
            style={{ wordBreak: "keep-all" }}
          >
            {para}
          </p>
        );
      })}
    </div>
  );
}
