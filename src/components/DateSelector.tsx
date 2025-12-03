import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const days = [
  { short: "Mon", date: 2, isToday: false },
  { short: "Tue", date: 3, isToday: true },
  { short: "Wed", date: 4, isToday: false },
  { short: "Thu", date: 5, isToday: false },
  { short: "Fri", date: 6, isToday: false },
  { short: "Sat", date: 7, isToday: false },
  { short: "Sun", date: 8, isToday: false },
];

const DateSelector = () => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-cosmic-silver" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          December 2024
        </h2>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 px-2">
          {days.map((day) => (
            <button
              key={day.date}
              className={cn(
                "flex flex-col items-center justify-center w-10 h-14 rounded-lg transition-all duration-200",
                day.isToday
                  ? "bg-cosmic-silver text-primary-foreground glow-silver"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <span className="text-[10px] uppercase tracking-wider">
                {day.short}
              </span>
              <span className={cn("text-lg font-medium", day.isToday && "font-bold")}>
                {day.date}
              </span>
            </button>
          ))}
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Button variant="cosmic-outline" size="sm">
        Today
      </Button>
    </div>
  );
};

export default DateSelector;
