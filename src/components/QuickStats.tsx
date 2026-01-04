import { CheckCircle2, Clock, Target, Zap } from "lucide-react";
import { useQuickStats } from "@/hooks/useQuickStats";
import { Skeleton } from "@/components/ui/skeleton";

const QuickStats = () => {
  const { data: stats, isLoading } = useQuickStats();

  const statItems = [
    {
      icon: CheckCircle2,
      label: "Completed",
      value: stats?.completedToday.toString() || "0",
      subtext: "tasks today",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Clock,
      label: "Focus Time",
      value: `${stats?.focusHours || "0"}h`,
      subtext: "deep work",
      color: "text-cosmic-silver",
      bgColor: "bg-cosmic-silver/10",
    },
    {
      icon: Target,
      label: "Streak",
      value: stats?.streak.toString() || "0",
      subtext: "days",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Zap,
      label: "Efficiency",
      value: `${stats?.efficiency || 0}%`,
      subtext: "this week",
      color: "text-cosmic-teal",
      bgColor: "bg-cosmic-teal/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <div
          key={stat.label}
          className="glass rounded-xl p-4 animate-fade-in hover:border-cosmic-silver/30 transition-all duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className={`${stat.bgColor} p-2 rounded-lg`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-display font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stat.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
