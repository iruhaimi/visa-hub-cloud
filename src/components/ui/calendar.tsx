import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 pointer-events-auto bg-background rounded-2xl shadow-xl border", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-6",
        month: "space-y-4",
        caption: "flex justify-center relative items-center h-10 mb-1",
        caption_label: "text-sm font-bold text-foreground tracking-tight uppercase",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "inline-flex items-center justify-center",
          "h-8 w-8 rounded-lg",
          "bg-transparent hover:bg-primary/10",
          "text-muted-foreground hover:text-primary",
          "border border-transparent hover:border-primary/20",
          "transition-all duration-150",
          "active:scale-90"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "flex mb-1",
        head_cell: cn(
          "w-10 h-8 flex items-center justify-center",
          "text-[11px] font-bold uppercase tracking-widest",
          "text-muted-foreground/60"
        ),
        row: "flex w-full",
        cell: cn(
          "relative h-10 w-10 text-center text-sm p-0",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected].day-range-end)]:rounded-r-lg",
          "[&:has([aria-selected].day-outside)]:bg-primary/5",
          "[&:has([aria-selected])]:bg-primary/5",
          "first:[&:has([aria-selected])]:rounded-l-lg",
          "last:[&:has([aria-selected])]:rounded-r-lg"
        ),
        day: cn(
          "h-9 w-9 p-0 font-medium rounded-lg",
          "flex items-center justify-center mx-auto",
          "text-foreground/70 hover:text-foreground",
          "transition-all duration-150",
          "hover:bg-primary/10",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          "aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground font-bold",
          "shadow-md shadow-primary/25",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "scale-105"
        ),
        day_today: cn(
          "bg-accent text-accent-foreground font-bold",
          "ring-1 ring-primary/30"
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/25",
          "aria-selected:bg-primary/5 aria-selected:text-muted-foreground/40"
        ),
        day_disabled: "text-muted-foreground/15 cursor-not-allowed hover:bg-transparent",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" strokeWidth={2} />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" strokeWidth={2} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
