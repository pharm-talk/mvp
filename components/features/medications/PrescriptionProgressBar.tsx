"use client";

import { getDaysInfo, formatDateKR } from "./utils";

interface PrescriptionProgressBarProps {
  startDate: string | null;
  endDate: string | null;
}

export default function PrescriptionProgressBar({
  startDate,
  endDate,
}: PrescriptionProgressBarProps) {
  const info = getDaysInfo(startDate, endDate);
  if (!info) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">
          {formatDateKR(startDate)} ~ {formatDateKR(endDate)}
        </span>
        <span
          className={`font-semibold ${
            info.isExpired ? "text-red-400" : info.remainingDays <= 1 ? "text-orange-500" : "text-brand"
          }`}
        >
          {info.isExpired ? "복용 완료" : `${info.remainingDays}일 남음`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            info.isExpired ? "bg-gray-300" : info.remainingDays <= 1 ? "bg-orange-400" : "bg-brand"
          }`}
          style={{ width: `${Math.round(info.progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
