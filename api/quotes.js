import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing server environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();

    if (req.method === "GET") {
      const { job_id, tradesperson_id, status } = req.query;

      let query = supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (job_id) query = query.eq("job_id", job_id);
      if (tradesperson_id) query = query.eq("tradesperson_id", tradesperson_id);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;

      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (req.method === "POST") {
      const payload = req.body || {};

      if (!payload.job_id) {
        return res.status(400).json({ error: "job_id is required" });
      }

      if (!payload.tradesperson_id) {
        return res.status(400).json({ error: "tradesperson_id is required" });
      }

      const numericPrice = Number(payload.price);
      if (!Number.isFinite(numericPrice)) {
        return res.status(400).json({ error: "price must be a valid number" });
      }

      const toInsert = {
        job_id: payload.job_id,
        tradesperson_id: payload.tradesperson_id,
        price: numericPrice,
        message:
          payload.message !== undefined && payload.message !== null
            ? String(payload.message).trim()
            : null,
        status: "pending",
      };

      const { data, error } = await supabase
        .from("quotes")
        .insert([toInsert])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Quotes API error:", err);
    return res.status(500).json({
      error: err.message || "Server error",
    });
  }
}
