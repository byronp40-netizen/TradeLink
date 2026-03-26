import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CustomerHeader from "@/components/layout/CustomerHeader";
import CustomerFooter from "@/components/layout/CustomerFooter";
import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import { Button } from "@/components/ui/button";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { getJobById, updateJobStatus } from "@/services/jobService";
import { acceptQuote, getQuotesByJobId, rejectQuote } from "@/services/quoteService";
import { getUserById } from "@/services/userService";
import type { Job, Profile, Quote } from "@/types";

const TEMP_TEST_CUSTOMER = {
id: "832efb7e-5cf5-4ad4-a39b-bde7d53b42e4",
full_name: "Test Customer",
email: "customer@test.local",
role: "customer" as const,
phone: null,
location: null,
bio: null,
created_at: null,
};

const JobDetail = () => {
const { jobId } = useParams<{ jobId: string }>();
const navigate = useNavigate();
const queryClient = useQueryClient();

const user = TEMP_TEST_CUSTOMER;

const { data: job, isLoading: jobLoading } = useQuery<Job>({
queryKey: ["job", jobId],
queryFn: () => getJobById(jobId!),
enabled: !!jobId,
});

const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
queryKey: ["quotes", jobId],
queryFn: () => getQuotesByJobId(jobId!),
enabled: !!jobId,
});

const acceptQuoteMutation = useMutation({
mutationFn: async (quoteId: string) => {
return acceptQuote(quoteId);
},
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ["job", jobId] });
queryClient.invalidateQueries({ queryKey: ["quotes", jobId] });
toast.success("Quote accepted", {
description: "The job has been assigned to the selected tradesperson.",
});
},
onError: (error: Error) => {
toast.error("Failed to accept quote", {
description: error.message,
});
},
});

const rejectQuoteMutation = useMutation({
mutationFn: async (quoteId: string) => {
return rejectQuote(quoteId);
},
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ["quotes", jobId] });
toast.success("Quote rejected");
},
onError: (error: Error) => {
toast.error("Failed to reject quote", {
description: error.message,
});
},
});

const completeJobMutation = useMutation({
mutationFn: () => updateJobStatus(jobId!, "completed"),
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ["job", jobId] });
toast.success("Job marked as completed");
navigate("/dashboard");
},
onError: (error: Error) => {
toast.error("Failed to complete job", {
description: error.message,
});
},
});

const acceptedQuote = useMemo(
() => quotes.find((quote) => quote.status === "accepted"),
[quotes]
);

if (jobLoading || !job) {
return (
<div className="min-h-screen flex flex-col">
<div className="h-16 border-b" />
<div className="container py-8">
<Skeleton className="h-64 w-full" />
</div>
</div>
);
}

return (
<div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
<CustomerHeader user={user} unreadMessages={0} />

<main className="flex-1 container px-4 py-8">
<div className="max-w-6xl mx-auto space-y-6">
<div className="space-y-2">
<Link to="/dashboard">
<Button variant="ghost" size="sm" className="gap-2">
<ArrowLeft className="h-4 w-4" />
Back to Dashboard
</Button>
</Link>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div className="lg:col-span-2 space-y-6">
<Card>
<CardHeader>
<div className="flex items-start justify-between gap-4">
<div className="space-y-2 flex-1">
<CardTitle className="text-2xl">{job.title}</CardTitle>

<div className="flex flex-wrap gap-2">
{job.primary_trade && (
<Badge variant="secondary">{job.primary_trade}</Badge>
)}
{job.suggested_trades?.map((trade) => (
<Badge key={trade} variant="outline">
{trade}
</Badge>
))}
</div>
</div>

<JobStatusBadge status={job.status} />
</div>
</CardHeader>

<CardContent className="space-y-6">
<div>
<h3 className="font-semibold mb-2">Description</h3>
<p className="text-muted-foreground">
{job.description || "No description provided."}
</p>
</div>

<Separator />

<div className="space-y-3">
<div className="flex items-center gap-2 text-sm">
<MapPin className="h-4 w-4 text-muted-foreground" />
<span className="font-medium">Location:</span>
<span className="text-muted-foreground">
{job.location || "Not set"}
</span>
</div>

<div className="flex items-center gap-2 text-sm">
<Calendar className="h-4 w-4 text-muted-foreground" />
<span className="font-medium">Created:</span>
<span className="text-muted-foreground">
{job.created_at
? format(new Date(job.created_at), "MMMM dd, yyyy • h:mm a")
: "Not set"}
</span>
</div>

<div className="flex items-center gap-2 text-sm">
<span className="font-medium">Budget:</span>
<span className="text-muted-foreground">
{job.budget !== null && job.budget !== undefined
? `€${job.budget}`
: "Not set"}
</span>
</div>
</div>

{job.status === "in_progress" && (
<div className="pt-4">
<Button
onClick={() => completeJobMutation.mutate()}
className="w-full"
size="lg"
disabled={completeJobMutation.isPending}
>
<CheckCircle2 className="mr-2 h-4 w-4" />
Mark as Completed
</Button>
</div>
)}
</CardContent>
</Card>

<Card>
<CardHeader>
<CardTitle>Quotes Received ({quotes.length})</CardTitle>
<CardDescription>
Compare quotes and select the best option for your project.
</CardDescription>
</CardHeader>

<CardContent className="space-y-4">
{quotesLoading ? (
<Skeleton className="h-64 w-full" />
) : quotes.length === 0 ? (
<div className="text-sm text-muted-foreground">
No quotes received yet.
</div>
) : (
quotes.map((quote) => (
<QuoteCardWithTrader
key={quote.id}
quote={quote}
isSelected={acceptedQuote?.id === quote.id}
onAccept={(quoteId) => acceptQuoteMutation.mutate(quoteId)}
onReject={(quoteId) => rejectQuoteMutation.mutate(quoteId)}
/>
))
)}
</CardContent>
</Card>
</div>

<div className="space-y-6">
<Card>
<CardHeader>
<CardTitle className="text-lg">Job Timeline</CardTitle>
</CardHeader>

<CardContent>
<div className="space-y-4">
<div className="flex gap-3">
<div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
<CheckCircle2 className="h-4 w-4 text-green-500" />
</div>
<div className="flex-1 space-y-1">
<p className="text-sm font-medium">Job Created</p>
<p className="text-xs text-muted-foreground">
{job.created_at
? format(new Date(job.created_at), "MMM dd, yyyy • h:mm a")
: "Not set"}
</p>
</div>
</div>

{quotes.length > 0 && (
<div className="flex gap-3">
<div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
<CheckCircle2 className="h-4 w-4 text-green-500" />
</div>
<div className="flex-1 space-y-1">
<p className="text-sm font-medium">Quotes Received</p>
<p className="text-xs text-muted-foreground">
{quotes.length} tradespeople responded
</p>
</div>
</div>
)}

{acceptedQuote && (
<div className="flex gap-3">
<div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
<CheckCircle2 className="h-4 w-4 text-green-500" />
</div>
<div className="flex-1 space-y-1">
<p className="text-sm font-medium">Quote Accepted</p>
<p className="text-xs text-muted-foreground">
Job assigned to selected tradesperson
</p>
</div>
</div>
)}

{job.accepted_at && (
<div className="flex gap-3">
<div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
<CheckCircle2 className="h-4 w-4 text-green-500" />
</div>
<div className="flex-1 space-y-1">
<p className="text-sm font-medium">Accepted At</p>
<p className="text-xs text-muted-foreground">
{format(new Date(job.accepted_at), "MMM dd, yyyy • h:mm a")}
</p>
</div>
</div>
)}
</div>
</CardContent>
</Card>
</div>
</div>
</div>
</main>

<CustomerFooter />
</div>
);
};

const QuoteCardWithTrader = ({
quote,
onAccept,
onReject,
isSelected,
}: {
quote: Quote;
onAccept: (id: string) => void;
onReject: (id: string) => void;
isSelected: boolean;
}) => {
const { data: tradesperson, isLoading } = useQuery<Profile>({
queryKey: ["user", quote.tradesperson_id],
queryFn: () => getUserById(quote.tradesperson_id),
});

if (isLoading || !tradesperson) {
return <Skeleton className="h-40 w-full" />;
}

return (
<div className="rounded-xl border p-5 space-y-4">
<div className="flex items-start justify-between gap-4">
<div className="space-y-2">
<div className="text-lg font-semibold">
{quote.price !== null && quote.price !== undefined
? `€${quote.price}`
: "No price"}
</div>

<div className="text-sm text-slate-600">
{tradesperson.full_name || tradesperson.email || "Tradesperson"}
</div>

<div className="text-sm text-muted-foreground">
{quote.message || "No message provided."}
</div>

<div className="text-xs text-muted-foreground">
Status: {quote.status}
</div>
</div>

{isSelected && (
<Badge className="bg-green-600 text-white hover:bg-green-600">
Accepted
</Badge>
)}
</div>

{!isSelected && quote.status !== "rejected" && (
<div className="flex gap-2">
<Button
onClick={() => onAccept(quote.id)}
disabled={quote.status === "accepted"}
>
Accept Quote
</Button>

<Button
variant="outline"
onClick={() => onReject(quote.id)}
>
Reject Quote
</Button>
</div>
)}
</div>
);
};

export default JobDetail;