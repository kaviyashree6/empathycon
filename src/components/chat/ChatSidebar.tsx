import { Heart, BarChart3, BookOpen, Wind, Phone, Settings, Sparkles, Brain } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmotionAnalysis } from "@/lib/chat-api";
import { Smile, Frown, Meh, X } from "lucide-react";
import { EmotionTimeline } from "@/components/timeline/EmotionTimeline";
import { Message } from "@/hooks/useChat";

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

type ChatSidebarProps = {
  lastEmotion: EmotionAnalysis | null;
  messages: Message[];
  onClose: () => void;
  onStartVoiceCall?: () => void;
};

export function ChatSidebar({ lastEmotion, messages, onClose, onStartVoiceCall }: ChatSidebarProps) {
  const navigate = useNavigate();
  const EmotionIcon = lastEmotion
    ? emotionIcons[lastEmotion.emotion]
    : emotionIcons.neutral;

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">EmpathyConnect</span>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Current Emotion */}
      {lastEmotion && (
        <Card variant="calm" className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              Current Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EmotionIcon className={`w-5 h-5 ${emotionColors[lastEmotion.emotion]}`} />
                <span className={`text-sm ${emotionColors[lastEmotion.emotion]}`}>
                  {lastEmotion.primary_feeling}
                </span>
              </div>
              <Badge
                variant={
                  lastEmotion.risk_level === "high"
                    ? "high"
                    : lastEmotion.risk_level === "medium"
                    ? "medium"
                    : "low"
                }
              >
                {lastEmotion.risk_level} risk
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Intensity</div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    lastEmotion.emotion === "positive"
                      ? "bg-success"
                      : lastEmotion.emotion === "negative"
                      ? "bg-destructive"
                      : "bg-primary"
                  }`}
                  style={{ width: `${lastEmotion.intensity * 10}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emotion Timeline */}
      <EmotionTimeline messages={messages} className="mb-4" />

      {/* Quick Actions */}
      <div className="space-y-2 mb-4">
        {onStartVoiceCall && (
          <Button variant="hero" className="w-full justify-start gap-3" onClick={onStartVoiceCall}>
            <Phone className="w-4 h-4" />
            Voice Call
          </Button>
        )}
        <Button variant="calm" className="w-full justify-start gap-3" onClick={() => navigate("/emotional-dashboard")}>
          <Brain className="w-4 h-4" />
          Emotional Twin
        </Button>
        <Button variant="calm" className="w-full justify-start gap-3" onClick={() => navigate("/wellness")}>
          <Sparkles className="w-4 h-4" />
          Wellness Hub
        </Button>
        <Button variant="calm" className="w-full justify-start gap-3" onClick={() => navigate("/journal")}>
          <BookOpen className="w-4 h-4" />
          My Journal
        </Button>
        <Button variant="calm" className="w-full justify-start gap-3" onClick={() => navigate("/breathing")}>
          <Wind className="w-4 h-4" />
          Breathing Exercise
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate("/settings")}>
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Resources */}
      <Card variant="default" className="mt-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            Grounding Techniques
          </Badge>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            Sleep Tips
          </Badge>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            Anxiety Relief
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
