import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getAllJobs, updateJob } from "@/services/jobService";
import { getContractorProfileById } from "@/services/contractorProfileService";
import type { ContractorProfile, Job } from "@/types";

const TEMP_TEST_CONTRACTOR_ID = "ef0aeb9a-0ab6-4552-abee-40b9c09d3a41";

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

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
          setContractorUser({
            id: user.id,
            email: user.email || "",
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Contractor",
          });
          return;
        }

        if (TEMP_TEST_CONTRACTOR_ID) {
          setContractorUser({
            id: TEMP_TEST_CONTRACTOR_ID,
            email: "contractor@test.local",
            name: "Test Contractor",
          });
          return;
        }

        setContractorUser(null);
      } catch (err) {
        console.error("Failed to load contractor user:", err);

        if (TEMP_TEST_CONTRACTOR_ID) {
          setContractorUser({
            id: TEMP_TEST_CONTRACTOR_ID,
            email: "contractor@test.local",
            name: "Test Contractor",
          });
        } else {
          setContractorUser(null);
        }
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

  const availableJobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const assignedJobs = useMemo(() => assignedJobsQuery.data ?? [], [assignedJobsQuery.data]);

  if (loadingAuth) {
    return <div className="p-6">Loading contractor dashboard...</div>;
  }

  if (!contractorUser) {
    return <div className="p-6">No contractor user found.</div>;
  }

  if (contractorProfileQuery.isLoading) {
    return <div className="p-6">Loading contractor profile...</div>;
  }

  if (contractorProfileQuery.isError || !contractorProfileQuery.data) {
    return <div className="p-6">Could not load contractor profile for this user ID.</div>;
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

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Jobs</h2>

          {jobsQuery.isLoading ? (
            <div className="bg-white rounded-xl border p-6">Loading jobs...</div>
          ) : availableJobs.length === 0 ? (
            <div className="bg-white rounded-xl border p-6">No open jobs found for your primary trade.</div>
          ) : (
            <div className="grid gap-4">
              {availableJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <p className="text-slate-600 mt-1">{job.description || "No description"}</p>

                      <div className="mt-3 text-sm text-slate-500 space-y-1">
                        <div>Status: {job.status}</div>
                        <div>Primary trade: {job.primary_trade || "Not set"}</div>
                        <div>Location: {job.location || "Not set"}</div>
                        <div>
                          Budget: {job.budget !== null && job.budget !== undefined ? `€${job.budget}` : "Not set"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => acceptJobMutation.mutate(job.id)}
                      disabled={acceptJobMutation.isPending}
                      className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      Accept Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">My Assigned Jobs</h2>

          {assignedJobsQuery.isLoading ? (
            <div className="bg-white rounded-xl border p-6">Loading assigned jobs...</div>
          ) : assignedJobs.length === 0 ? (
            <div className="bg-white rounded-xl border p-6">You have no assigned jobs yet.</div>
          ) : (
            <div className="grid gap-4">
              {assignedJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border p-5 shadow-sm">
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="text-slate-600 mt-1">{job.description || "No description"}</p>

                  <div className="mt-3 text-sm text-slate-500 space-y-1">
                    <div>Status: {job.status}</div>
                    <div>Location: {job.location || "Not set"}</div>
                    <div>
                      Accepted at: {job.accepted_at ? new Date(job.accepted_at).toLocaleString() : "Not set"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}