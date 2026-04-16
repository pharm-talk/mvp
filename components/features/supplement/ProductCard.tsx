"use client";

import { AlertTriangle, Clock } from "lucide-react";

interface ProductCardProps {
  ingredient: string;
  reason: string;
  domesticBrands: string[];
  importedBrands: string[];
  dosageTip?: string;
  caution?: string;
  index: number;
}

export function ProductCard({
  ingredient,
  reason,
  domesticBrands,
  importedBrands,
  dosageTip,
  caution,
  index,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* 성분명 + 이유 */}
      <div className="flex items-start gap-3 mb-3">
        <span className="w-6 h-6 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-brand">{index + 1}</span>
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[0.9375rem] font-bold text-gray-900">{ingredient}</h3>
          <p className="text-[0.8125rem] text-gray-500 mt-0.5 leading-relaxed">
            {reason}
          </p>
        </div>
      </div>

      {/* 브랜드 추천 */}
      {(domesticBrands.length > 0 || importedBrands.length > 0) && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          {domesticBrands.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-[0.6875rem] font-semibold text-gray-400 w-8 flex-shrink-0 pt-0.5">국내</span>
              <div className="flex flex-wrap gap-1.5">
                {domesticBrands.map((brand) => (
                  <span
                    key={brand}
                    className="text-[0.75rem] font-medium text-gray-700"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
          {importedBrands.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-[0.6875rem] font-semibold text-blue-400 w-8 flex-shrink-0 pt-0.5">수입</span>
              <div className="flex flex-wrap gap-1.5">
                {importedBrands.map((brand) => (
                  <span
                    key={brand}
                    className="text-[0.75rem] font-medium text-gray-700"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 복용 TIP */}
      {dosageTip && (
        <div className="flex items-start gap-2 mt-3">
          <Clock className="w-3.5 h-3.5 text-brand mt-0.5 flex-shrink-0" />
          <p className="text-[0.75rem] text-gray-500 leading-relaxed">
            {dosageTip}
          </p>
        </div>
      )}

      {/* 주의사항 */}
      {caution && (
        <div className="flex items-start gap-2 mt-2.5 px-3 py-2 rounded-lg bg-amber-50" role="alert">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-[0.75rem] text-amber-700 leading-relaxed">
            {caution}
          </p>
        </div>
      )}
    </div>
  );
}
