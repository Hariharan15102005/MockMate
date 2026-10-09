import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const InstructorScheduled = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Scheduled Date/Time', accessor: 'scheduledAt' },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <StatusBadge status="INTERVIEW_SCHEDULED" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Scheduled Interviews"
        subtitle="Configured mock interview sessions ready for candidate participation."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No scheduled interviews"
        emptyDescription="Interviews you configure will appear in this upcoming schedule."
      />
    </div>
  );
};

export default InstructorScheduled;
