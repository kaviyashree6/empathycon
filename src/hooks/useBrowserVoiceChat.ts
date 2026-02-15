import { useState, useCallback, useRef, useEffect } from "react";
import { browserTextToSpeech, stopBrowserSpeech, LanguageCode } from "@/lib/voice-api";
import { streamChat, ChatMessage, EmotionAnalysis } from "@/lib/chat-api";
import { toast } from "sonner";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const RECOGNITION_LANG_MAP: Record<string, string> = {
  en: "en-US", "en-gb": "en-GB", "en-au": "en-AU",
  es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR",
  it: "it-IT", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
  hi: "hi-IN", ar: "ar-SA", ru: "ru-RU", nl: "nl-NL", pl: "pl-PL",
};

// Speech pattern analysis for tone-based emotion detection
function analyzeSpeechPatterns(transcript: string, speechDurationMs: number): {
  pace: "slow" | "normal" | "fast";
  urgency: "low" | "medium" | "high";
  emotionalCues: string[];
} {
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = speechDurationMs > 0 ? (wordCount / speechDurationMs) * 60000 : 120;

  const pace = wordsPerMinute < 80 ? "slow" : wordsPerMinute > 180 ? "fast" : "normal";

  // Detect urgency from speech patterns
  const urgencyWords = ["please", "help", "can't", "need", "now", "stop", "hurry", "scared", "afraid"];
  const crisisWords = ["hopeless", "suicide", "kill", "die", "end it", "self-harm", "alone", "worthless", "burden"];
  const lowerText = transcript.toLowerCase();

  const foundUrgency = urgencyWords.filter(w => lowerText.includes(w));
  const foundCrisis = crisisWords.filter(w => lowerText.includes(w));

  const emotionalCues: string[] = [];
  if (pace === "fast") emotionalCues.push("rapid speech (possible anxiety)");
  if (pace === "slow") emotionalCues.push("slow speech (possible sadness/fatigue)");
  if (foundUrgency.length > 0) emotionalCues.push(`urgency cues: ${foundUrgency.join(", ")}`);
  if (foundCrisis.length > 0) emotionalCues.push(`crisis indicators: ${foundCrisis.join(", ")}`);
  if (transcript.includes("...") || transcript.split(/[.!?]/).length > 5) emotionalCues.push("fragmented speech");

  const urgency = foundCrisis.length > 0 ? "high" : foundUrgency.length >= 2 || pace === "fast" ? "medium" : "low";

  return { pace, urgency, emotionalCues };
}

type VoiceChatState = "idle" | "listening" | "thinking" | "speaking";

type TranscriptEntry = {
  role: "user" | "ai";
  text: string;
  emotion?: EmotionAnalysis;
  speechPatterns?: ReturnType<typeof analyzeSpeechPatterns>;
};

export function useBrowserVoiceChat(language: LanguageCode = "en") {
  const [state, setState] = useState<VoiceChatState>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [partialText, setPartialText] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [isEscalated, setIsEscalated] = useState(false);

  const recognitionRef = useRef<any>(null);
  const conversationRef = useRef<ChatMessage[]>([]);
  const isStoppingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const speechStartTimeRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const currentEmotionRef = useRef<EmotionAnalysis | null>(null);
  const languageRef = useRef(language);
  const lastSendTimeRef = useRef<number>(0);

  // Keep refs in sync
  useEffect(() => { languageRef.current = language; }, [language]);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const processUserInputRef = useRef<(text: string) => void>(() => {});

  const processUserInput = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessingRef.current) return;
    
    // Debounce: minimum 3 seconds between messages
    const now = Date.now();
    if (now - lastSendTimeRef.current < 3000) {
      console.log("Voice chat debounced, too soon since last message");
      return;
    }
    lastSendTimeRef.current = now;
    isProcessingRef.current = true;
    const speechDuration = Date.now() - speechStartTimeRef.current;
    const speechPatterns = analyzeSpeechPatterns(userText, speechDuration);

    setState("thinking");
    setTranscript((prev) => [...prev, { role: "user", text: userText, speechPatterns }]);

    // Enrich message with speech pattern context for better AI emotion understanding
    const enrichedMessage = speechPatterns.emotionalCues.length > 0
      ? `${userText}\n\n[Voice analysis: ${speechPatterns.emotionalCues.join("; ")}. Speech pace: ${speechPatterns.pace}]`
      : userText;

    conversationRef.current.push({ role: "user", content: userText });

    let aiResponse = "";
    let detectedEmotion: EmotionAnalysis | null = null;

    try {
      await streamChat(enrichedMessage, conversationRef.current.slice(-10), {
        onEmotion: (emotion) => {
          detectedEmotion = emotion;
          currentEmotionRef.current = emotion;
          setCurrentEmotion(emotion);

          // Auto-escalate for high-risk voice input
          if (emotion.risk_level === "high" || speechPatterns.urgency === "high") {
            setIsEscalated(true);
            toast.warning(
              "I hear you're going through something very difficult. I'm connecting you with additional support. You're not alone. ❤️",
              { duration: 15000 }
            );
          } else if (emotion.risk_level === "medium" && speechPatterns.urgency === "medium") {
            toast.info(
              "I'm paying close attention to how you're feeling. I'm here for you. 💙",
              { duration: 8000 }
            );
          }
        },
        onDelta: (delta) => {
          aiResponse += delta;
        },
        onDone: async () => {
          conversationRef.current.push({ role: "assistant", content: aiResponse });
          setTranscript((prev) => [...prev, { role: "ai", text: aiResponse, emotion: detectedEmotion || undefined }]);

          // Speak with empathetic pacing
          setState("speaking");
          isSpeakingRef.current = true;
          try {
            await browserTextToSpeech(aiResponse, languageRef.current);
          } catch (e) {
            console.warn("Browser TTS error:", e);
          }
          isSpeakingRef.current = false;
          isProcessingRef.current = false;

          // CRITICAL: Resume listening after speaking for continuous conversation
          if (!isStoppingRef.current && isListeningRef.current) {
            setState("listening");
            resumeListening();
          }
        },
        onError: (error) => {
          console.error("Chat error:", error);
          toast.error(error);
          isProcessingRef.current = false;
          if (!isStoppingRef.current && isListeningRef.current) {
            setState("listening");
            resumeListening();
          }
        },
      });
    } catch (error) {
      console.error("Voice chat error:", error);
      toast.error("Failed to get AI response. Please try again.");
      isProcessingRef.current = false;
      if (!isStoppingRef.current && isListeningRef.current) {
        setState("listening");
        resumeListening();
      }
    }
  }, []);

  // Keep ref in sync so startCall's onresult always calls the latest version
  useEffect(() => { processUserInputRef.current = processUserInput; }, [processUserInput]);

  const resumeListening = useCallback(() => {
    if (isStoppingRef.current || !isListeningRef.current) return;

    const tryStart = () => {
      if (isStoppingRef.current || !isListeningRef.current) return;
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          speechStartTimeRef.current = Date.now();
        }
      } catch (e) {
        // If start fails (e.g. already started), retry after delay
        setTimeout(() => {
          if (!isStoppingRef.current && isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              speechStartTimeRef.current = Date.now();
            } catch { /* ignore */ }
          }
        }, 500);
      }
    };

    // Small delay to let previous recognition fully stop
    setTimeout(tryStart, 300);
  }, []);

  const startCall = useCallback(async () => {
    if (!isSupported) {
      toast.error("Your browser doesn't support voice recognition. Please use Chrome or Edge.");
      return;
    }

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access is required for voice chat. Please allow microphone access.");
      return;
    }

    isStoppingRef.current = false;
    isListeningRef.current = true;
    conversationRef.current = [];
    setTranscript([]);
    setPartialText("");
    setCurrentEmotion(null);
    setIsEscalated(false);

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = RECOGNITION_LANG_MAP[languageRef.current] || "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
      speechStartTimeRef.current = Date.now();
    };

    recognition.onresult = (event: any) => {
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
        // Stop recognition while processing to avoid overlap
        try { recognition.stop(); } catch { /* ignore */ }
        processUserInputRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // Normal timeout, will auto-restart via onend
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access.");
        isListeningRef.current = false;
        setIsConnected(false);
        setState("idle");
      } else if (event.error === "aborted") {
        // Intentional abort, ignore
      } else {
        console.warn("Speech error:", event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in call and not speaking/processing
      if (!isStoppingRef.current && isListeningRef.current && !isSpeakingRef.current) {
        setTimeout(() => {
          if (!isStoppingRef.current && isListeningRef.current && !isSpeakingRef.current) {
            resumeListening();
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    setIsConnected(true);

    // Empathetic greeting
    const greeting = "Hi! I'm listening and I'm here for you. How are you feeling today?";
    setTranscript([{ role: "ai", text: greeting }]);
    setState("speaking");
    isSpeakingRef.current = true;
    try {
      await browserTextToSpeech(greeting, languageRef.current);
    } catch (e) {
      console.warn("Greeting TTS error:", e);
    }
    isSpeakingRef.current = false;

    setState("listening");
    recognition.start();
    speechStartTimeRef.current = Date.now();
  }, [isSupported, resumeListening]);

  const endCall = useCallback(() => {
    isStoppingRef.current = true;
    isListeningRef.current = false;
    stopBrowserSpeech();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    setIsConnected(false);
    setState("idle");
    setPartialText("");
  }, []);

  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      isListeningRef.current = false;
      stopBrowserSpeech();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
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
    currentEmotion,
    isEscalated,
    startCall,
    endCall,
  };
}
