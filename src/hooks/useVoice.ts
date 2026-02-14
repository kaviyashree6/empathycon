import { useState, useCallback, useRef } from "react";
import {
  browserTextToSpeech,
  stopBrowserSpeech,
  LanguageCode,
} from "@/lib/voice-api";
import { toast } from "sonner";

// Browser language mapping for SpeechRecognition
const RECOGNITION_LANG_MAP: Record<string, string> = {
  en: "en-US", "en-gb": "en-GB", "en-au": "en-AU",
  es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR",
  it: "it-IT", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
  hi: "hi-IN", ar: "ar-SA", ru: "ru-RU", nl: "nl-NL", pl: "pl-PL",
};

type VoiceState = "idle" | "recording" | "processing" | "speaking";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoice(language: LanguageCode = "en") {
  const [state, setState] = useState<VoiceState>("idle");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const resolveRef = useRef<((text: string | null) => void) | null>(null);

  const startRecording = useCallback(async () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Your browser doesn't support voice recognition. Please use Chrome or Edge.");
      return;
    }

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access is required. Please allow microphone access.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = RECOGNITION_LANG_MAP[language] || "en-US";

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const text = lastResult[0]?.transcript || "";
          resolveRef.current?.(text.trim() || null);
          resolveRef.current = null;
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone access.");
        } else if (event.error === "no-speech") {
          toast.info("No speech detected. Please try again.");
        }
        resolveRef.current?.(null);
        resolveRef.current = null;
        setState("idle");
      };

      recognition.onend = () => {
        if (resolveRef.current) {
          resolveRef.current(null);
          resolveRef.current = null;
        }
        setState("idle");
      };

      recognitionRef.current = recognition;
      recognition.start();
      setState("recording");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, [language]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recognitionRef.current || state !== "recording") {
      return null;
    }

    setState("processing");

    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      recognitionRef.current.stop();
    });
  }, [state]);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!isVoiceEnabled || !text.trim()) return;

      try {
        setState("speaking");
        await browserTextToSpeech(text, language);
        setState("idle");
      } catch (error) {
        console.error("Text-to-speech failed:", error);
        toast.error("Voice playback unavailable.");
        setState("idle");
      }
    },
    [language, isVoiceEnabled]
  );

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    stopBrowserSpeech();
    setState("idle");
  }, []);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled((prev) => !prev);
    if (state === "speaking") {
      stopSpeaking();
    }
  }, [state, stopSpeaking]);

  return {
    state,
    isVoiceEnabled,
    isRecording: state === "recording",
    isProcessing: state === "processing",
    isSpeaking: state === "speaking",
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
    toggleVoice,
  };
}
