import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const EngineerInterviews = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Instructor', accessor: 'instructorName' },
    {
      header: 'Session Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'INTERVIEW_SCHEDULED'} size="sm" />
    },
    { header: 'Scheduled Time', accessor: 'scheduledAt' }
  ];

  return (
    <div>
      <PageHeader
        title="Candidate Interview Monitoring"
        subtitle="Track live interview sessions, scheduled assessments, and completed evaluations."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No interviews to track"
        emptyDescription="Candidate interviews scheduled by instructors will appear in this monitoring view."
      />
    </div>
  );
};

export default EngineerInterviews;
