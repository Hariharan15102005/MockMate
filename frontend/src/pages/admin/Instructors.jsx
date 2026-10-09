import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import { BookOpen, Plus } from 'lucide-react';

export const AdminInstructors = () => {
  const columns = [
    { header: 'Instructor Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Specialization', accessor: 'specialization' },
    { header: 'Interviews Configured', accessor: 'interviewsCount' },
    { header: 'Status', accessor: 'status' }
  ];

  return (
    <div>
      <PageHeader
        title="Instructors & Evaluators"
        subtitle="Manage technical evaluators and interview rubric designers."
        actions={
          <Button variant="primary" size="sm" icon={Plus} disabled>
            Provision Instructor
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No Instructors provisioned"
        emptyDescription="Instructor assignment and evaluation governance will be enabled in later workflow modules."
      />
    </div>
  );
};

export default AdminInstructors;
