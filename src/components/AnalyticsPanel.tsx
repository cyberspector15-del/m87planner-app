import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useEvents } from "@/hooks/useEvents";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, TrendUp, Calendar } from "@phosphor-icons/react";
import { format, subDays, startOfDay, isWithinInterval } from "date-fns";

const COLORS = {
  completed: "hsl(var(--cosmic-teal))",
  pending: "hsl(var(--cosmic-silver))",
  high: "hsl(0, 70%, 60%)",
  medium: "hsl(45, 80%, 55%)",
  low: "hsl(var(--cosmic-teal))",
};

const AnalyticsPanel = () => {
  const { data: tasks = [] } = useTasks();
  const { data: events = [] } = useEvents();

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, pending, total, completionRate };
  }, [tasks]);

  const completionData = useMemo(() => [
    { name: "Completed", value: stats.completed, color: COLORS.completed },
    { name: "Pending", value: stats.pending, color: COLORS.pending },
  ], [stats]);

  const priorityData = useMemo(() => {
    const high = tasks.filter((t) => t.priority === 1 && !t.completed).length;
    const medium = tasks.filter((t) => t.priority === 2 && !t.completed).length;
    const low = tasks.filter((t) => t.priority === 3 && !t.completed).length;
    return [
      { name: "High", value: high, fill: COLORS.high },
      { name: "Medium", value: medium, fill: COLORS.medium },
      { name: "Low", value: low, fill: COLORS.low },
    ];
  }, [tasks]);

  const weeklyTrend = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dayEvents = events.filter((e) => {
        const eventDate = startOfDay(new Date(e.start_time));
        return eventDate.getTime() === date.getTime();
      });
      const completedEvents = dayEvents.filter((e) => e.status === "completed");
      return {
        day: format(date, "EEE"),
        events: dayEvents.length,
        completed: completedEvents.length,
      };
    });
    return days;
  }, [events]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const nextWeek = subDays(now, -7);
    return tasks
      .filter((t) => !t.completed && t.deadline)
      .filter((t) => {
        const deadline = new Date(t.deadline!);
        return isWithinInterval(deadline, { start: now, end: nextWeek });
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass border-border/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cosmic-teal/20 flex items-center justify-center">
              <CheckCircle size={20} weight="thin" className="text-cosmic-teal" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cosmic-silver/20 flex items-center justify-center">
              <Circle size={20} weight="thin" className="text-cosmic-silver" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate Pie Chart */}
      <Card className="glass border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendUp size={16} weight="thin" />
            Task Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-right">
              <p className="text-4xl font-display font-bold text-cosmic-gradient">
                {stats.completionRate}%
              </p>
              <p className="text-sm text-muted-foreground">completion rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="glass border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Tasks by Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity Trend */}
      <Card className="glass border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar size={16} weight="thin" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="hsl(var(--cosmic-silver))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--cosmic-silver))", r: 3 }}
                  name="Scheduled"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(var(--cosmic-teal))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--cosmic-teal))", r: 3 }}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="glass border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-sm text-foreground truncate max-w-[200px]">{task.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(task.deadline!), "MMM d")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPanel;