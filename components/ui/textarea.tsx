import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-[0.95rem] border border-input/90 bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[0_0_0_4px_rgba(75,133,97,0.08)]",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
