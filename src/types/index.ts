export type JobStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type UserRole = "customer" | "tradesperson";

export type TradeCategory = string;

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  phone: string | null;
  location: string | null;
  bio: string | null;
  created_at: string | null;

  // Temporary compatibility fields for older UI code
  name?: string;
  type?: UserRole;
  avatar?: string;
  county?: string;
  trades?: string[];
  rating?: number;
  completedJobs?: number;
}

export type User = Profile;

export interface ContractorProfile {
  id: string;
  business_name: string | null;
  primary_trade: string;
  secondary_trades: string[] | null;
  county: string | null;
  bio: string | null;
  created_at: string | null;
}

export interface JobImage {
  id: string;
  job_id: string;
  storage_path: string;
  filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  status: JobStatus;
  created_at: string | null;
  updated_at: string | null;
  customer_id: string | null;
  trade_type: string | null;
  location: string | null;
  budget: number | null;
  suggested_trades?: string[] | null;
  primary_trade?: string | null;
  assigned_to?: string | null;
  accepted_at?: string | null;

  // Temporary compatibility fields for older UI code
  customerId?: string;
  originalDescription?: string;
  tradeCategories?: string[];
  urgency?: "low" | "medium" | "high" | "urgent" | "normal";
  county?: string;
  eircode?: string;
  address?: string;
  images?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  selectedQuoteId?: string;
  preferredStartDate?: Date;
  estimatedDuration?: string;
}

export interface Quote {
  id: string;
  job_id: string;
  tradesperson_id: string;
  price: number | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string | null;
  updated_at: string | null;

  // Temporary compatibility fields for older UI code
  contractor_id?: string;
  amount?: number | null;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  recipient_id: string;
  body: string | null;
  read: boolean | null;
  created_at: string | null;

  // Temporary compatibility fields
  is_read?: boolean;
}

export interface Trade {
  id: string;
  slug: string | null;
  display_name: string;
}