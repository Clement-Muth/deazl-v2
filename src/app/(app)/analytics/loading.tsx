export default function AnalyticsLoading() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-2 pt-8">
        <div className="mb-2 h-3 w-24 animate-pulse rounded-full bg-primary/20" />
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-foreground/10" />
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-52 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}
