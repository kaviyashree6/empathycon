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

Remember: You are a supportive companion, not a replacement for professional therapy. Be present, be kind, and be safe.`;

const EMOTION_ANALYSIS_PROMPT = `Analyze the emotional content of the user's message and categorize it. Return a JSON object with:
- "emotion": one of "positive", "negative", or "neutral"
- "intensity": a number from 1-10 indicating emotional intensity
- "risk_level": "low", "medium", or "high" based on crisis indicators
- "primary_feeling": the main emotion detected (e.g., "anxiety", "sadness", "joy", "anger", "fear", "hope")

Only return the JSON object, no other text.

User message: `;

// Generate pseudo user ID for privacy
function generatePseudoUserId(sessionId: string): string {
  const hash = sessionId.slice(0, 4).toUpperCase();
  return `User_${hash}`;
}

// deno-lint-ignore no-explicit-any
type SupabaseClientType = any;

// Insert crisis alert to database
async function insertCrisisAlert(
  supabase: SupabaseClientType,
  sessionId: string,
  messageId: string | null,
  userId: string | null,
  riskLevel: string,
  primaryFeeling: string,
  messagePreview: string
) {
  try {
    const { error } = await supabase.from("crisis_alerts").insert({
      session_id: sessionId,
      message_id: messageId,
      user_id: userId,
      pseudo_user_id: generatePseudoUserId(sessionId),
      risk_level: riskLevel,
      primary_feeling: primaryFeeling,
      message_preview: messagePreview.slice(0, 200), // Limit preview length
      status: "pending",
    });

    if (error) {
      console.error("Failed to insert crisis alert:", error);
    } else {
      console.log("Crisis alert inserted for session:", sessionId);
    }
  } catch (e) {
    console.error("Error inserting crisis alert:", e);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], sessionId, userId } = await req.json();
    console.log("Received message:", message);
    console.log("Conversation history length:", conversationHistory.length);
    console.log("Session ID:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client with service role for inserting alerts
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Analyze emotion
    console.log("Analyzing emotion...");
    const emotionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: EMOTION_ANALYSIS_PROMPT + message }
        ],
        temperature: 0.3,
      }),
    });

    if (!emotionResponse.ok) {
      const errorText = await emotionResponse.text();
      console.error("Emotion analysis failed:", emotionResponse.status, errorText);
      
      if (emotionResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (emotionResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Emotion analysis failed: ${emotionResponse.status}`);
    }

    const emotionData = await emotionResponse.json();
    console.log("Emotion response:", emotionData);
    
    let emotionAnalysis = { emotion: "neutral", intensity: 5, risk_level: "low", primary_feeling: "neutral" };
    try {
      const emotionContent = emotionData.choices?.[0]?.message?.content || "";
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = emotionContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emotionAnalysis = JSON.parse(jsonMatch[0]);
      }
      console.log("Parsed emotion analysis:", emotionAnalysis);
    } catch (e) {
      console.error("Failed to parse emotion analysis:", e);
    }

    // Insert crisis alert if risk level is high or medium
    if (sessionId && (emotionAnalysis.risk_level === "high" || emotionAnalysis.risk_level === "medium")) {
      await insertCrisisAlert(
        supabase,
        sessionId,
        null,
        userId || null,
        emotionAnalysis.risk_level,
        emotionAnalysis.primary_feeling,
        message
      );
    }

    // Step 2: Generate empathetic response with streaming
    console.log("Generating empathetic response...");
    
    // Build conversation messages
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Add context about detected emotion for the AI
    if (emotionAnalysis.risk_level === "high") {
      messages.push({
        role: "system",
        content: "IMPORTANT: The user may be in crisis. Be extra gentle, validate their feelings, and gently encourage them to reach out to a crisis helpline or professional. Do not minimize their pain."
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
        messages: messages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Chat response failed:", chatResponse.status, errorText);
      
      if (chatResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (chatResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Chat failed: ${chatResponse.status}`);
    }

    // Create a transform stream to inject emotion data at the start
    const encoder = new TextEncoder();
    const emotionEvent = `data: ${JSON.stringify({ 
      type: "emotion", 
      emotion: emotionAnalysis 
    })}\n\n`;

    // Return streaming response with emotion prepended
    const reader = chatResponse.body?.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        // Send emotion data first
        controller.enqueue(encoder.encode(emotionEvent));
        
        // Then stream the chat response
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }
        controller.close();
      }
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