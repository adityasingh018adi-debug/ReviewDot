import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function CardSkeleton() {
  return (
    <div className="glass space-y-4 rounded-2xl p-6">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-9 w-1/2" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
