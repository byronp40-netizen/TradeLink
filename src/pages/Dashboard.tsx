import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getJobsByCustomerId } from "@/services/jobService";
import type { Job } from "@/types";

const TEMP_TEST_CUSTOMER_ID = "832efb7e-5cf5-4ad4-a39b-bde7d53b42e4";

type SignedInCustomer = {
  id: string;
  email: string;
  name: string;
};

export default function Dashboard() {
  const [customerUser, setCustomerUser] = useState<SignedInCustomer | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
          setCustomerUser({
            id: user.id,
            email: user.email || "",
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Customer",
          });
          return;
        }

        if (TEMP_TEST_CUSTOMER_ID) {
          setCustomerUser({
            id: TEMP_TEST_CUSTOMER_ID,
            email: "customer@test.local",
            name: "Test Customer",
          });
          return;
        }

        setCustomerUser(null);
      } catch (err) {
        console.error("Failed to load customer user:", err);

        if (TEMP_TEST_CUSTOMER_ID) {
          setCustomerUser({
            id: TEMP_TEST_CUSTOMER_ID,
            email: "customer@test.local",
            name: "Test Customer",
          });
        } else {
          setCustomerUser(null);
        }
      } finally {
        setLoadingAuth(false);
      }
    }

    loadUser();
  }, []);

  const customerJobsQuery = useQuery<Job[]>({
    queryKey: ["customerJobs", customerUser?.id],
    queryFn: () => getJobsByCustomerId(customerUser!.id),
    enabled: !!customerUser?.id,
  });

  const jobs = useMemo(() => customerJobsQuery.data ?? [], [customerJobsQuery.data]);

  if (loadingAuth) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (!customerUser) {
    return <div className="p-6">No customer user found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome, {customerUser.name}</p>

          <div className="mt-4">
            <Link
              to="/create-job"
              className="inline-flex rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Create New Job
            </Link>
          </div>
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
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <p className="text-slate-600 mt-1">
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
                        View Quotes
                      </Link>
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
