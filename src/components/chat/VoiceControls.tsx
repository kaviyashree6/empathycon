import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceControlsProps = {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isVoiceEnabled: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleVoice: () => void;
  disabled?: boolean;
};

export function VoiceControls({
  isRecording,
  isProcessing,
  isSpeaking,
  isVoiceEnabled,
  onStartRecording,
  onStopRecording,
  onToggleVoice,
  disabled = false,
}: VoiceControlsProps) {
  const handleMicClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mic button */}
      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={handleMicClick}
        disabled={disabled || isProcessing}
        className={cn(
          "relative transition-all",
          isRecording && "animate-pulse ring-2 ring-destructive ring-offset-2"
        )}
        title={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
        )}
      </Button>

      {/* Voice output toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleVoice}
        disabled={disabled}
        className={cn(
          "transition-colors",
          isVoiceEnabled ? "text-primary" : "text-muted-foreground",
          isSpeaking && "animate-pulse"
        )}
        title={isVoiceEnabled ? "Disable voice responses" : "Enable voice responses"}
      >
        {isVoiceEnabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
