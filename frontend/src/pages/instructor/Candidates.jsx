import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchInput from '../../components/common/SearchInput';

export const InstructorCandidates = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    { header: 'Candidate Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Assigned By (Engineer)', accessor: 'engineerName' },
    { header: 'Assigned Date', accessor: 'assignedAt' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'SENT_TO_INSTRUCTOR'} size="sm" />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Assigned Candidates"
        subtitle="Candidates assigned by Interview Engineers for review and assessment configuration."
        actions={
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search candidates..."
          />
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No candidates currently assigned"
        emptyDescription="Candidate portfolios routed by Interview Engineers will appear in this review roster."
      />
    </div>
  );
};

export default InstructorCandidates;
