"use client";

import { Check, Minus, SkipForward } from "lucide-react";
import type { Medication, DailyStats, MedicationLog } from "@/types/medication";
import { getCategoryConfig } from "./constants";

interface TodayChecklistProps {
  medications: Medication[];
  takenCount: number;
  totalCount: number;
  todayProgress: number;
  weeklyStats: DailyStats[];
  getLogForMedication: (id: string) => MedicationLog | undefined;
  getLastTakenTime: (id: string) => string | null;
  onToggleTaken: (id: string) => void;
  onSkip: (id: string) => void;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function TodayChecklist({
  medications,
  takenCount,
  totalCount,
  todayProgress,
  weeklyStats,
  getLogForMedication,
  getLastTakenTime,
  onToggleTaken,
  onSkip,
}: TodayChecklistProps) {
  const activeMeds = medications.filter((m) => !m.archived);

  if (activeMeds.length === 0) return null;

  return (
    <div className="px-5 pt-5 mb-2">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h2 className="text-[0.9375rem] font-bold text-gray-900">
            오늘의 복용
          </h2>
          <span className="text-sm font-semibold text-brand">
            {takenCount}/{totalCount} 완료
          </span>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300 ease-out"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
        </div>

        {/* Medication checklist */}
        <div className="divide-y divide-gray-50">
          {activeMeds.map((med) => {
            const log = getLogForMedication(med.id);
            const isTaken = log?.status === "taken";
            const isSkipped = log?.status === "skipped";
            const lastTime = getLastTakenTime(med.id);
            const config = getCategoryConfig(med.category);

            return (
              <div
                key={med.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${
                  isSkipped ? "bg-gray-50/50" : ""
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTaken(med.id)}
                  disabled={isSkipped}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isTaken
                      ? "bg-brand"
                      : isSkipped
                        ? "bg-gray-200"
                        : "border-2 border-gray-200 active:border-brand"
                  }`}
                  aria-label={`${med.name} 복용 체크`}
                >
                  {isTaken && <Check className="w-4 h-4 text-white" />}
                  {isSkipped && <Minus className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {/* Med info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate transition-colors duration-200 ${
                      isTaken
                        ? "text-gray-400 line-through"
                        : isSkipped
                          ? "text-gray-300 line-through"
                          : "text-gray-900"
                    }`}
                  >
                    {med.name}
                    {med.dosage && (
                      <span className="text-gray-300 font-normal ml-1">
                        {med.dosage}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isTaken && lastTime
                      ? `오늘 ${lastTime} 복용`
                      : isSkipped
                        ? "건너뜀"
                        : med.frequency ?? "복용 시간 미설정"}
                  </p>
                </div>

                {/* Skip button */}
                {!isTaken && (
                  <button
                    type="button"
                    onClick={() => onSkip(med.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      isSkipped
                        ? "bg-gray-200 text-gray-500"
                        : "text-gray-300 active:bg-gray-100 active:text-gray-500"
                    }`}
                    aria-label={`${med.name} 건너뛰기`}
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Weekly dots */}
        <WeeklyDots stats={weeklyStats} totalMeds={totalCount} />
      </div>
    </div>
  );
}

function WeeklyDots({
  stats,
  totalMeds,
}: {
  stats: DailyStats[];
  totalMeds: number;
}) {
  if (stats.length === 0 || totalMeds === 0) return null;

  // 이번 주 평균 복용률
  const totalTaken = stats.reduce((s, d) => s + d.taken, 0);
  const totalPossible = stats.reduce((s, d) => s + d.total, 0);
  const weeklyRate =
    totalPossible > 0 ? Math.round((totalTaken / totalPossible) * 100) : 0;

  return (
    <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {stats.map((day) => {
          const rate = day.total > 0 ? day.taken / day.total : 0;
          const dayOfWeek = new Date(day.date + "T12:00:00").getDay();

          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full transition-colors duration-200 ${
                  rate === 0
                    ? "bg-gray-100"
                    : rate < 0.5
                      ? "bg-brand/30"
                      : rate < 1
                        ? "bg-brand/60"
                        : "bg-brand"
                }`}
              />
              <span className="text-[0.5625rem] text-gray-300 leading-none">
                {DAY_LABELS[dayOfWeek]}
              </span>
            </div>
          );
        })}
      </div>
      <span className="text-xs font-semibold text-gray-500">
        이번 주 <span className="text-brand">{weeklyRate}%</span>
      </span>
    </div>
  );
}
