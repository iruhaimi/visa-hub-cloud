import * as React from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isRTL?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  isRTL = false,
  disabled = false,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const selectedDate = value ? new Date(value) : undefined;
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD for storage
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange(formattedDate);
    } else {
      onChange("");
    }
    setOpen(false);
  };

  const disabledDays = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-10 justify-between text-start font-normal group",
            "border-input bg-background hover:bg-accent/50",
            "transition-all duration-200",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2">
            {selectedDate ? (
              <span className="text-foreground">
                {format(selectedDate, "dd MMMM yyyy", { 
                  locale: isRTL ? ar : enUS 
                })}
              </span>
            ) : (
              <span>{placeholder || (isRTL ? "اختر التاريخ" : "Select date")}</span>
            )}
          </span>
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "bg-primary/10 text-primary",
            "group-hover:bg-primary group-hover:text-primary-foreground",
            "transition-all duration-200"
          )}>
            <CalendarDays className="h-4 w-4" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 shadow-xl border-border/50 bg-background" 
        align={isRTL ? "end" : "start"}
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabledDays}
          initialFocus
          className="rounded-lg"
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
