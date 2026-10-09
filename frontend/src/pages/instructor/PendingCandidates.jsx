import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const PendingCandidates = () => {
  const columns = [
    { header: 'Candidate Name', accessor: 'fullName' },
    { header: 'Target Role', accessor: 'targetRole' },
    { header: 'Resume Extracted Skills', accessor: 'skills' },
    {
      header: 'Review State',
      accessor: 'status',
      render: () => <StatusBadge status="SENT_TO_INSTRUCTOR" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pending Candidate Reviews"
        subtitle="Review candidate qualifications and determine mock interview configurations."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No candidates pending review"
        emptyDescription="All assigned candidate profiles have been reviewed."
      />
    </div>
  );
};

export default PendingCandidates;
