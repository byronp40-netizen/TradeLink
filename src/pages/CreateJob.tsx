import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerHeader from "@/components/layout/CustomerHeader";
import CustomerFooter from "@/components/layout/CustomerFooter";
import AIJobCreator from "@/components/jobs/AIJobCreator";
import { createJob } from "@/services/jobService";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type HeaderUser = {
  name: string;
  email: string;
  avatar?: string;
};

const TEMP_TEST_CUSTOMER_ID =
  "832efb7e-5cf5-4ad4-a39b-bde7d53b42e4";

const CreateJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [headerUser, setHeaderUser] = useState<HeaderUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
          setAuthUserId(user.id);

          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User";

          setHeaderUser({
            name: fullName,
            email: user.email || "",
            avatar: user.user_metadata?.avatar_url || undefined,
          });

          return;
        }

        // Temporary fallback until proper sign-in is built
        if (TEMP_TEST_CUSTOMER_ID && TEMP_TEST_CUSTOMER_ID !== "832efb7e-5cf5-4ad4-a39b-bde7d53b42e4") {
          setAuthUserId(TEMP_TEST_CUSTOMER_ID);
          setHeaderUser({
            name: "Test Customer",
            email: "test@local.dev",
          });
          return;
        }

        setAuthUserId(null);
        setHeaderUser(null);
      } catch (err) {
        console.error("Failed to load signed-in user:", err);

        if (TEMP_TEST_CUSTOMER_ID && TEMP_TEST_CUSTOMER_ID !== "832efb7e-5cf5-4ad4-a39b-bde7d53b42e4") {
          setAuthUserId(TEMP_TEST_CUSTOMER_ID);
          setHeaderUser({
            name: "Test Customer",
            email: "test@local.dev",
          });
        } else {
          setAuthUserId(null);
          setHeaderUser(null);
        }
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerJobs"] });

      toast.success("Job created successfully", {
        description: "Your job has been saved to the platform.",
      });

      navigate(`/jobs/${newJob.id}`);
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
    if (!authUserId) {
      toast.error("No customer ID available. Add a temporary test profile ID or build sign-in.");
      return;
    }

    createJobMutation.mutate({
      title: jobData.title,
      description: jobData.description,
      customer_id: authUserId,
      trade_type: jobData.primary_trade,
      suggested_trades: jobData.suggested_trades,
      primary_trade: jobData.primary_trade,
      location: jobData.location,
      budget: jobData.budget,
      status: "open",
    });
  };

  if (loadingUser) {
    return <div className="p-6">Loading...</div>;
  }

  if (!headerUser) {
    return (
      <div className="p-6">
        No signed-in user found. Add a temporary test profile ID in
        <code className="mx-1">CreateJob.tsx</code>
        or build the sign-in flow first.
      </div>
    );
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