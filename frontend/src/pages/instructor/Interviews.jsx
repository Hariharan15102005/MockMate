import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { Sliders, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InstructorInterviews = () => {
  const columns = [
    { header: 'Interview Title', accessor: 'title' },
    { header: 'Candidate', accessor: 'candidateName' },
    { header: 'Rounds Configured', accessor: 'roundsCount' },
    {
      header: 'Session Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'INTERVIEW_SCHEDULED'} size="sm" />
    },
    { header: 'Scheduled Date', accessor: 'scheduledAt' }
  ];

  return (
    <div>
      <PageHeader
        title="Instructor Interviews"
        subtitle="Manage configured AI mock interviews and monitor session progress."
        actions={
          <Link to="/instructor/interviews/builder">
            <Button variant="primary" size="sm" icon={Sliders}>
              Interview Builder
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No interviews configured"
        emptyDescription="Use the Interview Builder to configure multi-round AI mock interviews in Phase 5."
      />
    </div>
  );
};

export default InstructorInterviews;
