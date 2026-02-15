// Voice API utilities – browser-native only

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
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
    // Fallback timeout
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

/**
 * Browser-native TTS using window.speechSynthesis
 */
export async function browserTextToSpeech(
  text: string,
  language: LanguageCode = "en"
): Promise<void> {
  if (!window.speechSynthesis) {
    console.warn("Browser speech synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Wait for voices to be available
  const voices = await waitForVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  const targetLang = BROWSER_LANG_MAP[language] || "en-US";
  utterance.lang = targetLang;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Try exact match first, then prefix match
  let matchingVoice = voices.find((v) => v.lang === targetLang);
  if (!matchingVoice) {
    const langPrefix = targetLang.split("-")[0];
    matchingVoice = voices.find((v) => v.lang.startsWith(langPrefix));
  }
  // For languages like Tamil where native voice may not exist, try Google voices
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
    
    // Chrome bug: speechSynthesis pauses on long text. Keep it alive.
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
 * Stop any ongoing browser speech synthesis
 */
export function stopBrowserSpeech(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
