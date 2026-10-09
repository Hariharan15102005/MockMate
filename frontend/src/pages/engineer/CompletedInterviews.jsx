import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const CompletedInterviews = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Completed At', accessor: 'completedAt' },
    { header: 'Composite Score', accessor: 'score' },
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
        subtitle="Historical archive of completed candidate mock interviews."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No completed interviews recorded"
        emptyDescription="Interviews finished by candidates will appear here with calculated evaluation summaries."
      />
    </div>
  );
};

export default CompletedInterviews;
