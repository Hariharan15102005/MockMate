import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getAssignmentsApi } from '../../api/engineer';
import { RefreshCw, ExternalLink, Search } from 'lucide-react';

export const PendingAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPendingAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignmentsApi({
        page,
        size: pageSize,
        search,
        status: 'PENDING'
      });
      setAssignments(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load pending assignments:', err);
      setError('Unable to load pending assignments.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchPendingAssignments();
  }, [fetchPendingAssignments]);

  const columns = [
    {
      header: 'Candidate',
      accessor: 'candidate',
      render: (row) => (
        <div>
          <Link
            to={`/engineer/candidates/${row.candidate?.id}`}
            style={{ fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}
          >
            {row.candidate?.fullName || 'Candidate'}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {row.candidate?.applicationId || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Applied Role',
      accessor: 'appliedRole',
      render: (row) => (
        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          {row.appliedRole}
        </span>
      )
    },
    {
      header: 'Assigned Instructor',
      accessor: 'instructor',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            {row.instructor?.fullName}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {row.instructor?.department || 'Evaluation Board'}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      header: 'Routing Date',
      accessor: 'assignedAt',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {row.assignedAt ? new Date(row.assignedAt).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <Link to={`/engineer/candidates/${row.candidate?.id}`}>
          <Button variant="ghost" size="sm" icon={ExternalLink}>
            Profile
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pending Instructor Assignments"
        subtitle={`Assignments awaiting instructor intake or initial confirmation (${totalElements} records).`}
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchPendingAssignments} loading={loading}>
            Refresh
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton type="card" />
      ) : error ? (
        <ErrorState title="Error Loading Pending Assignments" message={error} onRetry={fetchPendingAssignments} />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          emptyTitle="No assignments in PENDING status"
          emptyDescription="All forwarded candidates are currently tracked under active SENT or ACCEPTED statuses."
        />
      )}
    </div>
  );
};

export default PendingAssignments;
