import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ComingSoonPlaceholder({
  title,
  message,
  icon: Icon = Construction,
  className
}: {
  title: string;
  message?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn("dashboard-glass-panel overflow-hidden", className)}>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/15 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="space-y-1.5">
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">
            {title}
          </p>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            {message ?? "This section is being built and isn't available yet. Check back soon."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}