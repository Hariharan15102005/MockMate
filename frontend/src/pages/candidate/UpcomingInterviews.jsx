import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const CandidateUpcoming = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Expected Duration', accessor: 'duration' },
    { header: 'Instructor', accessor: 'instructorName' },
    { header: 'Scheduled Start', accessor: 'scheduledAt' },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <StatusBadge status="INTERVIEW_SCHEDULED" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Upcoming Interviews"
        subtitle="Interviews scheduled for future completion."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No upcoming interviews"
        emptyDescription="You have no pending interviews at this time."
      />
    </div>
  );
};

export default CandidateUpcoming;
