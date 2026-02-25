// src/pages/ContractorDashboard.tsx
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON || process.env.VITE_SUPABASE_ANON || process.env.SUPABASE_ANON_KEY;

// You probably already have a single shared supabase client in your app.
// If so, import that instead of creating a new client here.
const supabase = createClient(String(SUPABASE_URL), String(SUPABASE_ANON));

type Job = {
  id: string;
  title: string;
  description?: string;
  suggested_trades?: string[];
  primary_trade?: string;
  location?: string;
  budget?: number;
  status?: string;
  created_at?: string;
};

const ContractorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadProfileAndJobs();
    // Optionally subscribe to real-time changes with supabase.channel for jobs table updates
    // return unsubscribe
  }, []);

  async function loadProfileAndJobs() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError("Not signed in");
        setLoading(false);
        return;
      }

      const userId = user.id;

      // load contractor profile
      const { data: prof, error: profErr } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profErr) {
        // If no profile exists, prof will be null
        setProfile(null);
        console.warn("No contractor profile found:", profErr.message || profErr);
      } else {
        setProfile(prof);
      }

      // Build trades to match
      const tradesToMatch: string[] = [];
      if (prof?.primary_trade) tradesToMatch.push(prof.primary_trade);
      if (Array.isArray(prof?.secondary_trades)) tradesToMatch.push(...prof.secondary_trades);

      // If no profile/trades, optionally show empty state
      if (tradesToMatch.length === 0) {
        // If there is no profile/trades, show all open jobs or instruct to create profile
        const { data: allJobs, error: allErr } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(200);

        if (allErr) throw allErr;
        setJobs(allJobs || []);
        setLoading(false);
        return;
      }

      // Query jobs where status=open AND suggested_trades overlaps tradesToMatch
      const { data: matchedJobs, error: jobsErr } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .overlaps("suggested_trades", tradesToMatch) // uses Postgres && operator
        .order("created_at", { ascending: false })
        .limit(200);

      if (jobsErr) throw jobsErr;
      setJobs(matchedJobs || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  async function acceptJob(jobId: string) {
    setAcceptingJobId(jobId);
    setError(null);
    try {
      const { data, error } = await fetch("/api/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          contractorId: (await supabase.auth.getUser()).data.user?.id,
        }),
      }).then((r) => r.json());

      if (data?.error || data?.status === "error") {
        throw new Error(data?.error || "Could not accept job");
      }

      // Quick refresh
      await loadProfileAndJobs();
    } catch (err: any) {
      console.error("Accept job failed:", err);
      setError(err?.message || "Failed to accept job");
    } finally {
      setAcceptingJobId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-lg font-semibold mb-4">Contractor Dashboard</h2>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : (
        <>
          {!profile && (
            <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-100 p-3">
              <strong>No contractor profile found.</strong> Please complete your contractor profile to get trade-specific job matches.
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="text-slate-600">No open jobs found for your trades right now.</div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-md p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-md font-semibold">{job.title}</h3>
                      <div className="text-sm text-slate-600">{job.location || "Location not specified"}</div>
                    </div>
                    <div className="text-sm text-slate-500">{new Date(job.created_at).toLocaleString()}</div>
                  </div>

                  <p className="mt-2 text-sm text-slate-700">{job.description}</p>

                  {Array.isArray(job.suggested_trades) && job.suggested_trades.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {job.suggested_trades.map((t) => (
                        <span key={t} className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700 border">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => acceptJob(job.id)}
                      disabled={acceptingJobId === job.id}
                      className="rounded-md bg-sky-600 px-3 py-2 text-white text-sm font-medium hover:bg-sky-700"
                    >
                      {acceptingJobId === job.id ? "Accepting…" : "Accept job"}
                    </button>

                    <button
                      onClick={() => navigator.clipboard.writeText(window.location.href + `/jobs/${job.id}`)}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractorDashboard;