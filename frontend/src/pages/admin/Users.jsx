import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import RoleBadge from '../../components/common/RoleBadge';
import StatusBadge from '../../components/common/StatusBadge';
import { UserPlus, Filter } from 'lucide-react';

export const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    { header: 'Full Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => <RoleBadge role={row.role} size="sm" />
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.enabled ? 'ACTIVE' : 'INACTIVE'} size="sm" />
    },
    { header: 'Created Date', accessor: 'createdAt' }
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="View platform accounts, manage credentials, and assign system access."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name or email..."
            />
            <Button variant="primary" size="sm" icon={UserPlus} disabled>
              Add User
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No additional users found"
        emptyDescription="User provisioning and staff creation workflows will be enabled in the Admin workflow module."
      />
    </div>
  );
};

export default UsersPage;
