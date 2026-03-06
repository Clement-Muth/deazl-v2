function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-foreground/6 ${className ?? ""}`} />;
}

export default function RecipesLoading() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-2 pt-8">
        <Skeleton className="mb-3 h-3 w-20 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-2xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <Skeleton className="h-32 w-full rounded-none" />
            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
              <Skeleton className="h-3 w-8 rounded-full" />
              <Skeleton className="h-3 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
