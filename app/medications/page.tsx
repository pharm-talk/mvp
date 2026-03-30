"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Camera,
  Loader2,
  Archive,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useMedications } from "@/hooks/useMedications";
import MedicationForm from "@/components/features/medications/MedicationForm";
import MedicationSection from "@/components/features/medications/MedicationSection";
import AiResultsScreen from "@/components/features/medications/AiResultsScreen";
import PhotoBottomSheet from "@/components/features/medications/PhotoBottomSheet";
import SupplementReports from "@/components/features/medications/SupplementReports";
import {
  LoadingSkeleton,
  EmptyState,
  SummaryCard,
  CategoryTabs,
  EmptyCategoryState,
} from "@/components/features/medications/MedicationListParts";

export default function MedicationsPage() {
  const router = useRouter();
  const med = useMedications();

  /* === AI 분석 결과 선택 화면 === */
  if (med.showAiResults && med.aiResults.length > 0) {
    return (
      <AiResultsScreen
        results={med.aiResults}
        saving={med.batchSaving}
        onAddAll={() => med.handleBatchAdd(med.aiResults)}
        onAddOne={med.handleAddOneFromAi}
        onClose={med.resetForm}
      />
    );
  }

  /* === 추가/수정 폼 === */
  if (med.showForm) {
    return (
      <MedicationForm
        form={med.form}
        editingId={med.editingId}
        saving={med.saving}
        analyzing={med.analyzing}
        showPhotoSheet={med.showPhotoSheet}
        cameraInputRef={med.cameraInputRef}
        albumInputRef={med.albumInputRef}
        onUpdateForm={med.updateForm}
        onSave={med.handleSave}
        onReset={med.resetForm}
        onShowPhotoSheet={med.setShowPhotoSheet}
        onFileChange={med.handleFileChange}
      />
    );
  }

  /* === 메인 리스트 === */
  return (
    <div className="min-h-dvh bg-surface">
      {/* 숨겨진 파일 인풋 */}
      <input
        ref={med.cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={med.handleFileChange}
        className="hidden"
      />
      <input
        ref={med.albumInputRef}
        type="file"
        accept="image/*"
        onChange={med.handleFileChange}
        className="hidden"
      />

      {/* 헤더 */}
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
          <h1 className="text-base font-bold text-gray-900">내 약 서랍</h1>
          <button
            type="button"
            onClick={() => med.setShowArchived(!med.showArchived)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              med.showArchived ? "bg-brand-light" : "active:bg-gray-50"
            }`}
            aria-label={med.showArchived ? "복용 중 보기" : "복용 기록 보기"}
          >
            <Archive
              className={`w-5 h-5 ${med.showArchived ? "text-brand" : "text-gray-400"}`}
            />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {/* AI 분석 중 오버레이 */}
        {med.analyzing && (
          <div className="px-5 pt-5">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-card">
              <Loader2 className="w-5 h-5 text-brand animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">사진을 분석하고 있어요</p>
                <p className="text-xs text-gray-400">약/영양제 정보를 자동으로 읽는 중...</p>
              </div>
            </div>
          </div>
        )}

        {med.loading ? (
          <LoadingSkeleton />
        ) : med.medications.length === 0 ? (
          <EmptyState
            analyzing={med.analyzing}
            onPhotoAdd={() => med.setShowPhotoSheet(true)}
            onManualAdd={() => med.setShowForm(true)}
          />
        ) : (
          <>
            <SummaryCard
              showArchived={med.showArchived}
              activeCount={med.activeMeds.length}
              archivedCount={med.archivedMeds.length}
              countByCategory={med.countByCategory}
            />
            <CategoryTabs
              activeTab={med.activeTab}
              showArchived={med.showArchived}
              archivedMeds={med.archivedMeds}
              countByCategory={med.countByCategory}
              onTabChange={med.setActiveTab}
            />

            {med.activeTab === "supplement" && !med.showArchived && (
              <SupplementReports
                savedReports={med.savedReports}
                viewingReport={med.viewingReport}
                onViewReport={med.setViewingReport}
              />
            )}

            {med.filteredMeds.length > 0 ? (
              <MedicationSection
                items={med.filteredMeds}
                category={med.activeTab}
                selectedId={med.selectedId}
                deleting={med.deleting}
                showArchived={med.showArchived}
                onSelect={med.setSelectedId}
                onEdit={med.openEdit}
                onDelete={med.handleDelete}
                onArchive={med.handleArchive}
                onUnarchive={med.handleUnarchive}
              />
            ) : (
              <EmptyCategoryState activeTab={med.activeTab} showArchived={med.showArchived} />
            )}

            {!med.showArchived && (
              <div className="px-5 mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => med.setShowPhotoSheet(true)}
                  disabled={med.analyzing}
                  className="w-full h-12 rounded-2xl bg-brand-light/50 text-brand font-semibold text-sm flex items-center justify-center gap-2 active:bg-brand-light transition-all duration-150 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  사진으로 추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    med.updateForm("category", med.activeTab);
                    med.setShowForm(true);
                  }}
                  className="w-full h-12 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:bg-gray-50 transition-all duration-150"
                >
                  <Plus className="w-4 h-4" />
                  직접 입력하기
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {med.showPhotoSheet && (
        <PhotoBottomSheet
          onCamera={() => {
            med.setShowPhotoSheet(false);
            med.cameraInputRef.current?.click();
          }}
          onAlbum={() => {
            med.setShowPhotoSheet(false);
            med.albumInputRef.current?.click();
          }}
          onClose={() => med.setShowPhotoSheet(false)}
        />
      )}

      {med.deleting && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-end justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 safe-bottom animate-in slide-in-from-bottom">
            <p className="text-center text-base font-semibold text-gray-900 mb-6">삭제 중...</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
