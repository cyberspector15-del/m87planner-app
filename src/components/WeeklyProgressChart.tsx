import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";

const WeeklyProgressChart = () => {
  const { data: weeklyData, isLoading } = useWeeklyProgress();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const totalCompleted = weeklyData?.reduce((sum, day) => sum + day.completed, 0) || 0;
  const maxValue = Math.max(...(weeklyData?.map(d => d.completed) || [0]), 1);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cosmic-teal" />
            Weekly Progress
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCompleted} task{totalCompleted !== 1 ? "s" : ""} completed this week
          </p>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              allowDecimals={false}
              domain={[0, Math.max(maxValue, 3)]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass rounded-lg px-3 py-2 border border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(data.date), "EEEE, MMM d")}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {data.completed} task{data.completed !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="completed" 
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            >
              {weeklyData?.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={isToday(parseISO(entry.date)) 
                    ? 'hsl(var(--cosmic-teal))' 
                    : 'hsl(var(--cosmic-silver) / 0.6)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyProgressChart;
