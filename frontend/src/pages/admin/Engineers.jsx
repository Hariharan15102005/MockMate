import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import { Cpu, Plus } from 'lucide-react';

export const AdminEngineers = () => {
  const columns = [
    { header: 'Engineer Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Department', accessor: 'department' },
    { header: 'Candidates Processed', accessor: 'processed' },
    { header: 'Status', accessor: 'status' }
  ];

  return (
    <div>
      <PageHeader
        title="Interview Engineers"
        subtitle="Manage candidate intake specialists and routing permissions."
        actions={
          <Button variant="primary" size="sm" icon={Plus} disabled>
            Provision Engineer
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No Interview Engineers provisioned"
        emptyDescription="Engineer management and intake delegation will be activated in the Admin workflow module."
      />
    </div>
  );
};

export default AdminEngineers;
