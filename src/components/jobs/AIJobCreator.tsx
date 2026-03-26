import React, { useEffect, useState } from "react";

type ParsedResult = {
  title?: string;
  description?: string;
  trade_types?: string[];
  urgency?: "low" | "medium" | "high";
  estimated_budget?: string | number | null;
  location_hint?: string | null;
  tags?: string[];
  confidence?: number;
};

type AIJobFormData = {
  title: string;
  description: string;
  suggested_trades: string[];
  primary_trade: string | null;
  location: string | null;
  budget: number | null;
};

type Props = {
  onComplete: (jobData: AIJobFormData) => void;
};

const AIJobCreator: React.FC<Props> = ({ onComplete }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manualTradeInput, setManualTradeInput] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiParsed, setAiParsed] = useState<ParsedResult | null>(null);

  const [suggestedTrades, setSuggestedTrades] = useState<string[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [primaryTrade, setPrimaryTrade] = useState<string | null>(null);

  useEffect(() => {
    if (!aiParsed?.trade_types || !Array.isArray(aiParsed.trade_types)) return;

    const normalized = aiParsed.trade_types
      .map((trade) => String(trade).trim())
      .filter(Boolean);

    setSuggestedTrades(normalized);
    setSelectedTrades(normalized);
    setPrimaryTrade(normalized[0] ?? null);

    if (aiParsed.title) setTitle(String(aiParsed.title));
    if (aiParsed.description) setDescription(String(aiParsed.description));
    if (aiParsed.location_hint) setLocation(String(aiParsed.location_hint));
    if (aiParsed.estimated_budget !== null && aiParsed.estimated_budget !== undefined) {
      setBudget(String(aiParsed.estimated_budget));
    }
  }, [aiParsed]);

  function toggleSelectTrade(trade: string) {
    setSelectedTrades((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === trade.toLowerCase());

      if (exists) {
        const next = prev.filter((item) => item.toLowerCase() !== trade.toLowerCase());
        if (primaryTrade && primaryTrade.toLowerCase() === trade.toLowerCase()) {
          setPrimaryTrade(next[0] ?? null);
        }
        return next;
      }

      const next = [...prev, trade];
      if (!primaryTrade) setPrimaryTrade(trade);
      return next;
    });
  }

  function choosePrimary(trade: string) {
    const exists = selectedTrades.some((item) => item.toLowerCase() === trade.toLowerCase());
    if (!exists) {
      setSelectedTrades((prev) => [...prev, trade]);
    }
    setPrimaryTrade(trade);
  }

  function addManualTrade() {
    const trade = manualTradeInput.trim();
    if (!trade) return;

    const inSuggestions = suggestedTrades.some(
      (item) => item.toLowerCase() === trade.toLowerCase()
    );
    const inSelected = selectedTrades.some(
      (item) => item.toLowerCase() === trade.toLowerCase()
    );

    if (!inSuggestions) setSuggestedTrades((prev) => [...prev, trade]);
    if (!inSelected) setSelectedTrades((prev) => [...prev, trade]);
    if (!primaryTrade) setPrimaryTrade(trade);

    setManualTradeInput("");
  }

  function removeTradeFromSuggestions(trade: string) {
    setSuggestedTrades((prev) =>
      prev.filter((item) => item.toLowerCase() !== trade.toLowerCase())
    );

    setSelectedTrades((prev) => {
      const next = prev.filter((item) => item.toLowerCase() !== trade.toLowerCase());
      if (primaryTrade && primaryTrade.toLowerCase() === trade.toLowerCase()) {
        setPrimaryTrade(next[0] ?? null);
      }
      return next;
    });
  }

  function parseBudget(value: string): number | null {
    const cleaned = value.replace(/[^\d.,-]/g, "").trim();
    if (!cleaned) return null;

    const parsed = Number(cleaned.replace(",", "."));
    return Number.isNaN(parsed) ? null : parsed;
  }

  async function generateFromAI() {
    setError(null);
    setSuccess(null);
    setAiParsed(null);

    const prompt = description.trim() || title.trim();

    if (!prompt) {
      setError("Please enter a title or description first.");
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/parse-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: prompt }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "AI request failed");
      }

      setAiParsed(payload?.parsed ?? null);
      setSuccess("AI suggestion loaded. Review the trades and choose a primary trade.");
    } catch (err: any) {
      setError(err?.message || "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (!title.trim()) {
        throw new Error("Please enter a job title.");
      }

      if (selectedTrades.length === 0) {
        throw new Error("Please select at least one trade.");
      }

      onComplete({
        title: title.trim(),
        description: description.trim(),
        suggested_trades: selectedTrades,
        primary_trade: primaryTrade ?? selectedTrades[0] ?? null,
        location: location.trim() || null,
        budget: parseBudget(budget),
      });

      setSuccess("Job details prepared successfully.");
    } catch (err: any) {
      setError(err?.message || "Could not prepare job data.");
    } finally {
      setSubmitting(false);
    }
  }

  const TradeChip: React.FC<{ trade: string; isSuggested?: boolean }> = ({
    trade,
    isSuggested,
  }) => {
    const isSelected = selectedTrades.some(
      (item) => item.toLowerCase() === trade.toLowerCase()
    );
    const isPrimary =
      primaryTrade?.toLowerCase() === trade.toLowerCase();

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm select-none ${
          isSelected
            ? isPrimary
              ? "bg-sky-600 text-white ring-2 ring-sky-200"
              : "bg-sky-50 text-sky-700 border border-sky-200"
            : "bg-white text-slate-700 border border-gray-200"
        }`}
      >
        <button
          type="button"
          onClick={() => toggleSelectTrade(trade)}
          className="text-sm font-medium"
        >
          {trade}
        </button>

        <button
          type="button"
          onClick={() => choosePrimary(trade)}
          className={`text-xs px-2 py-0.5 rounded-full ${
            isPrimary
              ? "bg-white/10 text-white"
              : "bg-white text-sky-600"
          }`}
        >
          {isPrimary ? "Primary" : "Set"}
        </button>

        {isSuggested && (
          <button
            type="button"
            onClick={() => removeTradeFromSuggestions(trade)}
            className="ml-1 text-xs text-red-600 hover:text-red-800"
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
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Concise job title"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={5}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Manual trade
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={manualTradeInput}
              onChange={(e) => setManualTradeInput(e.target.value)}
              placeholder="Add a trade AI missed"
            />
            <button
              type="button"
              onClick={addManualTrade}
              className="inline-flex items-center rounded-md border border-sky-600 bg-white px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Location
          </label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="County or town"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Budget
          </label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 150"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {suggestedTrades.map((trade) => (
            <TradeChip key={trade} trade={trade} isSuggested />
          ))}
        </div>

        {selectedTrades.length > 0 && (
          <p className="text-xs text-slate-500">
            Select the relevant trades and choose one as the primary trade.
          </p>
        )}
      </div>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      {success && <div className="mt-4 text-sm text-green-600">{success}</div>}

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={generateFromAI}
          disabled={aiLoading}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          {aiLoading ? "Generating..." : "Suggest Trades with AI"}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          {submitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </section>
  );
};

export default AIJobCreator;