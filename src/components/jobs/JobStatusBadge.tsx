import { Badge } from '@/components/ui/badge';
import type { JobStatus } from '@/types';
import { 
  FileText, 
  Clock, 
  MessageSquare, 
  UserCheck, 
  Wrench, 
  CheckCircle2, 
  Star 
} from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<JobStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ElementType;
  className?: string;
}> = {
  draft: {
    label: 'Draft',
    variant: 'outline',
    icon: FileText,
    className: 'bg-muted text-muted-foreground',
  },
  pending_quotes: {
    label: 'Awaiting Quotes',
    variant: 'default',
    icon: Clock,
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
  quotes_received: {
    label: 'Quotes Received',
    variant: 'default',
    icon: MessageSquare,
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  },
  contractor_selected: {
    label: 'Contractor Selected',
    variant: 'default',
    icon: UserCheck,
    className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
    icon: Wrench,
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  completed: {
    label: 'Completed',
    variant: 'default',
    icon: CheckCircle2,
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  },
  reviewed: {
    label: 'Reviewed',
    variant: 'default',
    icon: Star,
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
};

const JobStatusBadge = ({ status, className }: JobStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1.5 ${config.className} ${className || ''}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default JobStatusBadge;
