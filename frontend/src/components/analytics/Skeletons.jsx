const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="card p-6">
    <SkeletonBlock className="h-11 w-11 rounded-lg" />
    <SkeletonBlock className="mt-4 h-3 w-32" />
    <SkeletonBlock className="mt-2 h-8 w-24" />
    <SkeletonBlock className="mt-4 h-3 w-40" />
  </div>
);

const ChartCardSkeleton = ({ height = 300 }) => (
  <div className="card p-6">
    <SkeletonBlock className="mb-4 h-5 w-56 border-b border-gray-100 pb-3" />
    <div
      className="animate-pulse w-full rounded-lg bg-gray-200"
      style={{ height }}
    />
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div>
      <SkeletonBlock className="h-7 w-64" />
      <SkeletonBlock className="mt-2 h-4 w-96 max-w-full" />
    </div>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <ChartCardSkeleton height={280} />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[1, 2].map((i) => (
        <ChartCardSkeleton key={i} height={260} />
      ))}
    </div>
  </div>
);

export default AnalyticsSkeleton;