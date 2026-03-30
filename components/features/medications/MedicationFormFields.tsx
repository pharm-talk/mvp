"use client";

import { Check, Calendar } from "lucide-react";
import type { MedicationFormState } from "@/hooks/useMedications";
import { CATEGORY_CONFIG, DAILY_COUNT_OPTIONS, TIME_OPTIONS } from "./constants";

interface MedicationFormFieldsProps {
  form: MedicationFormState;
  onUpdateForm: <K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) => void;
}

export default function MedicationFormFields({
  form,
  onUpdateForm,
}: MedicationFormFieldsProps) {
  return (
    <>
      {/* 종류 선택 */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">분류</label>
      <div className="flex gap-2 mb-6">
        {CATEGORY_CONFIG.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onUpdateForm("category", value)}
            className={`flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all duration-150 ${
              form.category === value
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-500 active:bg-gray-150"
            }`}
          >
            <Icon className="w-[1.125rem] h-[1.125rem]" />
            {label}
          </button>
        ))}
      </div>

      {/* 제품명 */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        제품명 <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        placeholder={
          form.category === "chronic" ? "예: 아모디핀, 메트포르민" :
          form.category === "prescription" ? "예: 아목시실린, 타이레놀" :
          "예: 비타민D, 오메가3"
        }
        value={form.name}
        onChange={(e) => onUpdateForm("name", e.target.value)}
        className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
      />

      {/* 1회 복용량 */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">1회 복용량</label>
      <input
        type="text"
        placeholder="예: 1정, 2캡슐, 1포"
        value={form.dosage}
        onChange={(e) => onUpdateForm("dosage", e.target.value)}
        className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 mb-6"
      />

      {/* 하루 복용 횟수 */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">하루 복용 횟수</label>
      <div className="flex gap-2 mb-4">
        {DAILY_COUNT_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onUpdateForm("dailyCount", form.dailyCount === opt ? "" : opt)}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-150 ${
              form.dailyCount === opt
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-600 active:bg-gray-150"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* 복용 시간대 */}
      {form.dailyCount && form.dailyCount !== "필요시" && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">복용 시간대</label>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((opt) => {
              const selected = form.times.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    onUpdateForm(
                      "times",
                      selected ? form.times.filter((t) => t !== opt) : [...form.times, opt]
                    )
                  }
                  className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
                    selected
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-150"
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 장기 복용: 복용 시작일 */}
      {form.category === "chronic" && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            복용 시작일
            <span className="text-xs text-gray-400 font-normal ml-1">선택</span>
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => onUpdateForm("startDate", e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
          />
          <p className="text-[0.6875rem] text-gray-400 mt-1">언제부터 드시고 있나요?</p>
        </div>
      )}

      {/* 처방약: 복용 기간 */}
      {form.category === "prescription" && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" />
            복용 기간
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">시작일</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => onUpdateForm("startDate", e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">종료일</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => onUpdateForm("endDate", e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
              />
            </div>
          </div>
        </div>
      )}

      {/* 메모 */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {form.category === "prescription" ? "처방 사유" : "메모"}
        <span className="text-xs text-gray-400 font-normal ml-1">선택</span>
      </label>
      <textarea
        placeholder={
          form.category === "prescription" ? "예: 감기, 장염, 치과 치료" :
          form.category === "supplement" ? "예: 공복에 복용, 식후 30분" :
          "처방 사유나 특이사항"
        }
        value={form.notes}
        onChange={(e) => onUpdateForm("notes", e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
      />
    </>
  );
}
