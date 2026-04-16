"use client";

import { AlertTriangle, Phone } from "lucide-react";

interface EmergencyBannerProps {
  level: "emergency" | "urgent";
  message: string;
  onClose?: () => void;
}

export function EmergencyBanner({
  level,
  message,
  onClose,
}: EmergencyBannerProps) {
  const isEmergency = level === "emergency";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`sticky top-0 z-50 px-4 py-3 ${
        isEmergency
          ? "bg-red-600 text-white"
          : "bg-amber-500 text-amber-950"
      }`}
    >
      <div className="flex items-start gap-3 max-w-lg mx-auto">
        <AlertTriangle
          className={`shrink-0 mt-0.5 ${
            isEmergency ? "text-white" : "text-amber-900"
          }`}
          size={20}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">{message}</p>

          {isEmergency && (
            <a
              href="tel:119"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 bg-white text-red-600 font-bold text-sm rounded-lg active:scale-95 transition-transform duration-200 ease-out"
              aria-label="119에 전화하기"
            >
              <Phone size={16} aria-hidden="true" />
              119 전화하기
            </a>
          )}
        </div>

        {!isEmergency && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 -m-1 rounded-md active:bg-amber-600/20 transition-colors duration-200 ease-out"
            aria-label="배너 닫기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="text-amber-900"
            >
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
