// Voice API utilities – browser-native only (no ElevenLabs)

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
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// Language code mapping for browser speechSynthesis
const BROWSER_LANG_MAP: Record<string, string> = {
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

/**
 * Browser-native TTS using window.speechSynthesis
 */
export function browserTextToSpeech(
  text: string,
  language: LanguageCode = "en"
): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn("Browser speech synthesis not supported, resolving silently");
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = BROWSER_LANG_MAP[language] || "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) =>
      v.lang.startsWith(utterance.lang.split("-")[0])
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

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
  });
}

/**
 * Stop any ongoing browser speech synthesis
 */
export function stopBrowserSpeech(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
