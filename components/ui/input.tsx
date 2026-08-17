import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-[0.95rem] border border-input/90 bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-shadow file:mr-3 file:rounded-[0.8rem] file:border-0 file:bg-primary file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground file:transition-colors hover:file:bg-primary/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[0_0_0_4px_rgba(75,133,97,0.08)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
