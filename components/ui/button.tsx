import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-[1rem] px-5 py-2.5 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-150 ease-out hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(22,74,47,0.16)] hover:bg-primary/94 hover:shadow-[0_14px_28px_rgba(22,74,47,0.22)]",
        secondary:
          "border border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/82",
        outline: "border border-border/80 bg-card text-foreground hover:bg-muted/70",
        ghost: "px-4 text-foreground hover:bg-muted/70",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: {
        default: "",
        sm: "min-h-10 rounded-[0.9rem] px-4 py-2 text-sm",
        lg: "min-h-12 px-6 py-3 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = "Button";

export { Button, buttonVariants };
