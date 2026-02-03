import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  unlocked?: boolean;
  unlocked_at?: string;
};

export type WellnessStreak = {
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
  last_check_in: string | null;
};

export type DailyCheckIn = {
  id: string;
  check_in_date: string;
  mood_score: number;
  energy_level: number | null;
  sleep_quality: number | null;
  gratitude_note: string | null;
};

export function useGamification() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<WellnessStreak | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGamificationData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch streak data
      const { data: streakData } = await supabase
        .from("wellness_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setStreak(streakData);

      // Fetch all achievements with user unlock status
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*");

      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      const unlockedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua.unlocked_at]) || []
      );

      const mergedAchievements = (allAchievements || []).map((a) => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlocked_at: unlockedMap.get(a.id),
      }));

      setAchievements(mergedAchievements);

      // Calculate total points
      const points = mergedAchievements
        .filter((a) => a.unlocked)
        .reduce((sum, a) => sum + a.points, 0);
      setTotalPoints(points);

      // Check today's check-in
      const today = new Date().toISOString().split("T")[0];
      const { data: checkInData } = await supabase
        .from("daily_check_ins")
        .select("*")
        .eq("user_id", user.id)
        .eq("check_in_date", today)
        .maybeSingle();

      setTodayCheckIn(checkInData);
    } catch (error) {
      console.error("Error fetching gamification data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const submitCheckIn = async (data: {
    mood_score: number;
    energy_level?: number;
    sleep_quality?: number;
    gratitude_note?: string;
  }) => {
    if (!user) return null;

    try {
      const today = new Date().toISOString().split("T")[0];

      // Upsert check-in
      const { data: checkIn, error } = await supabase
        .from("daily_check_ins")
        .upsert(
          {
            user_id: user.id,
            check_in_date: today,
            ...data,
          },
          { onConflict: "user_id,check_in_date" }
        )
        .select()
        .single();

      if (error) throw error;

      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      let longestStreak = 1;
      let totalCheckIns = 1;

      if (streak) {
        totalCheckIns = streak.total_check_ins + 1;
        if (streak.last_check_in === yesterdayStr) {
          newStreak = streak.current_streak + 1;
        } else if (streak.last_check_in === today) {
          newStreak = streak.current_streak;
          totalCheckIns = streak.total_check_ins;
        }
        longestStreak = Math.max(newStreak, streak.longest_streak);
      }

      await supabase.from("wellness_streaks").upsert(
        {
          user_id: user.id,
          current_streak: newStreak,
          longest_streak: longestStreak,
          total_check_ins: totalCheckIns,
          last_check_in: today,
        },
        { onConflict: "user_id" }
      );

      // Check for new achievements
      await checkAchievements(newStreak, totalCheckIns);

      toast.success("Check-in complete! 🌟");
      await fetchGamificationData();
      return checkIn;
    } catch (error) {
      console.error("Error submitting check-in:", error);
      toast.error("Failed to submit check-in");
      return null;
    }
  };

  const checkAchievements = async (currentStreak: number, totalCheckIns: number) => {
    if (!user) return;

    const unlockedIds = achievements.filter((a) => a.unlocked).map((a) => a.id);
    const toUnlock: string[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      let shouldUnlock = false;

      if (achievement.requirement_type === "total_check_ins" && totalCheckIns >= achievement.requirement_value) {
        shouldUnlock = true;
      } else if (achievement.requirement_type === "current_streak" && currentStreak >= achievement.requirement_value) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        toUnlock.push(achievement.id);
      }
    }

    for (const achievementId of toUnlock) {
      await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievementId,
      });

      const achievement = achievements.find((a) => a.id === achievementId);
      if (achievement) {
        toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
          description: achievement.description,
          duration: 5000,
        });
      }
    }
  };

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  return {
    streak,
    achievements,
    todayCheckIn,
    totalPoints,
    isLoading,
    submitCheckIn,
    refresh: fetchGamificationData,
  };
}
