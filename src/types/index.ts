export type UserType = 'customer' | 'tradesperson';

export type TradeCategory = 
  | 'Plumbing'
  | 'Electrical'
  | 'Carpentry'
  | 'Painting & Decorating'
  | 'Building & Construction'
  | 'Roofing'
  | 'Heating & Gas'
  | 'Plastering'
  | 'Tiling'
  | 'Landscaping'
  | 'Glazing';

export type JobStatus = 
  | 'draft'
  | 'pending_quotes'
  | 'quotes_received'
  | 'contractor_selected'
  | 'in_progress'
  | 'completed'
  | 'reviewed';

export type UrgencyLevel = 'emergency' | 'urgent' | 'normal' | 'flexible';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: UserType;
  avatar?: string;
  trades?: TradeCategory[];
  county?: string;
  rating?: number;
  completedJobs?: number;
  createdAt: Date;
}

export interface Job {
  id: string;
  customerId: string;
  title: string;
  description: string;
  originalDescription: string;
  tradeCategories: TradeCategory[];
  status: JobStatus;
  urgency: UrgencyLevel;
  county: string;
  eircode?: string;
  address: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  selectedQuoteId?: string;
  preferredStartDate?: Date;
  estimatedDuration?: string;
}

export interface Quote {
  id: string;
  jobId: string;
  tradespersonId: string;
  amount: number;
  currency: string;
  description: string;
  estimatedDuration: string;
  startDate: Date;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface Message {
  id: string;
  jobId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface AIAnalysis {
  recommendedTrades: TradeCategory[];
  confidence: number;
  reasoning: string;
  suggestedQuestions: string[];
}
