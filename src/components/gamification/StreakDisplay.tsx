import { Card, CardContent } from "@/components/ui/card";
import { useGamification } from "@/hooks/useGamification";
import { Flame, Trophy, Target, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakDisplay() {
  const { streak, totalPoints, isLoading } = useGamification();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: Flame,
      label: "Current Streak",
      value: streak?.current_streak || 0,
      suffix: "days",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Trophy,
      label: "Longest Streak",
      value: streak?.longest_streak || 0,
      suffix: "days",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Target,
      label: "Total Check-Ins",
      value: streak?.total_check_ins || 0,
      suffix: "",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Star,
      label: "Total Points",
      value: totalPoints,
      suffix: "pts",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="gradient-card shadow-soft hover:shadow-card transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {stat.suffix}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
