// ElevenLabs Voice API utilities

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

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Convert text to speech using ElevenLabs
 */
export async function textToSpeech(
  text: string,
  language: LanguageCode = "en"
): Promise<Blob> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ text, language }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "TTS failed" }));
    throw new Error(error.error || "Text-to-speech failed");
  }

  return response.blob();
}

/**
 * Play audio blob through the browser
 */
export function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    
    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error("Audio playback failed"));
    };
    
    audio.play().catch(reject);
  });
}

/**
 * Convert speech to text using ElevenLabs
 */
export async function speechToText(
  audioBlob: Blob,
  language: LanguageCode = "en"
): Promise<{ text: string; detectedLanguage?: string }> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("language", language);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "STT failed" }));
    throw new Error(error.error || "Speech-to-text failed");
  }

  const data = await response.json();
  return {
    text: data.text,
    detectedLanguage: data.language,
  };
}

/**
 * Record audio from microphone
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.audioChunks = [];
    
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
