// api/jobs.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
console.error("Missing Supabase server env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE");
// If you want, throw here to fail fast on deploy:
// throw new Error("Missing Supabase server env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
auth: { persistSession: false }
});

function normalizeStringArray(value) {
if (!value) return [];
if (Array.isArray(value)) {
return value
.map((v) => (v === null || v === undefined ? "" : String(v).trim()))
.map((v) => v.replace(/\s+/g, " ")) // collapse spaces
.filter(Boolean);
}
// maybe a comma-separated string
if (typeof value === "string") {
return value
.split(",")
.map((v) => v.trim())
.filter(Boolean);
}
return [];
}

export default async function handler(req, res) {
try {
// ---------------- GET ALL JOBS ----------------
if (req.method === "GET") {
// Optional: pagination params can be added later
const { data, error } = await supabase
.from("jobs")
.select("*")
.order("created_at", { ascending: false })
.limit(100);

if (error) throw error;
return res.status(200).json(data);
}

// ---------------- CREATE JOB ----------------
if (req.method === "POST") {
const payload = req.body ?? {};

// Basic server-side validation
const title = payload.title ? String(payload.title).trim() : "";
const description = payload.description ? String(payload.description).trim() : "";

if (!title || !description) {
return res.status(400).json({ error: "Missing title or description" });
}

// Normalize suggested_trades (allow array or comma-separated string)
const suggestedTrades = normalizeStringArray(payload.suggested_trades || payload.suggestedTrades || payload.suggested_trades);
// Also accept trade_type or primary_trade provided directly
let primaryTrade = payload.primary_trade || payload.primaryTrade || payload.trade_type || null;
if (primaryTrade) primaryTrade = String(primaryTrade).trim();

// If primary_trade provided but not in suggestedTrades, add it to suggestedTrades
if (primaryTrade) {
const exists = suggestedTrades.some((t) => t.toLowerCase() === primaryTrade.toLowerCase());
if (!exists) suggestedTrades.unshift(primaryTrade);
}

// If no primaryTrade but there is a single suggested trade, set it
if (!primaryTrade && suggestedTrades.length === 1) {
primaryTrade = suggestedTrades[0];
}

// Budget handling: allow numeric or string ranges — coerce numeric when possible
let budget = null;
if (payload.budget !== undefined && payload.budget !== null && payload.budget !== "") {
const b = payload.budget;
if (typeof b === "number") {
budget = b;
} else {
// attempt to extract first numeric token
const cleaned = String(b).replace(/[^\d.,-]/g, "").replace(",", ".");
const n = Number(cleaned);
budget = Number.isFinite(n) ? n : null;
}
}

const toInsert = {
title,
description,
customer_id: payload.customer_id || null,
trade_type: primaryTrade || null, // legacy single-field
suggested_trades: suggestedTrades.length > 0 ? suggestedTrades : null, // text[] or jsonb
primary_trade: primaryTrade || null,
location: payload.location || null,
budget: budget,
status: payload.status || "open"
};

// Insert into Supabase
const { data, error } = await supabase
.from("jobs")
.insert([toInsert])
.select()
.single();

if (error) throw error;
return res.status(201).json(data);
}

// ---------------- DELETE JOB ----------------
if (req.method === "DELETE") {
const { id } = req.query;
if (!id) return res.status(400).json({ error: "Missing id" });
const { error } = await supabase.from("jobs").delete().eq("id", id);
if (error) throw error;
return res.status(204).end();
}

res.setHeader("Allow", ["GET", "POST", "DELETE"]);
return res.status(405).end(`Method ${req.method} Not Allowed`);
} catch (err) {
console.error("Jobs API error:", err);
// hide internal stack in production, but return message for debugging
return res.status(500).json({ error: err.message || "Server error" });
}
}