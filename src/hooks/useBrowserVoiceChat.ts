import { useState, useCallback, useRef, useEffect } from "react";
import { browserTextToSpeech, stopBrowserSpeech, LanguageCode } from "@/lib/voice-api";
import { streamChat, ChatMessage } from "@/lib/chat-api";
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
  ta: "ta-IN",
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
  const isProcessingRef = useRef(false);
  const isListeningRef = useRef(false);
  const languageRef = useRef(language);
  const lastSendTimeRef = useRef<number>(0);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => { languageRef.current = language; }, [language]);

  const processUserInputRef = useRef<(text: string) => void>(() => {});

  const resumeListening = useCallback(() => {
    if (isStoppingRef.current || !isListeningRef.current) return;

    const tryStart = () => {
      if (isStoppingRef.current || !isListeningRef.current) return;
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = RECOGNITION_LANG_MAP[languageRef.current] || "en-US";
          recognitionRef.current.start();
        }
      } catch (e) {
        setTimeout(() => {
          if (!isStoppingRef.current && isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch { }
          }
        }, 500);
      }
    };

    setTimeout(tryStart, 300);
  }, []);

  const processUserInput = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessingRef.current) return;

    const now = Date.now();
    if (now - lastSendTimeRef.current < 3000) {
      console.log("Voice chat debounced, too soon since last message");
      return;
    }
    lastSendTimeRef.current = now;
    isProcessingRef.current = true;

    setState("thinking");
    setTranscript((prev) => [...prev, { role: "user", text: userText }]);

    conversationRef.current.push({ role: "user", content: userText });

    let aiResponse = "";

    try {
      await streamChat(userText, conversationRef.current.slice(-10), {
        onDelta: (delta) => {
          aiResponse += delta;
        },
        onDone: async () => {
          conversationRef.current.push({ role: "assistant", content: aiResponse });
          setTranscript((prev) => [...prev, { role: "ai", text: aiResponse }]);

          setState("speaking");
          isSpeakingRef.current = true;
          try {
            await browserTextToSpeech(aiResponse, languageRef.current);
          } catch (e) {
            console.warn("Browser TTS error:", e);
          }
          isSpeakingRef.current = false;
          isProcessingRef.current = false;

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
      }, undefined, undefined, languageRef.current);
    } catch (error) {
      console.error("Voice chat error:", error);
      toast.error("Failed to get AI response. Please try again.");
      isProcessingRef.current = false;
      if (!isStoppingRef.current && isListeningRef.current) {
        setState("listening");
        resumeListening();
      }
    }
  }, [resumeListening]);

  useEffect(() => { processUserInputRef.current = processUserInput; }, [processUserInput]);

  const startCall = useCallback(async () => {
    if (!isSupported) {
      toast.error("Your browser doesn't support voice recognition. Please use Chrome or Edge.");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access is required for voice chat. Please allow microphone access.");
      return;
    }

    isStoppingRef.current = false;
    isListeningRef.current = true;
    isProcessingRef.current = false;
    conversationRef.current = [];
    setTranscript([]);
    setPartialText("");

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = RECOGNITION_LANG_MAP[languageRef.current] || "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
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
        try { recognition.stop(); } catch { }
        processUserInputRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access.");
        isListeningRef.current = false;
        setIsConnected(false);
        setState("idle");
      } else if (event.error === "aborted") {
      } else {
        console.warn("Speech error:", event.error);
      }
    };

    recognition.onend = () => {
      if (!isStoppingRef.current && isListeningRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (!isStoppingRef.current && isListeningRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
            resumeListening();
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    setIsConnected(true);

    const greetings: Record<string, string> = {
      en: "Hi! I'm listening. How are you feeling today?",
      "en-gb": "Hi! I'm listening. How are you feeling today?",
      "en-au": "Hi! I'm listening. How are you feeling today?",
      es: "¡Hola! Estoy escuchando. ¿Cómo te sientes hoy?",
      fr: "Bonjour ! Je vous écoute. Comment vous sentez-vous aujourd'hui ?",
      de: "Hallo! Ich höre zu. Wie fühlen Sie sich heute?",
      pt: "Olá! Estou ouvindo. Como você está se sentindo hoje?",
      it: "Ciao! Ti ascolto. Come ti senti oggi?",
      ja: "こんにちは！聞いていますよ。今日の調子はどうですか？",
      ko: "안녕하세요! 듣고 있어요. 오늘 기분이 어떠세요?",
      zh: "你好！我在听。你今天感觉怎么样？",
      hi: "नमस्ते! मैं सुन रहा हूँ। आज आप कैसा महसूस कर रहे हैं?",
      ar: "مرحبًا! أنا أستمع. كيف تشعر اليوم؟",
      ru: "Привет! Я слушаю. Как вы себя чувствуете сегодня?",
      nl: "Hallo! Ik luister. Hoe voel je je vandaag?",
      pl: "Cześć! Słucham. Jak się dziś czujesz?",
      ta: "வணக்கம்! நான் கேட்டுக்கொண்டிருக்கிறேன். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
    };
    const greeting = greetings[languageRef.current] || greetings.en;

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
  }, [isSupported, resumeListening]);

  const endCall = useCallback(() => {
    isStoppingRef.current = true;
    isListeningRef.current = false;
    isProcessingRef.current = false;
    stopBrowserSpeech();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { }
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
        try { recognitionRef.current.stop(); } catch { }
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
