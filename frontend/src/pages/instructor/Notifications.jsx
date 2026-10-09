import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { Bell } from 'lucide-react';

export const InstructorNotifications = () => {
  return (
    <div>
      <PageHeader
        title="Instructor Notifications"
        subtitle="Candidate assignment alerts and completed evaluation notifications."
      />

      <EmptyState
        icon={Bell}
        title="No notifications"
        description="All caught up! Alerts will appear when candidates are assigned to you by Interview Engineers."
      />
    </div>
  );
};

export default InstructorNotifications;
