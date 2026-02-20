import type { Job } from '@/types';
import JobCard from './JobCard';
import { Empty } from '@/components/ui/empty';
import { Briefcase } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  emptyMessage?: string;
}

const JobList = ({ jobs, emptyMessage = 'No jobs found' }: JobListProps) => {
  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{emptyMessage}</h3>
            <p className="text-sm text-muted-foreground">Jobs you create will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};

export default JobList;
