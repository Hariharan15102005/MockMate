import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const ScheduledInterviews = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Instructor', accessor: 'instructorName' },
    { header: 'Scheduled Date/Time', accessor: 'scheduledAt' },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <StatusBadge status="INTERVIEW_SCHEDULED" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Scheduled Candidate Interviews"
        subtitle="Upcoming AI mock interview sessions awaiting candidate attendance."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No scheduled interviews"
        emptyDescription="Interviews configured and scheduled by instructors will appear here."
      />
    </div>
  );
};

export default ScheduledInterviews;
