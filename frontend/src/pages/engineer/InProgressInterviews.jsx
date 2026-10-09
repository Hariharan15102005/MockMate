import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const InProgressInterviews = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Current Stage', accessor: 'currentStage' },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <StatusBadge status="INTERVIEW_IN_PROGRESS" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="In-Progress Live Sessions"
        subtitle="Interviews currently active in the real-time AI interview engine."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No active interviews currently running"
        emptyDescription="When candidates join live interview rooms, their real-time state will be tracked here."
      />
    </div>
  );
};

export default InProgressInterviews;
