import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateEvent, useUpdateEvent, Event } from "@/hooks/useEvents";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().max(200).optional(),
  travelBuffer: z.number().min(0).max(120).optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventDialogProps {
  selectedDate?: Date;
  event?: Event;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const EventDialog = ({ selectedDate, event, open: controlledOpen, onOpenChange, trigger }: EventDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isEditing = !!event;

  const getDefaultValues = (): EventFormValues => {
    if (event) {
      const startDate = parseISO(event.start_time);
      const endDate = parseISO(event.end_time);
      return {
        title: event.title,
        description: event.description || "",
        date: startDate,
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        location: event.location || "",
        travelBuffer: event.travel_buffer_minutes || 0,
      };
    }
    return {
      title: "",
      description: "",
      date: selectedDate || new Date(),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      travelBuffer: 0,
    };
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when event changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, event]);

  const onSubmit = async (values: EventFormValues) => {
    // Combine date with times
    const startDateTime = new Date(values.date);
    const [startHours, startMinutes] = values.startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(values.date);
    const [endHours, endMinutes] = values.endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const eventData = {
      title: values.title,
      description: values.description || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: values.location || null,
      travel_buffer_minutes: values.travelBuffer || null,
      status: "scheduled",
      task_id: null,
    };

    if (isEditing) {
      await updateEvent.mutateAsync({ id: event.id, ...eventData });
    } else {
      await createEvent.mutateAsync(eventData);
    }

    setOpen(false);
    form.reset(getDefaultValues());
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  const defaultTrigger = (
    <Button variant="cosmic-outline" size="sm" className="gap-2">
      <Plus size={16} weight="thin" />
      Add Event
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="glass-strong border-border/50 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            {isEditing ? "Edit Event" : "Schedule New Event"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Event title"
                      className="bg-background/50 border-border/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional description..."
                      className="bg-background/50 border-border/50 resize-none"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-muted-foreground">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-background/50 border-border/50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon size={16} weight="thin" className="ml-auto opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto bg-popover"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground flex items-center gap-1">
                      <Clock size={12} weight="thin" />
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="bg-background/50 border-border/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground flex items-center gap-1">
                      <Clock size={12} weight="thin" />
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="bg-background/50 border-border/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground flex items-center gap-1">
                    <MapPin size={12} weight="thin" />
                    Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Optional location"
                      className="bg-background/50 border-border/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="travelBuffer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Travel Buffer (minutes)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={120}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="bg-background/50 border-border/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="cosmic-primary"
                disabled={isPending}
              >
                {isPending ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Event")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;