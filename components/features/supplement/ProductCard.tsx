"use client";

import { AlertTriangle } from "lucide-react";

interface ProductCardProps {
  ingredient: string;
  reason: string;
  domesticBrands: string[];
  importedBrands: string[];
  dosageTip?: string;
  caution?: string;
  index: number;
}

const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

const ACCENT_COLORS = [
  "bg-teal-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
];

export function ProductCard({
  ingredient,
  reason,
  domesticBrands,
  importedBrands,
  dosageTip,
  caution,
  index,
}: ProductCardProps) {
  const circledNumber = CIRCLED_NUMBERS[index] ?? `${index + 1}`;
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex">
        {/* 좌측 컬러 바 + 번호 */}
        <div
          className={`${accentColor} w-10 shrink-0 flex items-start justify-center pt-4`}
        >
          <span className="text-white font-bold text-base" aria-hidden="true">
            {circledNumber}
          </span>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0 p-4">
          {/* 성분명 + 추천 이유 */}
          <h3 className="text-base font-bold text-gray-900">{ingredient}</h3>
          <p className="mt-0.5 text-sm text-gray-600 leading-relaxed line-clamp-2">
            {reason}
          </p>

          {/* 브랜드 배지 */}
          {(domesticBrands.length > 0 || importedBrands.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {domesticBrands.map((brand) => (
                <span
                  key={`d-${brand}`}
                  className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-teal-50 text-teal-700"
                >
                  {brand}
                </span>
              ))}
              {importedBrands.map((brand) => (
                <span
                  key={`i-${brand}`}
                  className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700"
                >
                  {brand}
                </span>
              ))}
            </div>
          )}

          {/* 복용 TIP */}
          {dosageTip && (
            <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">복용 TIP</span>{" "}
              {dosageTip}
            </p>
          )}

          {/* 주의사항 */}
          {caution && (
            <div
              className="mt-2.5 flex items-start gap-1.5 px-3 py-2 rounded-lg bg-amber-50"
              role="alert"
            >
              <AlertTriangle
                size={14}
                className="shrink-0 mt-0.5 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-xs text-amber-800 leading-relaxed">
                {caution}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
