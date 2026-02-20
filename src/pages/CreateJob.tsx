import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CustomerHeader from '@/components/layout/CustomerHeader';
import CustomerFooter from '@/components/layout/CustomerFooter';
import AIJobCreator from '@/components/jobs/AIJobCreator';
import { getCurrentUser } from '@/services/userService';
import { createJob } from '@/services/jobService';
import { getUnreadMessageCount } from '@/services/messageService';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CreateJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: () => getUnreadMessageCount(user!.id),
    enabled: !!user,
  });

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ['customerJobs'] });
      toast.success('Job created successfully!', {
        description: 'Your job has been sent to available tradespeople in your area.',
      });
      navigate(`/jobs/${newJob.id}`);
    },
  });

  const handleJobComplete = (jobData: any) => {
    if (!user) return;

    createJobMutation.mutate({
      customerId: user.id,
      title: jobData.description.slice(0, 60) + (jobData.description.length > 60 ? '...' : ''),
      description: jobData.description,
      originalDescription: jobData.originalDescription,
      tradeCategories: jobData.tradeCategories,
      status: 'pending_quotes',
      urgency: jobData.urgency,
      county: jobData.county,
      address: jobData.address,
      eircode: jobData.eircode,
      preferredStartDate: jobData.preferredStartDate,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <CustomerHeader user={user} unreadMessages={unreadCount} />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Create New Job</h1>
            <p className="text-lg text-muted-foreground">
              Let our AI help you find the right tradespeople for your project
            </p>
          </div>

          <AIJobCreator onComplete={handleJobComplete} />
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
};

export default CreateJob;
