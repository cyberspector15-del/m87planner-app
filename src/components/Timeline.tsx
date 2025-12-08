import { useState } from "react";
import { MapPin, Clock, CheckCircle2, Circle, ArrowRight, Calendar, Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents, useDeleteEvent, useUpdateEvent, Event } from "@/hooks/useEvents";
import { format, isToday, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import EventDialog from "@/components/EventDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  if (event.status === "scheduled") return "high";
  if (event.status === "tentative") return "medium";
  return "low";
};

const Timeline = ({ selectedDate }: TimelineProps) => {
  const { data: events, isLoading, error } = useEvents(selectedDate);
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  const handleDelete = async () => {
    if (deletingEvent) {
      await deleteEvent.mutateAsync(deletingEvent.id);
      setDeletingEvent(null);
    }
  };

  const handleToggleComplete = async (event: Event) => {
    const newStatus = event.status === "completed" ? "scheduled" : "completed";
    await updateEvent.mutateAsync({ id: event.id, status: newStatus });
  };

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
    <>
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
                  "relative animate-fade-in group",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute -left-10 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    status === "completed" && "bg-emerald-500/20 glow-complete-subtle",
                    status === "current" && "bg-cosmic-teal/20 glow-teal",
                    status === "upcoming" && "bg-muted"
                  )}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

                {/* Event card - clickable to toggle completion */}
                <div
                  onClick={() => handleToggleComplete(event)}
                  className={cn(
                    "glass rounded-xl p-4 transition-all duration-300 cursor-pointer",
                    status === "completed" && "glow-complete border-emerald-500/50",
                    status === "current" && "border-cosmic-teal/30 glow-teal hover:border-cosmic-silver/30",
                    status === "upcoming" && "hover:border-cosmic-silver/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full border",
                            status === "completed" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                            status !== "completed" && priority === "high" && "priority-high",
                            status !== "completed" && priority === "medium" && "priority-medium",
                            status !== "completed" && priority === "low" && "priority-low"
                          )}
                        >
                          {status === "completed" ? "completed" : priority}
                        </span>
                        {status === "current" && (
                          <span className="text-xs text-cosmic-teal font-medium animate-pulse">
                            NOW
                          </span>
                        )}
                      </div>
                      <h3
                        className={cn(
                          "font-medium truncate transition-colors duration-300",
                          status === "completed" && "text-emerald-400",
                          status === "current" && "text-foreground text-glow-teal",
                          status === "upcoming" && "text-foreground"
                        )}
                      >
                        {status === "completed" && <CheckCircle2 className="w-4 h-4 inline-block mr-2" />}
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
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-cosmic-silver font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{format(startTime, "HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <ArrowRight className="w-3 h-3" />
                          <span>{format(endTime, "HH:mm")}</span>
                        </div>
                      </div>
                      {/* Edit/Delete buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeletingEvent(event); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <EventDialog
        event={editingEvent || undefined}
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        trigger={null}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <AlertDialogContent className="glass-strong border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvent.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Timeline;