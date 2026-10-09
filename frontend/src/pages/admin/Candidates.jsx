import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const AdminCandidates = () => {
  const columns = [
    { header: 'Candidate Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'Workflow Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'PENDING_VERIFICATION'} size="sm" />
    },
    { header: 'Assigned Instructor', accessor: 'instructorName' },
    { header: 'Registered On', accessor: 'createdAt' }
  ];

  return (
    <div>
      <PageHeader
        title="Candidate Roster"
        subtitle="Global view of all registered assessment participants across all cohorts."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No candidates registered"
        emptyDescription="Public candidate registrations and engineer intake items will appear here."
      />
    </div>
  );
};

export default AdminCandidates;
