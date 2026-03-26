import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function normalizeStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const {
        customer_id,
        assigned_to,
        status,
        primary_trade,
        limit,
      } = req.query;

      let query = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (customer_id) {
        query = query.eq("customer_id", customer_id);
      }

      if (assigned_to) {
        query = query.eq("assigned_to", assigned_to);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (primary_trade) {
        query = query.eq("primary_trade", primary_trade);
      }

      const parsedLimit = Number(limit);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        query = query.limit(parsedLimit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (req.method === "POST") {
      const payload = req.body || {};

      const title = payload.title ? String(payload.title).trim() : "";
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      const description =
        payload.description !== undefined && payload.description !== null
          ? String(payload.description).trim()
          : null;

      const suggestedTrades = normalizeStringArray(payload.suggested_trades);
      let primaryTrade =
        payload.primary_trade || payload.trade_type || null;

      if (primaryTrade) {
        primaryTrade = String(primaryTrade).trim();
      }

      if (!primaryTrade && suggestedTrades.length === 1) {
        primaryTrade = suggestedTrades[0];
      }

      if (primaryTrade) {
        const exists = suggestedTrades.some(
          (trade) => trade.toLowerCase() === primaryTrade.toLowerCase()
        );
        if (!exists) {
          suggestedTrades.unshift(primaryTrade);
        }
      }

      let budget = null;
      if (
        payload.budget !== undefined &&
        payload.budget !== null &&
        payload.budget !== ""
      ) {
        const numericBudget = Number(payload.budget);
        budget = Number.isFinite(numericBudget) ? numericBudget : null;
      }

      const toInsert = {
        title,
        description,
        customer_id: payload.customer_id || null,
        trade_type: primaryTrade || null,
        suggested_trades: suggestedTrades.length > 0 ? suggestedTrades : null,
        primary_trade: primaryTrade || null,
        location: payload.location || null,
        budget,
        status: payload.status || "open",
      };

      const { data, error } = await supabase
        .from("jobs")
        .insert([toInsert])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Jobs API error:", err);
    return res.status(500).json({
      error: err.message || "Server error",
    });
  }
}