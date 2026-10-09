import React from 'react';
import Badge from './Badge';
import { 
  Clock, 
  CheckCircle2, 
  Send, 
  UserCheck, 
  Calendar, 
  PlayCircle, 
  CheckCheck, 
  FileText, 
  Search, 
  Award, 
  XCircle, 
  Shield 
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  if (!status) return null;

  const statusConfig = {
    PENDING_VERIFICATION: {
      label: 'Pending Verification',
      variant: 'warning',
      icon: Clock
    },
    VERIFIED: {
      label: 'Verified',
      variant: 'info',
      icon: CheckCircle2
    },
    SENT_TO_INSTRUCTOR: {
      label: 'Sent to Instructor',
      variant: 'purple',
      icon: Send
    },
    ACCEPTED_BY_INSTRUCTOR: {
      label: 'Accepted by Instructor',
      variant: 'primary',
      icon: UserCheck
    },
    INTERVIEW_SCHEDULED: {
      label: 'Scheduled',
      variant: 'info',
      icon: Calendar
    },
    INTERVIEW_IN_PROGRESS: {
      label: 'In Progress',
      variant: 'warning',
      icon: PlayCircle
    },
    INTERVIEW_COMPLETED: {
      label: 'Completed',
      variant: 'success',
      icon: CheckCheck
    },
    REPORT_READY: {
      label: 'Report Ready',
      variant: 'success',
      icon: FileText
    },
    FINAL_REVIEW: {
      label: 'Final Review',
      variant: 'purple',
      icon: Search
    },
    SELECTED: {
      label: 'Selected',
      variant: 'success',
      icon: Award
    },
    REJECTED: {
      label: 'Rejected',
      variant: 'danger',
      icon: XCircle
    },
    ACTIVE: {
      label: 'Active',
      variant: 'success',
      icon: CheckCircle2
    },
    INACTIVE: {
      label: 'Inactive',
      variant: 'default',
      icon: XCircle
    },
    DRAFT: {
      label: 'Draft Blueprint',
      variant: 'warning',
      icon: FileText
    },
    PUBLISHED: {
      label: 'Published Blueprint',
      variant: 'success',
      icon: CheckCircle2
    }
  };

  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    variant: 'default',
    icon: Shield
  };

  return (
    <Badge variant={config.variant} size={size} icon={config.icon}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
