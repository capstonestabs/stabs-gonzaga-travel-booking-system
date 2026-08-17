"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rounded-[1.2rem] bg-card/70 p-3.5", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col gap-4",
        month: "space-y-4",
        month_caption: "flex items-center justify-between gap-2 px-1",
        caption_label: "font-display text-[1.05rem] font-semibold tracking-tight text-foreground",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-8 w-8 rounded-full border border-border/65 bg-background/80 p-0 text-foreground/85 hover:bg-secondary"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-8 w-8 rounded-full border border-border/65 bg-background/80 p-0 text-foreground/85 hover:bg-secondary"
        ),
        month_grid: "w-full border-separate border-spacing-y-1.5",
        weekdays: "grid grid-cols-7 gap-1",
        weekday:
          "flex h-8 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
        week: "grid grid-cols-7 gap-1",
        day: "relative h-10 w-full p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent p-0 text-sm font-medium text-foreground shadow-none hover:border-border/70 hover:bg-secondary/70"
        ),
        today:
          "rounded-[0.9rem] bg-primary/10 text-primary ring-1 ring-primary/15",
        selected:
          "rounded-[0.9rem] bg-primary text-primary-foreground ring-0 hover:bg-primary/94 hover:text-primary-foreground",
        outside: "text-muted-foreground/35 opacity-70",
        disabled: "text-muted-foreground/35 opacity-55",
        hidden: "invisible",
        ...classNames
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...componentProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", iconClassName)} {...componentProps} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", iconClassName)} {...componentProps} />
          )
      }}
      {...props}
    />
  );
}
