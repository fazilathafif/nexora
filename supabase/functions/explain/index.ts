// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } };

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { question, chosenIdx, stream, elaborate } = await req.json();

    if (!question || chosenIdx === undefined || !stream) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const level = stream === "gcse" ? "GCSE student (age 13–15)" : "A-Level student (age 16–17, UK competitive entry)";

    const systemPrompt = elaborate
      ? `You are an expert tutor giving a deeper dive to a ${level}. Use markdown. Cover:

## Worked example
Step-by-step solution to a similar problem.

## Deeper concept
The underlying theory in plain language — why it works, not just what it is.

## Connections
1–2 bullets linking this topic to related ideas the student will encounter.

Rules: stay under 280 words. Be thorough but clear. No waffle.`

      : `You are a concise AI tutor for a ${level}. Use markdown. Structure every reply with exactly these sections — no more:

## Why this answer?
2–3 sentences: why the correct answer is right and why the student's choice was wrong.

## Key concept
3 bullet points maximum covering the core idea.

## Exam tip
One sentence: a memory trick, common mistake to avoid, or shortcut.

Rules: stay under 180 words total. Be direct. No waffle. End with one short encouraging sentence.`;

    const userPrompt = `Question: ${question.q}
Correct answer: ${question.opts[question.ans]}
Student chose: ${question.opts[chosenIdx]}
Hint: ${question.hint}`;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: elaborate ? 450 : 350,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) throw new Error(`Anthropic error: ${anthropicRes.status}`);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                await writer.write(encoder.encode(parsed.delta.text));
              }
            } catch { /* skip malformed SSE lines */ }
          }
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err) {
    console.error("explain function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
