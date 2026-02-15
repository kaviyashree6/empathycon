// Voice API utilities – ElevenLabs for Tamil, browser-native for others

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", accent: "US" },
  { code: "en-gb", label: "English", accent: "UK" },
  { code: "en-au", label: "English", accent: "AU" },
  { code: "es", label: "Español", accent: "" },
  { code: "fr", label: "Français", accent: "" },
  { code: "de", label: "Deutsch", accent: "" },
  { code: "pt", label: "Português", accent: "" },
  { code: "it", label: "Italiano", accent: "" },
  { code: "ja", label: "日本語", accent: "" },
  { code: "ko", label: "한국어", accent: "" },
  { code: "zh", label: "中文", accent: "" },
  { code: "hi", label: "हिंदी", accent: "" },
  { code: "ar", label: "العربية", accent: "" },
  { code: "ru", label: "Русский", accent: "" },
  { code: "nl", label: "Nederlands", accent: "" },
  { code: "pl", label: "Polski", accent: "" },
  { code: "ta", label: "தமிழ்", accent: "" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const BROWSER_LANG_MAP: Record<string, string> = {
  en: "en-US", "en-gb": "en-GB", "en-au": "en-AU",
  es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR",
  it: "it-IT", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
  hi: "hi-IN", ar: "ar-SA", ru: "ru-RU", nl: "nl-NL", pl: "pl-PL",
  ta: "ta-IN",
};

// Languages that use ElevenLabs for natural-sounding TTS
const ELEVENLABS_LANGUAGES = new Set<string>(["ta"]);

/**
 * Ensure voices are loaded (some browsers load them async)
 */
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

// Track current ElevenLabs audio for stopping
let currentAudio: HTMLAudioElement | null = null;

/**
 * ElevenLabs TTS via edge function – natural multilingual voices
 */
async function elevenlabsTextToSpeech(
  text: string,
  language: LanguageCode = "ta"
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ text, language }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("ElevenLabs TTS error:", err);
    // Fallback to browser TTS
    console.warn("Falling back to browser TTS");
    return nativeBrowserTTS(text, language);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  return new Promise<void>((resolve) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      resolve();
    };
    audio.play().catch(() => {
      currentAudio = null;
      resolve();
    });
  });
}

/**
 * Browser-native TTS using window.speechSynthesis
 */
async function nativeBrowserTTS(
  text: string,
  language: LanguageCode = "en"
): Promise<void> {
  if (!window.speechSynthesis) {
    console.warn("Browser speech synthesis not supported");
    return;
  }

  window.speechSynthesis.cancel();

  const voices = await waitForVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  const targetLang = BROWSER_LANG_MAP[language] || "en-US";
  utterance.lang = targetLang;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  let matchingVoice = voices.find((v) => v.lang === targetLang);
  if (!matchingVoice) {
    const langPrefix = targetLang.split("-")[0];
    matchingVoice = voices.find((v) => v.lang.startsWith(langPrefix));
  }
  if (!matchingVoice) {
    const langPrefix = targetLang.split("-")[0];
    matchingVoice = voices.find((v) =>
      v.name.toLowerCase().includes(langPrefix) ||
      v.lang.toLowerCase().startsWith(langPrefix)
    );
  }
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        resolve();
      } else {
        console.warn(`Browser TTS error: ${e.error}`);
        resolve();
      }
    };

    window.speechSynthesis.speak(utterance);

    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(keepAlive);
      } else {
        window.speechSynthesis.resume();
      }
    }, 10000);

    utterance.onend = () => {
      clearInterval(keepAlive);
      resolve();
    };
  });
}

/**
 * Smart TTS – routes to ElevenLabs for Tamil, browser-native for others
 */
export async function browserTextToSpeech(
  text: string,
  language: LanguageCode = "en"
): Promise<void> {
  if (ELEVENLABS_LANGUAGES.has(language)) {
    return elevenlabsTextToSpeech(text, language);
  }
  return nativeBrowserTTS(text, language);
}

/**
 * Stop any ongoing speech (both browser and ElevenLabs)
 */
export function stopBrowserSpeech(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
