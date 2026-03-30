"use client";

import { Camera, ImagePlus } from "lucide-react";

interface PhotoBottomSheetProps {
  onCamera: () => void;
  onAlbum: () => void;
  onClose: () => void;
}

export default function PhotoBottomSheet({
  onCamera,
  onAlbum,
  onClose,
}: PhotoBottomSheetProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
        <div className="px-5 pb-3">
          <p className="text-base font-bold text-gray-900 mb-4">사진 추가</p>
          <button
            type="button"
            onClick={onCamera}
            className="w-full h-[3.25rem] rounded-xl bg-gray-50 text-left px-4 flex items-center gap-3 active:bg-gray-100 transition-colors mb-2"
          >
            <Camera className="w-5 h-5 text-gray-600" />
            <span className="text-[0.9375rem] font-medium text-gray-900">
              카메라로 촬영
            </span>
          </button>
          <button
            type="button"
            onClick={onAlbum}
            className="w-full h-[3.25rem] rounded-xl bg-gray-50 text-left px-4 flex items-center gap-3 active:bg-gray-100 transition-colors mb-2"
          >
            <ImagePlus className="w-5 h-5 text-gray-600" />
            <span className="text-[0.9375rem] font-medium text-gray-900">
              앨범에서 선택
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl text-gray-400 font-medium text-sm mt-1"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
