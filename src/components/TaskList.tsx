import { Plus, Clock, Flag, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  duration: number;
  priority: "high" | "medium" | "low";
  deadline?: string;
  flexible: boolean;
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Review quarterly report",
    duration: 60,
    priority: "high",
    deadline: "Today",
    flexible: false,
  },
  {
    id: "2",
    title: "Prepare presentation slides",
    duration: 90,
    priority: "high",
    deadline: "Tomorrow",
    flexible: true,
  },
  {
    id: "3",
    title: "Call with client",
    duration: 30,
    priority: "medium",
    deadline: "Today",
    flexible: false,
  },
  {
    id: "4",
    title: "Update documentation",
    duration: 45,
    priority: "low",
    flexible: true,
  },
  {
    id: "5",
    title: "Code review",
    duration: 30,
    priority: "medium",
    deadline: "Today",
    flexible: true,
  },
];

const TaskList = () => {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-foreground">
              Unscheduled Tasks
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mockTasks.length} tasks waiting
            </p>
          </div>
          <Button variant="cosmic-outline" size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border/30 cosmic-scrollbar max-h-[400px] overflow-y-auto">
        {mockTasks.map((task, index) => (
          <div
            key={task.id}
            className="p-4 hover:bg-accent/30 transition-colors cursor-pointer group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Flag
                    className={cn(
                      "w-3 h-3",
                      task.priority === "high" && "text-red-400",
                      task.priority === "medium" && "text-amber-400",
                      task.priority === "low" && "text-emerald-400"
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {task.flexible ? "Flexible" : "Fixed"}
                  </span>
                </div>
                <h3 className="font-medium text-foreground truncate">
                  {task.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.duration}min
                  </span>
                  {task.deadline && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded",
                        task.deadline === "Today" &&
                          "bg-red-500/10 text-red-400",
                        task.deadline === "Tomorrow" &&
                          "bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {task.deadline}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
