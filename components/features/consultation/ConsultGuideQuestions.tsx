"use client";

import { Check } from "lucide-react";
import type { ConsultType } from "@/types/consultation";
import {
  MEDICATION_TOPICS,
  SUPPLEMENT_GOALS,
  MEDICATION_SYMPTOMS,
} from "@/types/consultation";

interface ConsultGuideQuestionsProps {
  consultType: ConsultType;
  selectedTopics: string[];
  selectedGoals: string[];
  symptoms: string[];
  onToggleItem: (
    list: string[],
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
  setSelectedTopics: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedGoals: React.Dispatch<React.SetStateAction<string[]>>;
  setSymptoms: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ConsultGuideQuestions({
  consultType,
  selectedTopics,
  selectedGoals,
  symptoms,
  onToggleItem,
  setSelectedTopics,
  setSelectedGoals,
  setSymptoms,
}: ConsultGuideQuestionsProps) {
  if (consultType === "medication") {
    return (
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          어떤 상담이 필요하세요?
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {MEDICATION_TOPICS.map(({ value, label }) => {
            const selected = selectedTopics.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onToggleItem(selectedTopics, value, setSelectedTopics)}
                className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                  selected
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-600 active:bg-gray-150"
                }`}
              >
                {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                {label}
              </button>
            );
          })}
        </div>

        {/* 부작용 선택 시 증상 칩 */}
        {selectedTopics.includes("side_effect") && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              어떤 증상이 있나요?
            </label>
            <div className="flex flex-wrap gap-2">
              {MEDICATION_SYMPTOMS.map((symptom) => {
                const selected = symptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => onToggleItem(symptoms, symptom, setSymptoms)}
                    className={`h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 ${
                      selected
                        ? "bg-red-500 text-white"
                        : "bg-red-50 text-red-600 active:bg-red-100"
                    }`}
                  >
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        어떤 도움이 필요하세요?
      </label>
      <div className="flex flex-wrap gap-2">
        {SUPPLEMENT_GOALS.map(({ value, label }) => {
          const selected = selectedGoals.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggleItem(selectedGoals, value, setSelectedGoals)}
              className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                selected
                  ? "bg-orange-500 text-white"
                  : "bg-orange-50 text-orange-600 active:bg-orange-100"
              }`}
            >
              {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
