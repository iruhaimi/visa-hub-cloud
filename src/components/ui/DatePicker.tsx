import * as React from "react";
import { format, setMonth, setYear, getMonth, getYear, getDaysInMonth, startOfMonth, getDay, addDays, isSameDay, isToday, isBefore, isAfter } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DatePickerProps {
  value?: string | Date | null;
  onChange: (value: string) => void;
  placeholder?: string;
  isRTL?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  triggerClassName?: string;
}

const monthsAr = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const monthsEn = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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
  triggerClassName,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days');
  
  // Handle value as string or Date
  const parseValue = (val: string | Date | null | undefined): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    return new Date(val);
  };
  
  const selectedDate = parseValue(value);
  
  const [calendarDate, setCalendarDate] = React.useState<Date>(
    selectedDate || new Date()
  );
  
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
    if (selectedDate) {
      setCalendarDate(selectedDate);
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
            "w-full h-12 justify-between text-start font-normal group",
            "border-input bg-background hover:bg-accent/50",
            "transition-all duration-200",
            !selectedDate && "text-muted-foreground",
            triggerClassName,
            className
          )}
        >
          <span className="flex items-center gap-2">
            {selectedDate ? (
              <span className="text-foreground font-medium">
                {format(selectedDate, "dd MMMM yyyy", { 
                  locale: isRTL ? ar : enUS 
                })}
              </span>
            ) : (
              <span>{placeholder || (isRTL ? "اختر التاريخ" : "Select date")}</span>
            )}
          </span>
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg",
            "bg-primary/10 text-primary",
            "group-hover:bg-primary group-hover:text-primary-foreground",
            "transition-all duration-200"
          )}>
            <CalendarDays className="h-4 w-4" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[340px] p-0 shadow-2xl border-0 bg-background rounded-2xl overflow-hidden" 
        align={isRTL ? "end" : "start"}
        sideOffset={8}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-5 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => setView(view === 'years' ? 'days' : 'years')}
              className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              {getYear(calendarDate)}
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setView(view === 'months' ? 'days' : 'months')}
              className="block text-2xl font-bold mt-1 hover:opacity-80 transition-opacity"
            >
              {format(calendarDate, "EEEE، d MMMM", { locale: isRTL ? ar : enUS })}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-background">
          {view === 'days' && (
            <>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className={cn(
                    "p-2.5 rounded-xl hover:bg-accent transition-all duration-200",
                    "hover:scale-110 active:scale-95"
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('months')}
                  className="text-base font-bold hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent"
                >
                  {format(calendarDate, "MMMM yyyy", { locale: isRTL ? ar : enUS })}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className={cn(
                    "p-2.5 rounded-xl hover:bg-accent transition-all duration-200",
                    "hover:scale-110 active:scale-95"
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {days.map((day, i) => (
                  <div key={i} className="h-10 flex items-center justify-center text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => (
                  <div key={i} className="aspect-square p-0.5">
                    {date ? (
                      <button
                        type="button"
                        disabled={isDisabled(date)}
                        onClick={() => handleSelect(date)}
                        className={cn(
                          "w-full h-full rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200",
                          "hover:bg-primary/10 hover:scale-110 hover:shadow-md",
                          isToday(date) && !selectedDate && "bg-accent text-accent-foreground ring-2 ring-primary/40 ring-offset-1",
                          isToday(date) && selectedDate && !isSameDay(date, selectedDate) && "bg-accent/50 ring-1 ring-primary/30",
                          selectedDate && isSameDay(date, selectedDate) && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:from-primary hover:to-primary",
                          isDisabled(date) && "opacity-20 cursor-not-allowed hover:bg-transparent hover:scale-100 hover:shadow-none"
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
                  className="p-2.5 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('years')}
                  className="text-base font-bold hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent"
                >
                  {getYear(calendarDate)}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(prev => setYear(prev, getYear(prev) + 1))}
                  className="p-2.5 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-110 active:scale-95"
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
                      "py-3.5 px-2 rounded-xl text-sm font-semibold transition-all duration-200",
                      "hover:bg-primary/10 hover:scale-105 hover:shadow-md",
                      getMonth(calendarDate) === i && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:from-primary hover:to-primary"
                    )}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </>
          )}

          {view === 'years' && (
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-3 gap-2 p-1">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      "py-3.5 px-2 rounded-xl text-sm font-semibold transition-all duration-200",
                      "hover:bg-primary/10 hover:scale-105 hover:shadow-md",
                      getYear(calendarDate) === year && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:from-primary hover:to-primary",
                      year === currentYear && getYear(calendarDate) !== year && "ring-2 ring-primary/30"
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              if (!isDisabled(today)) {
                setCalendarDate(today);
                handleSelect(today);
              } else {
                setCalendarDate(today);
                setView('days');
              }
            }}
            className="text-primary font-semibold hover:text-primary hover:bg-primary/10 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
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
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            {isRTL ? "مسح" : "Clear"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
