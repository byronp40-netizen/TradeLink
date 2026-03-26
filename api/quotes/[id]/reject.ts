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

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("quotes")
      .update({
        status: "rejected",
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Reject quote API error:", err);
    return res.status(500).json({
      error: err.message || "Server error",
    });
  }
}