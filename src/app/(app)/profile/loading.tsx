function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-foreground/6 ${className ?? ""}`} />;
}

export default function ProfileLoading() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="flex flex-col items-center px-5 pb-6 pt-10 text-center">
        <Skeleton className="h-20 w-20 rounded-3xl" />
        <Skeleton className="mt-4 h-6 w-32 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-44 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4 px-4 py-2">
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              {i > 0 && <div className="mx-4 h-px bg-border/50" />}
              <div className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
