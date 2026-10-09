import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const CandidateCompleted = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Date Completed', accessor: 'completedAt' },
    { header: 'Overall Evaluation', accessor: 'score' },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <StatusBadge status="INTERVIEW_COMPLETED" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Completed Interviews & Reports"
        subtitle="Past mock assessment records and performance evaluations."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No completed assessments"
        emptyDescription="Interviews you finish will show evaluation reports and scores here."
      />
    </div>
  );
};

export default CandidateCompleted;
