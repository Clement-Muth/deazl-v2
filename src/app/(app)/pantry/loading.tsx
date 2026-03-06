function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-foreground/6 ${className ?? ""}`} />;
}

export default function PantryLoading() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-2 pt-8">
        <Skeleton className="mb-3 h-3 w-16 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-2xl" />
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
