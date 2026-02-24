// src/components/jobs/AIJobCreator.tsx
import React, { useState } from "react";

type ParsedResult = {
  title?: string;
  description?: string;
  trade_types?: string[];
  urgency?: "low" | "medium" | "high";
  estimated_budget?: string | null;
  location_hint?: string | null;
  tags?: string[];
  [k: string]: any;
};

type Props = {
  onCreated?: (job: any) => void;
};

const AIJobCreator: React.FC<Props> = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tradeType, setTradeType] = useState(""); // single-string input for UI; server stores array
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<string | null>(null);
  const [aiParsed, setAiParsed] = useState<ParsedResult | null>(null);

  // Call your AI endpoint to parse natural language into structured job data.
  // The endpoint should return { parsed: {...}, raw: "..." }
  async function generateFromAI() {
    setError(null);
    setSuccess(null);

    // Use whatever context you have: prefer description, then title, then a fallback prompt
    const promptSource = description.trim() || title.trim() || "";
    const prompt = promptSource || "Create a short job description and suggest trade types for: painting a 3-room apartment interior.";

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

      const parsed: ParsedResult | null = payload?.parsed ?? null;
      const raw: string | null = payload?.raw ?? null;

      if (!parsed || typeof parsed !== "object") {
        throw new Error("AI returned invalid output");
      }

      // Map parsed values to the UI state with safe fallbacks
      if (parsed.title) setTitle(String(parsed.title));
      if (parsed.description) setDescription(String(parsed.description));
      // trade_types may be array or string — prefer first element for the single-select input
      if (Array.isArray(parsed.trade_types) && parsed.trade_types.length > 0) {
        setTradeType(String(parsed.trade_types[0]));
      } else if (typeof parsed.trade_types === "string") {
        setTradeType(parsed.trade_types);
      }

      if (parsed.location_hint) setLocation(String(parsed.location_hint));
      if (parsed.estimated_budget) setBudget(String(parsed.estimated_budget ?? ""));

      setAiRaw(raw);
      setAiParsed(parsed);
      setSuccess("AI-suggested fields loaded. Please review before creating the job.");
    } catch (err: any) {
      console.error("AI generation failed:", err);
      setError(err?.message || "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  // Create job using your existing API route: POST /api/jobs
  async function createJob() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Basic validation
    if (!title.trim()) {
      setError("Please enter a job title.");
      setLoading(false);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      // Keep tradeType as single string; server can save to suggested_trades array or trade_type field
      trade_type: tradeType.trim() || null,
      location: location.trim() || null,
      budget: budget ? parseBudget(budget) : null,
    };

    try {
      const resp = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (resp.status === 201 || resp.status === 200) {
        const data = await resp.json();
        setSuccess("Job created successfully.");
        // Reset form if you want
        // setTitle(""); setDescription(""); setTradeType(""); setLocation(""); setBudget("");
        if (onCreated) onCreated(data);
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
    // If budget looks numeric, return number; otherwise return the string for now.
    const cleaned = b.replace(/[^\d.,-]/g, "").trim();
    if (!cleaned) return null;
    // Try to coerce to number if simple
    const num = Number(cleaned.replace(",", "."));
    if (!Number.isNaN(num)) return num;
    return b;
  }

  function clearForm() {
    setTitle("");
    setDescription("");
    setTradeType("");
    setLocation("");
    setBudget("");
    setError(null);
    setSuccess(null);
    setAiRaw(null);
    setAiParsed(null);
  }

  return (
    <section style={{ maxWidth: 820, margin: "0 auto", padding: 12 }}>
      <h2>AI Job Creator</h2>

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
          <label style={{ display: "block", fontWeight: 600 }}>Trade type (primary)</label>
          <input
            type="text"
            value={tradeType}
            onChange={(e) => setTradeType(e.target.value)}
            placeholder="e.g. plumber, electrician"
            style={{ width: "100%", padding: 8 }}
          />
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
        <button
          type="button"
          onClick={generateFromAI}
          disabled={aiLoading}
          style={{ padding: "8px 12px" }}
        >
          {aiLoading ? "Asking AI…" : "Generate from AI"}
        </button>

        <button
          type="button"
          onClick={() => createJob()}
          disabled={loading}
          style={{ padding: "8px 12px" }}
        >
          {loading ? "Creating…" : "Create job"}
        </button>

        <button type="button" onClick={clearForm} style={{ padding: "8px 12px" }}>
          Clear
        </button>

        {aiParsed && (
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#0a0" }}>
            AI suggestion available
          </div>
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

      {aiParsed && (
        <div style={{ marginTop: 12, padding: 10, background: "#fafafa", border: "1px solid #eee" }}>
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