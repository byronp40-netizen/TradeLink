import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJobsByCustomerId, deleteJob } from "@/services/jobService";
import { getQuotesByJobId } from "@/services/quoteService";
import { useAuth } from "@/context/AuthContext";
import type { Job, Quote } from "@/types";
import { toast } from "sonner";

function getJobProgressLabel(job: Job, quoteCount: number) {
  if (job.status === "assigned") return "Assigned";
  if (job.status === "completed") return "Completed";
  if (quoteCount > 0) return "Quotes Received";
  return "Awaiting Quotes";
}

function getJobProgressClass(job: Job, quoteCount: number) {
  if (job.status === "assigned") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (job.status === "completed") {
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }
  if (quoteCount > 0) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }
  return "bg-amber-50 text-amber-700 border border-amber-200";
}

function canEditJob(job: Job) {
  return job.status !== "assigned" && job.status !== "completed";
}

function canDeleteJob(job: Job) {
  return job.status !== "assigned" && job.status !== "completed";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading, signOut } = useAuth();

  const customerJobsQuery = useQuery<Job[]>({
    queryKey: ["customerJobs", user?.id],
    queryFn: () => getJobsByCustomerId(user!.id),
    enabled: !!user?.id,
  });

  const jobs = useMemo(() => customerJobsQuery.data ?? [], [customerJobsQuery.data]);

  const quoteQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ["quotesByJob", job.id],
      queryFn: () => getQuotesByJobId(job.id),
      enabled: !!job.id,
    })),
  });

  const quoteCountByJobId = useMemo(() => {
    const map: Record<string, number> = {};

    jobs.forEach((job, index) => {
      const quotes = (quoteQueries[index]?.data as Quote[] | undefined) ?? [];
      map[job.id] = quotes.length;
    });

    return map;
  }, [jobs, quoteQueries]);

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return deleteJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerJobs"] });

      toast.success("Job deleted", {
        description: "The job has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete job", {
        description: error.message,
      });
    },
  });

  async function handleSignOut() {
    await signOut();
    navigate("/sign-in");
  }

  function handleDeleteJob(job: Job) {
    if (!canDeleteJob(job)) {
      toast.error("This job cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${job.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteJobMutation.mutate(job.id);
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="p-6">You must be signed in to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Customer Dashboard</h1>
            <p className="text-slate-600 mt-2">Welcome, {user.name}</p>

            <div className="mt-4">
              <Link
                to="/create-job"
                className="inline-flex rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Create New Job
              </Link>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">My Jobs</h2>

          {customerJobsQuery.isLoading ? (
            <div className="bg-white rounded-xl border p-6">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl border p-6">
              You have not created any jobs yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => {
                const quoteCount = quoteCountByJobId[job.id] ?? 0;
                const progressLabel = getJobProgressLabel(job, quoteCount);
                const progressClass = getJobProgressClass(job, quoteCount);

                return (
                  <div key={job.id} className="bg-white rounded-xl border p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${progressClass}`}
                          >
                            {progressLabel}
                          </span>
                        </div>

                        <p className="text-slate-600 mt-2">
                          {job.description || "No description"}
                        </p>

                        <div className="mt-3 text-sm text-slate-500 space-y-1">
                          <div>Status: {job.status}</div>
                          <div>Primary trade: {job.primary_trade || "Not set"}</div>
                          <div>Location: {job.location || "Not set"}</div>
                          <div>
                            Budget:{" "}
                            {job.budget !== null && job.budget !== undefined
                              ? `€${job.budget}`
                              : "Not set"}
                          </div>
                          <div>Quotes received: {quoteCount}</div>
                          <div>
                            Created:{" "}
                            {job.created_at
                              ? new Date(job.created_at).toLocaleString()
                              : "Not set"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/jobs/${job.id}/quotes`}
                          className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          {quoteCount > 0 ? "View Quotes" : "Check Quotes"}
                        </Link>

                        {canEditJob(job) && (
                          <Link
                            to={`/jobs/${job.id}/edit`}
                            className="inline-flex justify-center rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            Edit Job
                          </Link>
                        )}

                        {canDeleteJob(job) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job)}
                            disabled={deleteJobMutation.isPending}
                            className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            Delete Job
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}