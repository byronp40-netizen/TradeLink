// api/jobs.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing Supabase env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

export default async function handler(req, res) {
  try {

    // ---------------- GET ALL JOBS ----------------
    if (req.method === "GET") {
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
      const payload = req.body;

      if (!payload.title || !payload.description) {
        return res.status(400).json({ error: "Title and description required" });
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          title: payload.title,
          description: payload.description,
          customer_id: payload.customer_id ?? null,
          trade_type: payload.trade_type ?? null,
          location: payload.location ?? null,
          budget: payload.budget ?? null,
          status: "open"
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // ---------------- DELETE JOB ----------------
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Job id required" });
      }

      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end();

  } catch (err) {
    console.error("Jobs API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
