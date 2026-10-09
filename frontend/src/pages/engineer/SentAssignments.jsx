import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const SentAssignments = () => {
  const columns = [
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Instructor', accessor: 'instructorName' },
    { header: 'Sent At', accessor: 'assignedAt' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status="SENT_TO_INSTRUCTOR" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Sent to Instructors"
        subtitle="Candidates currently under review with assigned instructors."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No active sent assignments"
        emptyDescription="Candidate portfolios forwarded to instructors will display here."
      />
    </div>
  );
};

export default SentAssignments;
