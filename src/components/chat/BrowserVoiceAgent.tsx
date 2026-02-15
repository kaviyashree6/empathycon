import { memo } from "react";
import { Phone, PhoneOff, Loader2, Mic, Volume2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBrowserVoiceChat } from "@/hooks/useBrowserVoiceChat";
import { LanguageCode } from "@/lib/voice-api";
import { VoiceWaveform } from "./VoiceWaveform";

type BrowserVoiceAgentProps = {
  language?: LanguageCode;
  onClose?: () => void;
};

function BrowserVoiceAgentInner({ language = "en", onClose }: BrowserVoiceAgentProps) {
  const {
    state,
    isConnected,
    isSupported,
    transcript,
    partialText,
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
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Live AI voice conversation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
            {state === "listening" ? "Listening..." : state === "thinking" ? "Thinking..." : state === "speaking" ? "Speaking..." : "Ready to call"}
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
              <div key={i}>
                <p className={cn(entry.role === "user" ? "text-primary" : "text-muted-foreground")}>
                  <span className="font-medium">{entry.role === "user" ? "You: " : "AI: "}</span>
                  {entry.text}
                </p>
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
          🎙️ Live voice conversation • Speaks in your selected language
        </p>
      </CardContent>
    </Card>
  );
}

export const BrowserVoiceAgent = memo(BrowserVoiceAgentInner);
