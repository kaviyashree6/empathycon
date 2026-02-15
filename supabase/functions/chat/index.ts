import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429 && attempt < maxRetries) {
      const delay = Math.min(2000 * Math.pow(2, attempt), 15000);
      console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    return response;
  }
  throw new Error("Max retries exceeded");
}

const SYSTEM_PROMPT = `You are EmpathyConnect, a compassionate and safe AI mental health assistant.

Your rules:
1. ALWAYS validate the user's emotions first before offering any suggestions
2. Provide short, supportive, and empathetic responses (2-4 sentences typically)
3. NEVER diagnose mental health conditions or prescribe medications
4. Use warm, gentle language that makes users feel heard and understood
5. When detecting signs of crisis, gently acknowledge their pain and encourage reaching out to crisis resources
6. Ask open-ended follow-up questions to encourage sharing
7. Focus on emotional support, not problem-solving unless explicitly asked
8. CRITICAL: You MUST respond in the SAME language the user speaks. If a language is specified, respond ONLY in that language. Never switch to English unless the user writes in English.

Remember: You are a supportive companion, not a replacement for professional therapy. Be present, be kind, and be safe.`;

const CRISIS_KEYWORDS = [
  "hopeless", "no point", "give up", "can't go on", "end it", "suicide",
  "kill myself", "self-harm", "cutting", "die", "death", "alone forever",
  "tired of life", "no reason to live", "worthless", "burden", "nobody cares",
  "want to disappear", "can't take it", "better off without me",
];

function detectCrisisKeywords(message: string): { detected: boolean; keywords: string[] } {
  const lower = message.toLowerCase();
  const found = CRISIS_KEYWORDS.filter((kw) => lower.includes(kw));
  return { detected: found.length > 0, keywords: found };
}

// deno-lint-ignore no-explicit-any
type SupabaseClientType = any;

async function insertCrisisAlert(
  supabase: SupabaseClientType,
  sessionId: string,
  userId: string | null,
  riskLevel: string,
  primaryFeeling: string,
  messagePreview: string
) {
  try {
    const pseudoId = `User_${sessionId.slice(0, 4).toUpperCase()}`;
    await supabase.from("crisis_alerts").insert({
      session_id: sessionId,
      message_id: null,
      user_id: userId,
      pseudo_user_id: pseudoId,
      risk_level: riskLevel,
      primary_feeling: primaryFeeling,
      message_preview: messagePreview.slice(0, 200),
      status: "pending",
    });
  } catch (e) {
    console.error("Error inserting crisis alert:", e);
  }
}

const EMOTION_TOOLS = [
  {
    type: "function",
    function: {
      name: "report_emotion",
      description: "Report the detected emotion from the user's message before responding.",
      parameters: {
        type: "object",
        properties: {
          emotion: { type: "string", enum: ["positive", "negative", "neutral"] },
          intensity: { type: "number", description: "Emotional intensity from 1 to 10" },
          risk_level: { type: "string", enum: ["low", "medium", "high"] },
          primary_feeling: { type: "string", description: "The main emotion word, e.g. anxiety, sadness, joy, hope, loneliness, anger, fear, calm" },
        },
        required: ["emotion", "intensity", "risk_level", "primary_feeling"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], sessionId, userId, language } = await req.json();
    console.log("Received message:", message);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const keywordResult = detectCrisisKeywords(message);

    // Language mapping for AI responses
    const LANG_NAMES: Record<string, string> = {
      en: "English", "en-gb": "English", "en-au": "English",
      es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
      it: "Italian", ja: "Japanese", ko: "Korean", zh: "Chinese",
      hi: "Hindi", ar: "Arabic", ru: "Russian", nl: "Dutch", pl: "Polish",
      ta: "Tamil",
    };

    const langInstruction = language && language !== "en"
      ? `\n\nIMPORTANT: The user's selected language is ${LANG_NAMES[language] || language}. You MUST respond ONLY in ${LANG_NAMES[language] || language}. Do NOT respond in English.`
      : "";

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT + langInstruction },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    if (keywordResult.detected && keywordResult.keywords.some(kw => ["suicide", "kill myself", "self-harm", "end it", "die"].includes(kw))) {
      chatMessages.push({
        role: "system",
        content: "IMPORTANT: The user may be in crisis. Be extra gentle, validate their feelings, and encourage them to reach out to a crisis helpline.",
      });
    }

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };
    const gatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";

    // Keyword-based emotion detection (no API call needed)
    console.log("Detecting emotion from keywords...");
    let emotionAnalysis = { emotion: "neutral", intensity: 5, risk_level: "low", primary_feeling: "neutral" };

    // Use keyword detection for emotion instead of a separate API call
    if (keywordResult.detected) {
      emotionAnalysis.emotion = "negative";
      emotionAnalysis.intensity = 7;
      emotionAnalysis.risk_level = "medium";
      emotionAnalysis.primary_feeling = keywordResult.keywords[0] || "distress";
      if (keywordResult.keywords.some((kw: string) => ["suicide", "kill myself", "self-harm", "end it", "die"].includes(kw))) {
        emotionAnalysis.risk_level = "high";
        emotionAnalysis.intensity = 9;
      }
    } else {
      // Simple keyword-based sentiment without an API call
      const lower = message.toLowerCase();
      const negativeWords = ["anxious", "anxiety", "sad", "depressed", "angry", "scared", "lonely", "stressed", "worried", "hurt", "pain", "crying", "overwhelmed", "exhausted", "frustrated", "afraid", "panic", "miserable", "terrible", "awful"];
      const positiveWords = ["happy", "grateful", "excited", "good", "great", "wonderful", "better", "hopeful", "calm", "peaceful", "loved", "joy", "proud", "relaxed", "confident"];
      
      const negMatch = negativeWords.find(w => lower.includes(w));
      const posMatch = positiveWords.find(w => lower.includes(w));
      
      if (negMatch) {
        emotionAnalysis = { emotion: "negative", intensity: 6, risk_level: "low", primary_feeling: negMatch };
      } else if (posMatch) {
        emotionAnalysis = { emotion: "positive", intensity: 6, risk_level: "low", primary_feeling: posMatch };
      }
    }

    // Insert crisis alert if needed
    if (sessionId && (emotionAnalysis.risk_level === "high" || emotionAnalysis.risk_level === "medium")) {
      insertCrisisAlert(supabase, sessionId, userId || null, emotionAnalysis.risk_level, emotionAnalysis.primary_feeling, message);
    }

    // Add emotion context for better response
    if (emotionAnalysis.risk_level === "high") {
      chatMessages.push({
        role: "system",
        content: "The user is showing high emotional distress. Be extra gentle and suggest crisis resources.",
      });
    }

    // Single API call: Generate empathetic response (streaming)
    console.log("Generating response...");

    const chatResponse = await fetchWithRetry(gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: chatMessages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Chat failed:", chatResponse.status, errorText);
      if (chatResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (chatResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Chat failed: ${chatResponse.status}`);
    }

    // Stream response with emotion prepended
    const encoder = new TextEncoder();
    const emotionEvent = `data: ${JSON.stringify({ type: "emotion", emotion: emotionAnalysis })}\n\n`;
    const upstreamReader = chatResponse.body?.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        // Send emotion first
        controller.enqueue(encoder.encode(emotionEvent));

        // Forward upstream stream
        if (upstreamReader) {
          try {
            while (true) {
              const { done, value } = await upstreamReader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            console.error("Stream read error:", e);
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
