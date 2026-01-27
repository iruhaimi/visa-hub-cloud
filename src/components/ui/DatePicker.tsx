import * as React from "react";
import { format, setMonth, setYear, getMonth, getYear } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const monthsAr = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const monthsEn = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
  const [calendarDate, setCalendarDate] = React.useState<Date>(
    value ? new Date(value) : new Date()
  );
  
  const selectedDate = value ? new Date(value) : undefined;
  const months = isRTL ? monthsAr : monthsEn;
  
  // Generate years range (100 years back to 10 years forward)
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    const startYear = minDate ? getYear(minDate) : currentYear - 100;
    const endYear = maxDate ? getYear(maxDate) : currentYear + 10;
    const yearsList = [];
    for (let year = endYear; year >= startYear; year--) {
      yearsList.push(year);
    }
    return yearsList;
  }, [currentYear, minDate, maxDate]);
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange(formattedDate);
    } else {
      onChange("");
    }
    setOpen(false);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = setMonth(calendarDate, parseInt(monthIndex));
    setCalendarDate(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(calendarDate, parseInt(year));
    setCalendarDate(newDate);
  };

  const disabledDays = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Update calendar date when value changes
  React.useEffect(() => {
    if (value) {
      setCalendarDate(new Date(value));
    }
  }, [value]);

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
        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 p-4 pb-2 border-b border-border/50">
          {/* Month Selector */}
          <Select
            value={getMonth(calendarDate).toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="flex-1 h-9 text-sm font-medium bg-muted/50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              <ScrollArea className="h-[250px]">
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>

          {/* Year Selector */}
          <Select
            value={getYear(calendarDate).toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px] h-9 text-sm font-medium bg-muted/50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              <ScrollArea className="h-[250px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          month={calendarDate}
          onMonthChange={setCalendarDate}
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
