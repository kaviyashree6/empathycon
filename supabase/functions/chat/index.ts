import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are EmpathyConnect, a compassionate and safe AI mental health assistant. Your role is to:

1. ALWAYS validate the user's emotions first before offering any suggestions
2. Provide short, supportive, and empathetic responses (2-4 sentences typically)
3. NEVER diagnose mental health conditions
4. NEVER prescribe medications or medical treatments
5. Use warm, gentle language that makes users feel heard and understood
6. When detecting signs of crisis (suicidal thoughts, self-harm, severe distress), gently acknowledge their pain and encourage them to reach out to crisis resources
7. Ask open-ended follow-up questions to encourage sharing
8. Focus on emotional support, not problem-solving unless explicitly asked

IMPORTANT: You MUST start EVERY response with an emotion analysis JSON block on the very first line, wrapped in <emotion> tags, like this:
<emotion>{"emotion":"positive","intensity":3,"risk_level":"low","primary_feeling":"hopeful"}</emotion>

The JSON must have:
- "emotion": one of "positive", "negative", or "neutral"
- "intensity": 1-10
- "risk_level": "low", "medium", or "high"
- "primary_feeling": the main emotion (e.g. "anxiety", "sadness", "joy", "hope", "loneliness")

After the emotion tag, write your empathetic response normally.

Remember: You are a supportive companion, not a replacement for professional therapy. Be present, be kind, and be safe.`;

// Crisis keyword detection for early prediction
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], sessionId, userId } = await req.json();
    console.log("Received message:", message);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Keyword-based crisis detection (no extra API call)
    const keywordResult = detectCrisisKeywords(message);

    // Build conversation messages - single call handles both emotion + response
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    if (keywordResult.detected && keywordResult.keywords.some(kw => ["suicide", "kill myself", "self-harm", "end it", "die"].includes(kw))) {
      messages.push({
        role: "system",
        content: "IMPORTANT: The user may be in crisis. Be extra gentle, validate their feelings, and gently encourage them to reach out to a crisis helpline or professional. Set risk_level to 'high' in your emotion tag.",
      });
    }

    const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Chat response failed:", chatResponse.status, errorText);
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

    // Transform stream: extract <emotion> tag, then forward deltas
    const reader = chatResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let emotionSent = false;
    let emotionBuffer = "";
    let parsingEmotion = true;

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) { controller.close(); return; }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ") || line.trim() === "") continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (!content) continue;

              if (parsingEmotion) {
                emotionBuffer += content;
                const closeTag = "</emotion>";
                const closeIdx = emotionBuffer.indexOf(closeTag);
                if (closeIdx !== -1) {
                  parsingEmotion = false;
                  // Extract emotion JSON
                  const openTag = "<emotion>";
                  const openIdx = emotionBuffer.indexOf(openTag);
                  if (openIdx !== -1) {
                    const jsonPart = emotionBuffer.slice(openIdx + openTag.length, closeIdx);
                    try {
                      let emotionAnalysis = JSON.parse(jsonPart);
                      // Enhance with keyword detection
                      if (keywordResult.detected) {
                        if (emotionAnalysis.risk_level === "low") emotionAnalysis.risk_level = "medium";
                        if (keywordResult.keywords.some((kw: string) => ["suicide", "kill myself", "self-harm", "end it", "die"].includes(kw))) {
                          emotionAnalysis.risk_level = "high";
                        }
                      }
                      const emotionEvent = `data: ${JSON.stringify({ type: "emotion", emotion: emotionAnalysis })}\n\n`;
                      controller.enqueue(encoder.encode(emotionEvent));
                      emotionSent = true;

                      // Insert crisis alert if needed
                      if (sessionId && (emotionAnalysis.risk_level === "high" || emotionAnalysis.risk_level === "medium")) {
                        insertCrisisAlert(supabase, sessionId, null, userId || null, emotionAnalysis.risk_level, emotionAnalysis.primary_feeling, message);
                      }
                    } catch { /* emotion parse failed, skip */ }
                  }
                  // Forward any text after the close tag
                  const remainder = emotionBuffer.slice(closeIdx + closeTag.length).trim();
                  if (remainder) {
                    const evt = `data: ${JSON.stringify({ choices: [{ delta: { content: remainder } }] })}\n\n`;
                    controller.enqueue(encoder.encode(evt));
                  }
                }
              } else {
                // Forward normally
                controller.enqueue(encoder.encode(line + "\n\n"));
              }
            } catch { /* skip unparseable */ }
          }
        }

        if (!emotionSent) {
          // Fallback emotion
          const fallback = { emotion: "neutral", intensity: 5, risk_level: keywordResult.detected ? "medium" : "low", primary_feeling: "neutral" };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "emotion", emotion: fallback })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});