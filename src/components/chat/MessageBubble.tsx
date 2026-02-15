import { useState } from "react";
import { Smile, Frown, Meh, AlertTriangle, Volume2, Loader2 } from "lucide-react";
import { EmotionAnalysis } from "@/lib/chat-api";
import { browserTextToSpeech, stopBrowserSpeech, LanguageCode } from "@/lib/voice-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const emotionIcons = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
};

const emotionColors = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  emotion?: EmotionAnalysis;
  language?: LanguageCode;
};

export function MessageBubble({ role, content, timestamp, emotion, language = "en" }: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = role === "user";
  const emotionType = emotion?.emotion || "neutral";
  const EmotionIcon = emotionIcons[emotionType];

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopBrowserSpeech();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    try {
      await browserTextToSpeech(content, language);
    } catch (e) {
      console.warn("TTS error:", e);
    }
    setIsSpeaking(false);
  };

  return (
    <div className={cn("flex animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] md:max-w-[60%] rounded-2xl p-4",
          isUser
            ? "gradient-primary text-primary-foreground rounded-br-md"
            : "bg-card shadow-soft border border-border rounded-bl-md"
        )}
      >
        {/* Risk warning for high-risk messages */}
        {emotion?.risk_level === "high" && role === "assistant" && (
          <div className="flex items-center gap-2 text-accent mb-2 pb-2 border-b border-border">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Support resources available</span>
          </div>
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>

        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs",
                isUser ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>

            {/* Per-message TTS button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                isUser ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={handleSpeak}
              title={isSpeaking ? "Stop speaking" : "Listen to this message"}
            >
              {isSpeaking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          {role === "assistant" && emotion && (
            <div className="flex items-center gap-1">
              <EmotionIcon className={cn("w-4 h-4", emotionColors[emotionType])} />
              {emotion.primary_feeling && (
                <span className={cn("text-xs", emotionColors[emotionType])}>
                  {emotion.primary_feeling}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-card shadow-soft border border-border rounded-2xl rounded-bl-md p-4">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
