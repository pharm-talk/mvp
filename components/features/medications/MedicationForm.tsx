"use client";

import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import type { MedicationFormState } from "@/hooks/useMedications";
import { getCategoryConfig } from "./constants";
import PhotoBottomSheet from "./PhotoBottomSheet";
import MedicationFormFields from "./MedicationFormFields";

interface MedicationFormProps {
  form: MedicationFormState;
  editingId: string | null;
  saving: boolean;
  analyzing: boolean;
  showPhotoSheet: boolean;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  albumInputRef: React.RefObject<HTMLInputElement>;
  onUpdateForm: <K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) => void;
  onSave: () => void;
  onReset: () => void;
  onShowPhotoSheet: (show: boolean) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MedicationForm({
  form,
  editingId,
  saving,
  analyzing,
  showPhotoSheet,
  cameraInputRef,
  albumInputRef,
  onUpdateForm,
  onSave,
  onReset,
  onShowPhotoSheet,
  onFileChange,
}: MedicationFormProps) {
  const categoryLabel = getCategoryConfig(form.category).label;

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onReset}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            {editingId ? `${categoryLabel} 수정` : "추가하기"}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pt-6 pb-4">
        {/* AI 사진 입력 (새로 추가할 때만) */}
        {!editingId && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => onShowPhotoSheet(true)}
              disabled={analyzing}
              className="w-full h-14 rounded-2xl border-2 border-dashed border-brand/30 bg-brand-light/30 flex items-center justify-center gap-2.5 active:bg-brand-light/50 transition-all duration-150 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 text-brand animate-spin" />
                  <span className="text-sm font-semibold text-brand">AI가 분석하고 있어요...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-brand" />
                  <span className="text-sm font-semibold text-brand">사진으로 자동 입력</span>
                </>
              )}
            </button>
            <p className="text-[0.6875rem] text-gray-400 text-center mt-1.5">
              약 상자, 처방전, 영양제 라벨 등을 촬영하세요
            </p>
          </div>
        )}

        <MedicationFormFields form={form} onUpdateForm={onUpdateForm} />

        {/* 저장 버튼 */}
        <button
          type="button"
          onClick={onSave}
          disabled={!form.name.trim() || saving}
          className="w-full h-12 mt-8 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center active:brightness-95 transition-all duration-150 disabled:opacity-40"
        >
          {saving ? "저장 중..." : editingId ? "수정 완료" : "추가하기"}
        </button>
        <div className="h-10 safe-bottom" />
      </div>

      {/* 사진 선택 바텀시트 */}
      {showPhotoSheet && (
        <PhotoBottomSheet
          onCamera={() => {
            onShowPhotoSheet(false);
            cameraInputRef.current?.click();
          }}
          onAlbum={() => {
            onShowPhotoSheet(false);
            albumInputRef.current?.click();
          }}
          onClose={() => onShowPhotoSheet(false)}
        />
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
      />
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}
