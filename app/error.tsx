"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (추후 Sentry 등 연동 가능)
    if (process.env.NODE_ENV === "development") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        {/* 아이콘 */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* 메시지 */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-gray-900">
            문제가 발생했어요
          </h2>
          <p className="text-sm leading-relaxed text-gray-500" style={{ wordBreak: "keep-all" }}>
            일시적인 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해주세요.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={reset}
            className="w-full rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-medium text-white transition-colors duration-200 ease-out active:bg-gray-800"
          >
            다시 시도
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full rounded-xl bg-gray-100 px-6 py-3.5 text-sm font-medium text-gray-700 transition-colors duration-200 ease-out active:bg-gray-200"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
