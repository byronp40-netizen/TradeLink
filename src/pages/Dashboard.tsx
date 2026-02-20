import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import CustomerHeader from '@/components/layout/CustomerHeader';
import CustomerFooter from '@/components/layout/CustomerFooter';
import JobList from '@/components/jobs/JobList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/services/userService';
import { getJobsByCustomerId } from '@/services/jobService';
import { getUnreadMessageCount } from '@/services/messageService';
import { Plus, Briefcase, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['customerJobs', user?.id],
    queryFn: () => getJobsByCustomerId(user!.id),
    enabled: !!user,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: () => getUnreadMessageCount(user!.id),
    enabled: !!user,
  });

  const activeJobs = jobs.filter(j => 
    j.status === 'pending_quotes' || 
    j.status === 'quotes_received' || 
    j.status === 'contractor_selected' ||
    j.status === 'in_progress'
  );
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'reviewed');
  const pendingQuotes = jobs.filter(j => j.status === 'quotes_received');

  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="h-16 border-b" />
        <div className="container py-8 space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <CustomerHeader user={user} unreadMessages={unreadCount} />

      <main className="flex-1 container px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your home maintenance projects all in one place
            </p>
            <Link to="/create-job">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create New Job
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeJobs.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Jobs in progress or awaiting action
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <Clock className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingQuotes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Jobs with quotes to review
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedJobs.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully finished jobs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Jobs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Your Jobs</h2>
                <p className="text-muted-foreground">Track and manage your home repair projects</p>
              </div>
              <Link to="/jobs">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            {jobsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : (
              <JobList 
                jobs={jobs.slice(0, 6)} 
                emptyMessage="No jobs yet. Create your first job to get started!"
              />
            )}
          </div>
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
};

export default Dashboard;
