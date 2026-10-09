import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getAssignedCandidatesApi } from '../../api/instructor';
import { RefreshCw, ExternalLink, Search, Clock } from 'lucide-react';

export const PendingCandidates = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignedCandidatesApi({
        page,
        size: pageSize,
        search,
        status: 'SENT'
      });
      setAssignments(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load pending candidates:', err);
      setError('Unable to load pending candidate reviews.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const columns = [
    {
      header: 'Candidate',
      accessor: 'candidate',
      render: (row) => (
        <div>
          <Link
            to={`/instructor/candidates/${row.candidate?.id}`}
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
      header: 'Assigned By',
      accessor: 'engineer',
      render: (row) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {row.engineer?.fullName || 'Interview Engineer'}
        </span>
      )
    },
    {
      header: 'Review Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      header: 'Assigned Date',
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
        <Link to={`/instructor/candidates/${row.candidate?.id}`}>
          <Button variant="primary" size="sm" icon={ExternalLink}>
            Review Candidate
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pending Candidate Reviews"
        subtitle={`Candidates awaiting your review and assessment configuration (${totalElements} pending).`}
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchPending} loading={loading}>
            Refresh
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton type="card" />
      ) : error ? (
        <ErrorState title="Error Loading Pending Candidates" message={error} onRetry={fetchPending} />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          emptyTitle="No pending reviews"
          emptyDescription="You have reviewed all candidates currently assigned to you."
        />
      )}
    </div>
  );
};

export default PendingCandidates;
