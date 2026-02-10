import { cn } from "@/lib/utils";
import { Smile, Frown, Meh, Mic, Activity } from "lucide-react";
import { EmotionAnalysis } from "@/lib/chat-api";

type LiveEmotionMeterProps = {
  emotion: EmotionAnalysis | null;
  isRecording: boolean;
  className?: string;
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "😊", happiness: "😄", hope: "🌟", gratitude: "🙏",
  calm: "😌", content: "☺️", relief: "😮‍💨", love: "❤️",
  anxiety: "😰", sadness: "😢", anger: "😠", fear: "😨",
  frustration: "😤", loneliness: "😔", hopelessness: "💔",
  tired: "😴", confused: "😕", neutral: "😐", welcoming: "👋",
};

export function LiveEmotionMeter({ emotion, isRecording, className }: LiveEmotionMeterProps) {
  const emoji = emotion ? (EMOTION_EMOJIS[emotion.primary_feeling] || "😐") : "😐";
  const intensity = emotion?.intensity || 5;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-500",
      isRecording
        ? "border-primary/30 bg-primary/5 shadow-glow"
        : "border-border bg-card",
      className
    )}>
      {/* Live indicator */}
      {isRecording && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-[10px] font-medium text-destructive uppercase tracking-wider">Live</span>
        </div>
      )}

      {/* Emotion emoji */}
      <span className="text-2xl transition-all duration-300" role="img" aria-label={emotion?.primary_feeling || "neutral"}>
        {emoji}
      </span>

      {/* Intensity bars */}
      <div className="flex items-end gap-0.5 h-6">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-300",
              i < intensity
                ? emotion?.emotion === "positive"
                  ? "bg-success"
                  : emotion?.emotion === "negative"
                  ? "bg-destructive"
                  : "bg-primary"
                : "bg-muted"
            )}
            style={{
              height: `${Math.max(4, (i + 1) * 2.2)}px`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Feeling label */}
      {emotion?.primary_feeling && (
        <span className="text-xs text-muted-foreground capitalize">
          {emotion.primary_feeling}
        </span>
      )}
    </div>
  );
}
