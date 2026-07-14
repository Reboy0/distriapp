export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3.5 w-full" />
      ))}
    </div>
  );
}

export function CardSkeletonList({ count = 3, lines = 3 }: { count?: number; lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} lines={lines} />
      ))}
    </div>
  );
}
