import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerHeader from "@/components/layout/CustomerHeader";
import CustomerFooter from "@/components/layout/CustomerFooter";
import AIJobCreator from "@/components/jobs/AIJobCreator";
import { createJob } from "@/services/jobService";
import { uploadJobImage } from "@/services/jobImageService";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type HeaderUser = {
  name: string;
  email: string;
  avatar?: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;

const CreateJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const headerUser = useMemo<HeaderUser | null>(() => {
    if (!user) return null;

    return {
      name: user.name,
      email: user.email,
      avatar: undefined,
    };
  }, [user]);

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: async (createdJob) => {
      try {
        if (selectedImages.length > 0) {
          for (const file of selectedImages) {
            await uploadJobImage(createdJob.id, file);
          }
        }

        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        queryClient.invalidateQueries({ queryKey: ["customerJobs"] });
        queryClient.invalidateQueries({ queryKey: ["jobImages", createdJob.id] });

        toast.success("Job created successfully", {
          description:
            selectedImages.length > 0
              ? "Your job and images have been saved."
              : "Your job has been saved to the platform.",
        });

        navigate(`/jobs/${createdJob.id}`);
      } catch (error: any) {
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        queryClient.invalidateQueries({ queryKey: ["customerJobs"] });

        toast.error("Job created, but image upload failed", {
          description: error?.message || "Some images could not be uploaded.",
        });

        navigate(`/jobs/${createdJob.id}`);
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to create job", {
        description: error.message,
      });
    },
  });

  const handleJobComplete = (jobData: {
    title: string;
    description: string;
    suggested_trades: string[];
    primary_trade: string | null;
    location: string | null;
    budget: number | null;
  }) => {
    if (!user?.id) {
      toast.error("You must be signed in to create a job.");
      return;
    }

    createJobMutation.mutate({
      title: jobData.title,
      description: jobData.description,
      customer_id: user.id,
      trade_type: jobData.primary_trade,
      suggested_trades: jobData.suggested_trades,
      primary_trade: jobData.primary_trade,
      location: jobData.location,
      budget: jobData.budget,
      status: "open",
    });
  };

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

    setSelectedImages((prev) => {
      const combined = [...prev, ...validImages].slice(0, MAX_IMAGE_COUNT);

      if (prev.length + validImages.length > MAX_IMAGE_COUNT) {
        toast.error("Image limit reached", {
          description: `You can upload up to ${MAX_IMAGE_COUNT} images.`,
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

  if (!headerUser) {
    return <div className="p-6">You must be signed in to create a job.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <CustomerHeader user={headerUser} unreadMessages={0} />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>

            <h1 className="text-4xl font-bold tracking-tight">Create New Job</h1>
            <p className="text-lg text-muted-foreground">
              Describe the job and let TradeLink suggest the right trade.
            </p>
          </div>

          <AIJobCreator onComplete={handleJobComplete} />

          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Upload images of the issue</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add up to 5 images to help contractors understand the problem.
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

          {createJobMutation.isPending && (
            <p className="text-sm text-slate-500">Creating job...</p>
          )}
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
};

export default CreateJob;