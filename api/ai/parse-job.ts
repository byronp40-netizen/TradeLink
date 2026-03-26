import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

let TRADE_TYPES: string[] = [
  "carpentry",
  "plumbing",
  "electrical",
  "tiling",
  "painting",
  "roofing",
  "general repair",
  "construction",
  "landscaping",
  "heating",
  "gas",
  "flooring",
  "glazier",
  "locksmith",
  "demolition",
  "cleaning",
];

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tmod = require("../../src/data/trades");
  if (tmod && Array.isArray(tmod.TRADE_TYPES)) {
    TRADE_TYPES = tmod.TRADE_TYPES.map((t: unknown) => String(t).toLowerCase().trim());
  }
} catch {
  console.log("No external TRADE_TYPES module found, using builtin list.");
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `
You extract structured job data from a user's free-text job description for a trades marketplace.

You MUST return ONLY valid JSON.
No markdown.
No backticks.
No explanation.

Allowed trades:
${TRADE_TYPES.join(", ")}

Return this JSON shape exactly:
{
  "title": string,
  "description": string,
  "trade_types": string[],
  "urgency": "low" | "medium" | "high" | null,
  "estimated_budget": number | null,
  "location_hint": string | null,
  "tags": string[],
  "confidence": number
}

Rules:
- trade_types must only use values from the allowed list
- if unsure, choose the closest allowed trade(s)
- use short, relevant strings
- numbers must be numbers, not strings
`;

function validateAndScore(parsed: any) {
  const result = {
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    description: typeof parsed?.description === "string" ? parsed.description.trim() : "",
    trade_types: Array.isArray(parsed?.trade_types)
      ? parsed.trade_types.map((t: unknown) => String(t).toLowerCase().trim())
      : [],
    urgency:
      typeof parsed?.urgency === "string" &&
      ["low", "medium", "high"].includes(parsed.urgency.toLowerCase())
        ? parsed.urgency.toLowerCase()
        : null,
    estimated_budget:
      parsed?.estimated_budget !== null &&
      parsed?.estimated_budget !== undefined &&
      Number.isFinite(Number(parsed.estimated_budget))
        ? Number(parsed.estimated_budget)
        : null,
    location_hint:
      typeof parsed?.location_hint === "string" ? parsed.location_hint.trim() : null,
    tags: Array.isArray(parsed?.tags)
      ? parsed.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [],
    confidence: 0.5,
  };

  result.trade_types = result.trade_types.filter((t) => TRADE_TYPES.includes(t));

  let score = 0.5;
  if (result.trade_types.length > 0) score += 0.2;
  if (result.description.length > 20) score += 0.1;
  if (result.title.length > 3) score += 0.05;
  if (result.urgency) score += 0.05;
  if (result.estimated_budget !== null) score += 0.1;

  result.confidence = Math.min(0.99, Math.round(score * 100) / 100);

  return result;
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { text } = req.body ?? {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: 'Request body must contain "text" string.' });
    }

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;

    if (!raw || typeof raw !== "string") {
      return res.status(502).json({ error: "No usable response from model" });
    }

    const jsonText = extractJsonText(raw);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI JSON output:", {
        raw,
        jsonText,
        parseError,
      });

      return res.status(502).json({
        error: "Model did not return valid JSON",
        detail: String(parseError),
      });
    }

    const safe = validateAndScore(parsed);

    return res.status(200).json({
      ok: true,
      parsed: safe,
    });
  } catch (err: any) {
    console.error("parse-job error:", err);

    return res.status(500).json({
      error: "Internal server error",
      detail: String(err?.message ?? err),
    });
  }
}