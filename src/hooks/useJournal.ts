import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Mood = "great" | "good" | "okay" | "bad" | "terrible";

export type JournalEntry = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: Mood;
  mood_score: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type NewJournalEntry = {
  title?: string;
  content: string;
  mood: Mood;
  tags?: string[];
};

const moodToScore: Record<Mood, number> = {
  great: 5,
  good: 4,
  okay: 3,
  bad: 2,
  terrible: 1,
};

export function useJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setEntries(data as JournalEntry[]);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      toast.error("Failed to load journal entries");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = useCallback(
    async (entry: NewJournalEntry): Promise<JournalEntry | null> => {
      if (!user) {
        toast.error("Please sign in to save journal entries");
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            title: entry.title || null,
            content: entry.content,
            mood: entry.mood,
            mood_score: moodToScore[entry.mood],
            tags: entry.tags || [],
          })
          .select()
          .single();

        if (error) throw error;

        const newEntry = data as JournalEntry;
        setEntries((prev) => [newEntry, ...prev]);
        toast.success("Journal entry saved!");
        return newEntry;
      } catch (error) {
        console.error("Error creating journal entry:", error);
        toast.error("Failed to save journal entry");
        return null;
      }
    },
    [user]
  );

  const updateEntry = useCallback(
    async (
      id: string,
      updates: Partial<NewJournalEntry>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const updateData: Record<string, unknown> = {
          ...updates,
        };

        if (updates.mood) {
          updateData.mood_score = moodToScore[updates.mood];
        }

        const { error } = await supabase
          .from("journal_entries")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;

        await fetchEntries();
        toast.success("Journal entry updated!");
        return true;
      } catch (error) {
        console.error("Error updating journal entry:", error);
        toast.error("Failed to update journal entry");
        return false;
      }
    },
    [user, fetchEntries]
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("journal_entries")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setEntries((prev) => prev.filter((e) => e.id !== id));
        toast.success("Journal entry deleted");
        return true;
      } catch (error) {
        console.error("Error deleting journal entry:", error);
        toast.error("Failed to delete journal entry");
        return false;
      }
    },
    [user]
  );

  const getMoodStats = useCallback(() => {
    if (entries.length === 0) return null;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEntries = entries.filter(
      (e) => new Date(e.created_at) >= weekAgo
    );

    if (recentEntries.length === 0) return null;

    const avgScore =
      recentEntries.reduce((sum, e) => sum + e.mood_score, 0) /
      recentEntries.length;

    const moodCounts = recentEntries.reduce((acc, e) => {
      acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {} as Record<Mood, number>);

    const dominantMood = Object.entries(moodCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as Mood;

    return {
      averageScore: avgScore,
      totalEntries: recentEntries.length,
      dominantMood,
      dailyScores: recentEntries.slice(0, 7).map((e) => ({
        date: new Date(e.created_at).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        score: e.mood_score,
      })),
    };
  }, [entries]);

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    fetchEntries,
    getMoodStats,
  };
}
