import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getJobById, updateJob, deleteJob } from "@/services/jobService";
import {
  getJobImages,
  getJobImageSignedUrls,
  uploadJobImage,
  deleteJobImage,
  type JobImage,
} from "@/services/jobImageService";
import type { Job } from "@/types";
import { toast } from "sonner";

type EditJobForm = {
  title: string;
  description: string;
  primary_trade: string;
  location: string;
  budget: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;

function canEditJob(job: Job) {
  return job.status !== "assigned" && job.status !== "completed";
}

function canDeleteJob(job: Job) {
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

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const jobQuery = useQuery<Job>({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId!),
    enabled: !!jobId,
  });

  const jobImagesQuery = useQuery<JobImage[]>({
    queryKey: ["jobImages", jobId],
    queryFn: () => getJobImages(jobId!),
    enabled: !!jobId,
  });

  const jobImageUrlsQuery = useQuery<Record<string, string>>({
    queryKey: ["jobImageUrls", jobId, jobImagesQuery.data],
    queryFn: () => getJobImageSignedUrls(jobImagesQuery.data || []),
    enabled: !!jobImagesQuery.data && jobImagesQuery.data.length > 0,
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

  const existingImages = useMemo(() => jobImagesQuery.data ?? [], [jobImagesQuery.data]);
  const imageUrls = useMemo(() => jobImageUrlsQuery.data ?? {}, [jobImageUrlsQuery.data]);

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

      const updatedJob = await updateJob(jobId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        primary_trade: form.primary_trade.trim().toLowerCase() || null,
        trade_type: form.primary_trade.trim().toLowerCase() || null,
        location: form.location.trim() || null,
        budget: parsedBudget,
      });

      if (selectedImages.length > 0) {
        for (const file of selectedImages) {
          await uploadJobImage(jobId, file);
        }
      }

      return updatedJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerJobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobImages", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobImageUrls", jobId] });

      toast.success("Job updated successfully", {
        description:
          selectedImages.length > 0
            ? "Your job changes and images have been saved."
            : "Your job changes have been saved.",
      });

      navigate(`/jobs/${jobId}`);
    },
    onError: (error: Error) => {
      toast.error("Failed to update job", {
        description: error.message,
      });
    },
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

  const deleteImageMutation = useMutation({
    mutationFn: async ({ imageId, storagePath }: { imageId: string; storagePath: string }) => {
      return deleteJobImage(imageId, storagePath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobImages", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobImageUrls", jobId] });

      toast.success("Image deleted", {
        description: "The image has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete image", {
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

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validImages = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isUnderLimit = file.size <= MAX_IMAGE_SIZE_BYTES;
      return isImage && isUnderLimit;
    });

    if (validImages.length !== files.length) {
      toast.error("Some files were ignored", {
        description: "Only image files up to 5MB are allowed.",
      });
    }

    const remainingSlots = Math.max(0, MAX_IMAGE_COUNT - existingImages.length);

    setSelectedImages((prev) => {
      const combined = [...prev, ...validImages].slice(0, remainingSlots);

      if (prev.length + validImages.length > remainingSlots) {
        toast.error("Image limit reached", {
          description: `You can have up to ${MAX_IMAGE_COUNT} images in total.`,
        });
      }

      return combined;
    });

    e.target.value = "";
  }

  function removeSelectedImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
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

  const totalImageCount = existingImages.length + selectedImages.length;

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
            Update your job details and supporting images before a contractor is assigned.
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

          <div className="space-y-3 border-t pt-4">
            <div>
              <h2 className="text-lg font-semibold">Existing Images</h2>
              <p className="text-sm text-slate-600">
                Remove images you no longer want attached to this job.
              </p>
            </div>

            {jobImagesQuery.isLoading || jobImageUrlsQuery.isLoading ? (
              <div className="text-sm text-slate-600">Loading images...</div>
            ) : existingImages.length === 0 ? (
              <div className="text-sm text-slate-600">No images uploaded yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="rounded-lg border p-3 space-y-3">
                    <img
                      src={imageUrls[image.id]}
                      alt={image.filename}
                      className="w-full rounded-md border object-cover"
                    />
                    <div className="text-xs text-slate-500 break-all">{image.filename}</div>
                    <button
                      type="button"
                      onClick={() =>
                        deleteImageMutation.mutate({
                          imageId: image.id,
                          storagePath: image.storage_path,
                        })
                      }
                      disabled={deleteImageMutation.isPending}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Delete Image
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div>
              <h2 className="text-lg font-semibold">Add New Images</h2>
              <p className="text-sm text-slate-600">
                You can have up to {MAX_IMAGE_COUNT} images in total. Current total: {totalImageCount}
              </p>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm"
            />

            {selectedImages.length > 0 && (
              <div className="space-y-2">
                {selectedImages.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{file.name}</div>
                      <div className="text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSelectedImage(index)}
                      className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
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
          </div>
        </form>
      </div>
    </div>
  );
}