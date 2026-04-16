"use client";

import {
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  PenLine,
  AlertTriangle,
} from "lucide-react";
import { ShieldCheck } from "@phosphor-icons/react";

/* -- 배정 대기 카드 -- */

interface AssignCardProps {
  hasAiReport: boolean;
  submitting: boolean;
  onAssign: () => void;
}

export function AssignCard({
  hasAiReport,
  submitting,
  onAssign,
}: AssignCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 text-center">
      {!hasAiReport && (
        <>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            아직 배정되지 않은 상담이에요
          </p>
          <p className="text-xs text-gray-400 mb-4">
            상담을 받으면 답변을 작성할 수 있어요
          </p>
        </>
      )}
      {hasAiReport && (
        <>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            AI 리포트가 생성되었어요
          </p>
          <p className="text-xs text-gray-400 mb-4">
            상담을 받은 후 검증해주세요
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onAssign}
        disabled={submitting}
        className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center active:brightness-95 transition-all duration-150 disabled:opacity-60"
      >
        {submitting ? "배정 중..." : "이 상담 받기"}
      </button>
    </div>
  );
}

/* -- AI 리포트 검증 액션 -- */

interface VerificationActionsProps {
  submitting: boolean;
  onApprove: () => void;
  onEdit: () => void;
}

export function VerificationActions({
  submitting,
  onApprove,
  onEdit,
}: VerificationActionsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
            <ShieldCheck
              className="w-4 h-4 text-brand"
              weight="duotone"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              AI 리포트 검증
            </p>
            <p className="text-xs text-gray-400">
              리포트를 검토하고 승인하거나 수정해주세요
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={onApprove}
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              검증 완료
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="w-full h-12 rounded-xl bg-gray-100 text-gray-700 font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:bg-gray-200 transition-colors duration-150"
        >
          <PenLine className="w-4 h-4" />
          수정 후 검증
        </button>
      </div>
    </div>
  );
}

/* -- 답변 편집기 (수정 모드 / 직접 작성) -- */

interface AnswerEditorProps {
  value: string;
  onChange: (value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  title: string;
  description: string;
  placeholder?: string;
  rows?: number;
  submitLabel: string;
}

export function AnswerEditor({
  value,
  onChange,
  submitting,
  onSubmit,
  onCancel,
  title,
  description,
  placeholder,
  rows = 8,
  submitLabel,
}: AnswerEditorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
            <PenLine className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            const target = e.target;
            setTimeout(() => {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          }}
          placeholder={placeholder}
          rows={rows}
          aria-label="약사 답변 입력"
          className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-300 placeholder:leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
        />
        {onCancel && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-300">{value.length}자</p>
          </div>
        )}

        {onCancel ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-600 font-semibold text-[0.9375rem] flex items-center justify-center active:bg-gray-200 transition-colors duration-150"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim() || submitting}
              className="flex-1 h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {submitLabel}
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || submitting}
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
                {submitLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* -- 추가 질문 답변 입력 -- */

interface FollowupEditorProps {
  value: string;
  onChange: (value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}

export function FollowupEditor({
  value,
  onChange,
  submitting,
  onSubmit,
}: FollowupEditorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">추가 질문 답변</p>
            <p className="text-xs text-gray-400">
              환자가 추가 질문을 남겼어요
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <textarea
          placeholder="추가 질문에 대한 답변을 작성해주세요."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            const target = e.target;
            setTimeout(() => {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          }}
          rows={5}
          aria-label="추가 질문 답변 입력"
          className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || submitting}
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
  );
}
