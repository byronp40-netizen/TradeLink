// api/ai/parse-job.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'; // optional types - OK if present
import OpenAI from 'openai';

// Try to import canonical trade list from src/data/trades
let TRADE_TYPES: string[] = [
'carpentry',
'plumbing',
'electrical',
'tiling',
'painting',
'roofing',
'general repair',
'construction',
'landscaping',
'heating',
'gas',
'flooring',
'glazier',
'locksmith',
'demolition',
'cleaning'
];
try {
// runtime import — if you keep canonical list in src/data/trades.ts this will override the fallback
// path resolved relative to repo root (api/ -> ../../src/...)
// if Typescript build fails, ensure src/data/trades.ts exists and exports TRADE_TYPES
// eslint-disable-next-line @typescript-eslint/no-var-requires
// require is used to avoid TS compile-time module resolution issues on some build setups
// If you prefer ESM import, switch to: import { TRADE_TYPES as TT } from '../../src/data/trades';
// and then assign TRADE_TYPES = TT
// But using require here is more robust for serverless builds
// eslint-disable-next-line @typescript-eslint/no-var-requires
// @ts-ignore
const tmod = require('../../src/data/trades');
if (tmod && Array.isArray(tmod.TRADE_TYPES)) {
TRADE_TYPES = tmod.TRADE_TYPES;
}
} catch (e) {
// keep fallback list
console.log('No external TRADE_TYPES module found, using builtin list.');
}

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

/**
* Strict system prompt to constrain model to valid JSON and only allowed trade types.
* Keep this prompt server-side only.
*/
const SYSTEM_PROMPT = `
You are an assistant that extracts structured job data from a user's free-text job description
for a trades marketplace.

REQUIREMENTS:
- You MUST output ONLY valid JSON (no surrounding explanation, no backticks).
- All trade types returned in "trade_types" MUST be chosen from this allowed list (do not invent new trades).
Allowed trades: ${TRADE_TYPES.join(', ')}

OUTPUT JSON schema:
{
"title": string,
"description": string,
"trade_types": string[], // subset of allowed trades
"urgency": "low" | "medium" | "high",
"estimated_budget": number | null, // numeric estimated budget (EUR), or null
"location_hint": string | null, // short free text hint (county/city)
"tags": string[], // optional short keywords
"confidence": number // 0.0 - 1.0 (the model's internal guess; server will overwrite)
}

RULES:
- If uncertain between trades, choose the closest allowed trade(s).
- Do NOT output any explanation or extra fields.
- Ensure numbers are numeric (not strings).
- Keep strings short and relevant.
`;

/** Minimal runtime validation & computed confidence */
function validateAndScore(parsed: any) {
const result: any = {
title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
trade_types: Array.isArray(parsed.trade_types) ? parsed.trade_types.map(String) : [],
urgency: parsed.urgency || null,
estimated_budget: parsed.estimated_budget ?? null,
location_hint: parsed.location_hint ?? null,
tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
confidence: 0.5 // baseline
};

// sanitize trade types to allowed list
result.trade_types = result.trade_types
.map((t: string) => t.toLowerCase().trim())
.filter((t: string) => TRADE_TYPES.includes(t));

// basic fixes for urgency
if (typeof result.urgency === 'string') {
const u = result.urgency.toLowerCase();
if (['low', 'medium', 'high'].includes(u)) result.urgency = u;
else result.urgency = null;
} else {
result.urgency = null;
}

// budget numeric coercion (if numeric-like)
if (result.estimated_budget !== null) {
const n = Number(result.estimated_budget);
result.estimated_budget = Number.isFinite(n) ? n : null;
}

// confidence scoring heuristics (server-side)
let score = 0.5;
if (result.trade_types.length > 0) score += 0.2;
if (result.description && result.description.length > 30) score += 0.1;
if (result.title && result.title.length > 3) score += 0.05;
if (result.urgency) score += 0.05;
if (result.estimated_budget !== null) score += 0.1;

result.confidence = Math.min(0.99, Math.round(score * 100) / 100);
return result;
}

/** Helper to safely extract text from the OpenAI Responses response object */
function extractOutputText(resp: any): string | null {
// New SDK often exposes .output_text, but be defensive
if (!resp) return null;
if (typeof resp.output_text === 'string') return resp.output_text;
if (Array.isArray(resp.output)) {
// join textual content
const parts: string[] = [];
for (const item of resp.output) {
if (item && item.content) {
// content may be array of objects
if (Array.isArray(item.content)) {
for (const c of item.content) {
if (c?.text) parts.push(c.text);
if (typeof c === 'string') parts.push(c);
}
} else if (typeof item.content === 'string') {
parts.push(item.content);
}
} else if (typeof item === 'string') {
parts.push(item);
}
}
return parts.join('\n').trim() || null;
}
return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
try {
if (req.method !== 'POST') {
return res.setHeader('Allow', ['POST']).status(405).json({ error: 'Method not allowed' });
}

const { text } = req.body ?? {};
if (!text || typeof text !== 'string') {
return res.status(400).json({ error: 'Request body must contain "text" string.' });
}

// Call OpenAI Responses API
const resp = await openai.responses.create({
model: 'gpt-4.1-mini',
// we use `input` as a conversation array so system + user are clear
input: [
{ role: 'system', content: SYSTEM_PROMPT },
{ role: 'user', content: text }
],
// optional: adjust temperature for deterministic output
temperature: 0.0,
max_output_tokens: 800
});

const raw = extractOutputText(resp);
if (!raw) {
return res.status(502).json({ error: 'No response from model' });
}

// The model is instructed to output only JSON — attempt to extract JSON
let jsonText = raw.trim();

// If model returns JSON embedded in text, try to find the first { ... } block
if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
const firstBrace = jsonText.indexOf('{');
const firstBracket = jsonText.indexOf('[');
const start = firstBrace >= 0 ? firstBrace : firstBracket;
const lastBrace = jsonText.lastIndexOf('}');
const lastBracket = jsonText.lastIndexOf(']');
const end = lastBrace > lastBracket ? lastBrace : lastBracket;
if (start >= 0 && end >= 0 && end > start) {
jsonText = jsonText.substring(start, end + 1);
}
}

let parsed: any;
try {
parsed = JSON.parse(jsonText);
} catch (e) {
// If direct JSON parse fails, try to recover common mistakes: trailing commas, single quotes
const cleaned = jsonText
.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, (m, p1, p2) => `"${p2}":`) // ensure keys in quotes
.replace(/,(\s*[}\]])/g, '$1') // remove trailing commas
.replace(/'/g, '"'); // single -> double quotes
try {
parsed = JSON.parse(cleaned);
} catch (e2) {
console.error('Failed to parse AI JSON output', { raw, cleaned, err1: e, err2: e2 });
return res.status(502).json({ error: 'Model did not return valid JSON', raw });
}
}

// Validate & compute server-side confidence and sanitise
const safe = validateAndScore(parsed);

return res.status(200).json({
ok: true,
parsed: safe,
model_text: raw // optional: keep raw model text for debugging (remove in production if sensitive)
});
} catch (err: any) {
console.error('parse-job error:', err?.message ?? err);
return res.status(500).json({ error: 'Internal server error', detail: String(err?.message ?? err) });
}
}