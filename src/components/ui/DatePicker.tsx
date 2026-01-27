import * as React from "react";
import { format, setMonth, setYear, getMonth, getYear, getDaysInMonth, startOfMonth, getDay, addDays, isSameDay, isToday, isBefore, isAfter } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const daysAr = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const daysEn = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days');
  const [calendarDate, setCalendarDate] = React.useState<Date>(
    value ? new Date(value) : new Date()
  );
  
  const selectedDate = value ? new Date(value) : undefined;
  const months = isRTL ? monthsAr : monthsEn;
  const days = isRTL ? daysAr : daysEn;
  
  // Generate years range
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

  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    const firstDay = startOfMonth(calendarDate);
    const daysInMonth = getDaysInMonth(calendarDate);
    const startDayOfWeek = getDay(firstDay);
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 0; i < daysInMonth; i++) {
      days.push(addDays(firstDay, i));
    }
    
    return days;
  }, [calendarDate]);
  
  const handleSelect = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    onChange(formattedDate);
    setOpen(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(calendarDate, monthIndex);
    setCalendarDate(newDate);
    setView('days');
  };

  const handleYearSelect = (year: number) => {
    const newDate = setYear(calendarDate, year);
    setCalendarDate(newDate);
    setView('months');
  };

  const isDisabled = (date: Date) => {
    // Create date-only comparisons to avoid time issues
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (minDate) {
      const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (isBefore(dateOnly, minDateOnly)) return true;
    }
    if (maxDate) {
      const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (isAfter(dateOnly, maxDateOnly)) return true;
    }
    return false;
  };

  const goToPrevMonth = () => {
    setCalendarDate(prev => setMonth(prev, getMonth(prev) - 1));
  };

  const goToNextMonth = () => {
    setCalendarDate(prev => setMonth(prev, getMonth(prev) + 1));
  };

  React.useEffect(() => {
    if (value) {
      setCalendarDate(new Date(value));
    }
  }, [value]);

  React.useEffect(() => {
    if (open) {
      setView('days');
    }
  }, [open]);

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
        className="w-[320px] p-0 shadow-2xl border-border/30 bg-background rounded-2xl overflow-hidden" 
        align={isRTL ? "end" : "start"}
        sideOffset={8}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4">
          <button
            type="button"
            onClick={() => setView(view === 'years' ? 'days' : 'years')}
            className="text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            {getYear(calendarDate)}
          </button>
          <button
            type="button"
            onClick={() => setView(view === 'months' ? 'days' : 'months')}
            className="block text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            {format(calendarDate, "d MMMM", { locale: isRTL ? ar : enUS })}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {view === 'days' && (
            <>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('months')}
                  className="text-base font-semibold hover:text-primary transition-colors flex items-center gap-1"
                >
                  {format(calendarDate, "MMMM yyyy", { locale: isRTL ? ar : enUS })}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {days.map((day, i) => (
                  <div key={i} className="h-9 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => (
                  <div key={i} className="aspect-square">
                    {date ? (
                      <button
                        type="button"
                        disabled={isDisabled(date)}
                        onClick={() => handleSelect(date)}
                        className={cn(
                          "w-full h-full rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                          "hover:bg-primary/10 hover:scale-110",
                          isToday(date) && !selectedDate && "bg-accent text-accent-foreground ring-2 ring-primary/30",
                          selectedDate && isSameDay(date, selectedDate) && "bg-primary text-primary-foreground shadow-lg hover:bg-primary",
                          isDisabled(date) && "opacity-30 cursor-not-allowed hover:bg-transparent hover:scale-100"
                        )}
                      >
                        {date.getDate()}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'months' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setCalendarDate(prev => setYear(prev, getYear(prev) - 1))}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('years')}
                  className="text-base font-semibold hover:text-primary transition-colors flex items-center gap-1"
                >
                  {getYear(calendarDate)}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(prev => setYear(prev, getYear(prev) + 1))}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleMonthSelect(i)}
                    className={cn(
                      "py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200",
                      "hover:bg-primary/10 hover:scale-105",
                      getMonth(calendarDate) === i && "bg-primary text-primary-foreground shadow-md hover:bg-primary"
                    )}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </>
          )}

          {view === 'years' && (
            <ScrollArea className="h-[280px]">
              <div className="grid grid-cols-3 gap-2 p-1">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      "py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200",
                      "hover:bg-primary/10 hover:scale-105",
                      getYear(calendarDate) === year && "bg-primary text-primary-foreground shadow-md hover:bg-primary"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              setCalendarDate(today);
              handleSelect(today);
            }}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            {isRTL ? "اليوم" : "Today"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="text-muted-foreground"
          >
            {isRTL ? "مسح" : "Clear"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
