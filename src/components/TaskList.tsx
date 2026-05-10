import { useState } from 'react';
import { Plus, Clock, Flag, DotsThree, PencilSimple, Trash, Check, MapPin, CircleNotch } from "@phosphor-icons/react";
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Task } from '@/types/database';
import { useTasks, useDeleteTask, useToggleTaskComplete } from '@/hooks/useTasks';
import TaskDialog from './TaskDialog';

const getPriorityConfig = (priority: number) => {
  switch (priority) {
    case 5:
      return { color: 'text-red-400', label: 'Urgent' };
    case 4:
      return { color: 'text-orange-400', label: 'High' };
    case 3:
      return { color: 'text-amber-400', label: 'Medium' };
    case 2:
      return { color: 'text-emerald-400', label: 'Low' };
    default:
      return { color: 'text-muted-foreground', label: 'Lowest' };
  }
};

const getDeadlineLabel = (deadline: string | null) => {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (isToday(date)) return { label: 'Today', urgent: true };
  if (isTomorrow(date)) return { label: 'Tomorrow', urgent: false };
  if (isPast(date)) return { label: 'Overdue', urgent: true };
  return { label: format(date, 'MMM d'), urgent: false };
};

const TaskList = () => {
  const { data: tasks, isLoading, error } = useTasks();
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleTaskComplete();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const incompleteTasks = tasks?.filter((t) => !t.completed) || [];
  const completedTasks = tasks?.filter((t) => t.completed) || [];

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask.mutateAsync(taskToDelete.id);
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    await toggleComplete.mutateAsync({ id: task.id, completed: !task.completed });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  const renderTask = (task: Task, index: number) => {
    const priority = getPriorityConfig(task.priority);
    const deadline = getDeadlineLabel(task.deadline);

    return (
      <div
        key={task.id}
        className={cn(
          'p-4 hover:bg-accent/30 transition-colors cursor-pointer group animate-fade-in',
          task.completed && 'opacity-60'
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Flag size={12} weight="thin" className={priority.color} />
              <span className="text-xs text-muted-foreground">
                {task.flexible ? 'Flexible' : 'Fixed'}
              </span>
            </div>
            <h3
              className={cn(
                'font-medium text-foreground truncate',
                task.completed && 'line-through'
              )}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={12} weight="thin" />
                {task.duration_minutes}min
              </span>
              {task.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} weight="thin" />
                  <span className="truncate max-w-[100px]">{task.location}</span>
                </span>
              )}
              {deadline && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded',
                    deadline.urgent
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-amber-500/10 text-amber-400'
                  )}
                >
                  {deadline.label}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              >
                <DotsThree size={16} weight="thin" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-border/50">
              <DropdownMenuItem onClick={() => handleToggleComplete(task)}>
                <Check size={16} weight="thin" className="mr-2" />
                {task.completed ? 'Mark incomplete' : 'Mark complete'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(task)}>
                <PencilSimple size={16} weight="thin" className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(task)}
                className="text-red-400 focus:text-red-400"
              >
                <Trash size={16} weight="thin" className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Unscheduled Tasks
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading ? 'Loading...' : `${incompleteTasks.length} tasks waiting`}
              </p>
            </div>
            <Button
              variant="cosmic-outline"
              size="sm"
              className="gap-1"
              onClick={() => setDialogOpen(true)}
            >
              <Plus size={16} weight="thin" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="divide-y divide-border/30 cosmic-scrollbar max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <CircleNotch size={24} weight="thin" className="animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Failed to load tasks</p>
              <p className="text-xs mt-1">Please sign in to view your tasks</p>
            </div>
          ) : incompleteTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No tasks yet</p>
              <p className="text-xs mt-1">Click "Add Task" to get started</p>
            </div>
          ) : (
            incompleteTasks.map((task, index) => renderTask(task, index))
          )}
        </div>

        {completedTasks.length > 0 && (
          <>
            <div className="p-3 border-t border-border/50 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium">
                Completed ({completedTasks.length})
              </p>
            </div>
            <div className="divide-y divide-border/30 cosmic-scrollbar max-h-[200px] overflow-y-auto">
              {completedTasks.map((task, index) => renderTask(task, index))}
            </div>
          </>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={editingTask}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="glass-strong border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskList;
