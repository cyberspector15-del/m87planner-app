import { CaretLeft, CaretRight, Calendar } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateSelector = ({ selectedDate, onDateChange }: DateSelectorProps) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => {
    onDateChange(addDays(selectedDate, -7));
  };

  const goToNextWeek = () => {
    onDateChange(addDays(selectedDate, 7));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Calendar size={20} weight="thin" className="text-cosmic-silver" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          {format(selectedDate, "MMMM yyyy")}
        </h2>
      </div>

      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={goToPreviousWeek}
        >
          <CaretLeft size={16} weight="thin" />
        </Button>

        <div className="flex items-center gap-1 px-2">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={cn(
                  "flex flex-col items-center justify-center w-10 h-14 rounded-lg transition-all duration-200",
                  isSelected
                    ? "bg-cosmic-silver text-primary-foreground glow-silver"
                    : isDayToday
                    ? "bg-cosmic-teal/20 text-cosmic-teal border border-cosmic-teal/30"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span className="text-[10px] uppercase tracking-wider">
                  {format(day, "EEE")}
                </span>
                <span className={cn("text-lg font-medium", isSelected && "font-bold")}>
                  {format(day, "d")}
                </span>
              </button>
            );
          })}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={goToNextWeek}
        >
          <CaretRight size={16} weight="thin" />
        </Button>
      </div>

      <Button variant="cosmic-outline" size="sm" onClick={goToToday}>
        Today
      </Button>
    </div>
  );
};

export default DateSelector;
