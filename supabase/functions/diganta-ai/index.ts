// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code is designed to run in Supabase Edge Functions with Deno runtime.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequestPayload {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({
          error: "GROQ_API_KEY is not configured in Supabase Edge Function secrets.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const body: ChatRequestPayload = await req.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request payload: messages array is required." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const selectedModel = model || "openai/gpt-oss-120b";

    // Call Groq Cloud API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return new Response(
        JSON.stringify({
          error: `Groq API responded with error: ${errorText}`,
          statusCode: groqResponse.status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: groqResponse.status,
        }
      );
    }

    const data = await groqResponse.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({
        content: assistantMessage,
        model: selectedModel,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message || "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
