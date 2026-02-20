import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Job } from '@/types';
import JobStatusBadge from './JobStatusBadge';
import { MapPin, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface JobCardProps {
  job: Job;
}

const urgencyColors = {
  emergency: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  urgent: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  flexible: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
};

const JobCard = ({ job }: JobCardProps) => {
  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 group">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
            </div>
            {job.images && job.images.length > 0 && (
              <img 
                src={job.images[0]} 
                alt={job.title}
                className="w-20 h-20 rounded-md object-cover border"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {job.tradeCategories.map(trade => (
              <Badge key={trade} variant="secondary" className="text-xs">
                {trade}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{job.county}</span>
          </div>

          {job.preferredStartDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Start: {format(new Date(job.preferredStartDate), 'MMM dd, yyyy')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <Badge variant="outline" className={urgencyColors[job.urgency]}>
              {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4 border-t">
          <JobStatusBadge status={job.status} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(job.createdAt), 'MMM dd, yyyy')}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default JobCard;
