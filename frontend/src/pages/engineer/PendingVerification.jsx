import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchInput from '../../components/common/SearchInput';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { getPendingVerificationCandidatesApi } from '../../api/engineer';
import { CheckCircle2, UserCheck, Eye, RefreshCw, Filter } from 'lucide-react';

export const PendingVerification = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filters
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [appliedRole, setAppliedRole] = useState('');

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingVerificationCandidatesApi({
        page,
        size: pageSize,
        search,
        experienceLevel,
        appliedRole
      });
      setCandidates(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Failed to load pending verification candidates:', err);
      setError('Unable to load pending verification candidates. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, experienceLevel, appliedRole]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleRoleChange = (e) => {
    setAppliedRole(e.target.value);
    setPage(0);
  };

  const handleExperienceChange = (e) => {
    setExperienceLevel(e.target.value);
    setPage(0);
  };

  const columns = [
    {
      header: 'Application ID',
      accessor: 'applicationId',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--primary)', fontSize: '0.85rem' }}>
          {row.applicationId}
        </span>
      )
    },
    {
      header: 'Candidate',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.fullName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      )
    },
    {
      header: 'Applied Role',
      accessor: 'appliedRole',
      render: (row) => (
        <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{row.appliedRole}</span>
      )
    },
    {
      header: 'College & Degree',
      accessor: 'college',
      render: (row) => (
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{row.college}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.degree} • {row.department}</div>
        </div>
      )
    },
    {
      header: 'Experience',
      accessor: 'experienceLevel',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
          {row.experienceLevel || 'FRESHER'}
        </span>
      )
    },
    {
      header: 'Submitted',
      accessor: 'createdAt',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'PENDING_VERIFICATION'} size="sm" />
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        <Link to={`/engineer/candidates/${row.id}`}>
          <Button variant="primary" size="sm" icon={UserCheck}>
            Review
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Pending Candidate Verification"
        subtitle="Review intake information for submitted candidates and determine eligibility for assessment."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchCandidates} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem'
        }}
      >
        <div style={{ flex: '1', minWidth: '260px' }}>
          <SearchInput
            placeholder="Search pending by name, email, or application ID..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            value={appliedRole}
            onChange={handleRoleChange}
            style={{ width: 'auto', minWidth: '160px', padding: '0.5rem 0.75rem' }}
          >
            <option value="">All Roles</option>
            <option value="Java">Java Developer</option>
            <option value="Frontend">Frontend Specialist</option>
            <option value="Backend">Backend Architect</option>
            <option value="Full Stack">Full Stack Engineer</option>
            <option value="ML">ML / AI Engineer</option>
          </select>

          <select
            className="form-input"
            value={experienceLevel}
            onChange={handleExperienceChange}
            style={{ width: 'auto', minWidth: '160px', padding: '0.5rem 0.75rem' }}
          >
            <option value="">All Experience Levels</option>
            <option value="FRESHER">Fresher</option>
            <option value="ENTRY_LEVEL">Entry Level</option>
            <option value="EXPERIENCED">Experienced</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <DataTable
        columns={columns}
        data={candidates}
        loading={loading}
        error={error}
        onRetry={fetchCandidates}
        emptyTitle="No candidates pending verification"
        emptyDescription="All submitted candidate intake items have been reviewed. New candidates requiring verification will appear here."
        pagination={{
          currentPage: page + 1,
          totalPages,
          totalItems: totalElements,
          onPageChange: (newPage) => setPage(newPage - 1)
        }}
      />
    </div>
  );
};

export default PendingVerification;
