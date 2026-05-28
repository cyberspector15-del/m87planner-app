import { format, isToday } from "date-fns";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/useEvents";

const MobileToday = () => {
  const [selectedDate] = useState(() => new Date());
  const { data: events } = useEvents(selectedDate);

  const title = useMemo(() => {
    return isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d");
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {(events?.length ?? 0).toString()} scheduled
          </p>
        </div>
        <Button size="sm" variant="cosmic-outline">
          Add
        </Button>
      </header>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Mobile UI scaffold. Next: mobile timeline + quick actions.
        </p>
      </div>
    </div>
  );
};

export default MobileToday;

