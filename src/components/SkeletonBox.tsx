interface SkeletonBoxProps {
  className?: string;
}

export default function SkeletonBox({ className = '' }: SkeletonBoxProps) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="surface-panel p-5 space-y-3">
      <SkeletonBox className="h-4 w-3/4" />
      <SkeletonBox className="h-3 w-1/2" />
      <SkeletonBox className="h-8 w-full mt-2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3">
      <SkeletonBox className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBox className="h-3.5 w-2/3" />
        <SkeletonBox className="h-2.5 w-1/3" />
      </div>
      <SkeletonBox className="h-4 w-12" />
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
