import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const InstructorInProgress = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Live Agent Stage', accessor: 'currentStage' },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <StatusBadge status="INTERVIEW_IN_PROGRESS" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Live Interview Sessions"
        subtitle="Monitor active sessions driven by the LangGraph AI multi-agent orchestrator."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No active interview sessions"
        emptyDescription="Sessions currently in progress will display live telemetry and round progression here."
      />
    </div>
  );
};

export default InstructorInProgress;
