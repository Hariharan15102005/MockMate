import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';

export const AdminAuditLogs = () => {
  const columns = [
    { header: 'Event Type', accessor: 'action', render: (row) => <Badge variant="info">{row.action}</Badge> },
    { header: 'Principal User', accessor: 'userId' },
    { header: 'IP Address', accessor: 'ipAddress' },
    { header: 'Timestamp', accessor: 'createdAt' },
    { header: 'Details', accessor: 'details' }
  ];

  return (
    <div>
      <PageHeader
        title="Security & Audit Logs"
        subtitle="Immutable security trail of authentication, data access, and administrative events."
      />

      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No audit records yet"
        emptyDescription="System audit events and access logs will stream to this view in Phase 8."
      />
    </div>
  );
};

export default AdminAuditLogs;
