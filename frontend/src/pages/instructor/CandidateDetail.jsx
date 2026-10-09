import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getAssignedCandidateDetailApi,
  acceptAssignmentApi,
  declineAssignmentApi
} from '../../api/instructor';
import { downloadResumeApi } from '../../api/engineer';
import {
  ArrowLeft,
  Download,
  Brain,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  Layers,
  FileText,
  UserCheck,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Send,
  Database,
  Cpu,
  Wrench,
  Clock,
  Check,
  XCircle,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const InstructorCandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Decision States
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignedCandidateDetailApi(id);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load assigned candidate:', err);
      setError(
        err.response?.status === 404
          ? 'Candidate was not found or is not assigned to your instructor account.'
          : 'Failed to retrieve candidate details.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDownload = async () => {
    if (!detail?.currentResume) return;
    setDownloading(true);
    try {
      await downloadResumeApi(detail.currentResume.id, detail.currentResume.fileName);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download resume.');
    } finally {
      setDownloading(false);
    }
  };

  const handleAcceptAssignment = async () => {
    if (!detail?.assignment?.id) return;
    setSubmittingAction(true);
    setActionError(null);
    try {
      const updatedAssignment = await acceptAssignmentApi(detail.assignment.id);
      setShowAcceptConfirm(false);
      setActionSuccess('Candidate assignment successfully accepted. Profile is ready for interview configuration.');
      setDetail((prev) => ({
        ...prev,
        assignment: updatedAssignment,
        candidate: {
          ...prev.candidate,
          status: 'ACCEPTED_BY_INSTRUCTOR'
        }
      }));
    } catch (err) {
      console.error('Accept assignment error:', err);
      setActionError(
        err.response?.data?.message || err.response?.data?.error || 'Failed to accept candidate assignment.'
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeclineAssignment = async (e) => {
    e.preventDefault();
    if (!detail?.assignment?.id) return;
    if (!declineReason.trim()) {
      setActionError('Please provide a specific reason for declining the candidate.');
      return;
    }

    setSubmittingAction(true);
    setActionError(null);
    try {
      const updatedAssignment = await declineAssignmentApi(detail.assignment.id, {
        reason: declineReason.trim()
      });
      setShowDeclineModal(false);
      setDeclineReason('');
      setActionSuccess('Candidate assignment declined. Notification dispatched to Interview Engineer.');
      setDetail((prev) => ({
        ...prev,
        assignment: updatedAssignment,
        candidate: {
          ...prev.candidate,
          status: 'VERIFIED'
        }
      }));
    } catch (err) {
      console.error('Decline assignment error:', err);
      setActionError(
        err.response?.data?.message || err.response?.data?.error || 'Failed to decline candidate assignment.'
      );
    } finally {
      setSubmittingAction(false);
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

  if (error || !detail) {
    return (
      <ErrorState
        title="Candidate Profile Unavailable"
        message={error || 'Unable to load candidate review portfolio.'}
        onRetry={fetchDetail}
      />
    );
  }

  const { candidate, assignment, currentResume, resumeAnalysis } = detail;
  const roleRelevance = resumeAnalysis?.roleRelevance || {};
  const score = roleRelevance.score != null ? Math.round(roleRelevance.score) : null;
  const isSentStatus = assignment?.status === 'SENT';
  const isAccepted = assignment?.status === 'ACCEPTED';
  const isDeclined = assignment?.status === 'DECLINED';

  return (
    <div>
      {/* Top Breadcrumb & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <Link
          to="/instructor/candidates"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} /> Back to Assigned Candidates
        </Link>

        {isSentStatus && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setActionError(null);
                setShowDeclineModal(true);
              }}
              style={{ borderColor: 'var(--danger-border)', color: 'var(--danger)' }}
            >
              <XCircle size={15} style={{ marginRight: '0.35rem' }} /> Decline Candidate
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActionError(null);
                setShowAcceptConfirm(true);
              }}
            >
              <CheckCircle2 size={15} style={{ marginRight: '0.35rem' }} /> Accept Candidate
            </Button>
          </div>
        )}
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={18} />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {actionError && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Acceptance Status Highlight Banner */}
      {isAccepted && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>READY FOR INTERVIEW CONFIGURATION</span>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>ACCEPTED</span>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Accepted by {assignment.acceptedByName || 'You'} on{' '}
                {assignment.acceptedAt ? new Date(assignment.acceptedAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Declined Status Banner */}
      {isDeclined && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                flexShrink: 0
              }}
            >
              <XCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>CANDIDATE ASSIGNMENT DECLINED</span>
                <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>DECLINED</span>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Declined by {assignment.declinedByName || 'Instructor'} on{' '}
                {assignment.declinedAt ? new Date(assignment.declinedAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}.
              </div>
              {assignment.declineReason && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <strong>Reason provided: </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{assignment.declineReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Candidate Overview Header Card */}
      <Card style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {candidate.fullName}
              </h1>
              <StatusBadge status={assignment?.status || candidate.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Briefcase size={15} color="var(--primary)" /> {candidate.appliedRole}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Code2 size={15} color="var(--primary)" /> {candidate.applicationId}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} /> Assigned {new Date(assignment?.assignedAt || candidate.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentResume ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download size={14} style={{ marginRight: '0.35rem' }} />
                {downloading ? 'Downloading...' : 'Download Resume'}
              </Button>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No resume attached</span>
            )}
          </div>
        </div>
      </Card>

      {/* Engineer Assignment Routing Message */}
      {assignment?.engineerMessage && (
        <Card
          title="Interview Engineer Instructions"
          subtitle={`Dispatched by Engineer: ${assignment.engineer?.fullName || 'Interview Operations'}`}
          style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--primary)' }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              marginTop: '0.5rem',
              fontStyle: 'italic'
            }}
          >
            "{assignment.engineerMessage}"
          </div>
        </Card>
      )}

      {/* Candidate Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Academic & Professional Background */}
        <Card title="Candidate Academic Background" subtitle="Verified education details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>College / University:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{candidate.college || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Degree & Department:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                {candidate.degree ? `${candidate.degree} - ${candidate.department || ''}` : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Graduation Year:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{candidate.graduationYear || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cumulative CGPA:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                {candidate.cgpa != null ? `${candidate.cgpa} / 10.0` : 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Contact & Verification Summary */}
        <Card title="Contact & Intake Verification" subtitle="Verified candidate information">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{candidate.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{candidate.phone || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Location:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{candidate.location || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Verification Status:</span>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                <ShieldCheck size={12} style={{ marginRight: '0.25rem' }} /> VERIFIED
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI-Assisted Resume Intelligence Section */}
      {resumeAnalysis ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>
            <Brain size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              AI-Assisted Resume Analysis
            </h2>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>LangGraph Evaluated</span>
          </div>

          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Responsible AI Review:</strong> AI analysis scores and gap assessments are predictive recommendations
              to accelerate evaluation. Final evaluation and interview configuration remain at the instructor's discretion.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            {/* Match Score & Analysis */}
            <Card title="AI Role Relevance" subtitle="Candidate alignment against job profile">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                {score != null && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: score >= 75 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      border: `3px solid ${score >= 75 ? 'var(--success)' : 'var(--warning)'}`,
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: '1.4rem', fontWeight: '800', color: score >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                      {score}%
                    </span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Match</span>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {score >= 80 ? 'High Technical Fit' : 'Moderate Technical Alignment'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {roleRelevance.reason || 'Candidate has relevant qualifications.'}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Professional Summary" subtitle="Synthesized resume summary">
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.5rem' }}>
                {resumeAnalysis.summary || 'No summary extracted.'}
              </div>
            </Card>
          </div>

          {/* Technical Competencies */}
          <Card title="Extracted Technical Stack" subtitle="Skills, languages, frameworks, and databases" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {resumeAnalysis.skills?.map((s, i) => (
                <span key={i} className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                  {s}
                </span>
              ))}
            </div>
          </Card>

          {/* Strengths & Potential Exploration Gaps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <Card title="Identified Strengths" subtitle="Areas of strong candidate competence">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {resumeAnalysis.strengths?.map((str, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={15} color="var(--success)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Recommended Interview Exploration Points" subtitle="Potential gaps and technical probe topics">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {resumeAnalysis.potentialGaps?.map((gap, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <AlertTriangle size={15} color="var(--warning)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            No Resume Analysis Available
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Candidate resume document is attached and available for download.
          </p>
        </Card>
      )}

      {/* Confirm Accept Dialog */}
      <ConfirmDialog
        isOpen={showAcceptConfirm}
        title="Accept Candidate for Review?"
        message={`You are accepting candidate ${candidate.fullName} for ${candidate.appliedRole}. This candidate will be transitioned to READY FOR INTERVIEW CONFIGURATION and the Interview Engineer will be notified.`}
        confirmLabel={submittingAction ? 'Accepting...' : 'Accept Candidate'}
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleAcceptAssignment}
        onCancel={() => !submittingAction && setShowAcceptConfirm(false)}
      />

      {/* Decline Modal */}
      {showDeclineModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 999
          }}
          onClick={() => !submittingAction && setShowDeclineModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !submittingAction && setShowDeclineModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div
                style={{
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--danger)'
                }}
              >
                <XCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                  Decline Candidate Assignment
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Provide a mandatory evaluation rationale for declining {candidate.fullName}.
                </p>
              </div>
            </div>

            <form onSubmit={handleDeclineAssignment}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="declineReason"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.4rem'
                  }}
                >
                  Decline Reason *
                </label>
                <textarea
                  id="declineReason"
                  rows={4}
                  maxLength={1000}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Candidate does not meet the minimum Spring Boot and microservices architectural requirements for this track."
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {declineReason.length} / 1000 characters
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeclineModal(false)}
                  disabled={submittingAction}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={submittingAction || !declineReason.trim()}
                >
                  {submittingAction ? 'Declining...' : 'Confirm Decline'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCandidateDetail;
