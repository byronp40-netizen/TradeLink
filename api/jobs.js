// api/jobs.js — Supabase-backed jobs CRUD
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
console.error("Missing Supabase env vars");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
const { method } = req;

try {
if (method === "GET") {
const { data, error } = await supabase
.from("jobs")
.select("*")
.order("created_at", { ascending: false });

if (error) throw error;
return res.status(200).json(data);
}

if (method === "POST") {
const body = req.body || {};
const { title = "Untitled", description = "", status = "open" } = body;

const { data, error } = await supabase
.from("jobs")
.insert([{ title, description, status }])
.select()
.single();

if (error) throw error;
return res.status(201).json(data);
}

if (method === "DELETE") {
const id = req.query.id;
if (!id) return res.status(400).json({ error: "id required" });

const { data, error } = await supabase
.from("jobs")
.delete()
.eq("id", id)
.select()
.single();

if (error) throw error;
return res.status(200).json(data);
}

// unsupported
res.setHeader("Allow", ["GET", "POST", "DELETE"]);
return res.status(405).end(`Method ${method} Not Allowed`);
} catch (err) {
console.error(err);
return res.status(500).json({ error: err.message || "Server error" });
}
}