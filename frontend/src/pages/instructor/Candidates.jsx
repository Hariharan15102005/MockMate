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
import {
  UserCheck,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react';

export const InstructorCandidates = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchAssignedCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignedCandidatesApi({
        page,
        size: pageSize,
        search,
        status: statusFilter
      });

      setAssignments(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load assigned candidates:', err);
      setError('Unable to load assigned candidate roster from server.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchAssignedCandidates();
  }, [fetchAssignedCandidates]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchAssignedCandidates();
  };

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
      header: 'Target Role',
      accessor: 'appliedRole',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            {row.appliedRole}
          </div>
          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
            {row.interviewType || 'TECHNICAL'}
          </span>
        </div>
      )
    },
    {
      header: 'Assigned By',
      accessor: 'engineer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            {row.engineer?.fullName || 'Interview Engineer'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {row.engineer?.department || 'Intake Operations'}
          </div>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => {
        const priority = row.priority || 'MEDIUM';
        let badgeColor = 'var(--text-muted)';
        if (priority === 'HIGH') badgeColor = 'var(--danger)';
        else if (priority === 'MEDIUM') badgeColor = 'var(--warning)';
        else if (priority === 'LOW') badgeColor = 'var(--success)';

        return (
          <span style={{ fontWeight: '700', fontSize: '0.75rem', color: badgeColor, textTransform: 'uppercase' }}>
            {priority}
          </span>
        );
      }
    },
    {
      header: 'Routing Status',
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
        title="Assigned Candidates"
        subtitle={`Candidates assigned to you for assessment review and interview evaluation (${totalElements} assigned).`}
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAssignedCandidates} loading={loading}>
            Refresh Roster
          </Button>
        }
      />

      <Card style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search candidate name, application ID, or target role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Assignment Statuses</option>
              <option value="SENT">SENT (Under Review)</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="DECLINED">DECLINED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <Button variant="secondary" size="sm" type="submit">
            Search
          </Button>

          {(search || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
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
        <ErrorState title="Error Loading Candidates" message={error} onRetry={fetchAssignedCandidates} />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          emptyTitle="No candidates currently assigned"
          emptyDescription="Candidate profiles routed to you by Interview Engineers will appear in this review queue."
        />
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing page {page + 1} of {totalPages} ({totalElements} total)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCandidates;
