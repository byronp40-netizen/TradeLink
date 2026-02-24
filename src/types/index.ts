// src/types/index.ts
export type JobStatus = "open" | "assigned" | "in_progress" | "completed" | "cancelled" | "new" | "pending";

export interface User {
id: string;
full_name?: string | null;
email?: string | null;
role?: "customer" | "tradesperson";
phone?: string | null;
location?: string | null;
bio?: string | null;
created_at?: string | null;
}

export interface Job {
id?: string;
title: string;
description?: string | null;
status?: JobStatus;
created_at?: string | null;
updated_at?: string | null;
customer_id?: string | null;
trade_type?: string | null;
location?: string | null;
budget?: number | null;
}

export interface Quote {
id?: string;
job_id: string;
tradesperson_id: string;
price?: number | null;
message?: string | null;
status?: "pending" | "accepted" | "rejected" | "withdrawn";
created_at?: string | null;
updated_at?: string | null;
}

export interface Message {
id?: string;
job_id: string;
sender_id: string;
recipient_id: string;
body?: string | null;
read?: boolean;
created_at?: string | null;
}