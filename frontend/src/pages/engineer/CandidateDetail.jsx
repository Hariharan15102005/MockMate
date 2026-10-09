import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getCandidateByIdApi, updateCandidateApi } from '../../api/engineer';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  Edit,
  ArrowLeft,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Send,
  Sliders,
  ChevronRight,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

export const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchCandidate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCandidateByIdApi(id);
      setCandidate(data);
      setEditFormData({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        location: data.location,
        college: data.college,
        degree: data.degree,
        department: data.department,
        graduationYear: data.graduationYear,
        cgpa: data.cgpa ?? '',
        experienceLevel: data.experienceLevel || 'FRESHER',
        appliedRole: data.appliedRole,
        applicationId: data.applicationId,
        source: data.source || 'CAMPUS',
        engineerNotes: data.engineerNotes || ''
      });
    } catch (err) {
      console.error('Failed to load candidate details:', err);
      setError(err.response?.status === 404 ? 'Candidate record not found.' : 'Unable to load candidate details from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    setEditError(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const payload = {
        ...editFormData,
        graduationYear: Number(editFormData.graduationYear),
        cgpa: editFormData.cgpa !== '' ? Number(editFormData.cgpa) : null
      };

      const updated = await updateCandidateApi(id, payload);
      setCandidate(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      if (err.response?.status === 409) {
        setEditError(`Conflict: Application ID '${editFormData.applicationId}' is already in use.`);
      } else {
        setEditError(err.response?.data?.message || 'Failed to update candidate details.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ width: '40%', height: '32px', marginBottom: '24px' }} />
        <LoadingSkeleton type="card" style={{ marginBottom: '16px' }} />
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <ErrorState
        title="Candidate Not Found"
        message={error || 'The requested candidate profile does not exist.'}
        onRetry={fetchCandidate}
      />
    );
  }

  const pipelineStages = [
    { name: 'Intake Created', status: 'completed', label: 'Done' },
    { name: 'Verification', status: 'active', label: candidate.status },
    { name: 'Instructor Routing', status: 'upcoming', label: 'Phase 6' },
    { name: 'AI Interview', status: 'upcoming', label: 'Phase 7' },
    { name: 'Evaluation Report', status: 'upcoming', label: 'Phase 8' }
  ];

  return (
    <div>
      <PageHeader
        title={candidate.fullName}
        subtitle={`Application ID: ${candidate.applicationId} • Applied for ${candidate.appliedRole}`}
        badge={<StatusBadge status={candidate.status} />}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/engineer/candidates">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to List
              </Button>
            </Link>
            <Button variant="primary" size="sm" icon={Edit} onClick={() => setIsEditing(true)}>
              Edit Details
            </Button>
          </div>
        }
      />

      {/* Visual Pipeline Progression Indicator */}
      <Card title="Recruitment Pipeline Progression" subtitle="Current status in candidate intake workflow" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
          {pipelineStages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isActive = stage.status === 'active';

            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isActive ? 'var(--primary)' : isCompleted ? 'var(--success-border)' : 'var(--border-color)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                    STAGE {idx + 1}
                  </span>
                  {isCompleted ? <CheckCircle2 size={14} color="var(--success)" /> : isActive ? <Clock size={14} color="var(--primary)" /> : null}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {stage.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detail Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Personal Details */}
        <Card title="Personal Information" subtitle="Contact & location">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{candidate.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{candidate.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{candidate.phone || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{candidate.location || '—'}</div>
            </div>
          </div>
        </Card>

        {/* Academic Details */}
        <Card title="Academic Information" subtitle="Education and degree">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>College / University</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{candidate.college}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Degree</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{candidate.degree}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{candidate.department}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Graduation Year</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{candidate.graduationYear}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CGPA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: candidate.cgpa ? 'var(--success)' : 'var(--text-muted)' }}>
                  {candidate.cgpa ? `${candidate.cgpa} / 10.0` : '—'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Parameters */}
        <Card title="Application Parameters" subtitle="Role & experience tracking">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Application ID</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                {candidate.applicationId}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Applied Role</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{candidate.appliedRole}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Experience Level</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.experienceLevel || 'FRESHER'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intake Source</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.source || 'CAMPUS'}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created At</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {candidate.createdAt ? new Date(candidate.createdAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </Card>

        {/* Engineer Notes */}
        <Card title="Engineer Notes" subtitle="Internal intake notes">
          <div style={{ marginTop: '0.5rem' }}>
            {candidate.engineerNotes ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                {candidate.engineerNotes}
              </p>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No engineer notes recorded during intake.
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* EDIT MODAL DIALOG */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => !editLoading && setIsEditing(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Edit Candidate Intake Information
              </h3>
              <button
                type="button"
                onClick={() => !editLoading && setIsEditing(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                <AlertCircle size={18} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="fullName" className="form-input" value={editFormData.fullName} onChange={handleEditChange} required />
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input type="email" name="email" className="form-input" value={editFormData.email} onChange={handleEditChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Phone *</label>
                  <input type="text" name="phone" className="form-input" value={editFormData.phone} onChange={handleEditChange} required />
                </div>
                <div>
                  <label className="form-label">Location *</label>
                  <input type="text" name="location" className="form-input" value={editFormData.location} onChange={handleEditChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">College *</label>
                  <input type="text" name="college" className="form-input" value={editFormData.college} onChange={handleEditChange} required />
                </div>
                <div>
                  <label className="form-label">Degree *</label>
                  <input type="text" name="degree" className="form-input" value={editFormData.degree} onChange={handleEditChange} required />
                </div>
                <div>
                  <label className="form-label">Department *</label>
                  <input type="text" name="department" className="form-input" value={editFormData.department} onChange={handleEditChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Graduation Year *</label>
                  <input type="number" name="graduationYear" className="form-input" value={editFormData.graduationYear} onChange={handleEditChange} required />
                </div>
                <div>
                  <label className="form-label">CGPA (0.0 - 10.0)</label>
                  <input type="number" step="0.01" name="cgpa" className="form-input" value={editFormData.cgpa} onChange={handleEditChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Application ID *</label>
                  <input type="text" name="applicationId" className="form-input" value={editFormData.applicationId} onChange={handleEditChange} required />
                </div>
                <div>
                  <label className="form-label">Applied Role *</label>
                  <input type="text" name="appliedRole" className="form-input" value={editFormData.appliedRole} onChange={handleEditChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Experience Level</label>
                  <select name="experienceLevel" className="form-input" value={editFormData.experienceLevel} onChange={handleEditChange}>
                    <option value="FRESHER">FRESHER</option>
                    <option value="ENTRY_LEVEL">ENTRY LEVEL</option>
                    <option value="EXPERIENCED">EXPERIENCED</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Source</label>
                  <select name="source" className="form-input" value={editFormData.source} onChange={handleEditChange}>
                    <option value="CAMPUS">CAMPUS</option>
                    <option value="COLLEGE">COLLEGE</option>
                    <option value="REFERRAL">REFERRAL</option>
                    <option value="JOB_PORTAL">JOB PORTAL</option>
                    <option value="COMPANY_WEBSITE">COMPANY WEBSITE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Engineer Notes</label>
                <textarea name="engineerNotes" className="form-input" rows="3" value={editFormData.engineerNotes} onChange={handleEditChange} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditing(false)} disabled={editLoading}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={Save} loading={editLoading} disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetail;
