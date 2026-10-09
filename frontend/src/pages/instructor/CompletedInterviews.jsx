import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const InstructorCompleted = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Completed Date', accessor: 'completedAt' },
    { header: 'Score', accessor: 'score' },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <StatusBadge status="INTERVIEW_COMPLETED" size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Completed Interviews"
        subtitle="Archive of finalized mock interviews ready for evaluation review."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No completed interviews"
        emptyDescription="Interviews completed by candidates will appear here."
      />
    </div>
  );
};

export default InstructorCompleted;
