import { cn } from "@/lib/utils";

function LoadingBar({ className }: { className?: string }) {
  return <div className={cn("skeleton-bar rounded-full", className)} />;
}

function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("panel skeleton-surface min-h-0 p-4 sm:p-5", className)}>
      <div className="space-y-2.5">
        <LoadingBar className="h-3 w-24" />
        <LoadingBar className="h-8 w-2/3 max-w-[22rem]" />
        <LoadingBar className="h-4 w-full max-w-[34rem]" />
        <LoadingBar className="h-4 w-5/6 max-w-[28rem]" />
      </div>
    </div>
  );
}

export function PageLoadingState({
  label = "Loading page",
  cards = 3
}: {
  label?: string;
  cards?: number;
}) {
  return (
    <div className="page-shell space-y-4 py-5 sm:space-y-5 sm:py-6">
      <div className="space-y-2.5">
        <div className="gradient-chip skeleton-surface inline-flex w-fit items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/55" />
          {label}
        </div>
        <LoadingBar className="h-10 w-full max-w-[24rem]" />
        <LoadingBar className="h-4 w-full max-w-[34rem]" />
      </div>

      <div className="grid gap-3.5 sm:gap-4">
        {Array.from({ length: cards }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceLoadingState({ label }: { label: string }) {
  return (
    <div className="page-shell space-y-3 py-4 sm:space-y-3.5 sm:py-5">
      <div className="panel skeleton-surface p-3 sm:p-3.5">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="gradient-chip skeleton-surface inline-flex w-fit items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary/55" />
                {label}
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton-bar h-8 w-8 rounded-[0.9rem]" />
                <LoadingBar className="h-7 w-40 max-w-full" />
              </div>
              <LoadingBar className="h-4 w-full max-w-[34rem]" />
              <LoadingBar className="h-4 w-5/6 max-w-[28rem]" />
            </div>

            <div className="skeleton-bar h-11 w-full rounded-[0.95rem] lg:w-40" />
          </div>

          <div className="border-t border-border/70 pt-3">
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex min-h-11 w-[9rem] shrink-0 items-center gap-2 rounded-[0.9rem] border border-border/60 bg-card/90 px-3 py-2.5"
                >
                  <div className="skeleton-bar h-8 w-8 rounded-[0.75rem]" />
                  <LoadingBar className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 min-[480px]:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>

      <LoadingCard className="min-h-[14rem]" />
      <div className="grid gap-3.5 min-[480px]:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <LoadingCard key={index} className="min-h-[11rem]" />
        ))}
      </div>
    </div>
  );
}
