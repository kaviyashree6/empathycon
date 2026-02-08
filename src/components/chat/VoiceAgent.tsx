import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, memo } from "react";
import { Phone, PhoneOff, Loader2, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VoiceAgentProps = {
  agentId: string;
  onClose?: () => void;
};

function VoiceAgentInner({ agentId, onClose }: VoiceAgentProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  // Use ref to avoid recreating onMessage callback
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice agent: connected");
      toast.success("Voice call connected!");
    },
    onDisconnect: () => {
      console.log("Voice agent: disconnected");
      setIsConnecting(false);
    },
    onMessage: (message: unknown) => {
      console.log("Voice agent message:", JSON.stringify(message));
      const msg = message as {
        type?: string;
        source?: string;
        role?: string;
        message?: string;
        user_transcription_event?: { user_transcript?: string };
        agent_response_event?: { agent_response?: string };
      };

      // Handle different message formats from ElevenLabs
      if (msg.type === "user_transcript") {
        setTranscript((prev) => [
          ...prev,
          `You: ${msg.user_transcription_event?.user_transcript || ""}`,
        ]);
      } else if (msg.type === "agent_response") {
        setTranscript((prev) => [
          ...prev,
          `AI: ${msg.agent_response_event?.agent_response || ""}`,
        ]);
      } else if (msg.role === "agent" && msg.message) {
        // Alternative message format
        setTranscript((prev) => [...prev, `AI: ${msg.message}`]);
      } else if (msg.role === "user" && msg.message) {
        setTranscript((prev) => [...prev, `You: ${msg.message}`]);
      }
    },
    onError: (error) => {
      console.error("Voice agent error:", error);
      toast.error("Voice call error occurred");
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setTranscript([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        {
          body: { agentId },
        }
      );

      if (error) {
        let errorMsg = "Failed to get conversation token";
        try {
          const errorBody =
            typeof error === "object" && "message" in error
              ? JSON.parse(error.message)
              : null;
          if (errorBody?.error) {
            errorMsg = errorBody.error;
          }
        } catch {
          if (error.message) errorMsg = error.message;
        }
        throw new Error(errorMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.token) {
        throw new Error(
          "No token received. Please check your ElevenLabs configuration in Settings."
        );
      }

      console.log("Voice agent: starting session with token...");

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
      });

      console.log("Voice agent: session started successfully");
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start voice call",
        { duration: 8000 }
      );
      setIsConnecting(false);
    }
  }, [conversation, agentId]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      console.warn("Error ending session:", e);
    }
    onClose?.();
  }, [conversation, onClose]);

  const isConnected = conversation.status === "connected";

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <Phone className="w-5 h-5 text-primary" />
          Voice Call
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isConnected
                ? "bg-success animate-pulse"
                : isConnecting
                ? "bg-warning animate-pulse"
                : "bg-muted"
            )}
          />
          <Badge
            variant={
              isConnected
                ? "default"
                : isConnecting
                ? "secondary"
                : "outline"
            }
          >
            {isConnected
              ? "Connected"
              : isConnecting
              ? "Connecting..."
              : "Ready to call"}
          </Badge>
        </div>

        {/* Speaking indicator */}
        {isConnected && (
          <div className="flex items-center justify-center gap-4 py-4">
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                !conversation.isSpeaking
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Mic
                className={cn(
                  "w-4 h-4",
                  !conversation.isSpeaking && "animate-pulse"
                )}
              />
              <span className="text-sm">Listening</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                conversation.isSpeaking
                  ? "bg-accent/20 text-accent"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Volume2
                className={cn(
                  "w-4 h-4",
                  conversation.isSpeaking && "animate-pulse"
                )}
              />
              <span className="text-sm">Speaking</span>
            </div>
          </div>
        )}

        {/* Transcript preview */}
        {transcript.length > 0 && (
          <div className="max-h-32 overflow-y-auto p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            {transcript.slice(-5).map((line, i) => (
              <p
                key={i}
                className={cn(
                  line.startsWith("You:")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Control buttons */}
        <div className="flex justify-center gap-3">
          {!isConnected ? (
            <Button
              onClick={startConversation}
              disabled={isConnecting}
              variant="hero"
              size="lg"
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  Start Voice Call
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={stopConversation}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Speak naturally with our AI therapist in real-time
        </p>
      </CardContent>
    </Card>
  );
}

// Memoize to prevent re-renders from parent state changes (e.g. chat messages)
export const VoiceAgent = memo(VoiceAgentInner);
