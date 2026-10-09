import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const CandidateInterviews = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Target Role', accessor: 'targetRole' },
    { header: 'Instructor', accessor: 'instructorName' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'INTERVIEW_SCHEDULED'} size="sm" />
    },
    { header: 'Date & Time', accessor: 'scheduledAt' }
  ];

  return (
    <div>
      <PageHeader
        title="My Mock Interviews"
        subtitle="View your scheduled sessions, active interview links, and past evaluation summaries."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No interviews assigned yet"
        emptyDescription="Interviews scheduled by your evaluator will appear here."
      />
    </div>
  );
};

export default CandidateInterviews;
