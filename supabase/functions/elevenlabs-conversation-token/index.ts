import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs API key is not configured. Please set it up in your project settings.",
          code: "MISSING_API_KEY"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { agentId } = await req.json();

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: "Agent ID is required", code: "MISSING_AGENT_ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Requesting conversation token for agent: ${agentId}`);
    console.log(`API key present: true, length: ${ELEVENLABS_API_KEY.length}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error (${response.status}):`, errorText);

      // Parse for user-friendly messaging
      let userMessage = `ElevenLabs API error (${response.status})`;
      let code = "ELEVENLABS_ERROR";

      if (response.status === 401) {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson?.detail?.status === "missing_permissions") {
            userMessage = "Your ElevenLabs API key is missing the 'Conversational AI' permission. Please update your API key with convai_write permission enabled.";
            code = "MISSING_PERMISSIONS";
          } else {
            userMessage = "Invalid ElevenLabs API key. Please check your API key and try again.";
            code = "INVALID_API_KEY";
          }
        } catch {
          userMessage = "Invalid ElevenLabs API key. Please update it in your project settings.";
          code = "INVALID_API_KEY";
        }
      } else if (response.status === 404) {
        userMessage = "Agent not found. Please check your Agent ID in Settings.";
        code = "AGENT_NOT_FOUND";
      } else if (response.status === 429) {
        userMessage = "Rate limit exceeded. Please wait a moment and try again.";
        code = "RATE_LIMIT";
      }

      return new Response(
        JSON.stringify({ error: userMessage, code, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { token } = await response.json();
    console.log("Successfully obtained conversation token");

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Token error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
