import { CheckCircle2, Clock, Target, Zap } from "lucide-react";

const stats = [
  {
    icon: CheckCircle2,
    label: "Completed",
    value: "12",
    subtext: "tasks today",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Clock,
    label: "Focus Time",
    value: "4.5h",
    subtext: "deep work",
    color: "text-cosmic-silver",
    bgColor: "bg-cosmic-silver/10",
  },
  {
    icon: Target,
    label: "Streak",
    value: "7",
    subtext: "days",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Zap,
    label: "Efficiency",
    value: "94%",
    subtext: "this week",
    color: "text-cosmic-teal",
    bgColor: "bg-cosmic-teal/10",
  },
];

const QuickStats = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
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
