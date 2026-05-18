/**
 * Supabase Edge Function: explain
 * --------------------------------
 * Proxies AI explanation requests to Anthropic Claude.
 * The API key never touches the frontend.
 *
 * Deploy: supabase functions deploy explain
 * Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { question, chosenIdx, stream } = await req.json();

    if (!question || chosenIdx === undefined || !stream) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const level = stream === "gcse"
      ? "Year 9–10 GCSE student aged 13–15"
      : "Year 12 A-Level student aged 16–17 preparing for competitive university entry (UCAT, LNAT, TMUA, ESAT, TSA or STEP)";

    const prompt = `You are BrightPath, a warm and expert UK tutor helping a ${level}.

Question: ${question.q}
Topic: ${question.topic}
Correct answer: ${question.opts[question.ans]}
Student chose: ${question.opts[chosenIdx]}
Hint: ${question.hint}

Write a clear explanation in 3-4 sentences. Explain WHY the correct answer is right and briefly why the student's choice was wrong. Use concrete step-by-step reasoning appropriate for the student's level. End with one short encouraging sentence. Be concise — this student has 5 minutes.`;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.content?.[0]?.text ?? "Review the hint carefully and try again — you've got this!";

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("explain function error:", err);
    return new Response(
      JSON.stringify({ explanation: "Great attempt! Work through the hint step by step — the method will click with practice. 💪" }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
