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

export const SentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchSentAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignmentsApi({
        page,
        size: pageSize,
        search,
        status: 'SENT'
      });
      setAssignments(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load sent assignments:', err);
      setError('Unable to load sent assignments.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchSentAssignments();
  }, [fetchSentAssignments]);

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
            {row.instructor?.specialization || row.instructor?.department || 'Evaluation Board'}
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
      header: 'Sent Date',
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
        title="Sent to Instructors"
        subtitle={`Candidates currently forwarded to domain instructors for review (${totalElements} active).`}
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchSentAssignments} loading={loading}>
            Refresh
          </Button>
        }
      />

      <Card style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            fetchSentAssignments();
          }}
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search candidate name, app ID, role, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm" type="submit">
            Search
          </Button>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setSearch('');
                setPage(0);
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </Card>

      {loading ? (
        <LoadingSkeleton type="card" />
      ) : error ? (
        <ErrorState title="Error Loading Sent Assignments" message={error} onRetry={fetchSentAssignments} />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          emptyTitle="No candidates currently in SENT status"
          emptyDescription="Verified candidates forwarded to instructors will display here."
        />
      )}
    </div>
  );
};

export default SentAssignments;
