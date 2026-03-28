import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  getJobById,
  deleteJob,
  updateJobStatus,
} from "@/services/jobService";
import { getQuotesByJobId } from "@/services/quoteService";
import type { Job, Quote } from "@/types";
import { toast } from "sonner";

function canEditJob(job: Job) {
  return job.status !== "assigned" && job.status !== "completed";
}

function canDeleteJob(job: Job) {
  return job.status !== "assigned" && job.status !== "completed";
}

function canMarkCompleted(job: Job) {
  return job.status === "assigned";
}

function getProgressLabel(job: Job, quoteCount: number) {
  if (job.status === "assigned") return "Assigned";
  if (job.status === "completed") return "Completed";
  if (quoteCount > 0) return "Quotes Received";
  return "Awaiting Quotes";
}

function getProgressClass(job: Job, quoteCount: number) {
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

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  const jobQuery = useQuery<Job>({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId!),
    enabled: !!jobId,
  });

  const quotesQuery = useQuery<Quote[]>({
    queryKey: ["quotes", jobId],
    queryFn: () => getQuotesByJobId(jobId!),
    enabled: !!jobId,
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) {
        throw new Error("Missing job ID");
      }

      return deleteJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerJobs"] });

      toast.success("Job deleted", {
        description: "The job has been removed successfully.",
      });

      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete job", {
        description: error.message,
      });
    },
  });

  const completeJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) {
        throw new Error("Missing job ID");
      }

      return updateJobStatus(jobId, "completed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerJobs"] });

      toast.success("Job marked as completed", {
        description: "This job has now been marked as completed.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update job", {
        description: error.message,
      });
    },
  });

  const quotes = useMemo(() => quotesQuery.data ?? [], [quotesQuery.data]);

  const quoteCount = quotes.length;

  const acceptedQuote = useMemo(
    () => quotes.find((quote) => quote.status === "accepted"),
    [quotes]
  );

  const lowestQuote = useMemo(() => {
    const numericPrices = quotes
      .map((quote) =>
        quote.price !== null && quote.price !== undefined
          ? Number(quote.price)
          : null
      )
      .filter((price): price is number => price !== null && Number.isFinite(price));

    if (numericPrices.length === 0) return null;

    return Math.min(...numericPrices);
  }, [quotes]);

  function handleDelete(currentJob: Job) {
    if (!canDeleteJob(currentJob)) {
      toast.error("This job cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentJob.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteJobMutation.mutate();
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">You must be signed in to view this job.</div>;
  }

  if (jobQuery.isLoading) {
    return <div className="p-6">Loading job...</div>;
  }

  if (jobQuery.isError || !jobQuery.data) {
    return <div className="p-6">Could not load the selected job.</div>;
  }

  const job = jobQuery.data;

  if (job.customer_id && job.customer_id !== user.id) {
    return <div className="p-6">You do not have permission to view this job.</div>;
  }

  const progressLabel = getProgressLabel(job, quoteCount);
  const progressClass = getProgressClass(job, quoteCount);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${progressClass}`}
            >
              {progressLabel}
            </span>
          </div>

          <p className="text-slate-600">
            Review your job details, quote activity, and available actions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Job Summary</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <span className="font-medium text-slate-800">Description:</span>{" "}
                  {job.description || "No description"}
                </div>

                <div>
                  <span className="font-medium text-slate-800">Status:</span>{" "}
                  {job.status}
                </div>

                <div>
                  <span className="font-medium text-slate-800">Primary trade:</span>{" "}
                  {job.primary_trade || "Not set"}
                </div>

                <div>
                  <span className="font-medium text-slate-800">Location:</span>{" "}
                  {job.location || "Not set"}
                </div>

                <div>
                  <span className="font-medium text-slate-800">Budget:</span>{" "}
                  {job.budget !== null && job.budget !== undefined
                    ? `€${job.budget}`
                    : "Not set"}
                </div>

                <div>
                  <span className="font-medium text-slate-800">Created:</span>{" "}
                  {job.created_at
                    ? new Date(job.created_at).toLocaleString()
                    : "Not set"}
                </div>

                <div>
                  <span className="font-medium text-slate-800">Accepted at:</span>{" "}
                  {job.accepted_at
                    ? new Date(job.accepted_at).toLocaleString()
                    : "Not set"}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Quote Summary</h2>

              {quotesQuery.isLoading ? (
                <div className="mt-4 text-sm text-slate-600">Loading quotes...</div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div>
                    <span className="font-medium text-slate-800">Quotes received:</span>{" "}
                    {quoteCount}
                  </div>

                  <div>
                    <span className="font-medium text-slate-800">Accepted quote:</span>{" "}
                    {acceptedQuote ? "Yes" : "No"}
                  </div>

                  <div>
                    <span className="font-medium text-slate-800">Lowest quote:</span>{" "}
                    {lowestQuote !== null ? `€${lowestQuote}` : "Not available"}
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/jobs/${job.id}/quotes`}
                      className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      {quoteCount > 0 ? "View Quotes" : "Check Quotes"}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Actions</h2>

              <div className="mt-4 flex flex-col gap-3">
                {canEditJob(job) && (
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job.id}/edit`)}
                    className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Edit Job
                  </button>
                )}

                {canDeleteJob(job) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(job)}
                    disabled={deleteJobMutation.isPending}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
                  </button>
                )}

                {canMarkCompleted(job) && (
                  <button
                    type="button"
                    onClick={() => completeJobMutation.mutate()}
                    disabled={completeJobMutation.isPending}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {completeJobMutation.isPending
                      ? "Updating..."
                      : "Mark Completed"}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Status Guide</h2>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div>
                  <span className="font-medium text-slate-800">Awaiting Quotes:</span>{" "}
                  No contractor quotes yet.
                </div>
                <div>
                  <span className="font-medium text-slate-800">Quotes Received:</span>{" "}
                  One or more contractors have quoted.
                </div>
                <div>
                  <span className="font-medium text-slate-800">Assigned:</span>{" "}
                  You accepted a contractor quote.
                </div>
                <div>
                  <span className="font-medium text-slate-800">Completed:</span>{" "}
                  The job has been marked complete.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
