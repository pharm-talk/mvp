"use client";

import { ArrowLeft, ArrowUp, Loader2, FileText } from "lucide-react";
import { useSupplementCoach, QUICK_SUGGESTIONS } from "@/hooks/useSupplementCoach";
import {
  AiMessage,
  UserMessage,
  TypingIndicator,
  ReportLoadingSkeleton,
  ChipSelector,
} from "@/components/features/supplement/ChatComponents";
import { ReportMessage } from "@/components/features/supplement/ReportMessage";
import { ReportModal } from "@/components/features/supplement/ReportModal";
import { EmptyMedications } from "@/components/features/supplement/EmptyMedications";
import { PageLoadingSkeleton } from "@/components/features/supplement/PageLoadingSkeleton";

export default function SupplementCoachPage() {
  const coach = useSupplementCoach();

  if (coach.pageLoading) return <PageLoadingSkeleton />;
  if (!coach.hasMedications) return <EmptyMedications router={coach.router} />;

  const { phase, currentStepInfo, currentSelections, showInput } = coach;

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60 flex-shrink-0">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => coach.router.push("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            영양제 코디네이터
          </h1>
          {phase === "chat" && coach.report ? (
            <button
              type="button"
              onClick={coach.generateFinalReport}
              disabled={coach.generatingReport}
              className="h-8 px-3 rounded-lg bg-brand-light text-brand text-xs font-semibold flex items-center gap-1 active:bg-brand-light/80 transition-colors disabled:opacity-50"
            >
              {coach.generatingReport ? (
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
          {coach.messages.map((msg, idx) =>
            msg.isReport ? (
              <ReportMessage key={idx} report={msg.content} />
            ) : msg.role === "assistant" ? (
              <AiMessage key={idx} content={msg.content} />
            ) : (
              <UserMessage key={idx} content={msg.content} />
            )
          )}

          {phase === "intake" &&
            currentStepInfo.question &&
            coach.currentTurn <= 6 && (
              <>
                <AiMessage content={currentStepInfo.question} />
                {currentStepInfo.chips.length > 0 && (
                  <ChipSelector
                    chips={currentStepInfo.chips}
                    selected={currentSelections}
                    multiSelect={currentStepInfo.multiSelect}
                    onToggle={coach.handleChipToggle}
                  />
                )}
              </>
            )}

          {phase === "analyzing" && (
            <>
              <ReportLoadingSkeleton />
              <TypingIndicator text="분석 중이에요..." />
            </>
          )}

          {coach.loading && <TypingIndicator text="생각하고 있어요..." />}

          {phase === "chat" &&
            !coach.loading &&
            coach.report &&
            coach.messages.filter((m) => m.role === "user").length < 4 && (
              <div className="flex flex-wrap gap-1.5 ml-9 mt-1 mb-3">
                {QUICK_SUGGESTIONS.filter(
                  (q) => !coach.messages.some((m) => m.content === q)
                )
                  .slice(0, 3)
                  .map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => coach.sendMessage(q)}
                      className="h-8 px-3.5 rounded-full bg-white text-[0.8125rem] font-medium text-gray-500 border border-gray-150 active:border-brand/30 active:text-brand active:scale-[0.97] transition-all duration-200"
                    >
                      {q}
                    </button>
                  ))}
              </div>
            )}

          <div ref={coach.chatEndRef} />
        </div>
      </div>

      {/* 하단 영역 */}
      {showInput && (
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100/40 flex-shrink-0 safe-bottom">
          <div className="max-w-lg mx-auto px-4 py-3">
            {coach.showNextButton ? (
              <button
                type="button"
                onClick={coach.handleNext}
                className="w-full h-11 rounded-2xl bg-brand text-white text-[0.9375rem] font-semibold flex items-center justify-center gap-2 active:brightness-95 transition-all duration-200"
              >
                {currentSelections.length}개 선택 완료
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (phase === "intake") {
                    coach.handleIntakeTextInput(coach.input);
                  } else {
                    coach.sendMessage(coach.input);
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={coach.inputRef}
                  type="text"
                  value={coach.input}
                  onChange={(e) => coach.setInput(e.target.value)}
                  placeholder={
                    phase === "intake"
                      ? "직접 입력해도 돼요"
                      : "영양제에 대해 물어보세요"
                  }
                  disabled={coach.loading}
                  className="flex-1 h-11 rounded-2xl bg-gray-50/80 px-4 text-[0.875rem] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand/20 focus:bg-white transition-all duration-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={coach.loading || !coach.input.trim()}
                  className="w-10 h-10 rounded-xl bg-brand/90 flex items-center justify-center active:bg-brand transition-all duration-200 disabled:opacity-30 flex-shrink-0"
                  aria-label="전송"
                >
                  {coach.loading ? (
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

      {/* 리포트 미리보기 모달 */}
      {coach.showReportPreview && coach.savedReport && (
        <ReportModal
          savedReport={coach.savedReport}
          reportSaved={coach.reportSaved}
          onClose={() => {
            coach.setShowReportPreview(false);
            coach.setReportSaved(false);
          }}
          onSave={coach.saveReport}
          onRequestVerification={coach.requestPharmacistVerification}
        />
      )}
    </div>
  );
}
