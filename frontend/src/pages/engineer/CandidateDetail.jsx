import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ActivityTimeline from '../../components/common/ActivityTimeline';
import {
  getCandidateByIdApi,
  updateCandidateApi,
  verifyCandidateApi,
  rejectCandidateApi,
  getCandidateAuditApi,
  getCandidateResumesApi,
  uploadCandidateResumeApi,
  downloadResumeApi
} from '../../api/engineer';
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
  XCircle,
  Clock,
  Send,
  Sliders,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  History,
  Upload,
  Download,
  Brain,
  Sparkles,
  FileCode,
  Layers,
  Check,
  AlertTriangle
} from 'lucide-react';

export const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Verification Dialog
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Resume Upload Modal State
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);

  const fetchCandidateData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [candidateData, auditData, resumeList] = await Promise.all([
        getCandidateByIdApi(id),
        getCandidateAuditApi(id).catch(() => []),
        getCandidateResumesApi(id).catch(() => [])
      ]);

      setCandidate(candidateData);
      setAuditLogs(auditData || []);
      setResumes(resumeList || []);
      setEditFormData({
        fullName: candidateData.fullName,
        email: candidateData.email,
        phone: candidateData.phone,
        location: candidateData.location,
        college: candidateData.college,
        degree: candidateData.degree,
        department: candidateData.department,
        graduationYear: candidateData.graduationYear,
        cgpa: candidateData.cgpa ?? '',
        experienceLevel: candidateData.experienceLevel || 'FRESHER',
        appliedRole: candidateData.appliedRole,
        applicationId: candidateData.applicationId,
        source: candidateData.source || 'CAMPUS',
        engineerNotes: candidateData.engineerNotes || ''
      });
    } catch (err) {
      console.error('Failed to load candidate details:', err);
      setError(err.response?.status === 404 ? 'Candidate record not found.' : 'Unable to load candidate details from backend.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);

  // Handle Candidate Verification
  const handleVerifyCandidate = async () => {
    setVerifyLoading(true);
    try {
      const updated = await verifyCandidateApi(id);
      setCandidate(updated);
      setVerifyDialogOpen(false);
      setActionSuccess('Candidate has been verified successfully. Resume upload is now unlocked.');
      // Refresh audit logs
      const updatedAudit = await getCandidateAuditApi(id).catch(() => []);
      setAuditLogs(updatedAudit);
    } catch (err) {
      console.error('Verification failed:', err);
      alert(err.response?.data?.message || 'Failed to verify candidate.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle Candidate Rejection
  const handleRejectCandidate = async (e) => {
    e.preventDefault();
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectError('Please provide a specific reason for rejection.');
      return;
    }

    setRejectLoading(true);
    setRejectError(null);
    try {
      const updated = await rejectCandidateApi(id, trimmedReason);
      setCandidate(updated);
      setRejectModalOpen(false);
      setRejectionReason('');
      setActionSuccess('Candidate application has been rejected and recorded with reason.');
      // Refresh audit logs
      const updatedAudit = await getCandidateAuditApi(id).catch(() => []);
      setAuditLogs(updatedAudit);
    } catch (err) {
      console.error('Rejection failed:', err);
      setRejectError(err.response?.data?.message || 'Failed to reject candidate.');
    } finally {
      setRejectLoading(false);
    }
  };

  // Handle Resume Upload
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'docx') {
      setUploadError('Invalid format. Only PDF and DOCX files are supported.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleResumeUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF or DOCX file to upload.');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      const uploadedResume = await uploadCandidateResumeApi(id, selectedFile);
      setResumeModalOpen(false);
      setSelectedFile(null);
      setActionSuccess(`Resume '${uploadedResume.fileName}' uploaded and analyzed successfully (v${uploadedResume.version}).`);
      
      // Refresh resumes and audit logs
      const [updatedResumes, updatedAudit] = await Promise.all([
        getCandidateResumesApi(id),
        getCandidateAuditApi(id)
      ]);
      setResumes(updatedResumes || []);
      setAuditLogs(updatedAudit || []);
    } catch (err) {
      console.error('Resume upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload and analyze resume.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadResume = async (resumeItem) => {
    setDownloadLoadingId(resumeItem.id);
    try {
      await downloadResumeApi(resumeItem.id, resumeItem.fileName);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download resume file.');
    } finally {
      setDownloadLoadingId(null);
    }
  };

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
      setActionSuccess('Candidate details updated successfully.');
      const updatedAudit = await getCandidateAuditApi(id).catch(() => []);
      setAuditLogs(updatedAudit);
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        onRetry={fetchCandidateData}
      />
    );
  }

  const isPendingVerification = candidate.status === 'PENDING_VERIFICATION';
  const isVerified = candidate.status === 'VERIFIED';
  const isRejected = candidate.status === 'REJECTED';

  const currentResume = resumes.find((r) => r.isCurrent) || resumes[0];
  const historicalResumes = resumes.filter((r) => r.id !== currentResume?.id);

  const pipelineStages = [
    { name: 'Intake Created', status: 'completed', label: 'Completed' },
    {
      name: 'Verification',
      status: isVerified ? 'completed' : isRejected ? 'failed' : 'active',
      label: isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Review'
    },
    {
      name: 'Resume & AI Analysis',
      status: currentResume ? (currentResume.status === 'ANALYZED' ? 'completed' : currentResume.status === 'ANALYSIS_FAILED' ? 'failed' : 'active') : isVerified ? 'active' : 'upcoming',
      label: currentResume ? currentResume.status.replace(/_/g, ' ') : isVerified ? 'Ready for Upload' : 'Locked'
    },
    { name: 'Instructor Routing', status: 'upcoming', label: 'Phase 8' },
    { name: 'AI Interview', status: 'upcoming', label: 'Phase 9+' }
  ];

  // Map audit logs to ActivityTimeline format
  const timelineEvents = auditLogs.map((log) => {
    let type = 'default';
    if (log.action === 'CANDIDATE_VERIFIED' || log.action === 'RESUME_ANALYSIS_COMPLETED') type = 'success';
    else if (log.action === 'CANDIDATE_REJECTED' || log.action === 'RESUME_ANALYSIS_FAILED') type = 'alert';
    else if (log.action === 'RESUME_UPLOADED' || log.action === 'RESUME_ANALYSIS_STARTED') type = 'report';
    else if (log.action === 'CANDIDATE_CREATED') type = 'report';

    const actorName = log.actor?.fullName || 'System User';
    return {
      id: log.id,
      title: log.action.replace(/_/g, ' '),
      type,
      description: `${log.description} (${actorName})`,
      timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : ''
    };
  });

  return (
    <div>
      <PageHeader
        title={candidate.fullName}
        subtitle={`Application ID: ${candidate.applicationId} • Applied for ${candidate.appliedRole}`}
        badge={<StatusBadge status={candidate.status} />}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/engineer/candidates">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to List
              </Button>
            </Link>

            {isPendingVerification && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => setVerifyDialogOpen(true)}
                  disabled={verifyLoading}
                >
                  Verify Candidate
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  onClick={() => {
                    setRejectError(null);
                    setRejectionReason('');
                    setRejectModalOpen(true);
                  }}
                  disabled={rejectLoading}
                >
                  Reject Candidate
                </Button>
              </>
            )}

            {isVerified && (
              <Button
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={() => {
                  setSelectedFile(null);
                  setUploadError(null);
                  setResumeModalOpen(true);
                }}
              >
                {currentResume ? 'Upload New Resume Version' : 'Upload Resume'}
              </Button>
            )}

            <Button variant="secondary" size="sm" icon={Edit} onClick={() => setIsEditing(true)}>
              Edit Details
            </Button>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Verification / Rejection Status Metadata Banner */}
      {isVerified && candidate.verifiedBy && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--success)', fontSize: '0.95rem' }}>
              Candidate Verification Completed
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Verified by <strong style={{ color: 'var(--text-primary)' }}>{candidate.verifiedBy.fullName}</strong> ({candidate.verifiedBy.email}) on{' '}
              {candidate.verifiedAt ? new Date(candidate.verifiedAt).toLocaleString() : '—'}
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', marginTop: '0.15rem' }}>
            <XCircle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '0.95rem' }}>
              Candidate Application Rejected
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Rejected by <strong style={{ color: 'var(--text-primary)' }}>{candidate.rejectedBy?.fullName || 'Interview Engineer'}</strong> on{' '}
              {candidate.rejectedAt ? new Date(candidate.rejectedAt).toLocaleString() : '—'}
            </div>
            {candidate.rejectionReason && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <strong style={{ color: 'var(--danger)', display: 'block', marginBottom: '0.25rem' }}>Rejection Reason:</strong>
                {candidate.rejectionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Pipeline Progression Indicator */}
      <Card title="Recruitment Pipeline Progression" subtitle="Current status in recruitment lifecycle" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
          {pipelineStages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isActive = stage.status === 'active';
            const isFailed = stage.status === 'failed';

            let bgColor = 'rgba(255, 255, 255, 0.02)';
            let borderColor = 'var(--border-color)';
            let tagColor = 'var(--text-muted)';

            if (isCompleted) {
              bgColor = 'rgba(16, 185, 129, 0.08)';
              borderColor = 'var(--success-border)';
              tagColor = 'var(--success)';
            } else if (isActive) {
              bgColor = 'rgba(99, 102, 241, 0.1)';
              borderColor = 'var(--primary)';
              tagColor = 'var(--primary)';
            } else if (isFailed) {
              bgColor = 'rgba(239, 68, 68, 0.08)';
              borderColor = 'var(--danger-border)';
              tagColor = 'var(--danger)';
            }

            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: tagColor }}>
                    STAGE {idx + 1}
                  </span>
                  {isCompleted ? <CheckCircle2 size={14} color="var(--success)" /> : isFailed ? <XCircle size={14} color="var(--danger)" /> : isActive ? <Clock size={14} color="var(--primary)" /> : null}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {stage.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: tagColor }}>
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* RESUME MANAGEMENT SECTION (PHASE 7) */}
      <Card
        title="Candidate Resume & AI Analysis"
        subtitle="Resume document management, versioning, and LangGraph-powered analysis"
        style={{ marginBottom: '2rem' }}
      >
        {!isVerified && !currentResume ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.01)'
            }}
          >
            <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Resume Upload Locked
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0.35rem auto 0' }}>
              Candidate must be <strong>VERIFIED</strong> before a resume can be uploaded and processed for AI analysis.
            </p>
          </div>
        ) : !currentResume ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.02)'
            }}
          >
            <FileText size={42} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              No Resume Uploaded
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '450px', margin: '0.5rem auto 1.25rem' }}>
              Upload the candidate's PDF or DOCX resume document to extract structured skill profiles, experience timelines, and AI role relevance.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={Upload}
              onClick={() => {
                setSelectedFile(null);
                setUploadError(null);
                setResumeModalOpen(true);
              }}
            >
              Upload Candidate Resume
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Active Resume Card */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--primary)'
                  }}
                >
                  <FileText size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {currentResume.fileName}
                    </span>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: 'var(--primary)',
                        fontSize: '0.725rem',
                        fontWeight: '700'
                      }}
                    >
                      v{currentResume.version} (Active)
                    </span>
                    <StatusBadge status={currentResume.status} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Uploaded {currentResume.uploadedAt ? new Date(currentResume.uploadedAt).toLocaleString() : '—'} • {formatFileSize(currentResume.fileSize)} • By {currentResume.uploadedBy?.fullName || 'Interview Engineer'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                {currentResume.status === 'ANALYZED' && (
                  <Link to={`/engineer/resumes/${currentResume.id}/analysis`}>
                    <Button variant="primary" size="sm" icon={Brain}>
                      View Analysis
                    </Button>
                  </Link>
                )}

                {currentResume.status === 'PROCESSING' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', fontSize: '0.85rem' }}>
                    <Clock size={16} />
                    <span>Analyzing resume...</span>
                  </div>
                )}

                {currentResume.status === 'ANALYSIS_FAILED' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} />
                    <span>Analysis Failed</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  loading={downloadLoadingId === currentResume.id}
                  onClick={() => handleDownloadResume(currentResume)}
                >
                  Download
                </Button>
              </div>
            </div>

            {/* Historical Resumes (if > 1) */}
            {historicalResumes.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Previous Resume Versions ({historicalResumes.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {historicalResumes.map((hist) => (
                    <div
                      key={hist.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <FileText size={16} color="var(--text-muted)" />
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{hist.fileName}</span>
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>v{hist.version}</span>
                        <StatusBadge status={hist.status} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {hist.uploadedAt ? new Date(hist.uploadedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {hist.status === 'ANALYZED' && (
                          <Link to={`/engineer/resumes/${hist.id}/analysis`}>
                            <Button variant="ghost" size="sm">Analysis</Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Download}
                          loading={downloadLoadingId === hist.id}
                          onClick={() => handleDownloadResume(hist)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Verification History & Audit Trail Section */}
      <Card
        title="Verification History & Audit Trail"
        subtitle="Chronological lifecycle transitions and administrative actions"
        style={{ marginBottom: '2rem' }}
      >
        <ActivityTimeline
          events={timelineEvents}
          emptyMessage="No verification history or lifecycle audit logs recorded yet."
        />
      </Card>

      {/* RESUME UPLOAD MODAL */}
      {resumeModalOpen && (
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
          onClick={() => !uploadLoading && setResumeModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {currentResume ? 'Upload New Resume Version' : 'Upload Candidate Resume'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !uploadLoading && setResumeModalOpen(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {uploadError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleResumeUploadSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Select Resume File *</label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: selectedFile ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                    borderColor: selectedFile ? 'var(--primary)' : 'var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('resume-file-input')?.click()}
                >
                  <input
                    id="resume-file-input"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    disabled={uploadLoading}
                  />

                  {selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <FileText size={32} color="var(--primary)" />
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {selectedFile.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <Upload size={32} color="var(--text-muted)" />
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        Click to browse file
                      </span>
                      <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        Supported formats: PDF, DOCX (Max 10 MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  fontSize: '0.775rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.5rem',
                  lineHeight: 1.4
                }}
              >
                Upon upload, text is extracted server-side and automatically processed by the LangGraph AI Service for structured skill and experience extraction.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setResumeModalOpen(false)} disabled={uploadLoading}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={uploadLoading} disabled={uploadLoading || !selectedFile}>
                  {uploadLoading ? 'Uploading & Analyzing...' : 'Upload & Analyze'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFICATION CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={verifyDialogOpen}
        title="Verify Candidate Intake?"
        message={`You are confirming that ${candidate.fullName}'s submitted intake parameters and background eligibility have been reviewed and approved for the next recruitment stage.`}
        confirmLabel={verifyLoading ? 'Verifying...' : 'Verify Candidate'}
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleVerifyCandidate}
        onCancel={() => !verifyLoading && setVerifyDialogOpen(false)}
      />

      {/* REJECTION MODAL */}
      {rejectModalOpen && (
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
          onClick={() => !rejectLoading && setRejectModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={22} color="var(--danger)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Reject Candidate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !rejectLoading && setRejectModalOpen(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {rejectError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleRejectCandidate}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Reason for Rejection *</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rejectionReason.length} / 1000</span>
                </label>
                <textarea
                  className="form-input"
                  rows="4"
                  maxLength={1000}
                  placeholder="Provide detailed justification (e.g. academic criteria unmet, duplicate application, unverified profile)..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setRejectError(null);
                  }}
                  required
                  autoFocus
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: 0 }}>
                  This reason will be permanently recorded in the candidate's recruitment audit history.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setRejectModalOpen(false)} disabled={rejectLoading}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" type="submit" loading={rejectLoading} disabled={rejectLoading || !rejectionReason.trim()}>
                  {rejectLoading ? 'Rejecting...' : 'Reject Candidate'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
