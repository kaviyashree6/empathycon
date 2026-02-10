import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Brain, TrendingUp, TrendingDown, Calendar,
  Sparkles, Moon, Zap, Heart, Activity, BookOpen, BarChart3,
} from "lucide-react";

type CheckIn = {
  id: string;
  mood_score: number;
  energy_level: number | null;
  sleep_quality: number | null;
  gratitude_note: string | null;
  check_in_date: string;
};

type JournalEntry = {
  id: string;
  mood: string;
  mood_score: number;
  content: string;
  created_at: string;
  tags: string[] | null;
};

const MOOD_EMOJIS: Record<number, string> = {
  1: "😢", 2: "😔", 3: "😕", 4: "😐", 5: "🙂",
  6: "😊", 7: "😄", 8: "😁", 9: "🤩", 10: "🥳",
};

export default function EmotionalDashboard() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [checkInRes, journalRes] = await Promise.all([
        supabase
          .from("daily_check_ins")
          .select("*")
          .eq("user_id", user.id)
          .order("check_in_date", { ascending: false })
          .limit(30),
        supabase
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      setCheckIns((checkInRes.data as CheckIn[]) || []);
      setJournals((journalRes.data as JournalEntry[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    if (checkIns.length === 0) return null;

    const avgMood = checkIns.reduce((s, c) => s + c.mood_score, 0) / checkIns.length;
    const avgEnergy = checkIns.filter((c) => c.energy_level).reduce((s, c) => s + (c.energy_level || 0), 0) / (checkIns.filter((c) => c.energy_level).length || 1);
    const avgSleep = checkIns.filter((c) => c.sleep_quality).reduce((s, c) => s + (c.sleep_quality || 0), 0) / (checkIns.filter((c) => c.sleep_quality).length || 1);

    // Trend: compare last 7 vs previous 7
    const recent7 = checkIns.slice(0, 7);
    const prev7 = checkIns.slice(7, 14);
    const recentAvg = recent7.reduce((s, c) => s + c.mood_score, 0) / (recent7.length || 1);
    const prevAvg = prev7.length > 0 ? prev7.reduce((s, c) => s + c.mood_score, 0) / prev7.length : recentAvg;
    const moodTrend = recentAvg - prevAvg;

    return { avgMood, avgEnergy, avgSleep, moodTrend, totalCheckIns: checkIns.length };
  }, [checkIns]);

  const moodDistribution = useMemo(() => {
    const dist: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
    checkIns.forEach((c) => {
      if (c.mood_score >= 7) dist.positive++;
      else if (c.mood_score >= 4) dist.neutral++;
      else dist.negative++;
    });
    return dist;
  }, [checkIns]);

  const insights = useMemo(() => {
    const results: string[] = [];
    if (!stats) return results;

    if (stats.moodTrend > 0.5) results.push("📈 Your mood has been improving over the past week — keep up the positive momentum!");
    else if (stats.moodTrend < -0.5) results.push("📉 Your mood has dipped recently. Consider trying a breathing exercise or journaling about what's on your mind.");
    else results.push("📊 Your mood has been relatively stable. Consistency is a strength.");

    if (stats.avgSleep < 4) results.push("😴 Your sleep quality is below average. Better sleep often leads to better emotional wellbeing.");
    if (stats.avgEnergy < 4) results.push("⚡ Your energy levels are low. Physical activity and proper nutrition can help.");

    const journalDays = new Set(journals.map((j) => new Date(j.created_at).toDateString())).size;
    if (journalDays >= 5) results.push("📓 You've journaled frequently! Writing about feelings is associated with reduced stress.");
    if (journals.length === 0) results.push("📓 Try journaling — it can help process emotions and identify patterns.");

    const topTags: Record<string, number> = {};
    journals.forEach((j) => j.tags?.forEach((t) => { topTags[t] = (topTags[t] || 0) + 1; }));
    const sortedTags = Object.entries(topTags).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sortedTags.length > 0) {
      results.push(`🏷️ Your most frequent themes: ${sortedTags.map(([t]) => t).join(", ")}. These may reflect key areas to explore.`);
    }

    return results;
  }, [stats, journals]);

  // Weekly mood chart data (last 7 days)
  const weeklyMood = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dayCheckIns = checkIns.filter(
        (c) => new Date(c.check_in_date).toDateString() === date.toDateString()
      );
      const avg = dayCheckIns.length > 0
        ? dayCheckIns.reduce((s, c) => s + c.mood_score, 0) / dayCheckIns.length
        : 0;
      return { day: days[date.getDay()], score: avg, hasData: dayCheckIns.length > 0 };
    });
  }, [checkIns]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto p-6 text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-lg font-display font-bold mb-2">Emotional Twin Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-4">Sign in to view your emotional analytics</p>
          <Button asChild><Link to="/auth">Sign In</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/wellness"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Emotional Twin
            </h1>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <Activity className="w-3 h-3" />
            {stats?.totalCheckIns || 0} data points
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading your emotional data...</div>
        ) : !stats ? (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-display font-bold mb-2">Start Your Journey</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Complete daily check-ins in the Wellness Hub to build your emotional profile.
            </p>
            <Button asChild><Link to="/wellness">Go to Wellness Hub</Link></Button>
          </Card>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Avg Mood</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold">{stats.avgMood.toFixed(1)}</span>
                  <span className="text-lg">{MOOD_EMOJIS[Math.round(stats.avgMood)] || "😐"}</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {stats.moodTrend >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground">Trend</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-2xl font-display font-bold", stats.moodTrend >= 0 ? "text-success" : "text-destructive")}>
                    {stats.moodTrend >= 0 ? "+" : ""}{stats.moodTrend.toFixed(1)}
                  </span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Energy</span>
                </div>
                <span className="text-2xl font-display font-bold">{stats.avgEnergy.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/10</span>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-secondary-foreground" />
                  <span className="text-xs text-muted-foreground">Sleep</span>
                </div>
                <span className="text-2xl font-display font-bold">{stats.avgSleep.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/10</span>
              </Card>
            </div>

            {/* Weekly Mood Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Weekly Mood Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-32 gap-2">
                  {weeklyMood.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{day.hasData ? MOOD_EMOJIS[Math.round(day.score)] || "" : ""}</span>
                      <div className="w-full bg-muted rounded-t-lg overflow-hidden" style={{ height: "100%" }}>
                        <div
                          className={cn(
                            "w-full rounded-t-lg transition-all duration-500",
                            day.score >= 7 ? "bg-success" : day.score >= 4 ? "bg-primary" : day.score > 0 ? "bg-destructive" : "bg-muted"
                          )}
                          style={{ height: `${day.hasData ? day.score * 10 : 0}%`, marginTop: "auto" }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mood Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mood Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Positive (7-10)", count: moodDistribution.positive, color: "bg-success", emoji: "😊" },
                  { label: "Neutral (4-6)", count: moodDistribution.neutral, color: "bg-primary", emoji: "😐" },
                  { label: "Low (1-3)", count: moodDistribution.negative, color: "bg-destructive", emoji: "😔" },
                ].map((item) => {
                  const pct = checkIns.length > 0 ? (item.count / checkIns.length) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1">
                          {item.emoji} {item.label}
                        </span>
                        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={pct} className={cn("h-2 [&>div]:transition-all", `[&>div]:${item.color}`)} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="calm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-xs leading-relaxed">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="calm" className="h-auto p-4 flex-col gap-2" asChild>
                <Link to="/journal">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-xs">Journal Entry</span>
                </Link>
              </Button>
              <Button variant="calm" className="h-auto p-4 flex-col gap-2" asChild>
                <Link to="/wellness">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-xs">Daily Check-in</span>
                </Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
