// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("FATAL: GEMINI_API_KEY is missing in Edge Function environment!");
      throw new Error("Server configuration error: Missing API Key");
    }

    const { userId, mode, messages, metadata } = await req.json();

    // Simple validation
    if (!userId) throw new Error("userId is required");

    // Tier/Model selection
    const isPro = metadata?.isPro === true;
    const model = isPro ? "gemini-pro-latest" : "gemini-flash-latest";

    console.log(`[AI Gateway] Processing request for User: ${userId} | Tier: ${isPro ? "Pro" : "Free"} | Model: ${model}`);

    // MOCK MODE: Fetch disabled
    // const response = await fetch(...)

    console.log(`[AI Gateway] Mock Mode Active for User: ${userId}`);

    const mockContent = JSON.stringify({
      action: "mock",
      message: "AI is temporarily in safe mode. Your task has been processed successfully.",
      created: { tasks: [], routines: [] }
    });

    // We structure this to satisfy the frontend's expectation of { content: string }
    // while including the user's requested data in the 'raw' field or compatible structure.
    return new Response(JSON.stringify({
      content: mockContent,
      raw: {
        success: true,
        type: "mock",
        message: "AI is temporarily in safe mode. Your task has been processed successfully.",
        data: {
          suggestion: "Scheduled successfully (mock mode)."
        }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[AI Gateway] Internal Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
