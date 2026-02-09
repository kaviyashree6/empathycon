import { useState, useCallback, useRef } from "react";
import {
  AudioRecorder,
  browserTextToSpeech,
  speechToText,
  stopBrowserSpeech,
  LanguageCode,
} from "@/lib/voice-api";
import { toast } from "sonner";

type VoiceState = "idle" | "recording" | "processing" | "speaking";

export function useVoice(language: LanguageCode = "en") {
  const [state, setState] = useState<VoiceState>("idle");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }

      await recorderRef.current.start();
      setState("recording");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recorderRef.current?.isRecording()) {
      return null;
    }

    try {
      setState("processing");
      const audioBlob = await recorderRef.current.stop();

      const result = await speechToText(audioBlob, language);
      setState("idle");

      return result.text;
    } catch (error) {
      console.error("Speech-to-text failed:", error);
      toast.error("Could not transcribe audio. Please try again.");
      setState("idle");
      return null;
    }
  }, [language]);

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
