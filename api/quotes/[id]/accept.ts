import type { VercelRequest, VercelResponse } from "@vercel/node";
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const supabase = getSupabase();

    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing or invalid quote id" });
    }

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .single();

    if (quoteError) throw quoteError;
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const now = new Date().toISOString();

    const { data: acceptedQuote, error: acceptError } = await supabase
      .from("quotes")
      .update({
        status: "accepted",
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (acceptError) throw acceptError;

    const { error: rejectOthersError } = await supabase
      .from("quotes")
      .update({
        status: "rejected",
        updated_at: now,
      })
      .eq("job_id", quote.job_id)
      .neq("id", id);

    if (rejectOthersError) throw rejectOthersError;

    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({
        assigned_to: quote.tradesperson_id,
        status: "assigned",
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", quote.job_id);

    if (jobUpdateError) throw jobUpdateError;

    return res.status(200).json(acceptedQuote);
  } catch (err: any) {
    console.error("Accept quote API error:", err);
    return res.status(500).json({
      error: err.message || "Server error",
    });
  }