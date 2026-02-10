import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, Brain } from "lucide-react";
import { Message } from "@/hooks/useChat";

type EmotionTimelineProps = {
  messages: Message[];
  className?: string;
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "😊", happiness: "😄", hope: "🌟", gratitude: "🙏",
  calm: "😌", content: "☺️", relief: "😮‍💨", love: "❤️",
  anxiety: "😰", sadness: "😢", anger: "😠", fear: "😨",
  frustration: "😤", loneliness: "😔", hopelessness: "💔",
  tired: "😴", confused: "😕", neutral: "😐", welcoming: "👋",
};

const EMOTION_COLORS: Record<string, string> = {
  positive: "bg-success",
  negative: "bg-destructive",
  neutral: "bg-primary",
};

export function EmotionTimeline({ messages, className }: EmotionTimelineProps) {
  const emotionPoints = useMemo(() => {
    return messages
      .filter((m) => m.emotion && m.role === "assistant")
      .map((m) => ({
        id: m.id,
        emotion: m.emotion!,
        timestamp: m.timestamp,
        emoji: EMOTION_EMOJIS[m.emotion!.primary_feeling] || "😐",
      }));
  }, [messages]);

  const trend = useMemo(() => {
    if (emotionPoints.length < 2) return null;
    const recent = emotionPoints.slice(-3);
    const avgIntensity = recent.reduce((sum, p) => sum + p.emotion.intensity, 0) / recent.length;
    const negativeCount = recent.filter((p) => p.emotion.emotion === "negative").length;
    const positiveCount = recent.filter((p) => p.emotion.emotion === "positive").length;

    if (positiveCount > negativeCount) return { label: "Improving", color: "text-success" };
    if (negativeCount > positiveCount) return { label: "Needs attention", color: "text-destructive" };
    return { label: "Stable", color: "text-primary" };
  }, [emotionPoints]);

  const sessionSummary = useMemo(() => {
    if (emotionPoints.length < 2) return null;
    const first = emotionPoints[0];
    const last = emotionPoints[emotionPoints.length - 1];

    const startEmoji = first.emoji;
    const endEmoji = last.emoji;
    const startFeeling = first.emotion.primary_feeling;
    const endFeeling = last.emotion.primary_feeling;

    if (first.emotion.emotion === "negative" && last.emotion.emotion === "positive") {
      return `Journey: ${startEmoji} ${startFeeling} → ${endEmoji} ${endFeeling}. You showed resilience — the conversation helped you feel better.`;
    }
    if (first.emotion.emotion === "positive" && last.emotion.emotion === "positive") {
      return `Journey: ${startEmoji} ${startFeeling} → ${endEmoji} ${endFeeling}. You maintained a positive outlook throughout this session.`;
    }
    if (last.emotion.emotion === "negative") {
      return `Journey: ${startEmoji} ${startFeeling} → ${endEmoji} ${endFeeling}. You're going through a tough time. Consider trying a coping exercise.`;
    }
    return `Journey: ${startEmoji} ${startFeeling} → ${endEmoji} ${endFeeling}. Your emotions shifted during this session.`;
  }, [emotionPoints]);

  if (emotionPoints.length === 0) return null;

  return (
    <Card variant="calm" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Emotional Journey
          {trend && (
            <Badge variant="outline" className={cn("text-[10px] ml-auto", trend.color)}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline visualization */}
        <div className="relative">
          {/* Track */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full" />

          {/* Gradient overlay */}
          <div className="absolute top-4 left-0 right-0 h-1 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${emotionPoints.map((p, i) => {
                  const pct = (i / Math.max(1, emotionPoints.length - 1)) * 100;
                  const color = p.emotion.emotion === "positive"
                    ? "hsl(152, 55%, 45%)"
                    : p.emotion.emotion === "negative"
                    ? "hsl(0, 72%, 51%)"
                    : "hsl(187, 55%, 42%)";
                  return `${color} ${pct}%`;
                }).join(", ")})`,
              }}
            />
          </div>

          {/* Points */}
          <div className="relative flex justify-between items-start pt-0 pb-2">
            {emotionPoints.map((point, i) => (
              <div key={point.id} className="flex flex-col items-center" style={{ width: `${100 / emotionPoints.length}%` }}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-card bg-card shadow-soft transition-transform hover:scale-125 cursor-default z-10",
                  )}
                  title={`${point.emotion.primary_feeling} (${point.emotion.intensity}/10)`}
                >
                  {point.emoji}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">
                  {point.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Session Summary */}
        {sessionSummary && (
          <div className="mt-3 p-2.5 bg-card rounded-lg border border-border flex items-start gap-2">
            <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{sessionSummary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
