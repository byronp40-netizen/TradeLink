// src/components/jobs/AIJobCreator.tsx
import React, { useState, useEffect } from "react";

/**
* AI Job Creator (with trade chips + primary/secondary selection)
*
* Notes:
* - Expects /api/ai/parse-job to return { parsed: { trade_types: string[], ... }, model_text: string }
* - On create, sends suggested_trades (string[] or null) and primary_trade (string or null)
* - Prefer keeping a canonical src/data/trades.ts in your repo; this component will use aiParsed.trade_types
* as the authoritative suggestions when available.
*/

type ParsedResult = {
title?: string;
description?: string;
trade_types?: string[];
urgency?: "low" | "medium" | "high";
estimated_budget?: string | number | null;
location_hint?: string | null;
tags?: string[];
confidence?: number;
[k: string]: any;
};

type Props = {
onCreated?: (job: any) => void;
};

const AIJobCreator: React.FC<Props> = ({ onCreated }) => {
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [manualTradeInput, setManualTradeInput] = useState(""); // for manual add
const [location, setLocation] = useState("");
const [budget, setBudget] = useState("");
const [loading, setLoading] = useState(false);
const [aiLoading, setAiLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
const [aiRaw, setAiRaw] = useState<string | null>(null);
const [aiParsed, setAiParsed] = useState<ParsedResult | null>(null);

// trade chip state
const [suggestedTrades, setSuggestedTrades] = useState<string[]>([]); // canonical suggestions (from AI or manual)
const [selectedTrades, setSelectedTrades] = useState<string[]>([]); // user-selected trades (subset of suggestedTrades or manual)
const [primaryTrade, setPrimaryTrade] = useState<string | null>(null); // chosen primary trade

// When AI parsed output arrives, populate suggestions, selected and primary defaults
useEffect(() => {
if (aiParsed?.trade_types && Array.isArray(aiParsed.trade_types)) {
const normalized = aiParsed.trade_types.map((t) => String(t).trim()).filter(Boolean);
setSuggestedTrades(normalized);
// default: select all suggestions (you can change to select-first if preferred)
setSelectedTrades(normalized.slice());
setPrimaryTrade(normalized[0] ?? null);
// Also fill title/description if present
if (aiParsed.title) setTitle(String(aiParsed.title));
if (aiParsed.description) setDescription(String(aiParsed.description));
if (aiParsed.location_hint) setLocation(String(aiParsed.location_hint));
if (aiParsed.estimated_budget) setBudget(String(aiParsed.estimated_budget));
}
}, [aiParsed]);

// Toggle a trade in selectedTrades (select/deselect)
function toggleSelectTrade(trade: string) {
setSelectedTrades((prev) => {
const lower = trade.toLowerCase();
const exists = prev.some((t) => t.toLowerCase() === lower);
if (exists) {
const next = prev.filter((t) => t.toLowerCase() !== lower);
// if primary was removed, unset primary or set to first left
if (primaryTrade && primaryTrade.toLowerCase() === lower) {
setPrimaryTrade(next[0] ?? null);
}
return next;
} else {
// add to end
const next = [...prev, trade];
// if no primary present, set this as primary
if (!primaryTrade) setPrimaryTrade(trade);
return next;
}
});
}

// Add a manual trade to suggestions and select it
function addManualTrade() {
const t = manualTradeInput.trim();
if (!t) return;
// avoid duplicates (case-insensitive)
const existsInSuggested = suggestedTrades.some((s) => s.toLowerCase() === t.toLowerCase());
const existsInSelected = selectedTrades.some((s) => s.toLowerCase() === t.toLowerCase());
if (!existsInSuggested) {
setSuggestedTrades((s) => [...s, t]);
}
if (!existsInSelected) {
setSelectedTrades((s) => [...s, t]);
}
setPrimaryTrade((p) => p ?? t);
setManualTradeInput("");
}

// Remove trade from suggestions (and selected)
function removeTradeFromSuggestions(trade: string) {
const lower = trade.toLowerCase();
setSuggestedTrades((prev) => prev.filter((t) => t.toLowerCase() !== lower));
setSelectedTrades((prev) => {
const next = prev.filter((t) => t.toLowerCase() !== lower);
if (primaryTrade && primaryTrade.toLowerCase() === lower) {
setPrimaryTrade(next[0] ?? null);
}
return next;
});
}

// Set primary trade explicitly (must be in selectedTrades)
function choosePrimary(trade: string) {
const lower = trade.toLowerCase();
const exists = selectedTrades.some((t) => t.toLowerCase() === lower);
if (!exists) {
// if not selected, select it first
setSelectedTrades((prev) => [...prev, trade]);
}
setPrimaryTrade(trade);
}

// Call AI parse endpoint
async function generateFromAI() {
setError(null);
setSuccess(null);
setAiRaw(null);
setAiParsed(null);

const promptSource = description.trim() || title.trim() || "";
const prompt = promptSource || "Describe the job in plain English and suggest trade types.";

setAiLoading(true);
try {
const resp = await fetch("/api/ai/parse-job", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ text: prompt })
});
const payload = await resp.json();
if (!resp.ok) {
const msg = payload?.error || JSON.stringify(payload);
throw new Error(msg);
}
setAiParsed(payload?.parsed ?? null);
setAiRaw(payload?.model_text ?? null);
setSuccess("AI suggestion loaded. Edit trades and choose a primary trade.");
} catch (err: any) {
console.error("AI generation failed:", err);
setError(err?.message || "AI request failed");
} finally {
setAiLoading(false);
}
}

// Create job — includes selectedTrades as suggested_trades and primaryTrade as primary_trade
async function createJob() {
setError(null);
setSuccess(null);
setLoading(true);

// minimal validation
if (!title.trim()) {
setError("Please enter a job title.");
setLoading(false);
return;
}
if (selectedTrades.length === 0 && !manualTradeInput.trim()) {
// If no selected trades and user hasn't added any manually, warn
setError("Please select at least one trade or add a trade.");
setLoading(false);
return;
}

const payload: any = {
title: title.trim(),
description: description.trim(),
// keep legacy trade_type populated with primaryTrade when available
trade_type: primaryTrade ?? (selectedTrades[0] ?? null),
// send full array of suggested trades (empty if none)
suggested_trades: selectedTrades.length > 0 ? selectedTrades : null,
primary_trade: primaryTrade ?? null,
location: location.trim() || null,
budget: budget ? parseBudget(budget) : null,
};

try {
const resp = await fetch("/api/jobs", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload),
});

if (resp.status === 201 || resp.status === 200) {
const data = await resp.json();
setSuccess("Job created successfully.");
if (onCreated) onCreated(data);
// optional: clear form
// clearForm();
} else {
const body = await resp.json().catch(() => null);
const msg = body?.error || `Server returned ${resp.status}`;
throw new Error(msg);
}
} catch (err: any) {
console.error("createJob error:", err);
setError(err?.message || "Failed to create job");
} finally {
setLoading(false);
}
}

function parseBudget(b: string) {
const cleaned = b.replace(/[^\d.,-]/g, "").trim();
if (!cleaned) return null;
const num = Number(cleaned.replace(",", "."));
if (!Number.isNaN(num)) return num;
return b;
}

function clearForm() {
setTitle("");
setDescription("");
setManualTradeInput("");
setLocation("");
setBudget("");
setSuggestedTrades([]);
setSelectedTrades([]);
setPrimaryTrade(null);
setAiParsed(null);
setAiRaw(null);
setError(null);
setSuccess(null);
}

// Small chip component
function TradeChip({
trade,
isSuggested = false,
}: {
trade: string;
isSuggested?: boolean;
}) {
const lower = trade.toLowerCase();
const isSelected = selectedTrades.some((t) => t.toLowerCase() === lower);
const isPrimary = primaryTrade && primaryTrade.toLowerCase() === lower;

return (
<div
style={{
display: "inline-flex",
alignItems: "center",
gap: 8,
margin: 4,
padding: "6px 10px",
borderRadius: 18,
border: isSelected ? (isPrimary ? "2px solid #0b76ef" : "1px solid #0b76ef") : "1px solid #ddd",
background: isSelected ? (isPrimary ? "#e6f0ff" : "#f0fbff") : "#fff",
boxShadow: isPrimary ? "0 1px 6px rgba(11,118,239,0.06)" : undefined,
}}
>
<button
type="button"
onClick={() => toggleSelectTrade(trade)}
style={{
background: "transparent",
border: "none",
cursor: "pointer",
padding: 0,
fontSize: 13,
fontWeight: isPrimary ? 700 : 500,
}}
title={isSelected ? "Deselect trade" : "Select trade"}
>
{trade}
</button>

{/* Primary selector */}
<button
type="button"
onClick={() => choosePrimary(trade)}
aria-pressed={isPrimary}
style={{
marginLeft: 2,
borderRadius: 12,
padding: "3px 6px",
fontSize: 11,
border: isPrimary ? "1px solid #0b76ef" : "1px solid #ddd",
background: isPrimary ? "#0b76ef" : "#fff",
color: isPrimary ? "#fff" : "#333",
cursor: "pointer",
}}
title="Mark as primary trade"
>
{isPrimary ? "Primary" : "Set primary"}
</button>

{/* remove (only for suggestions/added trades) */}
{isSuggested && (
<button
type="button"
onClick={() => removeTradeFromSuggestions(trade)}
title="Remove suggestion"
style={{
marginLeft: 6,
border: "none",
background: "transparent",
cursor: "pointer",
color: "#b00",
}}
>
✕
</button>
)}
</div>
);
}

return (
<section style={{ maxWidth: 920, margin: "0 auto", padding: 12 }}>
<h2 style={{ marginBottom: 6 }}>AI Job Creator</h2>

<div style={{ marginBottom: 8 }}>
<label style={{ display: "block", fontWeight: 600 }}>Title</label>
<input
type="text"
value={title}
onChange={(e) => setTitle(e.target.value)}
placeholder="Concise job title"
style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
/>
</div>

<div style={{ marginBottom: 8 }}>
<label style={{ display: "block", fontWeight: 600 }}>Description</label>
<textarea
rows={6}
value={description}
onChange={(e) => setDescription(e.target.value)}
placeholder="Describe the job (AI can help populate this)"
style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
/>
</div>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
<div>
<label style={{ display: "block", fontWeight: 600 }}>Manual trade (add)</label>
<div style={{ display: "flex", gap: 8 }}>
<input
type="text"
value={manualTradeInput}
onChange={(e) => setManualTradeInput(e.target.value)}
placeholder="e.g. joiner, appliance repair"
style={{ flex: 1, padding: 8 }}
/>
<button type="button" onClick={addManualTrade} style={{ padding: "8px 10px" }}>
Add
</button>
</div>
<div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
Add a trade if AI missed it, then select and set primary.
</div>
</div>

<div>
<label style={{ display: "block", fontWeight: 600 }}>Location (optional)</label>
<input
type="text"
value={location}
onChange={(e) => setLocation(e.target.value)}
placeholder="County / city / brief hint"
style={{ width: "100%", padding: 8 }}
/>
</div>
</div>

<div style={{ marginBottom: 12 }}>
<label style={{ display: "block", fontWeight: 600 }}>Budget (optional)</label>
<input
type="text"
value={budget}
onChange={(e) => setBudget(e.target.value)}
placeholder="e.g. 100-200 EUR or 150"
style={{ width: "100%", padding: 8 }}
/>
</div>

<div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
<button type="button" onClick={generateFromAI} disabled={aiLoading} style={{ padding: "8px 12px" }}>
{aiLoading ? "Asking AI…" : "Generate from AI"}
</button>

<button type="button" onClick={createJob} disabled={loading} style={{ padding: "8px 12px" }}>
{loading ? "Creating…" : "Create job"}
</button>

<button type="button" onClick={clearForm} style={{ padding: "8px 12px" }}>
Clear
</button>

{aiParsed && (
<div style={{ marginLeft: "auto", fontSize: 13, color: "#0a0" }}>AI suggestion available</div>
)}
</div>

{error && (
<div style={{ background: "#fff1f0", border: "1px solid #ffa8a8", padding: 8, marginBottom: 8 }}>
<strong style={{ color: "#d00" }}>Error:</strong> {error}
</div>
)}

{success && (
<div style={{ background: "#f0fff4", border: "1px solid #9be7b0", padding: 8, marginBottom: 8 }}>
{success}
</div>
)}

{/* Suggested trades / chips */}
<div style={{ marginTop: 12 }}>
<h4 style={{ marginBottom: 8 }}>Suggested trades</h4>
<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
{suggestedTrades.length > 0 ? (
suggestedTrades.map((t, i) => (
<TradeChip key={`${t}-${i}`} trade={t} isSuggested={true} />
))
) : (
<div style={{ color: "#666" }}>No AI suggestions yet — click "Generate from AI" or add a trade above.</div>
)}
</div>

{/* selected trades summary */}
{selectedTrades.length > 0 && (
<div style={{ marginTop: 12 }}>
<h5 style={{ margin: "8px 0" }}>Selected trades (will be saved)</h5>
<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
{selectedTrades.map((t, i) => (
<div key={`sel-${t}-${i}`} style={{ display: "inline-flex", alignItems: "center" }}>
<TradeChip trade={t} />
</div>
))}
</div>

<div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
Primary trade:{" "}
<strong style={{ marginLeft: 6 }}>{primaryTrade ?? "(none selected)"}</strong>
</div>
</div>
)}
</div>

{/* AI parsed preview */}
{aiParsed && (
<div style={{ marginTop: 16, padding: 10, background: "#fafafa", border: "1px solid #eee" }}>
<h4 style={{ marginTop: 0 }}>AI parsed preview</h4>
<pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(aiParsed, null, 2)}</pre>
{aiRaw && (
<>
<h5 style={{ margin: "8px 0 4px" }}>Raw AI output</h5>
<pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 200, overflow: "auto" }}>{aiRaw}</pre>
</>
)}
</div>
)}
</section>
);
};

export default AIJobCreator;