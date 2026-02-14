import { memo } from "react";
import { Phone, PhoneOff, Loader2, Mic, Volume2, AlertCircle, Shield, UserCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBrowserVoiceChat } from "@/hooks/useBrowserVoiceChat";
import { LanguageCode } from "@/lib/voice-api";
import { VoiceWaveform } from "./VoiceWaveform";

type BrowserVoiceAgentProps = {
  language?: LanguageCode;
  onClose?: () => void;
};

const EMOTION_EMOJI: Record<string, string> = {
  positive: "😊", negative: "😔", neutral: "😐",
};

function BrowserVoiceAgentInner({ language = "en", onClose }: BrowserVoiceAgentProps) {
  const {
    state,
    isConnected,
    isSupported,
    transcript,
    partialText,
    currentEmotion,
    isEscalated,
    startCall,
    endCall,
  } = useBrowserVoiceChat(language);

  const handleEndCall = () => {
    endCall();
    onClose?.();
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive/20 shadow-lg">
        <CardContent className="p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">
            Voice chat requires Chrome, Edge, or Safari. Please switch browsers to use this feature.
          </p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <Phone className="w-5 h-5 text-primary" />
          Voice Chat
          {isEscalated && (
            <Badge variant="destructive" className="text-[10px] gap-1 animate-pulse">
              <Shield className="w-3 h-3" />
              Escalated
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isEscalated ? "A therapist has been notified • AI + Human support active" : "AI-powered voice support with emotion detection"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hybrid Support Indicator */}
        {isConnected && (
          <div className={cn(
            "flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-xs",
            isEscalated ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-primary"
          )}>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>AI Active</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5">
              <UserCheck className={cn("w-3.5 h-3.5", isEscalated ? "text-destructive" : "text-muted-foreground")} />
              <span className={isEscalated ? "font-medium" : "text-muted-foreground"}>
                {isEscalated ? "Therapist Notified" : "Human Standby"}
              </span>
            </div>
          </div>
        )}

        {/* Live Emotion Display */}
        {isConnected && currentEmotion && (
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">{EMOTION_EMOJI[currentEmotion.emotion] || "😐"}</span>
              <div>
                <p className="text-xs font-medium capitalize">{currentEmotion.primary_feeling}</p>
                <p className="text-[10px] text-muted-foreground">
                  Intensity: {currentEmotion.intensity}/10
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={currentEmotion.risk_level === "high" ? "destructive" : currentEmotion.risk_level === "medium" ? "warning" : "secondary"}
                className="text-[10px]"
              >
                {currentEmotion.risk_level} risk
              </Badge>
              <div className="flex items-center gap-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span className="text-[10px] text-success font-medium">LIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isConnected
                ? state === "listening"
                  ? "bg-success animate-pulse"
                  : state === "speaking"
                  ? "bg-accent animate-pulse"
                  : "bg-warning animate-pulse"
                : "bg-muted"
            )}
          />
          <Badge variant={isConnected ? "default" : "outline"}>
            {state === "listening" ? "Listening..." : state === "thinking" ? "Analyzing & Thinking..." : state === "speaking" ? "Speaking..." : "Ready to call"}
          </Badge>
        </div>

        {/* Waveform visualizer */}
        {isConnected && (
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full transition-all",
                state === "listening" ? "bg-primary/10 ring-2 ring-primary/30" : "bg-muted"
              )}>
                <Mic className={cn("w-5 h-5", state === "listening" ? "text-primary" : "text-muted-foreground")} />
              </div>
              <VoiceWaveform isActive={state === "listening"} variant="listening" />
              <span className="text-xs text-muted-foreground">You</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full transition-all",
                state === "speaking" ? "bg-accent/15 ring-2 ring-accent/30"
                  : state === "thinking" ? "bg-warning/15 ring-2 ring-warning/30"
                  : "bg-muted"
              )}>
                {state === "thinking" ? (
                  <Loader2 className="w-5 h-5 text-warning animate-spin" />
                ) : (
                  <Volume2 className={cn("w-5 h-5", state === "speaking" ? "text-accent" : "text-muted-foreground")} />
                )}
              </div>
              <VoiceWaveform
                isActive={state === "speaking" || state === "thinking"}
                variant={state === "thinking" ? "thinking" : "speaking"}
              />
              <span className="text-xs text-muted-foreground">AI</span>
            </div>
          </div>
        )}

        {/* Live partial text */}
        {partialText && (
          <div className="px-3 py-2 bg-primary/5 rounded-lg text-sm text-primary italic text-center animate-pulse">
            🎤 {partialText}...
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="max-h-48 overflow-y-auto p-3 bg-muted/50 rounded-lg text-sm space-y-2">
            {transcript.slice(-8).map((entry, i) => (
              <div key={i} className="space-y-0.5">
                <p className={cn(entry.role === "user" ? "text-primary" : "text-muted-foreground")}>
                  <span className="font-medium">{entry.role === "user" ? "You: " : "AI: "}</span>
                  {entry.text}
                </p>
                {entry.speechPatterns && entry.speechPatterns.emotionalCues.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/70 pl-4">
                    🔍 {entry.speechPatterns.emotionalCues.join(" • ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Control buttons */}
        <div className="flex justify-center gap-3">
          {!isConnected ? (
            <Button onClick={startCall} variant="hero" size="lg" className="gap-2">
              <Phone className="w-5 h-5" />
              Start Voice Chat
            </Button>
          ) : (
            <Button onClick={handleEndCall} variant="destructive" size="lg" className="gap-2">
              <PhoneOff className="w-5 h-5" />
              End Call
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isEscalated
            ? "🛡️ AI + Human hybrid support system active • Crisis resources available"
            : "🎙️ Voice emotion detection • AI empathetic responses • Auto-escalation to therapist"
          }
        </p>
      </CardContent>
    </Card>
  );
}

export const BrowserVoiceAgent = memo(BrowserVoiceAgentInner);
