"use client";

import { Children, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProgressiveList({
  children,
  initialCount = 4,
  step = 4,
  maxHeightClass = "max-h-[min(34rem,60vh)]",
  className,
  itemsClassName,
  emptyMessage = "Nothing to show yet.",
  showMoreLabel = "Show more",
  showLessLabel = "Show less"
}: {
  children: React.ReactNode;
  initialCount?: number;
  step?: number;
  maxHeightClass?: string;
  className?: string;
  itemsClassName?: string;
  emptyMessage?: string;
  showMoreLabel?: string;
  showLessLabel?: string;
}) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [visibleCount, setVisibleCount] = useState(initialCount);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const hasMore = visibleCount < items.length;
  const shouldCollapse = items.length > initialCount;
  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          shouldCollapse
            ? `${maxHeightClass} overflow-y-auto overscroll-contain rounded-[0.95rem] px-0.5 pr-1`
            : "",
          "min-w-0 [scrollbar-gutter:stable]",
          itemsClassName
        )}
      >
        <div className="space-y-3">{visibleItems}</div>
      </div>

      {shouldCollapse ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(visibleCount, items.length)} of {items.length}
          </p>
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 gap-2"
              onClick={() => setVisibleCount((current) => Math.min(current + step, items.length))}
            >
              {showMoreLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 gap-2"
              onClick={() => setVisibleCount(initialCount)}
            >
              {showLessLabel}
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
