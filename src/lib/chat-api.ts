import { supabase } from "@/integrations/supabase/client";

export type EmotionAnalysis = {
  emotion: "positive" | "negative" | "neutral";
  intensity: number;
  risk_level: "low" | "medium" | "high";
  primary_feeling: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamCallbacks = {
  onEmotion?: (emotion: EmotionAnalysis) => void;
  onDelta?: (delta: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
};

export async function streamChat(
  message: string,
  conversationHistory: ChatMessage[],
  callbacks: StreamCallbacks,
  sessionId?: string,
  userId?: string
) {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  try {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        sessionId,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed with status ${response.status}`;
      
      if (response.status === 429) {
        callbacks.onError?.("Rate limit exceeded. Please wait a moment and try again.");
        return;
      }
      if (response.status === 402) {
        callbacks.onError?.("AI credits exhausted. Please add credits to continue.");
        return;
      }
      
      callbacks.onError?.(errorMessage);
      return;
    }

    if (!response.body) {
      callbacks.onError?.("No response body received");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process line by line
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          callbacks.onDone?.();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);

          // Handle emotion event
          if (parsed.type === "emotion" && parsed.emotion) {
            callbacks.onEmotion?.(parsed.emotion as EmotionAnalysis);
            continue;
          }

          // Handle chat delta
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            callbacks.onDelta?.(content);
          }
        } catch {
          // Incomplete JSON, put it back and wait for more data
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Final flush
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) callbacks.onDelta?.(content);
        } catch {
          /* ignore */
        }
      }
    }

    callbacks.onDone?.();
  } catch (error) {
    console.error("Stream chat error:", error);
    callbacks.onError?.(error instanceof Error ? error.message : "Connection error");
  }
}
