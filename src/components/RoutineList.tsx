import { useState } from 'react';
import { Repeat, Plus, PencilSimple, Trash, Clock, Calendar } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useRoutines, useDeleteRoutine, Routine } from '@/hooks/useRoutines';
import RoutineDialog from './RoutineDialog';

const RoutineList = () => {
  const { data: routines, isLoading } = useRoutines();
  const deleteRoutine = useDeleteRoutine();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (routine: Routine) => {
    setSelectedRoutine(routine);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRoutine(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRoutine.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getFrequencyLabel = (frequency: string | null) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekdays': return 'Weekdays';
      case 'weekends': return 'Weekends';
      case 'weekly': return 'Weekly';
      default: return 'Daily';
    }
  };

  const getFrequencyColor = (frequency: string | null) => {
    switch (frequency) {
      case 'daily': return 'bg-cosmic-teal/20 text-cosmic-teal border-cosmic-teal/30';
      case 'weekdays': return 'bg-amber-400/20 text-amber-400 border-amber-400/30';
      case 'weekends': return 'bg-purple-400/20 text-purple-400 border-purple-400/30';
      case 'weekly': return 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat size={20} weight="thin" className="text-cosmic-teal" />
          <h3 className="font-display font-semibold text-foreground">Routines</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreate}
          className="text-cosmic-silver hover:text-foreground"
        >
          <Plus size={16} weight="thin" className="mr-1" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground">Loading...</div>
      ) : !routines?.length ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-3">
            No routines yet. Create recurring habits!
          </p>
          <Button variant="cosmic-outline" size="sm" onClick={handleCreate}>
            <Plus size={16} weight="thin" className="mr-1" />
            Create Routine
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className={`group rounded-lg border p-3 transition-all ${
                routine.active
                  ? 'border-border/50 bg-card/30 hover:border-cosmic-silver/50'
                  : 'border-border/30 bg-card/10 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">
                      {routine.title}
                    </span>
                    {!routine.active && (
                      <Badge variant="outline" className="text-xs opacity-70">
                        Paused
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getFrequencyColor(routine.frequency)}`}
                    >
                      <Calendar size={12} weight="thin" className="mr-1" />
                      {getFrequencyLabel(routine.frequency)}
                    </Badge>
                    
                    <span className="flex items-center gap-1">
                      <Clock size={12} weight="thin" />
                      {formatTime(routine.window_start)} - {formatTime(routine.window_end)}
                    </span>
                    
                    <span>{routine.target_duration_minutes || 30}min</span>
                  </div>
                  
                  {routine.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {routine.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEdit(routine)}
                  >
                    <PencilSimple size={14} weight="thin" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(routine.id)}
                  >
                    <Trash size={14} weight="thin" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoutineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        routine={selectedRoutine}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-strong border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this routine. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoutineList;
