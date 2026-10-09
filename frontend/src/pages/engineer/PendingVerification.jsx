import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const PendingVerification = () => {
  const columns = [
    { header: 'Candidate Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Resume File', accessor: 'resumeFileName' },
    { header: 'Submitted At', accessor: 'createdAt' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'PENDING_VERIFICATION'} size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pending Candidate Verification"
        subtitle="Review uploaded candidate resumes, verify extracted parameters, and approve for instructor routing."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No candidates pending verification"
        emptyDescription="All submitted candidates have been reviewed. New candidate intake items requiring verification will appear here."
      />
    </div>
  );
};

export default PendingVerification;
