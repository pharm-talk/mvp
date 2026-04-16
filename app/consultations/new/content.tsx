"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import { ConsultProcessBanner } from "@/components/ui/AiDisclaimer";
import { useNewConsultation } from "@/hooks/useNewConsultation";
import { EmergencyBanner } from "@/components/features/emergency/EmergencyBanner";
import ConsultTypeSelector from "@/components/features/consultation/ConsultTypeSelector";
import HealthInfoSummary from "@/components/features/consultation/HealthInfoSummary";
import ConsultGuideQuestions from "@/components/features/consultation/ConsultGuideQuestions";
import ConsultChatOverlay from "@/components/features/consultation/ConsultChatOverlay";
import ConsultImageSection from "@/components/features/consultation/ConsultImageSection";

export default function NewConsultationContent() {
  const c = useNewConsultation();

  const age = c.getAge(c.profile?.birth_date ?? null);

  if (c.loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => c.router.back()}
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
        {c.emergencyState && (
          <EmergencyBanner
            level={c.emergencyState.level}
            message={c.emergencyState.message}
            onClose={c.emergencyState.level === "urgent" ? () => c.setEmergencyState(null) : undefined}
          />
        )}
        <ConsultProcessBanner />
        <div className="h-5" />

        <HealthInfoSummary
          profile={c.profile}
          medications={c.medications}
          age={age}
          showInfo={c.showInfo}
          onToggleInfo={() => c.setShowInfo(!c.showInfo)}
          excludedHealthKeys={c.excludedHealthKeys}
          onToggleHealthKey={c.toggleHealthKey}
          excludedMedIds={c.excludedMedIds}
          onToggleMedId={c.toggleMedId}
        />

        <ConsultTypeSelector
          consultType={c.consultType}
          onTypeChange={c.handleTypeChange}
        />

        <ConsultGuideQuestions
          consultType={c.consultType}
          selectedTopics={c.selectedTopics}
          selectedGoals={c.selectedGoals}
          symptoms={c.symptoms}
          onToggleItem={c.toggleItem}
          setSelectedTopics={c.setSelectedTopics}
          setSelectedGoals={c.setSelectedGoals}
          setSymptoms={c.setSymptoms}
        />

        {/* AI 질문 도우미 버튼 */}
        <button
          type="button"
          onClick={c.openAssist}
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

        {/* 자유 입력 */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            궁금한 점을 자유롭게 적어주세요
          </label>
          <textarea
            placeholder={
              c.consultType === "medication"
                ? "예: 혈압약이랑 소화제 같이 먹어도 되나요?\n요즘 약 먹고 나서 어지러운데 괜찮은 건지..."
                : "예: 비타민D랑 마그네슘 같이 먹어도 되나요?\n피로가 심한데 어떤 영양제가 도움될까요?"
            }
            value={c.content}
            onChange={(e) => c.setContent(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-300 placeholder:leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
          />
          <p className="text-xs text-gray-300 mt-1.5 text-right">{c.content.length}자</p>
        </div>

        <ConsultImageSection
          consultType={c.consultType}
          images={c.images}
          imagePreviews={c.imagePreviews}
          analyzing={c.analyzing}
          extractedMeds={c.extractedMeds}
          analysisComplete={c.analysisComplete}
          analysisError={c.analysisError}
          showPhotoSheet={c.showPhotoSheet}
          onShowPhotoSheet={c.setShowPhotoSheet}
          onImageAdd={c.handleImageAdd}
          onRemoveImage={c.removeImage}
          onRemoveExtracted={c.removeExtracted}
          cameraInputRef={c.cameraInputRef}
          albumInputRef={c.albumInputRef}
        />

        {/* 제출 */}
        <button
          type="button"
          onClick={c.handleSubmit}
          disabled={!c.canSubmit || c.submitting}
          className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-40"
        >
          {c.submitting ? "AI 분석 리포트 생성 중..." : "상담 요청하기"}
        </button>
        <div className="h-6" />
      </main>

      {/* AI 질문 도우미 오버레이 */}
      {c.showAssist && (
        <ConsultChatOverlay
          chatMessages={c.chatMessages}
          chatInput={c.chatInput}
          onChatInputChange={c.setChatInput}
          chatLoading={c.chatLoading}
          suggestedContent={c.suggestedContent}
          summarizing={c.summarizing}
          onClose={() => c.setShowAssist(false)}
          onSend={c.sendChatMessage}
          onApplySuggestion={c.applySuggestion}
          onApplyConversationSummary={c.applyConversationSummary}
          chatEndRef={c.chatEndRef}
          chatInputRef={c.chatInputRef}
        />
      )}
    </div>
  );
}
