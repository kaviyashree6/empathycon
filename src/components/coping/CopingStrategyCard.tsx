import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Wind, BookOpen, Music, Eye, Heart, 
  ThumbsUp, ThumbsDown, RefreshCw, Loader2, Sparkles 
} from "lucide-react";
import { EmotionAnalysis } from "@/lib/chat-api";
import { useNavigate } from "react-router-dom";

type CopingStrategy = {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: "breathing" | "journal" | "music" | "grounding" | "meditation";
  route?: string;
};

const STRATEGY_ICONS = {
  breathing: Wind,
  journal: BookOpen,
  music: Music,
  grounding: Eye,
  meditation: Heart,
};

function getStrategiesForEmotion(emotion: EmotionAnalysis | null): CopingStrategy[] {
  const feeling = emotion?.primary_feeling || "neutral";
  const level = emotion?.risk_level || "low";
  const strategies: CopingStrategy[] = [];

  // Crisis-level strategies
  if (level === "high") {
    strategies.push({
      id: "ground-54321",
      title: "5-4-3-2-1 Grounding",
      description: "Focus on 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. This anchors you to the present moment.",
      duration: "2 min",
      icon: "grounding",
    });
    strategies.push({
      id: "breath-calm",
      title: "Emergency Calm Breathing",
      description: "Slow 4-7-8 breathing to activate your parasympathetic nervous system and reduce immediate distress.",
      duration: "3 min",
      icon: "breathing",
      route: "/breathing",
    });
  }

  // Anxiety/fear strategies
  if (["anxiety", "fear", "worry", "panic", "stressed"].includes(feeling)) {
    strategies.push({
      id: "box-breathing",
      title: "Box Breathing",
      description: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Used by Navy SEALs for calm under pressure.",
      duration: "4 min",
      icon: "breathing",
      route: "/breathing",
    });
    strategies.push({
      id: "body-scan",
      title: "Quick Body Scan",
      description: "Close your eyes. Starting from your toes, notice each body part. Release tension as you go up.",
      duration: "5 min",
      icon: "meditation",
    });
  }

  // Sadness/loneliness strategies
  if (["sadness", "loneliness", "grief", "loss", "hopelessness"].includes(feeling)) {
    strategies.push({
      id: "gratitude-journal",
      title: "Gratitude Journaling",
      description: "Write down 3 things you're grateful for, no matter how small. This shifts perspective.",
      duration: "5 min",
      icon: "journal",
      route: "/journal",
    });
    strategies.push({
      id: "nature-sounds",
      title: "Nature Soundscape",
      description: "Listen to calming nature sounds — rain, ocean waves, or forest birds — to soothe your mind.",
      duration: "10 min",
      icon: "music",
      route: "/wellness",
    });
  }

  // Anger/frustration strategies
  if (["anger", "frustration", "irritation", "resentment"].includes(feeling)) {
    strategies.push({
      id: "release-breath",
      title: "Power Exhale",
      description: "Inhale deeply through nose, exhale forcefully through mouth. Repeat 10 times to release tension.",
      duration: "2 min",
      icon: "breathing",
      route: "/breathing",
    });
  }

  // Default strategies
  if (strategies.length < 2) {
    strategies.push({
      id: "mindful-pause",
      title: "Mindful Pause",
      description: "Take 30 seconds to close your eyes, take 3 deep breaths, and notice how you feel without judgment.",
      duration: "30 sec",
      icon: "meditation",
    });
    strategies.push({
      id: "express-art",
      title: "Express Through Art",
      description: "Use the mood canvas to freely draw or paint what you're feeling. No rules, just expression.",
      duration: "5 min",
      icon: "grounding",
      route: "/wellness",
    });
  }

  return strategies.slice(0, 3);
}

type CopingStrategyCardProps = {
  emotion: EmotionAnalysis | null;
  className?: string;
};

export function CopingStrategyCard({ emotion, className }: CopingStrategyCardProps) {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Record<string, "helped" | "not-helped">>({});
  const [strategies, setStrategies] = useState<CopingStrategy[]>(() => getStrategiesForEmotion(emotion));
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setStrategies(getStrategiesForEmotion(emotion));
      setFeedback({});
      setRefreshing(false);
    }, 500);
  }, [emotion]);

  const handleFeedback = (strategyId: string, type: "helped" | "not-helped") => {
    setFeedback((prev) => ({ ...prev, [strategyId]: type }));
  };

  if (!emotion || emotion.emotion === "positive") return null;

  return (
    <Card variant="calm" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Coping Strategies
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Personalized for how you're feeling right now
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {strategies.map((strategy) => {
          const Icon = STRATEGY_ICONS[strategy.icon];
          const fb = feedback[strategy.id];

          return (
            <div
              key={strategy.id}
              className={cn(
                "p-3 rounded-lg border border-border bg-card transition-all",
                fb === "helped" && "border-success/30 bg-success/5",
                fb === "not-helped" && "border-muted bg-muted/30 opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-xs font-semibold">{strategy.title}</h4>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">{strategy.duration}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{strategy.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {strategy.route && (
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => navigate(strategy.route!)}>
                        Try Now
                      </Button>
                    )}
                    {!fb && (
                      <div className="flex gap-1 ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleFeedback(strategy.id, "helped")}
                          title="This helped"
                        >
                          <ThumbsUp className="w-3 h-3 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleFeedback(strategy.id, "not-helped")}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                    {fb === "helped" && (
                      <span className="text-[10px] text-success ml-auto">✓ Glad it helped!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
