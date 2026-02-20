import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomerHeader from '@/components/layout/CustomerHeader';
import CustomerFooter from '@/components/layout/CustomerFooter';
import QuoteCard from '@/components/quotes/QuoteCard';
import JobStatusBadge from '@/components/jobs/JobStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/services/userService';
import { getJobById, selectQuoteForJob, updateJobStatus } from '@/services/jobService';
import { getQuotesByJobId, updateQuoteStatus } from '@/services/quoteService';
import { getUserById } from '@/services/userService';
import { getUnreadMessageCount } from '@/services/messageService';
import { ArrowLeft, MapPin, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobById(jobId!),
    enabled: !!jobId,
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes', jobId],
    queryFn: () => getQuotesByJobId(jobId!),
    enabled: !!jobId,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: () => getUnreadMessageCount(user!.id),
    enabled: !!user,
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      await updateQuoteStatus(quoteId, 'accepted');
      await selectQuoteForJob(jobId!, quoteId);
      
      // Decline other quotes
      const otherQuotes = quotes.filter(q => q.id !== quoteId);
      await Promise.all(
        otherQuotes.map(q => updateQuoteStatus(q.id, 'declined'))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['quotes', jobId] });
      toast.success('Quote accepted!', {
        description: 'The tradesperson has been notified. They will contact you shortly.',
      });
    },
  });

  const completeJobMutation = useMutation({
    mutationFn: () => updateJobStatus(jobId!, 'completed'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast.success('Job marked as completed!', {
        description: 'Please leave a review for the tradesperson.',
      });
      navigate(`/jobs/${jobId}/review`);
    },
  });

  if (jobLoading || !job || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="h-16 border-b" />
        <div className="container py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const urgencyColors = {
    emergency: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    urgent: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    normal: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    flexible: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <CustomerHeader user={user} unreadMessages={unreadCount} />

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
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {job.tradeCategories.map(trade => (
                          <Badge key={trade} variant="secondary">
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
                    <p className="text-muted-foreground">{job.description}</p>
                  </div>

                  {job.images && job.images.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Photos</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {job.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Job photo ${idx + 1}`}
                            className="rounded-lg border w-full h-48 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Location:</span>
                      <span className="text-muted-foreground">
                        {job.address}, {job.county}
                        {job.eircode && ` (${job.eircode})`}
                      </span>
                    </div>

                    {job.preferredStartDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Preferred Start:</span>
                        <span className="text-muted-foreground">
                          {format(new Date(job.preferredStartDate), 'MMMM dd, yyyy')}
                        </span>
                      </div>
                    )}

                    {job.estimatedDuration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Duration:</span>
                        <span className="text-muted-foreground">{job.estimatedDuration}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Urgency:</span>
                      <Badge variant="outline" className={urgencyColors[job.urgency]}>
                        {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {job.status === 'in_progress' && (
                    <div className="pt-4">
                      <Button 
                        onClick={() => completeJobMutation.mutate()}
                        className="w-full"
                        size="lg"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quotes Section */}
              {quotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quotes Received ({quotes.length})</CardTitle>
                    <CardDescription>
                      Compare quotes and select the best option for your project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quotesLoading ? (
                      <Skeleton className="h-64" />
                    ) : (
                      quotes.map((quote) => (
                        <QuoteCardWithTrader
                          key={quote.id}
                          quote={quote}
                          onAccept={(quoteId) => acceptQuoteMutation.mutate(quoteId)}
                          isSelected={job.selectedQuoteId === quote.id}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
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
                          {format(new Date(job.createdAt), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>

                    {job.status !== 'draft' && job.status !== 'pending_quotes' && (
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

                    {job.selectedQuoteId && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Contractor Selected</p>
                          <p className="text-xs text-muted-foreground">
                            Ready to begin work
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

// Helper component to fetch tradesperson data for each quote
const QuoteCardWithTrader = ({ 
  quote, 
  onAccept, 
  isSelected 
}: { 
  quote: any; 
  onAccept: (id: string) => void;
  isSelected: boolean;
}) => {
  const { data: tradesperson } = useQuery({
    queryKey: ['user', quote.tradespersonId],
    queryFn: () => getUserById(quote.tradespersonId),
  });

  if (!tradesperson) return <Skeleton className="h-64" />;

  return (
    <QuoteCard
      quote={quote}
      tradesperson={tradesperson}
      onAccept={onAccept}
      isSelected={isSelected}
    />
  );
};

export default JobDetail;
