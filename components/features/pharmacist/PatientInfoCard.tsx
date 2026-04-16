"use client";

import { useState } from "react";
import { User, Pill, ChevronDown, ChevronUp } from "lucide-react";
import type { HealthSnapshot, MedSnapshot } from "@/types/consultation";

const SupplementBottle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="7" width="10" height="14" rx="2" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M7 12h10" />
  </svg>
);

function InfoChip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "warning" | "danger";
}) {
  const styles = {
    default: "bg-gray-50 text-gray-600",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

function getAge(birthDate?: string) {
  if (!birthDate) return null;
  return new Date().getFullYear() - new Date(birthDate).getFullYear();
}

interface PatientInfoCardProps {
  health: HealthSnapshot | null;
  meds: MedSnapshot[];
}

export function PatientInfoCard({ health, meds }: PatientInfoCardProps) {
  const [showPatientInfo, setShowPatientInfo] = useState(true);
  const age = getAge(health?.birth_date);

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setShowPatientInfo(!showPatientInfo)}
        aria-expanded={showPatientInfo}
        aria-label={showPatientInfo ? "환자 정보 접기" : "환자 정보 펼치기"}
        className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">환자 정보</p>
            <p className="text-xs text-gray-400">
              {[
                health?.gender === "male"
                  ? "남"
                  : health?.gender === "female"
                    ? "여"
                    : null,
                age ? `${age}세` : null,
                meds.length > 0 ? `복용약 ${meds.length}개` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "정보 없음"}
            </p>
          </div>
        </div>
        {showPatientInfo ? (
          <ChevronUp className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-300" />
        )}
      </button>

      {showPatientInfo && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
          {health && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-gray-400 mb-2">
                건강 정보
              </p>
              <div className="flex flex-wrap gap-1.5">
                {health.gender && (
                  <InfoChip
                    label={health.gender === "male" ? "남성" : "여성"}
                  />
                )}
                {age && <InfoChip label={`${age}세`} />}
                {health.height_cm && (
                  <InfoChip label={`${health.height_cm}cm`} />
                )}
                {health.weight_kg && (
                  <InfoChip label={`${health.weight_kg}kg`} />
                )}
                {health.conditions?.map((c) => (
                  <InfoChip key={c} label={c} variant="warning" />
                ))}
                {health.allergies?.map((a) => (
                  <InfoChip
                    key={a}
                    label={`알레르기: ${a}`}
                    variant="danger"
                  />
                ))}
                {health.pregnancy_status === "pregnant" && (
                  <InfoChip label="임신 중" variant="warning" />
                )}
                {health.pregnancy_status === "nursing" && (
                  <InfoChip label="수유 중" variant="warning" />
                )}
              </div>
            </div>
          )}

          {meds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">
                복용 중인 약
              </p>
              <div className="space-y-1.5">
                {meds.map((med, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        med.type === "supplement"
                          ? "bg-orange-50"
                          : "bg-brand-light"
                      }`}
                    >
                      {med.type === "supplement" ? (
                        <SupplementBottle className="w-3.5 h-3.5 text-orange-500" />
                      ) : (
                        <Pill className="w-3.5 h-3.5 text-brand" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">
                        {med.name}
                      </span>
                      {(med.dosage || med.frequency) && (
                        <span className="text-xs text-gray-400 ml-2">
                          {[med.dosage, med.frequency]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
