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
      const { job_id, user_id } = req.query;

      if (!job_id || typeof job_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid job_id" });
      }

      if (!user_id || typeof user_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid user_id" });
      }

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, customer_id, assigned_to")
        .eq("id", job_id)
        .single();

      if (jobError) throw jobError;

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const allowed =
        user_id === job.customer_id || user_id === job.assigned_to;

      if (!allowed) {
        return res.status(403).json({ error: "You are not allowed to view messages for this job" });
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", job_id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return res.status(200).json(data || []);
    }

    if (req.method === "POST") {
      const { job_id, sender_id, recipient_id, body } = req.body || {};

      if (!job_id || typeof job_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid job_id" });
      }

      if (!sender_id || typeof sender_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid sender_id" });
      }

      if (!recipient_id || typeof recipient_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid recipient_id" });
      }

      if (!body || typeof body !== "string" || !body.trim()) {
        return res.status(400).json({ error: "Message body is required" });
      }

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, customer_id, assigned_to")
        .eq("id", job_id)
        .single();

      if (jobError) throw jobError;

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (!job.assigned_to) {
        return res.status(400).json({ error: "Messaging is only available once a contractor has been assigned" });
      }

      const senderAllowed =
        sender_id === job.customer_id || sender_id === job.assigned_to;

      const recipientAllowed =
        recipient_id === job.customer_id || recipient_id === job.assigned_to;

      if (!senderAllowed || !recipientAllowed) {
        return res.status(403).json({ error: "Sender or recipient is not allowed for this job" });
      }

      const validPair =
        (sender_id === job.customer_id && recipient_id === job.assigned_to) ||
        (sender_id === job.assigned_to && recipient_id === job.customer_id);

      if (!validPair) {
        return res.status(400).json({ error: "Invalid sender/recipient combination for this job" });
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          job_id,
          sender_id,
          recipient_id,
          body: body.trim(),
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("Messages API error:", err);
    return res.status(500).json({
      error: err.message || "Server error",
    });
  }
}