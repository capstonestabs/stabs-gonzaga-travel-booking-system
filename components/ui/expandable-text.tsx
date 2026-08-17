"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export function ExpandableText({
  text,
  threshold = 88,
  collapsedClassName = "line-clamp-2",
  textClassName = "text-xs leading-5 text-muted-foreground",
  className,
  expandLabel = "Show more",
  collapseLabel = "Show less"
}: {
  text: string;
  threshold?: number;
  collapsedClassName?: string;
  textClassName?: string;
  className?: string;
  expandLabel?: string;
  collapseLabel?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = useMemo(() => text.trim().length > threshold || text.includes("\n"), [text, threshold]);

  return (
    <div className={cn("space-y-1", className)}>
      <p className={cn(textClassName, shouldCollapse && !isExpanded ? collapsedClassName : null)}>
        {text}
      </p>

      {shouldCollapse ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsExpanded((current) => !current);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
          aria-expanded={isExpanded}
        >
          {isExpanded ? collapseLabel : expandLabel}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded ? "rotate-180" : "")} />
        </button>
      ) : null}
    </div>
  );
}
