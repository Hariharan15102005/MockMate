import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const EngineerReports = () => {
  const columns = [
    { header: 'Report Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Instructor', accessor: 'instructorName' },
    { header: 'Overall Score', accessor: 'score' },
    {
      header: 'Delivery Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'REPORT_READY'} size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Candidate Assessment Reports"
        subtitle="Review AI-generated candidate assessment reports and deliver to domain instructors."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No evaluation reports ready"
        emptyDescription="AI-generated assessment reports will appear here after interview completion."
      />
    </div>
  );
};

export default EngineerReports;
