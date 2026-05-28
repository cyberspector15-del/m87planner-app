import { Button } from "@/components/ui/button";
import TaskList from "@/components/TaskList";

const MobileTasks = () => {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Your task inbox</p>
        </div>
        <Button size="sm" variant="cosmic-outline">
          New
        </Button>
      </header>

      <TaskList />
    </div>
  );
};

export default MobileTasks;

