import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "./useChat";

type ChatSession = {
  id: string;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
};

export function useChatHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions for logged-in users
  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id, title, language, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createSession = useCallback(
    async (language: string = "en"): Promise<string | null> => {
      try {
        const sessionData = user
          ? { user_id: user.id, language }
          : { language };

        const { data, error } = await supabase
          .from("chat_sessions")
          .insert(sessionData)
          .select("id")
          .single();

        if (error) throw error;

        const sessionId = data.id;
        setCurrentSessionId(sessionId);

        if (user) {
          await loadSessions();
        }

        return sessionId;
      } catch (error) {
        console.error("Failed to create session:", error);
        return null;
      }
    },
    [user, loadSessions]
  );

  const loadMessages = useCallback(
    async (sessionId: string): Promise<Message[]> => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        return (data || []).map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          emotion: msg.emotion
            ? {
                emotion: msg.emotion as "positive" | "negative" | "neutral",
                intensity: msg.emotion_intensity || 5,
                risk_level: (msg.risk_level as "low" | "medium" | "high") || "low",
                primary_feeling: msg.primary_feeling || "",
              }
            : undefined,
          timestamp: new Date(msg.created_at),
        }));
      } catch (error) {
        console.error("Failed to load messages:", error);
        return [];
      }
    },
    []
  );

  const saveMessage = useCallback(
    async (
      sessionId: string,
      message: Omit<Message, "id" | "timestamp">
    ): Promise<void> => {
      try {
        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          emotion: message.emotion?.emotion,
          emotion_intensity: message.emotion?.intensity,
          risk_level: message.emotion?.risk_level,
          primary_feeling: message.emotion?.primary_feeling,
        });

        // Update session title from first user message
        if (message.role === "user") {
          const title =
            message.content.length > 50
              ? message.content.substring(0, 47) + "..."
              : message.content;

          await supabase
            .from("chat_sessions")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", sessionId);
        }
      } catch (error) {
        console.error("Failed to save message:", error);
      }
    },
    []
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        await supabase.from("chat_sessions").delete().eq("id", sessionId);

        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
        }

        await loadSessions();
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    },
    [currentSessionId, loadSessions]
  );

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading,
    createSession,
    loadMessages,
    saveMessage,
    deleteSession,
    loadSessions,
  };
}
