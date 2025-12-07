import { MapPin, Clock, CheckCircle2, Circle, ArrowRight, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents, Event } from "@/hooks/useEvents";
import { format, isToday, parseISO } from "date-fns";

interface TimelineProps {
  selectedDate?: Date;
}

type Priority = "high" | "medium" | "low";
type Status = "completed" | "current" | "upcoming";

const getEventStatus = (event: Event): Status => {
  const now = new Date();
  const startTime = parseISO(event.start_time);
  const endTime = parseISO(event.end_time);

  if (event.status === "completed" || now > endTime) {
    return "completed";
  }
  if (now >= startTime && now <= endTime) {
    return "current";
  }
  return "upcoming";
};

const getEventPriority = (event: Event): Priority => {
  // Map status to priority for display purposes
  // In real implementation, you might have a priority field on events
  if (event.status === "scheduled") return "high";
  if (event.status === "tentative") return "medium";
  return "low";
};

const Timeline = ({ selectedDate }: TimelineProps) => {
  const { data: events, isLoading, error } = useEvents(selectedDate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cosmic-silver" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Error loading events</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">No events scheduled</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {selectedDate && !isToday(selectedDate)
            ? `No events for ${format(selectedDate, "MMM d, yyyy")}`
            : "Add tasks and use Auto-Plan to schedule your day"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="timeline-line" />

      <div className="space-y-4 pl-10">
        {events.map((event, index) => {
          const status = getEventStatus(event);
          const priority = getEventPriority(event);
          const startTime = parseISO(event.start_time);
          const endTime = parseISO(event.end_time);

          return (
            <div
              key={event.id}
              className={cn(
                "relative animate-fade-in",
                { "opacity-60": status === "completed" }
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute -left-10 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  status === "completed" && "bg-cosmic-silver/20",
                  status === "current" && "bg-cosmic-teal/20 glow-teal",
                  status === "upcoming" && "bg-muted"
                )}
              >
                {status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-cosmic-silver" />
                ) : status === "current" ? (
                  <div className="relative">
                    <Circle className="w-4 h-4 text-cosmic-teal fill-cosmic-teal" />
                    <div className="absolute inset-0 animate-ping">
                      <Circle className="w-4 h-4 text-cosmic-teal" />
                    </div>
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* Travel buffer indicator */}
              {event.travel_buffer_minutes && event.travel_buffer_minutes > 0 && status !== "completed" && (
                <div className="absolute -left-10 -top-2 flex items-center gap-1 text-[10px] text-cosmic-teal">
                  <MapPin className="w-3 h-3" />
                  <span>{event.travel_buffer_minutes}min</span>
                </div>
              )}

              {/* Event card */}
              <div
                className={cn(
                  "glass rounded-xl p-4 transition-all duration-300 hover:border-cosmic-silver/30",
                  status === "current" && "border-cosmic-teal/30 glow-teal"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full border",
                          priority === "high" && "priority-high",
                          priority === "medium" && "priority-medium",
                          priority === "low" && "priority-low"
                        )}
                      >
                        {priority}
                      </span>
                      {status === "current" && (
                        <span className="text-xs text-cosmic-teal font-medium animate-pulse">
                          NOW
                        </span>
                      )}
                    </div>
                    <h3
                      className={cn(
                        "font-medium text-foreground truncate",
                        status === "current" && "text-glow-teal"
                      )}
                    >
                      {event.title}
                    </h3>
                    {event.location && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm text-muted-foreground/70 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-sm text-cosmic-silver font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{format(startTime, "HH:mm")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <ArrowRight className="w-3 h-3" />
                      <span>{format(endTime, "HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
