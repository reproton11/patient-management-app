const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
);

export const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <SkeletonBlock className="h-11 w-11 rounded-lg" />
    <SkeletonBlock className="h-3 w-32 mt-4" />
    <SkeletonBlock className="h-9 w-24 mt-2" />
    <SkeletonBlock className="h-3 w-40 mt-4" />
  </div>
);

export const ChartCardSkeleton = ({ height = 300 }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <SkeletonBlock className="h-5 w-56 mb-4 pb-3 border-b border-gray-100" />
    <div
      className="animate-pulse rounded-md bg-gray-200 w-full"
      style={{ height }}
    />
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-8">
    <div>
      <SkeletonBlock className="h-10 w-80" />
      <SkeletonBlock className="h-4 w-96 mt-2" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <ChartCardSkeleton height={280} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[1, 2].map((i) => (
        <ChartCardSkeleton key={i} height={260} />
      ))}
    </div>
  </div>
);

export default AnalyticsSkeleton;
