import React from 'react';
import Badge from './Badge';
import { Shield, Cpu, BookOpen, User } from 'lucide-react';

export const RoleBadge = ({ role, size = 'md' }) => {
  if (!role) return null;

  const roleConfig = {
    ADMIN: {
      label: 'Admin',
      variant: 'danger',
      icon: Shield
    },
    INTERVIEW_ENGINEER: {
      label: 'Interview Engineer',
      variant: 'info',
      icon: Cpu
    },
    INSTRUCTOR: {
      label: 'Instructor',
      variant: 'purple',
      icon: BookOpen
    },
    CANDIDATE: {
      label: 'Candidate',
      variant: 'success',
      icon: User
    }
  };

  const config = roleConfig[role] || {
    label: role,
    variant: 'default',
    icon: User
  };

  return (
    <Badge variant={config.variant} size={size} icon={config.icon}>
      {config.label}
    </Badge>
  );
};

export default RoleBadge;
