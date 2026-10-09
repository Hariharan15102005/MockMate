import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const AdminInterviews = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Instructor', accessor: 'instructorName' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'INTERVIEW_SCHEDULED'} size="sm" />
    },
    { header: 'Scheduled Date', accessor: 'scheduledAt' }
  ];

  return (
    <div>
      <PageHeader
        title="All System Interviews"
        subtitle="Global inspection of AI mock interview sessions and evaluation reports."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No interviews created yet"
        emptyDescription="Configured mock interview sessions will appear here once scheduled by Instructors."
      />
    </div>
  );
};

export default AdminInterviews;
