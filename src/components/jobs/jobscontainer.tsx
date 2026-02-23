import React, { useEffect, useState, useCallback } from "react";
import type { Job } from "@/types";
import JobList from "./JobList";
import AIJobCreator from "./AIjobcreator"; // adjust path/casing if needed

export default function JobsContainer() {
const [jobs, setJobs] = useState<Job[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [refreshKey, setRefreshKey] = useState(0);

const loadJobs = useCallback(async () => {
setLoading(true);
setError(null);
try {
const res = await fetch("/api/jobs");
if (!res.ok) {
const body = await res.json().catch(() => ({}));
throw new Error(body?.error || `HTTP ${res.status}`);
}
const data = await res.json();
// data might be array or { data: [...] } depending how the API returns it
setJobs(Array.isArray(data) ? data : data?.data || []);
} catch (err: any) {
console.error("Failed to load jobs", err);
setError(err?.message || "Failed to load jobs");
} finally {
setLoading(false);
}
}, []);

useEffect(() => {
loadJobs();
}, [loadJobs, refreshKey]);

// callback passed to AIJobCreator so it triggers a reload after creation
const handleCreated = useCallback(() => {
setRefreshKey(k => k + 1);
}, []);

return (
<div style={{ padding: 16 }}>
<AIJobCreator onCreated={handleCreated} />
<div style={{ marginTop: 20 }}>
{loading && <div>Loading jobs…</div>}
{error && <div style={{ color: "crimson" }}>{error}</div>}

<JobList jobs={jobs} emptyMessage="No jobs yet — create one above" />
</div>
</div>
);
}