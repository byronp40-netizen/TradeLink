import { apiRequest } from "../lib/api";
import type { Quote } from "../types";

export type CreateQuoteInput = {
  job_id: string;
  tradesperson_id: string;
  price: number;
  message?: string | null;
};

type QuoteFilters = {
  job_id?: string;
  tradesperson_id?: string;
  status?: string;
};

function toQueryString(filters: QuoteFilters = {}) {
  const params = new URLSearchParams();

  if (filters.job_id) params.set("job_id", filters.job_id);
  if (filters.tradesperson_id) params.set("tradesperson_id", filters.tradesperson_id);
  if (filters.status) params.set("status", filters.status);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getQuotes(filters: QuoteFilters = {}): Promise<Quote[]> {
  return apiRequest<Quote[]>(`/api/quotes${toQueryString(filters)}`);
}

export async function getQuotesByJobId(jobId: string): Promise<Quote[]> {
  return apiRequest<Quote[]>(`/api/quotes?job_id=${encodeURIComponent(jobId)}`);
}

export async function getQuotesByTradespersonId(
  tradespersonId: string
): Promise<Quote[]> {
  return apiRequest<Quote[]>(
    `/api/quotes?tradesperson_id=${encodeURIComponent(tradespersonId)}`
  );
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  return apiRequest<Quote>("/api/quotes", {
    method: "POST",
    body: input,
  });
}

export async function acceptQuote(quoteId: string): Promise<Quote> {
  return apiRequest<Quote>(`/api/quotes/${quoteId}/accept`, {
    method: "POST",
  });
}

export async function rejectQuote(quoteId: string): Promise<Quote> {
  return apiRequest<Quote>(`/api/quotes/${quoteId}/reject`, {
    method: "POST",
  });
}