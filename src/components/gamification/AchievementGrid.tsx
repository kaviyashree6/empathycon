import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import { Lock, Trophy } from "lucide-react";

export function AchievementGrid() {
  const { achievements, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Achievements
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {unlockedCount} / {achievements.length} Unlocked
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "relative p-4 rounded-xl text-center transition-all duration-300",
                achievement.unlocked
                  ? "bg-gradient-to-br from-primary/10 to-success/10 border border-primary/20 shadow-soft"
                  : "bg-muted/50 opacity-60"
              )}
            >
              {!achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <span className="text-3xl">{achievement.icon}</span>
              <h4 className="text-sm font-medium text-foreground mt-2 line-clamp-1">
                {achievement.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {achievement.description}
              </p>
              <div className="mt-2 text-xs font-medium text-primary">
                +{achievement.points} pts
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
