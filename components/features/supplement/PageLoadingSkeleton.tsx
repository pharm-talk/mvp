"use client";

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <div className="w-10" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="w-10" />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-16 bg-white rounded-2xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
