import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGamification } from "@/hooks/useGamification";
import { Sun, Moon, Zap, Smile, Meh, Frown, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, label: "Struggling", color: "text-destructive" },
  { value: 2, icon: Frown, label: "Low", color: "text-warning" },
  { value: 3, icon: Meh, label: "Okay", color: "text-muted-foreground" },
  { value: 4, icon: Smile, label: "Good", color: "text-success" },
  { value: 5, icon: Heart, label: "Great", color: "text-primary" },
];

const ENERGY_OPTIONS = [
  { value: 1, label: "Exhausted" },
  { value: 2, label: "Tired" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Energized" },
  { value: 5, label: "Vibrant" },
];

const SLEEP_OPTIONS = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Excellent" },
];

export function DailyCheckIn() {
  const { todayCheckIn, submitCheckIn, isLoading } = useGamification();
  const [mood, setMood] = useState<number>(todayCheckIn?.mood_score || 3);
  const [energy, setEnergy] = useState<number>(todayCheckIn?.energy_level || 3);
  const [sleep, setSleep] = useState<number>(todayCheckIn?.sleep_quality || 3);
  const [gratitude, setGratitude] = useState(todayCheckIn?.gratitude_note || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitCheckIn({
      mood_score: mood,
      energy_level: energy,
      sleep_quality: sleep,
      gratitude_note: gratitude || undefined,
    });
    setIsSubmitting(false);
  };

  if (todayCheckIn && !isLoading) {
    return (
      <Card className="gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-success" />
            Today's Check-In Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-primary" />
              Mood: {MOOD_OPTIONS[todayCheckIn.mood_score - 1]?.label}
            </div>
            {todayCheckIn.energy_level && (
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-warning" />
                Energy: {ENERGY_OPTIONS[todayCheckIn.energy_level - 1]?.label}
              </div>
            )}
            {todayCheckIn.sleep_quality && (
              <div className="flex items-center gap-1">
                <Moon className="w-4 h-4 text-secondary-foreground" />
                Sleep: {SLEEP_OPTIONS[todayCheckIn.sleep_quality - 1]?.label}
              </div>
            )}
          </div>
          {todayCheckIn.gratitude_note && (
            <p className="mt-3 text-sm text-muted-foreground italic">
              "{todayCheckIn.gratitude_note}"
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sun className="w-5 h-5 text-warning" />
          Daily Check-In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            How are you feeling today?
          </label>
          <div className="flex justify-between gap-2">
            {MOOD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200",
                    mood === option.value
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Icon className={cn("w-6 h-6", option.color)} />
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            Energy Level
          </label>
          <div className="flex gap-2">
            {ENERGY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setEnergy(option.value)}
                className={cn(
                  "flex-1 py-2 px-3 text-xs rounded-lg transition-all duration-200",
                  energy === option.value
                    ? "bg-warning text-warning-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep Quality */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
            <Moon className="w-4 h-4 text-secondary-foreground" />
            Sleep Quality
          </label>
          <div className="flex gap-2">
            {SLEEP_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSleep(option.value)}
                className={cn(
                  "flex-1 py-2 px-3 text-xs rounded-lg transition-all duration-200",
                  sleep === option.value
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gratitude Note */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            What are you grateful for today? (optional)
          </label>
          <Textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="I'm grateful for..."
            className="resize-none"
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Saving..." : "Complete Check-In ✨"}
        </Button>
      </CardContent>
    </Card>
  );
}
