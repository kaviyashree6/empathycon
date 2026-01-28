import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Supported voices with language/accent info
const VOICES = {
  // English accents
  "en-us": "TX3LPaxmHKxFdv7VOQHJ", // Liam (US)
  "en-gb": "JBFqnCBsd6RMkjVDRZzb", // George (UK)
  "en-au": "N2lVS1w4EtoT3dr4eOWO", // Callum (AU)
  "en": "EXAVITQu4vr4xnSDxMaL", // Sarah (default English)
  // Multilingual voices
  "es": "XrExE9yKIg1WjnnlVkGX", // Matilda
  "fr": "pFZP5JQG7iQjIQuC4Bku", // Lily
  "de": "onwK4e9ZLuTAKqWW03F9", // Daniel
  "pt": "cgSgspJ2msm6clMCkdW9", // Jessica
  "it": "cjVigY5qzO86Huf0OWal", // Eric
  "ja": "Xb7hH8MSUJpSbSDYk0k2", // Alice
  "ko": "bIHbv24MWmeRgasZH58o", // Will
  "zh": "iP95p4xoKVk53GoZ742B", // Chris
  "hi": "FGY2WhTYpPnrIDTdsKH5", // Laura
  "ar": "nPczCjzI2devNBz1zQrb", // Brian
  "ru": "SAz9YHcvj6GT2YYXdXww", // River
  "nl": "IKne3meq5aSn9XLyUdCD", // Charlie
  "pl": "CwhRBWXzGAHq8TQ4Fs17", // Roger
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const { text, language = "en", voiceId } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select voice based on language or use provided voiceId
    const selectedVoiceId = voiceId || VOICES[language as keyof typeof VOICES] || VOICES["en"];

    console.log(`TTS request: language=${language}, voiceId=${selectedVoiceId}, textLength=${text.length}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", errorText);
      throw new Error(`TTS failed: ${response.status}`);
    }

    // Stream the audio response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
