import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

/*
Attempt to load canonical trade list from src/data/trades.
Fallback list is used if that module does not exist.
*/
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
TRADE_TYPES = tmod.TRADE_TYPES.map((t: unknown) =>
String(t).toLowerCase().trim()
);
}
} catch {
console.log("No external TRADE_TYPES module found, using builtin list.");
}

/*
OpenAI client
*/
function getOpenAI() {
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
throw new Error("Missing OPENAI_API_KEY");
}

return new OpenAI({ apiKey });
}

/*
High-accuracy classification prompt
*/
const SYSTEM_PROMPT = `
You classify home repair and maintenance job descriptions for a trades marketplace.

Your job is to infer the most likely real-world trade or trades needed to diagnose and fix the issue.

You MUST return ONLY valid JSON.
Do not use markdown.
Do not wrap in backticks.
Do not include explanation.
Do not include any text before or after the JSON.

Allowed trades:
${TRADE_TYPES.join(", ")}

Return this exact JSON shape:
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

GENERAL CLASSIFICATION PRINCIPLES:
- Choose only from the allowed trades list.
- Base your answer on the customer's likely real-world need, not just keywords.
- If one trade is the obvious main trade and another may be needed later, put the main trade first.
- If a job may require diagnosis first, return the diagnosing trade first.
- If uncertain, choose the most likely trade and lower confidence.
- You may return multiple trades only when the description clearly spans multiple trades.
- Do not invent new trades.
- Prefer practical marketplace routing over abstract categorisation.

TRADE DECISION RULES:

PLUMBING:
Use "plumbing" for:
- leaking sinks
- dripping taps
- toilets
- drains
- blocked pipes
- showers
- water pressure issues
- waste pipes
- internal household water leaks
- radiator leaks if described as water leakage or pipework issue

ELECTRICAL:
Use "electrical" for:
- sockets
- switches
- lights
- wiring
- fuse boards
- tripping circuits
- power loss
- extractor fans if clearly electrical
- alarms or electrical safety issues

CARPENTRY:
Use "carpentry" for:
- doors
- frames
- hinges
- skirting boards
- stairs
- cabinets
- wooden structures
- timber repairs
- wood flooring structure if the issue is mainly woodwork rather than finish flooring installation

ROOFING:
Use "roofing" for:
- roof leaks
- rain ingress
- attic leaks
- missing tiles
- flashing
- gutters when part of water ingress
- storm roof damage
- external roof-related water entry

PAINTING:
Use "painting" for:
- interior or exterior painting
- repainting
- decorating
- surface finishing where painting is the core task

TILING:
Use "tiling" for:
- cracked tiles
- loose tiles
- bathroom tiling
- kitchen splashback tiling
- grout issues
- regrouting when tile finishing is the main issue

FLOORING:
Use "flooring" for:
- laminate flooring
- timber floor installation
- vinyl
- floor finish replacement
- floor repair where the core issue is the floor system/finish itself

HEATING:
Use "heating" for:
- boilers
- heating performance problems
- heating system faults
- radiators where the problem is heat output or heating operation rather than a plumbing leak

GAS:
Use "gas" for:
- gas leaks
- gas appliances
- gas safety concerns
- gas connections

GENERAL REPAIR:
Use "general repair" for:
- minor handyman-style tasks
- mixed small repairs
- vague domestic issues that do not clearly belong to one specialist trade
- small fixing/repair tasks with insufficient evidence for a specialist

CONSTRUCTION:
Use "construction" for:
- larger building works
- wall removal
- structural building work
- extensions
- significant building alterations
- broader building/site works beyond a narrow trade repair

LANDSCAPING:
Use "landscaping" for:
- garden work
- paving
- fencing if clearly outdoor/garden project
- outdoor ground works
- external soft/hard landscaping

GLAZIER:
Use "glazier" for:
- broken windows
- panes
- glazing units
- specialist glass replacement

LOCKSMITH:
Use "locksmith" for:
- locks
- keys
- door lock issues
- broken locking mechanisms
- access/security entry issues

DEMOLITION:
Use "demolition" for:
- strip-out work
- removal of walls/fixtures as demolition rather than construction finishing

CLEANING:
Use "cleaning" for:
- deep cleaning
- mould cleaning
- post-build cleaning
- specialist cleaning where cleaning is the main task

MULTI-TRADE GUIDANCE:
- If water ingress from rain damages an internal ceiling, prefer "roofing" first and consider "carpentry" second only if the structural or finish repair is clearly implied.
- If a plumbing leak has damaged cabinets or timber, prefer "plumbing" first and consider "carpentry" second.
- If a bathroom issue clearly involves both leaking pipework and damaged tiles, prefer "plumbing" first and add "tiling" second.
- If electrical damage is caused by another issue but the customer mainly needs the electrics made safe, prefer "electrical" first.
- Do not add extra trades unless there is clear evidence they are relevant.

URGENCY RULES:
Use "high" for:
- active flooding
- active leaks causing damage
- exposed wiring
- total or dangerous power loss
- gas smell
- inability to secure entry
- serious roof ingress
- anything that could rapidly worsen or create immediate safety/property risk

Use "medium" for:
- functional household issues needing timely repair but not clearly dangerous

Use "low" for:
- cosmetic work
- flexible non-urgent improvements
- minor issues not actively worsening

BUDGET RULES:
- Only provide estimated_budget if the task strongly appears to be a small, routine, low-complexity domestic job.
- If there is uncertainty, complexity, or likely inspection needed, return null.

TITLE RULES:
- Create a short practical customer-friendly title.
- Focus on the main issue, not every detail.
- Example style: "Kitchen sink leak", "Bathroom light tripping", "Roof leak into attic"

DESCRIPTION RULES:
- Rewrite the user's issue clearly and briefly without changing the meaning.
- Remove unnecessary repetition.

LOCATION RULES:
- If the text mentions a county, town, city, estate, suburb, or similar location hint, extract a short location_hint.
- Otherwise return null.

TAGS RULES:
- Use short practical keywords only.
- Examples: "leak", "radiator", "roof", "socket", "tiles", "drain", "ceiling stain", "door", "gutter"

CONFIDENCE RULES:
- Return a number from 0 to 1.
- High confidence when the issue clearly maps to a trade.
- Medium confidence when there are some ambiguities.
- Lower confidence when the description is vague or could reasonably fit several trades.
`;

/*
Map trade synonyms to canonical trade types
*/
function normalizeTradeAliases(trades: string[]): string[] {
const aliasMap: Record<string, string> = {
plumber: "plumbing",
plumbing: "plumbing",
electrician: "electrical",
electrical: "electrical",
carpenter: "carpentry",
carpentry: "carpentry",
roofer: "roofing",
roofing: "roofing",
painter: "painting",
painting: "painting",
tiler: "tiling",
tiling: "tiling",
floorer: "flooring",
flooring: "flooring",
heating: "heating",
gas: "gas",
glazier: "glazier",
locksmith: "locksmith",
demolition: "demolition",
cleaning: "cleaning",
landscaping: "landscaping",
builder: "construction",
construction: "construction",
handyman: "general repair",
"general repair": "general repair",
};

const normalized = trades
.map((t) => {
const key = String(t).toLowerCase().trim();
return aliasMap[key] || key;
})
.filter((t) => TRADE_TYPES.includes(t));

return [...new Set(normalized)];
}

/*
Extract JSON block from model output safely
*/
function extractJson(raw: string): string {
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

/*
Validate and clean parsed output
*/
function validateAndScore(parsed: any) {
const result = {
title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
description:
typeof parsed?.description === "string" ? parsed.description.trim() : "",
trade_types: Array.isArray(parsed?.trade_types)
? normalizeTradeAliases(parsed.trade_types)
: [],
urgency:
typeof parsed?.urgency === "string" &&
["low", "medium", "high"].includes(parsed.urgency.toLowerCase())
? parsed.urgency.toLowerCase()
: null,
estimated_budget:
parsed?.estimated_budget !== null &&
parsed?.estimated_budget !== undefined &&
Number.isFinite(Number(parsed?.estimated_budget))
? Number(parsed.estimated_budget)
: null,
location_hint:
typeof parsed?.location_hint === "string"
? parsed.location_hint.trim()
: null,
tags: Array.isArray(parsed?.tags)
? parsed.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
: [],
confidence: 0.5,
};

let score = 0.5;

if (result.trade_types.length > 0) score += 0.2;
if (result.description.length > 20) score += 0.1;
if (result.title.length > 3) score += 0.05;
if (result.urgency) score += 0.05;
if (result.estimated_budget !== null) score += 0.1;

result.confidence = Math.min(0.99, Math.round(score * 100) / 100);

if (!result.title && result.trade_types.length > 0) {
result.title =
result.trade_types[0].charAt(0).toUpperCase() +
result.trade_types[0].slice(1) +
" job";
}

return result;
}

/*
Serverless function
*/
export default async function handler(req: VercelRequest, res: VercelResponse) {
try {
if (req.method !== "POST") {
res.setHeader("Allow", ["POST"]);
return res.status(405).json({ error: "Method not allowed" });
}

const { text } = req.body ?? {};

if (!text || typeof text !== "string") {
return res.status(400).json({
error: 'Request body must contain "text" string',
});
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

if (!raw) {
return res.status(502).json({ error: "No response from model" });
}

const jsonText = extractJson(raw);

let parsed;

try {
parsed = JSON.parse(jsonText);
} catch (parseError) {
console.error("Failed to parse AI output", parseError);

return res.status(502).json({
error: "Model did not return valid JSON",
raw,
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