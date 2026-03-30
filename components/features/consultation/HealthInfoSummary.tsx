"use client";

import { useRouter } from "next/navigation";
import { Pill, ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import { SupplementBottle } from "./ConsultTypeSelector";
import RemovableChip from "@/components/ui/RemovableChip";
import type { Profile, Medication } from "@/hooks/useNewConsultation";

interface HealthInfoSummaryProps {
  profile: Profile | null;
  medications: Medication[];
  age: number | null;
  showInfo: boolean;
  onToggleInfo: () => void;
  excludedHealthKeys: Set<string>;
  onToggleHealthKey: (key: string) => void;
  excludedMedIds: Set<string>;
  onToggleMedId: (id: string) => void;
}

export default function HealthInfoSummary({
  profile,
  medications,
  age,
  showInfo,
  onToggleInfo,
  excludedHealthKeys,
  onToggleHealthKey,
  excludedMedIds,
  onToggleMedId,
}: HealthInfoSummaryProps) {
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={onToggleInfo}
        className="w-full bg-surface rounded-2xl px-4 py-3.5 flex items-center justify-between mb-5 active:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
            <Pill className="w-4 h-4 text-brand" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">
              내 정보 · 복용약 {medications.filter((m) => !excludedMedIds.has(m.id)).length}개
            </p>
            <p className="text-xs text-gray-400">포함할 정보를 선택할 수 있어요</p>
          </div>
        </div>
        {showInfo ? (
          <ChevronUp className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-300" />
        )}
      </button>

      {showInfo && (
        <div className="bg-surface rounded-2xl px-4 py-4 mb-5 space-y-4">
          {/* 건강정보 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">건강정보</p>
            <div className="flex flex-wrap gap-1.5">
              {profile?.gender && (
                <RemovableChip
                  label={profile.gender === "male" ? "남성" : "여성"}
                  excluded={excludedHealthKeys.has("gender")}
                  onToggle={() => onToggleHealthKey("gender")}
                />
              )}
              {age && (
                <RemovableChip
                  label={`${age}세`}
                  excluded={excludedHealthKeys.has("age")}
                  onToggle={() => onToggleHealthKey("age")}
                />
              )}
              {profile?.height_cm && (
                <RemovableChip
                  label={`${profile.height_cm}cm`}
                  excluded={excludedHealthKeys.has("height")}
                  onToggle={() => onToggleHealthKey("height")}
                />
              )}
              {profile?.weight_kg && (
                <RemovableChip
                  label={`${profile.weight_kg}kg`}
                  excluded={excludedHealthKeys.has("weight")}
                  onToggle={() => onToggleHealthKey("weight")}
                />
              )}
              {profile?.conditions && profile.conditions.length > 0 && (
                <RemovableChip
                  label={profile.conditions.join(", ")}
                  variant="warning"
                  excluded={excludedHealthKeys.has("conditions")}
                  onToggle={() => onToggleHealthKey("conditions")}
                />
              )}
              {profile?.allergies && profile.allergies.length > 0 && (
                <RemovableChip
                  label={`알레르기: ${profile.allergies.join(", ")}`}
                  variant="danger"
                  excluded={excludedHealthKeys.has("allergies")}
                  onToggle={() => onToggleHealthKey("allergies")}
                />
              )}
              {(profile?.pregnancy_status === "pregnant" || profile?.pregnancy_status === "nursing") && (
                <RemovableChip
                  label={profile.pregnancy_status === "pregnant" ? "임신 중" : "수유 중"}
                  variant="warning"
                  excluded={excludedHealthKeys.has("pregnancy")}
                  onToggle={() => onToggleHealthKey("pregnancy")}
                />
              )}
            </div>
          </div>

          {/* 복용 약 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">복용 중인 약 · 영양제</p>
            {medications.length === 0 ? (
              <p className="text-xs text-gray-300">
                등록된 약이 없어요.{" "}
                <button
                  type="button"
                  onClick={() => router.push("/medications")}
                  className="text-brand font-semibold"
                >
                  약 서랍에서 추가
                </button>
              </p>
            ) : (
              <div className="space-y-1.5">
                {medications.map((med) => {
                  const excluded = excludedMedIds.has(med.id);
                  return (
                    <div
                      key={med.id}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
                        excluded ? "bg-gray-50 opacity-40" : "bg-white"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          med.type === "supplement" ? "bg-orange-50" : "bg-brand-light"
                        }`}
                      >
                        {med.type === "supplement" ? (
                          <SupplementBottle className="w-3.5 h-3.5 text-orange-500" />
                        ) : (
                          <Pill className="w-3.5 h-3.5 text-brand" />
                        )}
                      </div>
                      <span className={`text-sm font-medium truncate flex-1 ${excluded ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {med.name}
                      </span>
                      {med.dosage && !excluded && (
                        <span className="text-xs text-gray-400 flex-shrink-0">{med.dosage}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleMedId(med.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 active:bg-gray-100 transition-colors"
                        aria-label={excluded ? "포함하기" : "제외하기"}
                      >
                        {excluded ? (
                          <Plus className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-gray-300" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
