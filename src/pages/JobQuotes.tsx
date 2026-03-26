import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJobById } from "@/services/jobService";
import { acceptQuote, getQuotesByJobId, rejectQuote } from "@/services/quoteService";
import type { Job, Quote } from "@/types";

export default function JobQuotes() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const acceptQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => acceptQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => rejectQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", jobId] });
    },
  });

  const quotes = useMemo(() => quotesQuery.data ?? [], [quotesQuery.data]);

  if (!jobId) {
    return <div className="p-6">Missing job ID.</div>;
  }

  if (jobQuery.isLoading || quotesQuery.isLoading) {
    return <div className="p-6">Loading quotes...</div>;
  }

  if (jobQuery.isError || !jobQuery.data) {
    return <div className="p-6">Could not load job.</div>;
  }

  const job = jobQuery.data;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-md border px-4 py-2 text-sm"
      >
        Back
      </button>

      <div className="bg-white rounded-xl border p-5">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-slate-600 mt-2">{job.description || "No description"}</p>
        <div className="mt-3 text-sm text-slate-500 space-y-1">
          <div>Status: {job.status}</div>
          <div>Primary trade: {job.primary_trade || "Not set"}</div>
          <div>Location: {job.location || "Not set"}</div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Quotes</h2>

        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl border p-5">No quotes yet.</div>
        ) : (
          <div className="grid gap-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">
                      {quote.price !== null && quote.price !== undefined
                        ? `€${quote.price}`
                        : "No price"}
                    </div>
                    <div className="text-sm text-slate-500">
                      Tradesperson ID: {quote.tradesperson_id}
                    </div>
                    <div className="text-sm text-slate-600">
                      {quote.message || "No message"}
                    </div>
                    <div className="text-sm text-slate-500">
                      Status: {quote.status}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => acceptQuoteMutation.mutate(quote.id)}
                      disabled={
                        acceptQuoteMutation.isPending || quote.status === "accepted"
                      }
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Accept Quote
                    </button>

                    <button
                      type="button"
                      onClick={() => rejectQuoteMutation.mutate(quote.id)}
                      disabled={
                        rejectQuoteMutation.isPending || quote.status === "rejected"
                      }
                      className="rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      Reject Quote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}