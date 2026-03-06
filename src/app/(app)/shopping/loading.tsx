function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-foreground/6 ${className ?? ""}`} />;
}

export default function ShoppingLoading() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-2 pt-8">
        <Skeleton className="mb-3 h-3 w-28 rounded-full" />
        <Skeleton className="h-10 w-44 rounded-2xl" />
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-24 rounded-full" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>

        {[...Array(4)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <div className="flex items-center gap-2.5 px-4 py-3">
              <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
              <Skeleton className="h-3 w-28 rounded-full" />
              <div className="ml-auto">
                <Skeleton className="h-3 w-6 rounded-full" />
              </div>
            </div>
            <div className="border-t border-border/60">
              {[...Array(3)].map((_, j) => (
                <div key={j}>
                  {j > 0 && <div className="mx-4 h-px bg-border/50" />}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
                    <div className="flex flex-1 flex-col gap-1">
                      <Skeleton className="h-3.5 w-32 rounded-full" />
                      <Skeleton className="h-3 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
