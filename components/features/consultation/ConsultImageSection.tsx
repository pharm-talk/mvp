"use client";

import type { RefObject } from "react";
import { X, ImagePlus, FileText, Loader2 } from "lucide-react";
import PhotoPickerSheet from "@/components/ui/PhotoPickerSheet";
import type { ConsultType, ExtractedMed } from "@/types/consultation";

interface ConsultImageSectionProps {
  consultType: ConsultType;
  images: File[];
  imagePreviews: string[];
  analyzing: boolean;
  extractedMeds: ExtractedMed[];
  analysisComplete: boolean;
  analysisError: string;
  showPhotoSheet: boolean;
  onShowPhotoSheet: (show: boolean) => void;
  onImageAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveExtracted: (index: number) => void;
  cameraInputRef: RefObject<HTMLInputElement>;
  albumInputRef: RefObject<HTMLInputElement>;
}

export default function ConsultImageSection({
  consultType,
  images,
  imagePreviews,
  analyzing,
  extractedMeds,
  analysisComplete,
  analysisError,
  showPhotoSheet,
  onShowPhotoSheet,
  onImageAdd,
  onRemoveImage,
  onRemoveExtracted,
  cameraInputRef,
  albumInputRef,
}: ConsultImageSectionProps) {
  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {consultType === "supplement"
            ? "사진으로 영양제 인식하기"
            : "사진으로 약 인식하기"}
          <span className="text-gray-300 font-normal ml-1">(선택)</span>
        </label>
        <p className="text-xs text-gray-400 mb-3">
          {consultType === "supplement"
            ? "영양제 병, 패키지 사진을 올리면 AI가 성분을 추출해요"
            : "처방전, 약 봉투 사진을 올리면 AI가 약 정보를 추출해요"}
        </p>

        <div className="flex gap-2 flex-wrap">
          {imagePreviews.map((src, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100"
            >
              <img src={src} alt={`첨부 ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => onShowPhotoSheet(true)}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 active:bg-gray-50 transition-colors"
            >
              <ImagePlus className="w-5 h-5 text-gray-300" />
              <span className="text-[0.625rem] text-gray-300">{images.length}/5</span>
            </button>
          )}
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onImageAdd}
          className="hidden"
        />
        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onImageAdd}
          className="hidden"
        />

        {/* AI 분석 중 */}
        {analyzing && (
          <div className="mt-3 bg-brand-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-brand animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand">
                AI가 {consultType === "supplement" ? "영양제" : "약"} 정보를 분석하고 있어요
              </p>
              <p className="text-xs text-brand/60">잠시만 기다려주세요...</p>
            </div>
          </div>
        )}

        {/* 분석 오류 */}
        {analysisError && !analyzing && (
          <div className="mt-3 bg-gray-50 rounded-2xl px-4 py-3.5">
            <p className="text-sm text-gray-500">{analysisError}</p>
            <p className="text-xs text-gray-400 mt-1">
              직접 {consultType === "supplement" ? "영양제" : "약"} 이름을 입력하셔도 돼요.
            </p>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisComplete && extractedMeds.length > 0 && (
          <div className="mt-3 bg-brand-light rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-brand" />
              <p className="text-sm font-semibold text-brand">
                인식된 {consultType === "supplement" ? "영양제" : "약"} 정보
              </p>
            </div>
            <div className="space-y-2">
              {extractedMeds.map((med, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                    <p className="text-xs text-gray-400">{med.dosage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveExtracted(i)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand/60 mt-2">
              잘못 인식된 항목은 X로 제거할 수 있어요
            </p>
          </div>
        )}
      </div>

      {/* 사진 선택 바텀시트 */}
      {showPhotoSheet && (
        <PhotoPickerSheet
          onClose={() => onShowPhotoSheet(false)}
          cameraInputRef={cameraInputRef}
          albumInputRef={albumInputRef}
        />
      )}
    </>
  );
}
