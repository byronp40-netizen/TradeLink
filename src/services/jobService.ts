import { apiRequest } from "../lib/api";
import type { Job, JobStatus } from "../types";

export type CreateJobInput = {
  title: string;
  description?: string | null;
  customer_id?: string | null;
  trade_type?: string | null;
  suggested_trades?: string[] | null;
  primary_trade?: string | null;
  location?: string | null;
  budget?: number | null;
  status?: JobStatus;
};

export type UpdateJobInput = Partial<CreateJobInput> & {
  assigned_to?: string | null;
  accepted_at?: string | null;
};

type JobListFilters = {
  customer_id?: string;
  assigned_to?: string;
  status?: string;
  primary_trade?: string;
  limit?: number;
};

function toQueryString(filters: JobListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.customer_id) params.set("customer_id", filters.customer_id);
  if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);
  if (filters.status) params.set("status", filters.status);
  if (filters.primary_trade) params.set("primary_trade", filters.primary_trade);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getAllJobs(filters: JobListFilters = {}): Promise<Job[]> {
  return apiRequest<Job[]>(`/api/jobs${toQueryString(filters)}`);
}

export async function getJobById(id: string): Promise<Job> {
  return apiRequest<Job>(`/api/jobs/${id}`);
}

export async function getJobsByCustomerId(customerId: string): Promise<Job[]> {
  return apiRequest<Job[]>(
    `/api/jobs${toQueryString({ customer_id: customerId })}`
  );
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  return apiRequest<Job>("/api/jobs", {
    method: "POST",
    body: input,
  });
}

export async function updateJob(
  jobId: string,
  updates: UpdateJobInput
): Promise<Job> {
  return apiRequest<Job>(`/api/jobs/${jobId}`, {
    method: "PATCH",
    body: updates,
  });
}

export async function deleteJob(jobId: string): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`/api/jobs/${jobId}`, {
    method: "DELETE",
  });
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus
): Promise<Job> {
  return updateJob(jobId, { status });
}

export async function selectQuoteForJob(
  _jobId: string,
  _quoteId: string
): Promise<Job> {
  throw new Error(
    "selectQuoteForJob is not implemented yet. We will add this when we wire the quotes flow."
  );
}

export async function analyzeJobDescription(description: string): Promise<{
  recommendedTrades: string[];
  confidence: number;
  reasoning: string;
  title?: string;
  parsed?: unknown;
}> {
  const result = await apiRequest<{
    ok: boolean;
    parsed: {
      title?: string;
      description?: string;
      trade_types?: string[];
      confidence?: number;
      tags?: string[];
    };
    model_text?: string;
  }>("/api/ai/parse-job", {
    method: "POST",
    body: { text: description },
  });

  return {
    recommendedTrades: result.parsed?.trade_types ?? [],
    confidence: result.parsed?.confidence ?? 0,
    reasoning:
      result.parsed?.trade_types && result.parsed.trade_types.length > 0
        ? `Suggested trades: ${result.parsed.trade_types.join(", ")}`
        : "No trade recommendation returned.",
    title: result.parsed?.title,
    parsed: result.parsed,
  };
}