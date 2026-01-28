import { Heart, BarChart3, BookOpen, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmotionAnalysis } from "@/lib/chat-api";
import { Smile, Frown, Meh, X } from "lucide-react";

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
  onClose: () => void;
};

export function ChatSidebar({ lastEmotion, onClose }: ChatSidebarProps) {
  const EmotionIcon = lastEmotion
    ? emotionIcons[lastEmotion.emotion]
    : emotionIcons.neutral;

  // Simulated weekly mood data
  const moodData = [60, 75, 50, 80, 65, 90, 70];

  return (
    <div className="h-full flex flex-col p-4">
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

      {/* Mood Graph Card */}
      <Card variant="calm" className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Weekly Mood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-20 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/30 hover:bg-primary/50 transition-colors"
                  style={{ height: `${moodData[i]}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-2 mb-4">
        <Button variant="calm" className="w-full justify-start gap-3">
          <BookOpen className="w-4 h-4" />
          My Journal
        </Button>
        <Button variant="calm" className="w-full justify-start gap-3">
          <Wind className="w-4 h-4" />
          Breathing Exercise
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
