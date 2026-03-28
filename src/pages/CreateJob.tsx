import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerHeader from "@/components/layout/CustomerHeader";
import CustomerFooter from "@/components/layout/CustomerFooter";
import AIJobCreator from "@/components/jobs/AIJobCreator";
import { createJob } from "@/services/jobService";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type HeaderUser = {
  name: string;
  email: string;
  avatar?: string;
};

const CreateJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerJobs"] });

      toast.success("Job created successfully", {
        description: "Your job has been saved to the platform.",
      });

      navigate("/dashboard");
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