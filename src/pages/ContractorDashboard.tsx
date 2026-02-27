// src/pages/ContractorDashboard.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
    // Optionally subscribe to real-time changes:
    // const subscription = supabase
    //   .channel('public:jobs')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, payload => {
    //     loadJobs(); // re-load or patch state
    //   })
    //   .subscribe();
    //
    // return () => { supabase.removeChannel(subscription); };
  }, []);

  async function loadProfileAndJobs() {
    setLoading(true);
    try {
      // Get current user profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        await loadJobs(null);
        setLoading(false);
        return;
      }

      // If you store profiles in the profiles table:
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileErr) {
        console.warn("Profile fetch error", profileErr);
      } else {
        setProfile(profileData);
      }

      await loadJobs(profileData?.primary_trade ?? null);
    } catch (err: any) {
      console.error(err);
      setError(String(err.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs(tradeFilter: string | null) {
    try {
      let q = supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(200);
      if (tradeFilter) {
        q = q.eq("primary_trade", tradeFilter);
      } else {
        // Optionally: filter to open jobs only
        q = q.eq("status", "open");
      }

      const { data, error } = await q;
      if (error) throw error;
      setJobs(data ?? []);
    } catch (err: any) {
      console.error("loadJobs error", err);
      setError(String(err.message ?? err));
    }
  }

  async function acceptJob(jobId: string) {
    setAcceptingJobId(jobId);
    setError(null);
    try {
      // Get current user id from client auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not signed in");

      const res = await fetch("/api/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          contractorId: user.id,
        }),
      });

      const payload = await res.json();
      if (!res.ok || payload?.error) {
        throw new Error(payload?.error ?? "Failed to accept job");
      }

      // Refresh jobs after accept
      await loadJobs(profile?.primary_trade ?? null);
    } catch (err: any) {
      console.error(err);
      setError(String(err.message ?? err));
    } finally {
      setAcceptingJobId(null);
    }
  }

  if (loading) return <div className="p-6">Loading contractor dashboard…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Contractor Dashboard</h2>
      <p className="text-sm text-slate-600 mb-4">Jobs available{profile?.primary_trade ? ` for ${profile.primary_trade}` : ""}</p>

      {jobs.length === 0 && <div className="text-sm text-slate-500">No jobs currently available.</div>}

      <ul className="space-y-4">
        {jobs.map((job) => (
          <li key={job.id} className="p-4 border rounded">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{job.title}</h3>
                <div className="text-sm text-slate-600">{job.description}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {job.location ? `${job.location} • ` : ""}
                  {job.budget ? `€${job.budget}` : "No budget provided"}
                </div>
                <div className="mt-2">
                  {Array.isArray(job.suggested_trades) && job.suggested_trades.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {job.suggested_trades.map((t) => (
                        <span key={t} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4">
                <button
                  onClick={() => acceptJob(job.id)}
                  disabled={acceptingJobId === job.id}
                  className="px-3 py-2 border rounded bg-white hover:bg-slate-50"
                >
                  {acceptingJobId === job.id ? "Accepting…" : "Accept job"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContractorDashboard;