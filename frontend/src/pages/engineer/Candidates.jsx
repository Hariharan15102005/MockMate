import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import { UserPlus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EngineerCandidates = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    { header: 'Candidate Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Primary Tech Stack', accessor: 'techStack' },
    {
      header: 'Workflow Stage',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'PENDING_VERIFICATION'} size="sm" />
    },
    { header: 'Assigned Instructor', accessor: 'instructorName' },
    { header: 'Created Date', accessor: 'createdAt' }
  ];

  return (
    <div>
      <PageHeader
        title="Candidate Roster & Pipeline"
        subtitle="Manage candidate intake, verify credentials, and route to domain evaluators."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search candidate name or tech stack..."
            />
            <Link to="/engineer/candidates/intake">
              <Button variant="primary" size="sm" icon={UserPlus}>
                New Intake
              </Button>
            </Link>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No candidates in pipeline"
        emptyDescription="Candidates will appear here after registration or manual intake. Use the 'New Intake' button to initiate candidate collection in Phase 5."
        emptyActionLabel="Add First Candidate"
        onEmptyAction={() => {}}
      />
    </div>
  );
};

export default EngineerCandidates;
