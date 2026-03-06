function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-foreground/6 ${className ?? ""}`} />;
}

export default function PlanningLoading() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-1 pt-8">
        <Skeleton className="mb-3 h-3 w-24 rounded-full" />
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>

      <div className="flex gap-1.5 overflow-hidden px-4 pb-3 pt-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex min-w-11 flex-1 flex-col items-center gap-2 rounded-2xl px-2 py-2.5">
            <Skeleton className="h-2 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-lg" />
            <div className="flex gap-0.5">
              {[0, 1, 2].map((j) => <Skeleton key={j} className="h-1 w-1 rounded-full" />)}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-5 mb-4 mt-2 flex items-center justify-between">
        <div>
          <Skeleton className="mb-1.5 h-6 w-28 rounded-xl" />
          <Skeleton className="h-4 w-20 rounded-lg" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="overflow-hidden rounded-3xl bg-card shadow-[0_2px_16px_rgba(28,25,23,0.10)]">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              {i > 0 && <div className="mx-4 h-px bg-border/50" />}
              <div className="flex items-center gap-3.5 px-4 py-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-2.5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
