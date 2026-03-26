import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getAllJobs, updateJob } from "@/services/jobService";
import { getContractorProfileById } from "@/services/contractorProfileService";
import { createQuote, getQuotesByTradespersonId } from "@/services/quoteService";
import type { ContractorProfile, Job, Quote } from "@/types";

type SignedInContractor = {
  id: string;
  email: string;
  name: string;
};

export default function ContractorDashboard() {

  const queryClient = useQueryClient();

  const [contractorUser, setContractorUser] = useState<SignedInContractor | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, { price: string; message: string }>>({});

  useEffect(() => {
    async function loadUser() {

      try {

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          setContractorUser(null);
          return;
        }

        setContractorUser({
          id: user.id,
          email: user.email || "",
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Contractor",
        });

      } catch (err) {

        console.error("Failed to load contractor user:", err);
        setContractorUser(null);

      } finally {

        setLoadingAuth(false);

      }
    }

    loadUser();
  }, []);

  const contractorProfileQuery = useQuery<ContractorProfile>({
    queryKey: ["contractorProfile", contractorUser?.id],
    queryFn: () => getContractorProfileById(contractorUser!.id),
    enabled: !!contractorUser?.id,
  });

  const jobsQuery = useQuery<Job[]>({
    queryKey: ["openJobsForTrade", contractorProfileQuery.data?.primary_trade],
    queryFn: () =>
      getAllJobs({
        status: "open",
        primary_trade: contractorProfileQuery.data?.primary_trade || undefined,
      }),
    enabled: !!contractorProfileQuery.data?.primary_trade,
  });

  const assignedJobsQuery = useQuery<Job[]>({
    queryKey: ["assignedJobs", contractorUser?.id],
    queryFn: () => getAllJobs({ assigned_to: contractorUser!.id }),
    enabled: !!contractorUser?.id,
  });

  const myQuotesQuery = useQuery<Quote[]>({
    queryKey: ["myQuotes", contractorUser?.id],
    queryFn: () => getQuotesByTradespersonId(contractorUser!.id),
    enabled: !!contractorUser?.id,
  });

  const acceptJobMutation = useMutation({

    mutationFn: async (jobId: string) => {

      if (!contractorUser?.id) {
        throw new Error("No contractor ID available");
      }

      return updateJob(jobId, {
        status: "assigned",
        assigned_to: contractorUser.id,
        accepted_at: new Date().toISOString(),
      });

    },

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ["openJobsForTrade"] });
      queryClient.invalidateQueries({ queryKey: ["assignedJobs"] });
      setErrorMessage("");

    },

    onError: (error: Error) => {
      setErrorMessage(error.message);
    },

  });

  const createQuoteMutation = useMutation({

    mutationFn: async (input: {
      job_id: string;
      price: number;
      message: string;
    }) => {

      if (!contractorUser?.id) {
        throw new Error("No contractor ID available");
      }

      return createQuote({
        job_id: input.job_id,
        tradesperson_id: contractorUser.id,
        price: input.price,
        message: input.message,
      });

    },

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ["myQuotes"] });
      setErrorMessage("");

    },

    onError: (error: Error) => {
      setErrorMessage(error.message);
    },

  });

  const availableJobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const assignedJobs = useMemo(() => assignedJobsQuery.data ?? [], [assignedJobsQuery.data]);
  const myQuotes = useMemo(() => myQuotesQuery.data ?? [], [myQuotesQuery.data]);

  const quotedJobIds = new Set(myQuotes.map((quote) => quote.job_id));

  if (loadingAuth) {
    return <div className="p-6">Loading contractor dashboard...</div>;
  }

  if (!contractorUser) {
    return <div className="p-6">You must be signed in to view this page.</div>;
  }

  if (contractorProfileQuery.isLoading) {
    return <div className="p-6">Loading contractor profile...</div>;
  }

  if (contractorProfileQuery.isError || !contractorProfileQuery.data) {
    return <div className="p-6">Could not load contractor profile for this user.</div>;
  }

  const contractorProfile = contractorProfileQuery.data;

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        <div className="bg-white rounded-xl shadow-sm border p-6">

          <h1 className="text-3xl font-bold">Contractor Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome, {contractorUser.name}</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="text-slate-500">Business</div>
              <div className="font-medium">{contractorProfile.business_name || "Not set"}</div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="text-slate-500">Primary Trade</div>
              <div className="font-medium">{contractorProfile.primary_trade}</div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="text-slate-500">County</div>
              <div className="font-medium">{contractorProfile.county || "Not set"}</div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
