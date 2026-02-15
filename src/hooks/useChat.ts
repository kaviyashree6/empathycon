import { useState, useCallback, useRef } from "react";
import { streamChat, EmotionAnalysis, ChatMessage } from "@/lib/chat-api";
import { LanguageCode } from "@/lib/voice-api";
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
  const languageRef = useRef<LanguageCode>("en");

  const setLanguage = useCallback((lang: LanguageCode) => {
    languageRef.current = lang;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const conversationHistory: ChatMessage[] = messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    let assistantContent = "";
    let emotionData: EmotionAnalysis | undefined;

    const updateAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("ai-")) {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: assistantContent, emotion: emotionData }
              : m
          );
        }
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
          emotionData = emotion;
          setLastEmotion(emotion);
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
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id.startsWith("ai-")) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        },
      }, undefined, undefined, languageRef.current);
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
    setMessages,
    setLanguage,
  };
}
