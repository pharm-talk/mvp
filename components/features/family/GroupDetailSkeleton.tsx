export default function GroupDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <div className="w-10 h-10" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="w-10" />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 animate-pulse shadow-card">
          <div className="h-5 w-32 bg-gray-100 rounded mb-3" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 animate-pulse shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-100" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
