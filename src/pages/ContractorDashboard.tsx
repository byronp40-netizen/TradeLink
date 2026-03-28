import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllJobs, getJobById } from "@/services/jobService";
import { getContractorProfileById } from "@/services/contractorProfileService";
import { createQuote, getQuotesByTradespersonId } from "@/services/quoteService";
import { useAuth } from "@/context/AuthContext";
import type { ContractorProfile, Job, Quote } from "@/types";

function getQuoteStatusClass(status: string) {
  if (status === "accepted") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (status === "rejected" || status === "declined") {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  return "bg-amber-50 text-amber-700 border border-amber-200";
}

function getQuoteStatusLabel(status: string) {
  if (status === "accepted") return "Accepted";
  if (status === "rejected" || status === "declined") return "Rejected";
  return "Pending";
}

type QuoteWithJob = {
  quote: Quote;
  job?: Job;
};

function QuoteStatusCard({
  item,
}: {
  item: QuoteWithJob;
}) {
  const { quote, job } = item;
  const statusClass = getQuoteStatusClass(quote.status);
  const statusLabel = getQuoteStatusLabel(quote.status);

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">
              {job?.title || "Job"}
            </h3>

            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-3 text-sm text-slate-500 space-y-1">
            <div>Location: {job?.location || "Not set"}</div>
            <div>Primary trade: {job?.primary_trade || "Not set"}</div>
            <div>
              Quote price:{" "}
              {quote.price !== null && quote.price !== undefined
                ? `€${quote.price}`
                : "Not set"}
            </div>
            <div>Message: {quote.message || "No message"}</div>
            <div>
              Submitted:{" "}
              {quote.created_at
                ? new Date(quote.created_at).toLocaleString()
                : "Not set"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContractorDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const [errorMessage, setErrorMessage] = useState("");
  const [quoteDrafts, setQuoteDrafts] = useState<
    Record<string, { price: string; message: string }>
  >({});

  const contractorProfileQuery = useQuery<ContractorProfile>({
    queryKey: ["contractorProfile", user?.id],
    queryFn: () => getContractorProfileById(user!.id),
    enabled: !!user?.id,
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
    queryKey: ["assignedJobs", user?.id],
    queryFn: () => getAllJobs({ assigned_to: user!.id }),
    enabled: !!user?.id,
  });

  const myQuotesQuery = useQuery<Quote[]>({
    queryKey: ["myQuotes", user?.id],
    queryFn: () => getQuotesByTradespersonId(user!.id),
    enabled: !!user?.id,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (input: {
      job_id: string;
      price: number;
      message: string;
    }) => {
      if (!user?.id) {
        throw new Error("No contractor ID available");
      }

      return createQuote({
        job_id: input.job_id,
        tradesperson_id: user.id,
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
  const assignedJobs = useMemo(
    () => assignedJobsQuery.data ?? [],
    [assignedJobsQuery.data]
  );
  const myQuotes = useMemo(() => myQuotesQuery.data ?? [], [myQuotesQuery.data]);

  const quotedJobIds = new Set(myQuotes.map((quote) => quote.job_id));

  const pendingQuotes = useMemo(
    () => myQuotes.filter((quote) => quote.status === "pending"),
    [myQuotes]
  );

  const acceptedQuotes = useMemo(
    () => myQuotes.filter((quote) => quote.status === "accepted"),
    [myQuotes]
  );

  const rejectedQuotes = useMemo(
    () =>
      myQuotes.filter(
        (quote) => quote.status === "rejected" || quote.status === "declined"
      ),
    [myQuotes]
  );

  const quoteJobQueries = useQueries({
    queries: myQuotes.map((quote) => ({
      queryKey: ["jobFromQuote", quote.job_id],
      queryFn: () => getJobById(quote.job_id),
      enabled: !!quote.job_id,
    })),
  });

  const quotesWithJobs = useMemo(() => {
    const jobMap: Record<string, Job | undefined> = {};

    myQuotes.forEach((quote, index) => {
      jobMap[quote.job_id] = quoteJobQueries[index]?.data as Job | undefined;
    });

    return {
      pending: pendingQuotes.map((quote) => ({
        quote,
        job: jobMap[quote.job_id],
      })),
      accepted: acceptedQuotes.map((quote) => ({
        quote,
        job: jobMap[quote.job_id],
      })),
      rejected: rejectedQuotes.map((quote) => ({
        quote,
        job: jobMap[quote.job_id],
      })),
    };
  }, [myQuotes, quoteJobQueries, pendingQuotes, acceptedQuotes, rejectedQuotes]);

  function updateQuoteDraft(jobId: string, field: "price" | "message", value: string) {
    setQuoteDrafts((prev) => ({
      ...prev,
      [jobId]: {
        price: prev[jobId]?.price ?? "",
        message: prev[jobId]?.message ?? "",
        [field]: value,
      },
    }));
  }

  function submitQuote(jobId: string) {
    const draft = quoteDrafts[jobId];
    const price = Number(draft?.price);

    if (!Number.isFinite(price)) {
      setErrorMessage("Enter a valid numeric price before submitting a quote.");
      return;
    }

    createQuoteMutation.mutate({
      job_id: jobId,
      price,
      message: draft?.message || "",
    });
  }

  async function handleSignOut() {
    await signOut();
    navigate("/sign-in");
  }

  if (loading) {
    return <div className="p-6">Loading contractor dashboard...</div>;
  }

  if (!user) {
    return <div className="p-6">You must be signed in to view this page.</div>;
  }

  if (contractorProfileQuery.isLoading) {
    return <div className="p-6">Loading contractor profile...</div>;
  }

  if (contractorProfileQuery.isError || !contractorProfileQuery.data) {
    return <div className="p-6">Could not load contractor profile for this user.</div>;
  }

  const contractorProfile = contractorProfileQuery.data;

  if (!contractorProfile.primary_trade) {
    navigate("/complete-contractor-profile");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Contractor Dashboard</h1>
            <p className="text-slate-600 mt-2">Welcome, {user.name}</p>

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

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/edit-contractor-profile")}
              className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800"
            >
              Edit Profile
            </button>

            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Sign Out
            </button>
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
            <div className="bg-white rounded-xl border p-6">
              No open jobs found for your primary trade.
            </div>
          ) : (
            <div className="grid gap-4">
              {availableJobs.map((job) => {
                const alreadyQuoted = quotedJobIds.has(job.id);
                const draft = quoteDrafts[job.id] || { price: "", message: "" };

                return (
                  <div key={job.id} className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <p className="text-slate-600 mt-1">{job.description || "No description"}</p>

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
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <h4 className="font-medium">Submit Quote</h4>

                      {alreadyQuoted ? (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                          You have already submitted a quote for this job.
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Price (€)</label>
                            <input
                              type="number"
                              value={draft.price}
                              onChange={(e) => updateQuoteDraft(job.id, "price", e.target.value)}
                              className="w-full rounded-md border px-3 py-2 text-sm"
                              placeholder="Enter quote amount"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Message</label>
                            <textarea
                              value={draft.message}
                              onChange={(e) => updateQuoteDraft(job.id, "message", e.target.value)}
                              className="w-full rounded-md border px-3 py-2 text-sm"
                              rows={3}
                              placeholder="Add a short note for the customer"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => submitQuote(job.id)}
                            disabled={createQuoteMutation.isPending}
                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Submit Quote
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">My Pending Quotes</h2>

          {myQuotesQuery.isLoading ? (
            <div className="bg-white rounded-xl border p-6">Loading quotes...</div>
          ) : quotesWithJobs.pending.length === 0 ? (
            <div className="bg-white rounded-xl border p-6">
              You have no pending quotes.
            </div>
          ) : (
            <div className="grid gap-4">
              {quotesWithJobs.pending.map((item) => (
                <QuoteStatusCard key={item.quote.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Accepted Quotes</h2>

          {myQuotesQuery.isLoading ? (
            <div className="bg-white rounded-xl border p-6">Loading quotes...</div>
          ) : quotesWithJobs.accepted.length === 0 ? (
            <div className="bg-white rounded-xl border p-6">
              You have no accepted quotes yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {quotesWithJobs.accepted.map((item) => (
                <QuoteStatusCard key={item.quote.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Rejected Quotes</h2>

          {myQuotesQuery.isLoading ? (
            <div className="bg-white rounded-xl border p-6">Loading quotes...</div>
          ) : quotesWithJobs.rejected.length === 0 ? (
            <div className="bg-white rounded-xl border p-6">
              You have no rejected quotes.
            </div>
          ) : (
            <div className="grid gap-4">
              {quotesWithJobs.rejected.map((item) => (
                <QuoteStatusCard key={item.quote.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">My Assigned Jobs</h2>

          {assignedJobsQuery.isLoading ? (
            <div className="bg-white rounded-xl border p-6">Loading assigned jobs...</div>
          ) : assignedJobs.length === 0 ? (
            <div className="bg-white rounded-xl border p-6">
              You have no assigned jobs yet.
            </div>
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
                      Accepted at:{" "}
                      {job.accepted_at
                        ? new Date(job.accepted_at).toLocaleString()
                        : "Not set"}
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