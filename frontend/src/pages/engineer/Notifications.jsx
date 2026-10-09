import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { Bell } from 'lucide-react';

export const EngineerNotifications = () => {
  return (
    <div>
      <PageHeader
        title="Notifications & Alerts"
        subtitle="Intake alerts, candidate submission triggers, and instructor response updates."
      />

      <EmptyState
        icon={Bell}
        title="No notifications"
        description="You're all caught up! Real-time alerts will trigger as candidate actions occur."
      />
    </div>
  );
};

export default EngineerNotifications;
