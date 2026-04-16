"use client";

import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  PenLine,
  AlertTriangle,
} from "lucide-react";
import { Robot, ShieldCheck } from "@phosphor-icons/react";
import { usePharmacistConsultation } from "@/hooks/usePharmacistConsultation";
import { PatientInfoCard } from "@/components/features/pharmacist/PatientInfoCard";
import {
  AssignCard,
  VerificationActions,
  AnswerEditor,
  FollowupEditor,
} from "@/components/features/pharmacist/PharmacistAnswerEditor";
import { formatDateFull } from "@/lib/format";

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

export default function PharmacistConsultationDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const {
    consultation,
    loading,
    error,
    editedAnswer,
    setEditedAnswer,
    followupAnswer,
    setFollowupAnswer,
    submitting,
    editMode,
    setEditMode,
    handleAssign,
    handleApproveAsIs,
    handleSubmitEdited,
    handleFollowupAnswer,
    refetch,
  } = usePharmacistConsultation(id);

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <p className="text-sm text-gray-600 mb-4 text-center break-words">
          {error}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 px-5 rounded-full bg-brand text-white text-sm font-semibold active:brightness-95 transition-all duration-150"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={() => router.push("/pharmacist")}
            className="h-10 px-5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold active:bg-gray-200 transition-all duration-150"
          >
            대시보드로
          </button>
        </div>
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

  const meds = consultation.medications_snapshot ?? [];
  const isPending = consultation.status === "pending";
  const isAssigned = consultation.status === "assigned";
  const isAnswered = consultation.status === "answered";
  const isVerified = !!consultation.verified_at;
  const hasAiReport = !!consultation.ai_report;
  const needsVerification = hasAiReport && !isVerified && (isAssigned || isPending);
  const hasFollowup = consultation.followup_question && !consultation.followup_answer;
  const typeLabel = consultation.type === "supplement" ? "영양제" : "복약";
  const typeColor =
    consultation.type === "supplement"
      ? "bg-orange-50 text-orange-600"
      : "bg-brand-light text-brand";

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
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
        <div className="bg-white px-5 py-3.5 border-b border-gray-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>
                {typeLabel} 상담
              </span>
              <StatusBadge status={consultation.status} />
            </div>
            <span className="text-xs text-gray-300">
              {formatDateFull(consultation.created_at)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 break-words leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <div className="px-5 pt-4 space-y-3">
          <PatientInfoCard health={consultation.health_snapshot} meds={meds} />

          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">환자 상담 내용</p>
            <p className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
              {consultation.content}
            </p>
          </div>

          {hasAiReport && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-blue-100">
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Robot className="w-5 h-5 text-blue-500" weight="duotone" />
                    <p className="text-sm font-bold text-gray-900">AI 분석 리포트</p>
                  </div>
                  {consultation.ai_report_at && (
                    <span className="text-xs text-gray-400">
                      {formatDateFull(consultation.ai_report_at)}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-gray-700 leading-[1.8] whitespace-pre-wrap break-words">
                  {consultation.ai_report}
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <AssignCard hasAiReport={hasAiReport} submitting={submitting} onAssign={handleAssign} />
          )}

          {isAssigned && needsVerification && !editMode && (
            <VerificationActions
              submitting={submitting}
              onApprove={handleApproveAsIs}
              onEdit={() => setEditMode(true)}
            />
          )}

          {editMode && (
            <AnswerEditor
              value={editedAnswer}
              onChange={setEditedAnswer}
              submitting={submitting}
              onSubmit={handleSubmitEdited}
              onCancel={() => setEditMode(false)}
              title="답변 수정"
              description="AI 리포트를 수정한 뒤 검증해주세요"
              rows={12}
              submitLabel="수정 후 검증"
            />
          )}

          {isAssigned && !hasAiReport && !consultation.answer && (
            <AnswerEditor
              value={editedAnswer}
              onChange={setEditedAnswer}
              submitting={submitting}
              onSubmit={handleSubmitEdited}
              title="답변 작성"
              description="AI 리포트가 없어서 직접 작성해주세요"
              placeholder="환자에게 전달할 답변을 작성해주세요."
              submitLabel="답변 전송하기"
            />
          )}

          {consultation.answer && isVerified && !editMode && (
            <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-brand">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand" weight="duotone" />
                  <p className="text-xs font-semibold text-brand">검증 완료된 답변</p>
                </div>
                {consultation.verified_at && (
                  <span className="text-xs text-gray-300">
                    {formatDateFull(consultation.verified_at)}
                  </span>
                )}
              </div>
              {consultation.answer !== consultation.ai_report ? (
                <p className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                  {consultation.answer}
                </p>
              ) : (
                <p className="text-sm text-gray-500">AI 리포트를 그대로 승인했습니다.</p>
              )}

              {isAnswered && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedAnswer(consultation.answer ?? "");
                    setEditMode(true);
                  }}
                  className="mt-3 w-full h-10 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 active:bg-gray-200 transition-colors duration-150"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  답변 수정
                </button>
              )}
            </div>
          )}

          {consultation.followup_question && (
            <div className="bg-white rounded-2xl shadow-card p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">환자 추가 질문</p>
              <p className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                {consultation.followup_question}
              </p>
            </div>
          )}

          {consultation.followup_answer && (
            <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-brand">
              <p className="text-xs font-semibold text-brand mb-2">추가 답변</p>
              <p className="text-[0.9375rem] text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                {consultation.followup_answer}
              </p>
            </div>
          )}

          {hasFollowup && (
            <FollowupEditor
              value={followupAnswer}
              onChange={setFollowupAnswer}
              submitting={submitting}
              onSubmit={handleFollowupAnswer}
            />
          )}
        </div>
      </main>
    </div>
  );
}
