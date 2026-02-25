// api/jobs/accept.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE; // must be set in Vercel envs

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing SUPABASE env vars for accept endpoint");
  // still continue so dev environment can show clearer error
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { jobId, contractorId } = req.body || {};

    if (!jobId || !contractorId) {
      return res.status(400).json({ error: "jobId and contractorId required" });
    }

    // Atomic update: only update when job is still open
    const updates = {
      status: "assigned",
      assigned_to: contractorId,
      accepted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId)
      .eq("status", "open")
      .select()
      .single();

    if (error) {
      // If no rows updated because not open, supabase returns error code or empty; normalize response.
      console.error("Accept job error:", error);
      return res.status(400).json({ error: error.message || "Could not accept job" });
    }

    return res.status(200).json({ success: true, job: data });
  } catch (err) {
    console.error("Accept job server error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}