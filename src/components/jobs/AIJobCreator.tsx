// src/components/jobs/AIJobCreator.tsx
import React, { useEffect, useState } from "react";

/**
 * Clean, professional AI Job Creator (Tailwind utility classes)
 * - Grid layout for neat alignment
 * - Visible bordered buttons with background
 * - Trade chips with selected + primary visual states
 *
 * NOTE: this assumes your project uses Tailwind (shadcn default).
 * If your project uses custom CSS variables (e.g. bg-primary), those will still apply.
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
  const [manualTradeInput, setManualTradeInput] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<string | null>(null);
  const [aiParsed, setAiParsed] = useState<ParsedResult | null>(null);

  const [suggestedTrades, setSuggestedTrades] = useState<string[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [primaryTrade, setPrimaryTrade] = useState<string | null>(null);

  useEffect(() => {
    if (aiParsed?.trade_types && Array.isArray(aiParsed.trade_types)) {
      const normalized = aiParsed.trade_types.map((t) => String(t).trim()).filter(Boolean);
      setSuggestedTrades(normalized);
      setSelectedTrades(normalized.slice());
      setPrimaryTrade(normalized[0] ?? null);
      if (aiParsed.title) setTitle(String(aiParsed.title));
      if (aiParsed.description) setDescription(String(aiParsed.description));
      if (aiParsed.location_hint) setLocation(String(aiParsed.location_hint));
      if (aiParsed.estimated_budget) setBudget(String(aiParsed.estimated_budget ?? ""));
    }
  }, [aiParsed]);

  function toggleSelectTrade(trade: string) {
    setSelectedTrades((prev) => {
      const lower = trade.toLowerCase();
      const exists = prev.some((t) => t.toLowerCase() === lower);
      if (exists) {
        const next = prev.filter((t) => t.toLowerCase() !== lower);
        if (primaryTrade && primaryTrade.toLowerCase() === lower) {
          setPrimaryTrade(next[0] ?? null);
        }
        return next;
      } else {
        const next = [...prev, trade];
        if (!primaryTrade) setPrimaryTrade(trade);
        return next;
      }
    });
  }

  function addManualTrade() {
    const t = manualTradeInput.trim();
    if (!t) return;
    const existsInSuggested = suggestedTrades.some((s) => s.toLowerCase() === t.toLowerCase());
    if (!existsInSuggested) setSuggestedTrades((s) => [...s, t]);
    const existsInSelected = selectedTrades.some((s) => s.toLowerCase() === t.toLowerCase());
    if (!existsInSelected) setSelectedTrades((s) => [...s, t]);
    setPrimaryTrade((p) => p ?? t);
    setManualTradeInput("");
  }

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

  function choosePrimary(trade: string) {
    const lower = trade.toLowerCase();
    const exists = selectedTrades.some((t) => t.toLowerCase() === lower);
    if (!exists) setSelectedTrades((s) => [...s, trade]);
    setPrimaryTrade(trade);
  }

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
      if (!resp.ok) throw new Error(payload?.error || "AI request failed");
      setAiParsed(payload?.parsed ?? null);
      setAiRaw(payload?.model_text ?? null);
      setSuccess("AI suggestion loaded — review trades and choose primary.");
    } catch (err: any) {
      console.error("AI generation failed:", err);
      setError(err?.message || "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function createJob() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!title.trim()) {
      setError("Please enter a job title.");
      setLoading(false);
      return;
    }
    if (selectedTrades.length === 0) {
      setError("Please select at least one trade or add a trade.");
      setLoading(false);
      return;
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      trade_type: primaryTrade ?? (selectedTrades[0] ?? null),
      suggested_trades: selectedTrades.length > 0 ? selectedTrades : null,
      primary_trade: primaryTrade ?? null,
      location: location.trim() || null,
      budget: budget ? parseBudget(budget) : null
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
        if (onCreated) onCreated(data);
      } else {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `Server returned ${resp.status}`);
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
    return null;
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

  const TradeChip: React.FC<{ trade: string; isSuggested?: boolean }> = ({ trade, isSuggested }) => {
    const lower = trade.toLowerCase();
    const isSelected = selectedTrades.some((t) => t.toLowerCase() === lower);
    const isPrimary = primaryTrade && primaryTrade.toLowerCase() === lower;

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm select-none
          ${isSelected ? (isPrimary ? "bg-sky-600 text-white ring-2 ring-sky-200" : "bg-sky-50 text-sky-700 border border-sky-200") : "bg-white text-slate-700 border border-gray-200"}
        `}
      >
        <button
          onClick={() => toggleSelectTrade(trade)}
          className="text-sm font-medium focus:outline-none"
          title={isSelected ? "Deselect trade" : "Select trade"}
        >
          {trade}
        </button>

        <button
          onClick={() => choosePrimary(trade)}
          className={`text-xs px-2 py-0.5 rounded-full ${isPrimary ? "bg-white/10 text-white" : "bg-white text-sky-600"} border border-transparent`}
          title="Set as primary trade"
        >
          {isPrimary ? "Primary" : "Set"}
        </button>

        {isSuggested && (
          <button
            onClick={() => removeTradeFromSuggestions(trade)}
            className="ml-1 text-xs text-red-600 hover:text-red-800"
            title="Remove suggestion"
            aria-label={`Remove ${trade}`}
          >
            ✕
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Job Creator</h2>
        <div className="text-sm text-slate-500">AI-assisted job creation</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Concise job title (e.g. Replace front door frame)"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            rows={5}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue and any context (AI can generate this for you)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Manual trade (add)</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              value={manualTradeInput}
              onChange={(e) => setManualTradeInput(e.target.value)}
              placeholder="e.g. joiner, glazing"
            />
            <button
              onClick={addManualTrade}
              className="inline-flex items-center gap-2 rounded-md border border-sky-600 bg-white px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
            >
              Add
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Add a trade if AI missed it, then select and set primary.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="County / city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 150 or 100-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={generateFromAI}
          disabled={aiLoading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          {aiLoading ? "Asking AI…" : "Generate from AI"}
        </button>

        <button
          onClick={createJob}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow"
        >
          {loading ? "Creating…" : "Create job"}
        </button>

        <button onClick={clearForm} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-gray-50">
          Clear
        </button>

        <div className="ml-auto text-sm text-slate-500">{aiParsed ? "AI suggestion available" : ""}</div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-700">
          <strong className="font-semibold">Error: </strong> {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-100 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="mt-6">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Suggested trades</h4>
        <div className="flex flex-wrap gap-3">
          {suggestedTrades.length > 0 ? (
            suggestedTrades.map((t, i) => <TradeChip key={`${t}-${i}`} trade={t} isSuggested />)
          ) : (
            <div className="text-sm text-slate-500">No AI suggestions — click "Generate from AI" or add a trade.</div>
          )}
        </div>
      </div>

      {selectedTrades.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-slate-700 mb-2">Selected trades (saved)</h5>
          <div className="flex flex-wrap gap-3">
            {selectedTrades.map((t, i) => (
              <div key={`sel-${t}-${i}`}>
                <TradeChip trade={t} />
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Primary trade: <strong className="ml-2">{primaryTrade ?? "(none selected)"}</strong>
          </div>
        </div>
      )}

      {aiParsed && (
        <div className="mt-6 rounded-md border border-gray-100 bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-slate-700">AI parsed preview</h4>
          <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap max-h-56 overflow-auto">{JSON.stringify(aiParsed, null, 2)}</pre>
          {aiRaw && (
            <>
              <h5 className="mt-3 text-xs font-medium text-slate-600">Raw AI output</h5>
              <pre className="mt-1 text-xs text-slate-600 whitespace-pre-wrap max-h-36 overflow-auto">{aiRaw}</pre>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default AIJobCreator;