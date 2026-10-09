import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const EngineerAssignments = () => {
  const columns = [
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Assigned Instructor', accessor: 'instructorName' },
    { header: 'Routing Date', accessor: 'assignedAt' },
    {
      header: 'Assignment Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'SENT_TO_INSTRUCTOR'} size="sm" />
    },
    { header: 'Notes', accessor: 'notes' }
  ];

  return (
    <div>
      <PageHeader
        title="Instructor Assignments & Candidate Routing"
        subtitle="Track candidates routed to instructors for review and interview configuration."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No candidate assignments recorded"
        emptyDescription="Verified candidates sent to domain instructors will appear in this tracking table."
      />
    </div>
  );
};

export default EngineerAssignments;
