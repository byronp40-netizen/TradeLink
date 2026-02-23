import React, { useState } from "react";

type Props = {
onCreated?: () => void; // optional callback for parent to reload jobs
};

export default function AIJobCreator({ onCreated }: Props) {
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [tradeType, setTradeType] = useState("");
const [location, setLocation] = useState("");
const [budget, setBudget] = useState<string>("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

async function handleSubmit(e?: React.FormEvent) {
if (e) e.preventDefault();
setError(null);
setSuccess(null);

if (!title.trim()) {
setError("Please provide a job title.");
return;
}

setLoading(true);
try {
const payload = {
title: title.trim(),
description: description.trim(),
trade_type: tradeType.trim() || null,
location: location.trim() || null,
budget: budget ? Number(budget) : null
};

const res = await fetch("/api/jobs", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload),
});

const data = await res.json();

if (!res.ok) {
// API returned error object
const msg = data?.error || JSON.stringify(data);
throw new Error(msg);
}

setSuccess("Job created");
setTitle("");
setDescription("");
setTradeType("");
setLocation("");
setBudget("");

if (onCreated) onCreated();
} catch (err: any) {
console.error("Create job failed", err);
setError(err?.message || "Failed to create job");
} finally {
setLoading(false);
}
}

// Optional: quick AI generation demo (calls server AI endpoint if you implement it)
async function generateFromAI() {
// If you have an /api/ai-job endpoint, you can call it here.
// This fallback just fills sample text when you don't have AI set up.
setLoading(true);
try {
// If you have AI endpoint:
// const r = await fetch("/api/ai-job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: "Small description for house painter job" })});
// const j = await r.json(); setDescription(j.text || "");
setDescription("Sample job description: Paint the front fence and trim (2 coats).");
} catch (err) {
console.warn("AI generation failed", err);
} finally {
setLoading(false);
}
}

return (
<form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
<h3>Create a job</h3>

<label style={{ display: "block", marginBottom: 8 }}>
<div>Title</div>
<input
value={title}
onChange={(e) => setTitle(e.target.value)}
placeholder="e.g. Fix leaking kitchen tap"
style={{ width: "100%", padding: 8 }}
disabled={loading}
/>
</label>

<label style={{ display: "block", marginBottom: 8 }}>
<div>Description</div>
<textarea
value={description}
onChange={(e) => setDescription(e.target.value)}
placeholder="More details about the job..."
rows={4}
style={{ width: "100%", padding: 8 }}
disabled={loading}
/>
</label>

<div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
<input
value={tradeType}
onChange={(e) => setTradeType(e.target.value)}
placeholder="Trade type (plumbing, electrical...)"
style={{ flex: 1, padding: 8 }}
disabled={loading}
/>
<input
value={location}
onChange={(e) => setLocation(e.target.value)}
placeholder="Location (town / county)"
style={{ flex: 1, padding: 8 }}
disabled={loading}
/>
<input
value={budget}
onChange={(e) => setBudget(e.target.value)}
placeholder="Budget (numeric)"
style={{ width: 120, padding: 8 }}
inputMode="numeric"
disabled={loading}
/>
</div>

<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
<button type="submit" disabled={loading}>
{loading ? "Creating…" : "Create job"}
</button>
<button type="button" onClick={generateFromAI} disabled={loading}>
Generate description (AI)
</button>
<button
type="button"
onClick={() => {
setTitle("");
setDescription("");
setTradeType("");
setLocation("");
setBudget("");
setError(null);
setSuccess(null);
}}
disabled={loading}
>
Clear
</button>
</div>

{error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
{success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}
</form>
);
}