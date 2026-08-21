import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function ComingSoonPlaceholder({
  title,
  message,
  icon: Icon = Construction
}: {
  title: string;
  message?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-secondary/65 text-primary">
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