import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getJobById, updateJob } from "@/services/jobService";
import type { Job } from "@/types";
import { toast } from "sonner";

type EditJobForm = {
  title: string;
  description: string;
  primary_trade: string;
  location: string;
  budget: string;
};

function canEditJob(job: Job) {
  return job.status !== "assigned" && job.status !== "completed";
}

export default function EditJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  const [form, setForm] = useState<EditJobForm>({
    title: "",
    description: "",
    primary_trade: "",
    location: "",
    budget: "",
  });

  const jobQuery = useQuery<Job>({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId!),
    enabled: !!jobId,
  });

  useEffect(() => {
    if (!jobQuery.data) return;

    setForm({
      title: jobQuery.data.title || "",
      description: jobQuery.data.description || "",
      primary_trade: jobQuery.data.primary_trade || "",
      location: jobQuery.data.location || "",
      budget:
        jobQuery.data.budget !== null && jobQuery.data.budget !== undefined
          ? String(jobQuery.data.budget)
          : "",
    });
  }, [jobQuery.data]);

  const updateJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) {
        throw new Error("Missing job ID");
      }

      const parsedBudget =
        form.budget.trim() === "" ? null : Number(form.budget.trim());

      if (parsedBudget !== null && !Number.isFinite(parsedBudget)) {
        throw new Error("Budget must be a valid number.");
      }

      return updateJob(jobId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        primary_trade: form.primary_trade.trim().toLowerCase() || null,
        trade_type: form.primary_trade.trim().toLowerCase() || null,
        location: form.location.trim() || null,
        budget: parsedBudget,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerJobs"] });

      toast.success("Job updated successfully", {
        description: "Your job changes have been saved.",
      });

      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast.error("Failed to update job", {
        description: error.message,
      });
    },
  });

  function updateField<K extends keyof EditJobForm>(key: K, value: EditJobForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">You must be signed in to edit a job.</div>;
  }

  if (jobQuery.isLoading) {
    return <div className="p-6">Loading job...</div>;
  }

  if (jobQuery.isError || !jobQuery.data) {
    return <div className="p-6">Could not load the selected job.</div>;
  }

  const job = jobQuery.data;

  if (job.customer_id && job.customer_id !== user.id) {
    return <div className="p-6">You do not have permission to edit this job.</div>;
  }

  if (!canEditJob(job)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Job cannot be edited</h1>
            <p className="mt-2 text-slate-600">
              This job can no longer be edited because it has already been assigned or completed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <h1 className="text-3xl font-bold">Edit Job</h1>
          <p className="text-slate-600">
            Update your job details before a contractor is assigned.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateJobMutation.mutate();
          }}
          className="bg-white rounded-xl border p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Example: Kitchen sink leak"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={5}
              placeholder="Describe the job in more detail"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Trade
            </label>
            <input
              type="text"
              value={form.primary_trade}
              onChange={(e) => updateField("primary_trade", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="plumbing"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use the same naming style as matching logic, for example plumbing, electrical, carpentry, roofing.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Galway"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget (€)
            </label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => updateField("budget", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={updateJobMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {updateJobMutation.isPending ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}