import { useState, useCallback } from "react";
import { streamChat, EmotionAnalysis, ChatMessage } from "@/lib/chat-api";
import { toast } from "sonner";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  emotion?: EmotionAnalysis;
  timestamp: Date;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm here to listen and support you. How are you feeling today?",
      emotion: { emotion: "neutral", intensity: 5, risk_level: "low", primary_feeling: "welcoming" },
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastEmotion, setLastEmotion] = useState<EmotionAnalysis | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = messages
      .slice(-10) // Keep last 10 messages for context
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    let assistantContent = "";
    let emotionData: EmotionAnalysis | undefined;

    const updateAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("ai-")) {
          // Update existing assistant message
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: assistantContent, emotion: emotionData }
              : m
          );
        }
        // Create new assistant message
        return [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant" as const,
            content: assistantContent,
            emotion: emotionData,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      await streamChat(content, conversationHistory, {
        onEmotion: (emotion) => {
          console.log("Emotion detected:", emotion);
          emotionData = emotion;
          setLastEmotion(emotion);
          
          // Show toast for high-risk messages
          if (emotion.risk_level === "high") {
            toast.warning(
              "If you're in crisis, please reach out to a helpline. You're not alone. ❤️",
              { duration: 10000 }
            );
          }
        },
        onDelta: (delta) => {
          updateAssistant(delta);
        },
        onDone: () => {
          setIsTyping(false);
        },
        onError: (error) => {
          console.error("Chat error:", error);
          toast.error(error);
          setIsTyping(false);
          
          // Add error message
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id.startsWith("ai-")) {
              return prev.slice(0, -1); // Remove empty assistant message
            }
            return prev;
          });
        },
      });
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message. Please try again.");
      setIsTyping(false);
    }
  }, [messages, isTyping]);

  return {
    messages,
    isTyping,
    lastEmotion,
    sendMessage,
  };
}
