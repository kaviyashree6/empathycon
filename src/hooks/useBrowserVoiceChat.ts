import { useState, useCallback, useRef, useEffect } from "react";
import { browserTextToSpeech, stopBrowserSpeech, LanguageCode } from "@/lib/voice-api";
import { streamChat, ChatMessage } from "@/lib/chat-api";
import { toast } from "sonner";

// Web Speech API types for cross-browser support
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Browser language mapping for SpeechRecognition
const RECOGNITION_LANG_MAP: Record<string, string> = {
  en: "en-US",
  "en-gb": "en-GB",
  "en-au": "en-AU",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  hi: "hi-IN",
  ar: "ar-SA",
  ru: "ru-RU",
  nl: "nl-NL",
  pl: "pl-PL",
};

type VoiceChatState = "idle" | "listening" | "thinking" | "speaking";

type TranscriptEntry = {
  role: "user" | "ai";
  text: string;
};

export function useBrowserVoiceChat(language: LanguageCode = "en") {
  const [state, setState] = useState<VoiceChatState>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [partialText, setPartialText] = useState("");

  const recognitionRef = useRef<any>(null);
  const conversationRef = useRef<ChatMessage[]>([]);
  const isStoppingRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // Check browser support
  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const processUserInput = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    setState("thinking");
    setTranscript((prev) => [...prev, { role: "user", text: userText }]);

    conversationRef.current.push({ role: "user", content: userText });

    let aiResponse = "";

    try {
      await streamChat(userText, conversationRef.current.slice(-10), {
        onEmotion: (emotion) => {
          if (emotion.risk_level === "high") {
            toast.warning(
              "If you're in crisis, please reach out to a helpline. You're not alone. ❤️",
              { duration: 10000 }
            );
          }
        },
        onDelta: (delta) => {
          aiResponse += delta;
        },
        onDone: async () => {
          conversationRef.current.push({ role: "assistant", content: aiResponse });
          setTranscript((prev) => [...prev, { role: "ai", text: aiResponse }]);

          // Speak the response
          setState("speaking");
          isSpeakingRef.current = true;
          try {
            await browserTextToSpeech(aiResponse, language);
          } catch (e) {
            console.warn("Browser TTS error:", e);
          }
          isSpeakingRef.current = false;

          // Resume listening if still connected
          if (!isStoppingRef.current) {
            setState("listening");
            resumeListening();
          }
        },
        onError: (error) => {
          console.error("Chat error:", error);
          toast.error(error);
          if (!isStoppingRef.current) {
            setState("listening");
            resumeListening();
          }
        },
      });
    } catch (error) {
      console.error("Voice chat error:", error);
      toast.error("Failed to get AI response");
      if (!isStoppingRef.current) {
        setState("listening");
        resumeListening();
      }
    }
  }, [language]);

  const resumeListening = useCallback(() => {
    if (isStoppingRef.current || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already started, ignore
    }
  }, []);

  const startCall = useCallback(async () => {
    if (!isSupported) {
      toast.error("Your browser doesn't support voice recognition. Please use Chrome or Edge.");
      return;
    }

    isStoppingRef.current = false;
    conversationRef.current = [];
    setTranscript([]);
    setPartialText("");

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = RECOGNITION_LANG_MAP[language] || "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setPartialText(interimTranscript);
      }

      if (finalTranscript.trim()) {
        setPartialText("");
        processUserInput(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "no-speech" && !isStoppingRef.current) {
        // Restart if no speech detected
        resumeListening();
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access.");
        setIsConnected(false);
        setState("idle");
      }
    };

    recognition.onend = () => {
      // Auto-restart if we're still in a call and not processing
      if (!isStoppingRef.current && !isSpeakingRef.current) {
        resumeListening();
      }
    };

    recognitionRef.current = recognition;
    setIsConnected(true);

    // Greeting
    const greeting = "Hi! I'm listening. How are you feeling today?";
    setTranscript([{ role: "ai", text: greeting }]);
    setState("speaking");
    isSpeakingRef.current = true;
    try {
      await browserTextToSpeech(greeting, language);
    } catch (e) {
      console.warn("Greeting TTS error:", e);
    }
    isSpeakingRef.current = false;

    // Start listening
    setState("listening");
    recognition.start();
  }, [isSupported, language, processUserInput, resumeListening]);

  const endCall = useCallback(() => {
    isStoppingRef.current = true;
    stopBrowserSpeech();

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setIsConnected(false);
    setState("idle");
    setPartialText("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      stopBrowserSpeech();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    state,
    isConnected,
    isSupported,
    transcript,
    partialText,
    startCall,
    endCall,
  };
}
