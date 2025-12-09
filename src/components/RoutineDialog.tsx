import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Routine, useCreateRoutine, useUpdateRoutine } from '@/hooks/useRoutines';

const routineSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  frequency: z.enum(['daily', 'weekly', 'weekdays', 'weekends']),
  window_start: z.string().min(1, 'Start time is required'),
  window_end: z.string().min(1, 'End time is required'),
  target_duration_minutes: z.number().min(5).max(480),
  active: z.boolean(),
});

type RoutineFormValues = z.infer<typeof routineSchema>;

interface RoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | null;
}

const RoutineDialog = ({ open, onOpenChange, routine }: RoutineDialogProps) => {
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();
  const isEditing = !!routine;

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      title: '',
      description: '',
      frequency: 'daily',
      window_start: '09:00',
      window_end: '10:00',
      target_duration_minutes: 30,
      active: true,
    },
  });

  useEffect(() => {
    if (routine) {
      form.reset({
        title: routine.title,
        description: routine.description || '',
        frequency: (routine.frequency as 'daily' | 'weekly' | 'weekdays' | 'weekends') || 'daily',
        window_start: routine.window_start,
        window_end: routine.window_end,
        target_duration_minutes: routine.target_duration_minutes || 30,
        active: routine.active ?? true,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        frequency: 'daily',
        window_start: '09:00',
        window_end: '10:00',
        target_duration_minutes: 30,
        active: true,
      });
    }
  }, [routine, form]);

  const onSubmit = async (values: RoutineFormValues) => {
    const routineData = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      frequency: values.frequency,
      window_start: values.window_start,
      window_end: values.window_end,
      target_duration_minutes: values.target_duration_minutes,
      active: values.active,
    };

    if (isEditing && routine) {
      await updateRoutine.mutateAsync({ id: routine.id, updates: routineData });
    } else {
      await createRoutine.mutateAsync(routineData);
    }

    onOpenChange(false);
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Every Day' },
    { value: 'weekdays', label: 'Weekdays Only' },
    { value: 'weekends', label: 'Weekends Only' },
    { value: 'weekly', label: 'Once a Week' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            {isEditing ? 'Edit Routine' : 'Create New Routine'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Morning Meditation"
                      className="bg-input/50 border-border/50"
                      {...field}
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details..."
                      className="bg-input/50 border-border/50 resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-input/50 border-border/50">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-strong border-border/50">
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="window_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Start</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="bg-input/50 border-border/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="window_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred End</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="bg-input/50 border-border/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="target_duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={480}
                      className="bg-input/50 border-border/50"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 bg-input/30 p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Should this routine be scheduled?
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="cosmic-outline"
                disabled={createRoutine.isPending || updateRoutine.isPending}
              >
                {createRoutine.isPending || updateRoutine.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Routine'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RoutineDialog;
