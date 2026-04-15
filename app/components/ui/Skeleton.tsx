interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />
}

export function VenueCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function TableCardSkeleton() {
  return (
    <div className="rounded-lg border-2 border-[var(--sf2)] bg-[var(--sf)]"
         style={{ aspectRatio: '1' }}>
      <div className="flex flex-col items-center justify-center h-full gap-1.5">
        <Skeleton className="h-5 w-10 rounded-md" />
        <Skeleton className="h-3.5 w-14 rounded-md" />
      </div>
    </div>
  )
}
