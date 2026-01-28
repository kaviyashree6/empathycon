import { Smile, Frown, Meh, AlertTriangle } from "lucide-react";
import { EmotionAnalysis } from "@/lib/chat-api";
import { cn } from "@/lib/utils";

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
};

export function MessageBubble({ role, content, timestamp, emotion }: MessageBubbleProps) {
  const isUser = role === "user";
  const emotionType = emotion?.emotion || "neutral";
  const EmotionIcon = emotionIcons[emotionType];

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
          <span
            className={cn(
              "text-xs",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>

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
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
