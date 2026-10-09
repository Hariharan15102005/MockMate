import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { getAssignedCandidateDetailApi } from '../../api/instructor';
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
  Clock
} from 'lucide-react';

export const InstructorCandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div>
      <PageHeader
        title={candidate.fullName}
        subtitle={`Application ID: ${candidate.applicationId} • Target Role: ${candidate.appliedRole}`}
        badge={<StatusBadge status={assignment?.status || candidate.status} />}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/instructor/candidates">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to Assigned Candidates
              </Button>
            </Link>

            {currentResume && (
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                loading={downloading}
                onClick={handleDownload}
              >
                Download Resume ({currentResume.fileName})
              </Button>
            )}
          </div>
        }
      />

      {/* AI DISCLAIMER & REVIEW CONTEXT BANNER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: 'var(--text-primary)',
          marginBottom: '1.75rem',
          fontSize: '0.875rem'
        }}
      >
        <div
          style={{
            padding: '0.5rem',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.2)',
            color: 'var(--primary)',
            flexShrink: 0
          }}
        >
          <Brain size={20} />
        </div>
        <div>
          <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.95rem' }}>
            Instructor Review Package — AI-Assisted Assessment
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            This profile and AI resume analysis support your domain evaluation and interview configuration (Phase 9+). Automated scores and keywords serve as assistive review signals.
          </div>
        </div>
      </div>

      {/* ASSIGNMENT & ENGINEER CONTEXT CARD */}
      {assignment && (
        <Card
          title="Intake Routing & Engineer Notes"
          subtitle={`Forwarded by ${assignment.engineer?.fullName || 'Interview Engineer'} (${assignment.engineer?.department || 'Intake Operations'})`}
          style={{ marginBottom: '1.75rem' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Interview Track</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)' }}>{assignment.interviewType || 'TECHNICAL'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Routing Priority</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: assignment.priority === 'HIGH' ? 'var(--danger)' : 'var(--text-primary)' }}>
                {assignment.priority || 'MEDIUM'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Date</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assignment Status</div>
              <div><StatusBadge status={assignment.status} size="sm" /></div>
            </div>
          </div>

          {assignment.engineerMessage && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}
            >
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                Engineer Instructions:
              </strong>
              {assignment.engineerMessage}
            </div>
          )}
        </Card>
      )}

      {/* CANDIDATE PROFILE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Personal & Contact Details */}
        <Card title="Candidate Background" subtitle="Contact and location data">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{candidate.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.location || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Experience Level</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.experienceLevel || 'FRESHER'}</div>
            </div>
          </div>
        </Card>

        {/* Academic Details */}
        <Card title="Academic Qualifications" subtitle="College and degrees">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>College / University</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{candidate.college}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Degree</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.degree}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.department}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Graduation Year</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{candidate.graduationYear}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CGPA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: candidate.cgpa ? 'var(--success)' : 'var(--text-muted)' }}>
                  {candidate.cgpa ? `${candidate.cgpa} / 10.0` : '—'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* AI RESUME ANALYSIS SECTION (IF AVAILABLE) */}
      {resumeAnalysis ? (
        <>
          {/* Role Alignment & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
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
    </div>
  );
};

export default InstructorCandidateDetail;
