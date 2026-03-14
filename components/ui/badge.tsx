import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
  {
    variants: {
      variant: {
        default: "border-primary/10 bg-primary/10 text-primary",
        muted: "border-border/70 bg-muted/65 text-muted-foreground",
        accent: "border-accent/10 bg-accent/10 text-accent",
        success: "border-emerald-600/10 bg-emerald-500/10 text-emerald-800",
        warning: "border-amber-600/10 bg-amber-500/12 text-amber-800",
        destructive: "border-destructive/10 bg-destructive/10 text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, variant, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}
