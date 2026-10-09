import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getInterviewsApi } from '../../api/instructor';
import {
  Sliders,
  Plus,
  Layers,
  Clock,
  User,
  Brain,
  Edit,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

export const InstructorInterviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalPages: 0, totalElements: 0 });

  const fetchInterviews = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviewsApi({
        page,
        size: pagination.size,
        search,
        status: statusFilter
      });
      setInterviews(data.content || []);
      setPagination((prev) => ({
        ...prev,
        page: data.number || 0,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0
      }));
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setError('Failed to load interview blueprints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.size]);

  useEffect(() => {
    fetchInterviews(0);
  }, [fetchInterviews]);

  const handleSearchChange = (value) => {
    setSearch(value);
  };

  const columns = [
    {
      header: 'Interview Blueprint',
      accessor: 'title',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {row.title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Target: <span style={{ color: 'var(--text-secondary)' }}>{row.targetRole || 'Not specified'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Candidate',
      accessor: 'candidateName',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            {row.candidateName ? row.candidateName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              {row.candidateName || 'Assigned Candidate'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {row.candidateEmail || ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Configuration',
      accessor: 'roundsCount',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Layers size={14} color="var(--primary)" />
            <span>{row.roundsCount || 0} Rounds</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Clock size={13} />
            <span>{row.durationMinutes || 45} mins</span>
            {row.isAdaptive && (
              <Badge variant="purple" size="sm">Adaptive</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      render: (row) => {
        const diff = row.difficulty || 'MEDIUM';
        const variant =
          diff === 'EASY' ? 'info' :
          diff === 'MEDIUM' ? 'warning' :
          diff === 'HARD' ? 'danger' : 'purple';
        return <Badge variant={variant} size="sm">{diff}</Badge>;
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      header: 'Updated / Published',
      accessor: 'publishedAt',
      render: (row) => (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {row.publishedAt
            ? new Date(row.publishedAt).toLocaleDateString()
            : row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : '—'}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.status === 'DRAFT' ? (
            <Button
              variant="primary"
              size="sm"
              icon={Edit}
              onClick={() => navigate(`/instructor/interviews/builder?interviewId=${row.id}`)}
            >
              Edit Draft
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={Eye}
              onClick={() => navigate(`/instructor/interviews/builder?interviewId=${row.id}`)}
            >
              View Blueprint
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Interview Blueprints & Configurations"
        subtitle="Design and publish deterministic multi-round interview blueprints for accepted candidates."
        actions={
          <Link to="/instructor/interviews/builder">
            <Button variant="primary" size="sm" icon={Plus}>
              New Blueprint
            </Button>
          </Link>
        }
      />

      {/* Filter / Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ flex: '1', minWidth: '240px', maxWidth: '400px' }}>
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search blueprints by title, role, candidate..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Status:</label>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Drafts</option>
            <option value="PUBLISHED">Published</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchInterviews(pagination.page)}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table / State */}
      {loading ? (
        <LoadingSkeleton count={4} height={60} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchInterviews(0)} />
      ) : (
        <DataTable
          columns={columns}
          data={interviews}
          emptyTitle="No interview blueprints found"
          emptyDescription={
            search || statusFilter
              ? "No interview blueprints match your current filter criteria."
              : "You haven't configured any interview blueprints yet. Click 'New Blueprint' to create one for an accepted candidate."
          }
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            onPageChange: (newPage) => fetchInterviews(newPage)
          }}
        />
      )}
    </div>
  );
};

export default InstructorInterviews;
