import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Task } from '@/types/database';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  priority: z.number().min(1).max(5),
  duration_minutes: z.number().min(5, 'Minimum 5 minutes').max(480, 'Maximum 8 hours'),
  deadline: z.date().optional().nullable(),
  flexible: z.boolean(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

const TaskDialog = ({ open, onOpenChange, task }: TaskDialogProps) => {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEditing = !!task;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 2,
      duration_minutes: 30,
      deadline: null,
      flexible: true,
      location: '',
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        duration_minutes: task.duration_minutes,
        deadline: task.deadline ? new Date(task.deadline) : null,
        flexible: task.flexible,
        location: task.location || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 2,
        duration_minutes: 30,
        deadline: null,
        flexible: true,
        location: '',
      });
    }
  }, [task, form]);

  const onSubmit = async (values: TaskFormValues) => {
    const taskData = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      priority: values.priority,
      duration_minutes: values.duration_minutes,
      deadline: values.deadline?.toISOString() || null,
      flexible: values.flexible,
      location: values.location?.trim() || null,
    };

    if (isEditing && task) {
      await updateTask.mutateAsync({ id: task.id, updates: taskData });
    } else {
      await createTask.mutateAsync(taskData);
    }

    onOpenChange(false);
  };

  const priorityOptions = [
    { value: 1, label: 'Lowest', color: 'text-muted-foreground' },
    { value: 2, label: 'Low', color: 'text-emerald-400' },
    { value: 3, label: 'Medium', color: 'text-amber-400' },
    { value: 4, label: 'High', color: 'text-orange-400' },
    { value: 5, label: 'Urgent', color: 'text-red-400' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            {isEditing ? 'Edit Task' : 'Create New Task'}
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
                      placeholder="What needs to be done?"
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
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(v) => field.onChange(parseInt(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-strong border-border/50">
                        {priorityOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                            className={option.color}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_minutes"
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
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal bg-input/50 border-border/50',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon size={16} weight="thin" className="ml-auto opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-strong border-border/50" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                      {field.value && (
                        <div className="p-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => field.onChange(null)}
                          >
                            Clear deadline
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Where will this take place?"
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
              name="flexible"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 bg-input/30 p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="cursor-pointer">Flexible timing</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Can this task be rescheduled if needed?
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="cosmic-outline"
                disabled={createTask.isPending || updateTask.isPending}
              >
                {createTask.isPending || updateTask.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
