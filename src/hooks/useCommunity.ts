import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CommunityStory = {
  id: string;
  anonymous_name: string;
  title: string;
  content: string;
  mood_tag: string | null;
  hearts_count: number;
  created_at: string;
  is_mine: boolean;
  has_hearted: boolean;
};

const ANONYMOUS_NAMES = [
  "Peaceful Panda",
  "Gentle Giraffe",
  "Calm Caterpillar",
  "Brave Bear",
  "Hopeful Hummingbird",
  "Resilient Robin",
  "Mindful Meadow",
  "Serene Sparrow",
  "Courageous Cloud",
  "Tranquil Turtle",
  "Healing Hawk",
  "Joyful Jasmine",
  "Strong Sunflower",
  "Grateful Grove",
  "Loving Lighthouse",
];

export function useCommunity() {
  const { user } = useAuth();
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myStories, setMyStories] = useState<CommunityStory[]>([]);

  const generateAnonymousName = () => {
    return ANONYMOUS_NAMES[Math.floor(Math.random() * ANONYMOUS_NAMES.length)];
  };

  const fetchStories = useCallback(async () => {
    try {
      // Fetch approved stories
      const { data: storiesData, error } = await supabase
        .from("community_stories")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch hearts if user is logged in
      let userHearts: string[] = [];
      if (user) {
        const { data: heartsData } = await supabase
          .from("story_hearts")
          .select("story_id")
          .eq("user_id", user.id);

        userHearts = heartsData?.map((h) => h.story_id) || [];
      }

      const formattedStories: CommunityStory[] = (storiesData || []).map((s) => ({
        ...s,
        is_mine: user ? s.user_id === user.id : false,
        has_hearted: userHearts.includes(s.id),
      }));

      setStories(formattedStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchMyStories = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("community_stories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMyStories(
        (data || []).map((s) => ({
          ...s,
          is_mine: true,
          has_hearted: false,
        }))
      );
    } catch (error) {
      console.error("Error fetching my stories:", error);
    }
  }, [user]);

  const shareStory = async (data: {
    title: string;
    content: string;
    mood_tag?: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to share your story");
      return null;
    }

    try {
      const { data: story, error } = await supabase
        .from("community_stories")
        .insert({
          user_id: user.id,
          anonymous_name: generateAnonymousName(),
          title: data.title,
          content: data.content,
          mood_tag: data.mood_tag || null,
          is_approved: true, // Auto-approve for now
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Story shared! Thank you for your courage 💜");
      await fetchStories();
      await fetchMyStories();
      return story;
    } catch (error) {
      console.error("Error sharing story:", error);
      toast.error("Failed to share story");
      return null;
    }
  };

  const toggleHeart = async (storyId: string) => {
    if (!user) {
      toast.error("Please sign in to show support");
      return;
    }

    const story = stories.find((s) => s.id === storyId);
    if (!story) return;

    try {
      if (story.has_hearted) {
        // Remove heart
        await supabase
          .from("story_hearts")
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", user.id);

        // Update hearts count
        await supabase
          .from("community_stories")
          .update({ hearts_count: story.hearts_count - 1 })
          .eq("id", storyId);
      } else {
        // Add heart
        await supabase.from("story_hearts").insert({
          story_id: storyId,
          user_id: user.id,
        });

        // Update hearts count
        await supabase
          .from("community_stories")
          .update({ hearts_count: story.hearts_count + 1 })
          .eq("id", storyId);
      }

      // Update local state
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? {
                ...s,
                has_hearted: !s.has_hearted,
                hearts_count: s.has_hearted
                  ? s.hearts_count - 1
                  : s.hearts_count + 1,
              }
            : s
        )
      );
    } catch (error) {
      console.error("Error toggling heart:", error);
    }
  };

  useEffect(() => {
    fetchStories();
    fetchMyStories();
  }, [fetchStories, fetchMyStories]);

  return {
    stories,
    myStories,
    isLoading,
    shareStory,
    toggleHeart,
    generateAnonymousName,
    refresh: fetchStories,
  };
}
