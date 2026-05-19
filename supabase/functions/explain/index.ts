/**
 * Supabase Edge Function: explain
 * --------------------------------
 * Proxies AI explanation requests to Anthropic Claude.
 * The API key never touches the frontend.
 *
 * Deploy: supabase functions deploy explain
 * Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 * Note: IDE type errors on deno.land imports and Deno global are expected —
 * this file runs on the Deno runtime (Supabase), not Node.js.
 */

// @ts-ignore — Deno-only import, not resolvable by VS Code without Deno extension
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore — Deno global available at runtime
declare const Deno: { env: { get(key: string): string | undefined } };

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
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

    const systemPrompt = `You are an expert AI tutor for a student learning application.
Your purpose is to TEACH and EXPLAIN concepts clearly to students instead of copying text from source material.

IMPORTANT BEHAVIOR RULES:
- NEVER copy large passages from source material.
- NEVER answer like a search engine.
- ALWAYS synthesize information into a fresh explanation.
- ALWAYS explain concepts in a natural, human teaching style.
- Use simple and student-friendly language.
- Keep explanations concise but meaningful.
- Avoid repetitive wording.
- Preserve technical accuracy.

RESPONSE FORMAT RULES:
Always structure answers using clean markdown. Use this format:

# Topic Title
## Quick Summary
A short 2–4 sentence explanation of the concept.
## Detailed Explanation
Explain the topic clearly in simple educational language.
## Key Points
- Important point 1
- Important point 2
- Important point 3
## Example
Provide a practical or exam-oriented example whenever possible.
## Important Formula / Definition
Include formulas, equations, or definitions if relevant.
## Exam Tips / Common Mistakes
Mention common student mistakes, shortcuts, or memory tricks if applicable.

ADDITIONAL RULES:
- Use bullet points frequently.
- Use short paragraphs.
- Use headings and subheadings.
- Explain difficult terminology simply.
- Prefer clarity over complexity.
- Keep answers engaging and readable on mobile screens.

FOR SCIENCE/MATH: Explain step-by-step. Show formulas separately. Explain why the answer works.
FOR THEORY SUBJECTS: Summarize concepts in easy language. Use analogies where helpful.
FOR EXAM PREPARATION: Focus on high-yield concepts. Provide memory aids if possible.

MOST IMPORTANT RULE: Your job is to TRANSFORM knowledge into high-quality educational explanations for a ${level}.`;

    const userPrompt = `A student got this question wrong and needs a clear explanation.

Question: ${question.q}
Topic: ${question.topic}
Correct answer: ${question.opts[question.ans]}
Student chose: ${question.opts[chosenIdx]}
Hint: ${question.hint}

Explain WHY the correct answer is right, why the student's choice was wrong, and teach the underlying concept step by step. End with one short encouraging sentence.`;

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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);

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
