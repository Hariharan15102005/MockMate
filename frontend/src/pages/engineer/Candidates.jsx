import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import { getCandidatesApi } from '../../api/engineer';
import { UserPlus, Eye, Filter, RotateCcw } from 'lucide-react';

export const EngineerCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCandidatesApi({
        page,
        size: 10,
        search: searchTerm,
        status: statusFilter,
        experienceLevel: experienceFilter
      });
      setCandidates(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch candidates from backend:', err);
      setError('Unable to load candidate roster from the backend service.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, experienceFilter]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleExperienceFilterChange = (e) => {
    setExperienceFilter(e.target.value);
    setPage(0);
  };

  const columns = [
    {
      header: 'Application ID',
      accessor: 'applicationId',
      width: '140px',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)', fontSize: '0.8125rem' }}>
          {row.applicationId}
        </span>
      )
    },
    {
      header: 'Candidate Name',
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
      render: (row) => <span style={{ fontWeight: '500' }}>{row.appliedRole}</span>
    },
    {
      header: 'College / University',
      accessor: 'college',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {row.college || '—'}
        </span>
      )
    },
    {
      header: 'Experience',
      accessor: 'experienceLevel',
      width: '120px',
      render: (row) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {row.experienceLevel || 'FRESHER'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '160px',
      render: (row) => <StatusBadge status={row.status || 'PENDING_VERIFICATION'} size="sm" />
    },
    {
      header: 'Actions',
      width: '90px',
      align: 'right',
      render: (row) => (
        <Link to={`/engineer/candidates/${row.id}`}>
          <Button variant="outline" size="sm" icon={Eye}>
            View
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Candidate Roster & Pipeline"
        subtitle="Manage candidate intake, verify credentials, and route to domain evaluators."
        actions={
          <Link to="/engineer/candidates/intake">
            <Button variant="primary" size="sm" icon={UserPlus}>
              New Candidate Intake
            </Button>
          </Link>
        }
      />

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search name, email, app ID, college, role..."
            style={{ maxWidth: '340px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="form-input"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              style={{ width: '180px', height: '38px', fontSize: '0.8125rem' }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="SENT_TO_INSTRUCTOR">Sent to Instructor</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="INTERVIEW_COMPLETED">Interview Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Exp:</span>
            <select
              className="form-input"
              value={experienceFilter}
              onChange={handleExperienceFilterChange}
              style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }}
            >
              <option value="">All Levels</option>
              <option value="FRESHER">FRESHER</option>
              <option value="ENTRY_LEVEL">ENTRY LEVEL</option>
              <option value="EXPERIENCED">EXPERIENCED</option>
            </select>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
            setExperienceFilter('');
            setPage(0);
          }}
          title="Reset Filters"
        >
          Reset
        </Button>
      </div>

      {/* Candidate Data Grid */}
      <DataTable
        columns={columns}
        data={candidates}
        loading={loading}
        error={error}
        onRetry={fetchCandidates}
        emptyTitle="No candidates found"
        emptyDescription={
          searchTerm || statusFilter || experienceFilter
            ? 'No candidates match the applied filters. Try adjusting your search criteria.'
            : 'No candidate intake records exist in the recruitment pipeline yet.'
        }
        emptyActionLabel="Add First Candidate"
        onEmptyAction={() => {}}
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

export default EngineerCandidates;
