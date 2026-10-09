import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const PendingAssignments = () => {
  const columns = [
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Target Stack', accessor: 'techStack' },
    { header: 'Verified At', accessor: 'verifiedAt' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status="VERIFIED" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pending Routing to Instructors"
        subtitle="Verified candidates ready to be matched and assigned to technical instructors."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No candidates pending instructor routing"
        emptyDescription="Verified candidates awaiting instructor assignment will appear here."
      />
    </div>
  );
};

export default PendingAssignments;
