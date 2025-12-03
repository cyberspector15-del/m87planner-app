import { MapPin, Clock, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  time: string;
  endTime: string;
  title: string;
  location?: string;
  priority: "high" | "medium" | "low";
  status: "completed" | "current" | "upcoming";
  travelBuffer?: number;
}

const mockEvents: TimelineEvent[] = [
  {
    id: "1",
    time: "08:00",
    endTime: "08:30",
    title: "Morning Meditation",
    priority: "medium",
    status: "completed",
  },
  {
    id: "2",
    time: "09:00",
    endTime: "10:30",
    title: "Deep Work Session",
    location: "Home Office",
    priority: "high",
    status: "completed",
  },
  {
    id: "3",
    time: "11:00",
    endTime: "12:00",
    title: "Team Standup Meeting",
    location: "Zoom",
    priority: "high",
    status: "current",
    travelBuffer: 15,
  },
  {
    id: "4",
    time: "13:00",
    endTime: "14:00",
    title: "Lunch Break",
    priority: "low",
    status: "upcoming",
  },
  {
    id: "5",
    time: "14:30",
    endTime: "16:00",
    title: "Project Development",
    location: "Main Office",
    priority: "high",
    status: "upcoming",
    travelBuffer: 25,
  },
  {
    id: "6",
    time: "17:00",
    endTime: "18:00",
    title: "Gym Session",
    location: "Fitness Center",
    priority: "medium",
    status: "upcoming",
    travelBuffer: 15,
  },
];

const Timeline = () => {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="timeline-line" />

      <div className="space-y-4 pl-10">
        {mockEvents.map((event, index) => (
          <div
            key={event.id}
            className={cn(
              "relative animate-fade-in",
              { "opacity-60": event.status === "completed" }
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Timeline dot */}
            <div
              className={cn(
                "absolute -left-10 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                event.status === "completed" && "bg-cosmic-silver/20",
                event.status === "current" && "bg-cosmic-teal/20 glow-teal",
                event.status === "upcoming" && "bg-muted"
              )}
            >
              {event.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-cosmic-silver" />
              ) : event.status === "current" ? (
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
            {event.travelBuffer && event.status !== "completed" && (
              <div className="absolute -left-10 -top-2 flex items-center gap-1 text-[10px] text-cosmic-teal">
                <MapPin className="w-3 h-3" />
                <span>{event.travelBuffer}min</span>
              </div>
            )}

            {/* Event card */}
            <div
              className={cn(
                "glass rounded-xl p-4 transition-all duration-300 hover:border-cosmic-silver/30",
                event.status === "current" && "border-cosmic-teal/30 glow-teal"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        event.priority === "high" && "priority-high",
                        event.priority === "medium" && "priority-medium",
                        event.priority === "low" && "priority-low"
                      )}
                    >
                      {event.priority}
                    </span>
                    {event.status === "current" && (
                      <span className="text-xs text-cosmic-teal font-medium animate-pulse">
                        NOW
                      </span>
                    )}
                  </div>
                  <h3
                    className={cn(
                      "font-medium text-foreground truncate",
                      event.status === "current" && "text-glow-teal"
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
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-sm text-cosmic-silver font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>{event.endTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
