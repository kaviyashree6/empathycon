import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Wind, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BreathingPattern = {
  name: string;
  description: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
};

const patterns: BreathingPattern[] = [
  {
    name: "4-7-8 Relaxation",
    description: "Reduces anxiety and helps you fall asleep",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
  },
  {
    name: "Box Breathing",
    description: "Used by Navy SEALs to stay calm under pressure",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
  },
  {
    name: "Calming Breath",
    description: "Simple pattern for quick stress relief",
    inhale: 4,
    hold1: 2,
    exhale: 6,
    hold2: 0,
    cycles: 6,
  },
];

type Phase = "inhale" | "hold1" | "exhale" | "hold2" | "complete";

const phaseLabels: Record<Phase, string> = {
  inhale: "Breathe In",
  hold1: "Hold",
  exhale: "Breathe Out",
  hold2: "Hold",
  complete: "Complete!",
};

export function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(patterns[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [totalTime, setTotalTime] = useState(0);

  const getPhaseTime = useCallback(
    (p: Phase): number => {
      switch (p) {
        case "inhale":
          return selectedPattern.inhale;
        case "hold1":
          return selectedPattern.hold1;
        case "exhale":
          return selectedPattern.exhale;
        case "hold2":
          return selectedPattern.hold2;
        default:
          return 0;
      }
    },
    [selectedPattern]
  );

  const getNextPhase = useCallback(
    (currentPhase: Phase): Phase => {
      switch (currentPhase) {
        case "inhale":
          return selectedPattern.hold1 > 0 ? "hold1" : "exhale";
        case "hold1":
          return "exhale";
        case "exhale":
          return selectedPattern.hold2 > 0 ? "hold2" : "inhale";
        case "hold2":
          return "inhale";
        default:
          return "inhale";
      }
    },
    [selectedPattern]
  );

  const startExercise = useCallback(() => {
    setIsRunning(true);
    setPhase("inhale");
    setTimeLeft(selectedPattern.inhale);
    setCurrentCycle(1);
    setTotalTime(0);
  }, [selectedPattern]);

  const resetExercise = useCallback(() => {
    setIsRunning(false);
    setPhase("inhale");
    setTimeLeft(0);
    setCurrentCycle(1);
    setTotalTime(0);
  }, []);

  useEffect(() => {
    if (!isRunning || phase === "complete") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const nextPhase = getNextPhase(phase);

          if (
            nextPhase === "inhale" &&
            currentCycle >= selectedPattern.cycles
          ) {
            setIsRunning(false);
            setPhase("complete");
            return 0;
          }

          if (nextPhase === "inhale") {
            setCurrentCycle((c) => c + 1);
          }

          setPhase(nextPhase);
          return getPhaseTime(nextPhase);
        }
        return prev - 1;
      });

      setTotalTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase, currentCycle, selectedPattern, getNextPhase, getPhaseTime]);

  const circleScale =
    phase === "inhale"
      ? 1.5
      : phase === "exhale"
      ? 0.8
      : phase === "complete"
      ? 1.2
      : 1;

  const circleColor =
    phase === "inhale"
      ? "bg-primary/30"
      : phase === "exhale"
      ? "bg-accent/30"
      : phase === "complete"
      ? "bg-success/30"
      : "bg-secondary/30";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/chat"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </Link>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Wind className="w-5 h-5 text-primary" />
            Breathing Exercise
          </h1>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Pattern Selector */}
        <div className="grid gap-3">
          {patterns.map((pattern) => (
            <Card
              key={pattern.name}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedPattern.name === pattern.name
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              )}
              onClick={() => {
                if (!isRunning) {
                  setSelectedPattern(pattern);
                  resetExercise();
                }
              }}
            >
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{pattern.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pattern.description}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p>
                    {pattern.inhale}-{pattern.hold1}-{pattern.exhale}
                    {pattern.hold2 > 0 && `-${pattern.hold2}`}
                  </p>
                  <p>{pattern.cycles} cycles</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Breathing Circle */}
        <Card variant="calm" className="overflow-hidden">
          <CardContent className="py-12 flex flex-col items-center">
            {/* Animated circle */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <div
                className={cn(
                  "absolute w-48 h-48 rounded-full transition-all duration-1000 ease-in-out",
                  circleColor
                )}
                style={{
                  transform: `scale(${circleScale})`,
                }}
              />
              <div
                className={cn(
                  "absolute w-36 h-36 rounded-full transition-all duration-1000 ease-in-out",
                  phase === "complete" ? "bg-success/50" : "bg-primary/50"
                )}
                style={{
                  transform: `scale(${circleScale * 0.9})`,
                }}
              />
              <div className="relative z-10 text-center">
                <p className="text-2xl font-bold">{phaseLabels[phase]}</p>
                {isRunning && phase !== "complete" && (
                  <p className="text-4xl font-display mt-2">{timeLeft}</p>
                )}
                {phase === "complete" && (
                  <Heart className="w-8 h-8 mx-auto mt-2 text-success animate-pulse" />
                )}
              </div>
            </div>

            {/* Progress info */}
            {isRunning && phase !== "complete" && (
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  Cycle {currentCycle} of {selectedPattern.cycles}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(totalTime / 60)}:{(totalTime % 60)
                    .toString()
                    .padStart(2, "0")}{" "}
                  elapsed
                </p>
              </div>
            )}

            {phase === "complete" && (
              <div className="text-center mb-6">
                <p className="text-success font-semibold mb-1">Well done!</p>
                <p className="text-sm text-muted-foreground">
                  You completed {selectedPattern.cycles} breathing cycles in{" "}
                  {Math.floor(totalTime / 60)}:{(totalTime % 60)
                    .toString()
                    .padStart(2, "0")}
                </p>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex gap-4">
              {!isRunning && phase !== "complete" && (
                <Button variant="hero" size="lg" onClick={startExercise} className="gap-2">
                  <Play className="w-5 h-5" />
                  Start
                </Button>
              )}

              {isRunning && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsRunning(false)}
                  className="gap-2"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </Button>
              )}

              {(isRunning || phase === "complete") && (
                <Button variant="ghost" size="lg" onClick={resetExercise} className="gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tips for Effective Breathing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Find a comfortable position, sitting or lying down</p>
            <p>• Breathe through your nose if possible</p>
            <p>• Place one hand on your chest, one on your belly</p>
            <p>• Focus on expanding your belly, not your chest</p>
            <p>• If you feel dizzy, return to normal breathing</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
