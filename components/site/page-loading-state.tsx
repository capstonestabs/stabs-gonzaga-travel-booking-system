import { cn } from "@/lib/utils";

function LoadingBar({ className }: { className?: string }) {
  return <div className={cn("skeleton-bar rounded-full", className)} />;
}

function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("panel skeleton-surface min-h-0 p-4 sm:p-5", className)}>
      <div className="space-y-3">
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
    <div className="page-shell space-y-5 py-6 sm:space-y-6 sm:py-8">
      <div className="space-y-3">
        <div className="gradient-chip skeleton-surface inline-flex w-fit items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/55" />
          {label}
        </div>
        <LoadingBar className="h-10 w-full max-w-[24rem]" />
        <LoadingBar className="h-4 w-full max-w-[34rem]" />
      </div>

      <div className="grid gap-4 sm:gap-5">
        {Array.from({ length: cards }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceLoadingState({ label }: { label: string }) {
  return (
    <div className="page-shell grid gap-4 py-4 sm:gap-5 sm:py-6 xl:grid-cols-[15.25rem,minmax(0,1fr)] 2xl:grid-cols-[16rem,minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="panel skeleton-surface p-3.5 sm:p-4">
          <div className="space-y-3">
            <LoadingBar className="h-6 w-20" />
            <LoadingBar className="h-8 w-2/3" />
            <LoadingBar className="h-4 w-full" />
            <LoadingBar className="h-4 w-5/6" />
          </div>
        </div>

        <div className="panel skeleton-surface p-3 sm:p-3.5">
          <div className="grid gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex min-h-11 items-center gap-2.5 rounded-[0.95rem] border border-border/60 bg-card/90 px-3 py-2.5"
              >
                <div className="skeleton-bar h-8 w-8 rounded-[0.8rem]" />
                <LoadingBar className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="space-y-4 sm:space-y-5">
        <div className="space-y-3">
          <div className="gradient-chip skeleton-surface inline-flex w-fit items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/55" />
            {label}
          </div>
          <LoadingBar className="h-10 w-full max-w-[24rem]" />
          <LoadingBar className="h-4 w-full max-w-[34rem]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>

        <LoadingCard className="min-h-[14rem]" />
      </div>
    </div>
  );
}
