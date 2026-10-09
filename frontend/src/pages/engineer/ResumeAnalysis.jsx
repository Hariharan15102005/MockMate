import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  getResumeAnalysisApi,
  getResumeByIdApi,
  downloadResumeApi
} from '../../api/engineer';
import {
  ArrowLeft,
  Download,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  Layers,
  FileText,
  Info,
  ExternalLink,
  Target,
  Database,
  Cpu,
  Wrench
} from 'lucide-react';

export const ResumeAnalysis = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalysisData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analysisData, resumeData] = await Promise.all([
        getResumeAnalysisApi(resumeId),
        getResumeByIdApi(resumeId)
      ]);
      setAnalysis(analysisData);
      setResume(resumeData);
    } catch (err) {
      console.error('Failed to load resume analysis:', err);
      setError(
        err.response?.status === 404
          ? 'Resume analysis report was not found or is still being generated.'
          : 'Failed to retrieve resume analysis from server.'
      );
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const handleDownload = async () => {
    if (!resume) return;
    setDownloading(true);
    try {
      await downloadResumeApi(resume.id, resume.fileName);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download resume file.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ width: '40%', height: '32px', marginBottom: '24px' }} />
        <LoadingSkeleton type="card" style={{ marginBottom: '16px' }} />
        <LoadingSkeleton type="card" style={{ marginBottom: '16px' }} />
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <ErrorState
        title="Resume Analysis Unavailable"
        message={error || 'The analysis for this resume could not be loaded.'}
        onRetry={fetchAnalysisData}
      />
    );
  }

  const roleRelevance = analysis.roleRelevance || {};
  const score = roleRelevance.score != null ? Math.round(roleRelevance.score) : null;

  return (
    <div>
      <PageHeader
        title="AI Resume Analysis"
        subtitle={`Resume Document: ${resume?.fileName || 'resume.pdf'} (v${resume?.version || 1}) • Analysis Version ${analysis.analysisVersion || '1.0.0'}`}
        badge={<StatusBadge status={resume?.status || 'ANALYZED'} />}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate(resume?.candidateId ? `/engineer/candidates/${resume.candidateId}` : '/engineer/candidates')}
            >
              Back to Candidate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              loading={downloading}
              onClick={handleDownload}
            >
              Download Resume
            </Button>
          </div>
        }
      />

      {/* AI DISCLAIMER BANNER */}
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
            AI-Assisted Candidate Analysis
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            This analysis supports interviewer and recruiter review and does not make automated or final hiring decisions. All extracted skills, experience, and scores are assistive insights.
          </div>
        </div>
      </div>

      {/* ROLE RELEVANCE & SUMMARY SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Role Relevance Card */}
        <Card title="Role Relevance & Alignment" subtitle="AI evaluation against target job requirements">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
            {score != null && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: score >= 75 ? 'rgba(16, 185, 129, 0.12)' : score >= 50 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `3px solid ${score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'}`,
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                  {score}%
                </span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Match
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {score >= 80 ? 'High Role Alignment' : score >= 60 ? 'Moderate Role Alignment' : 'Developing Alignment'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                {roleRelevance.reason || 'Candidate demonstrates relevant foundational qualifications for this position.'}
              </div>
            </div>
          </div>
        </Card>

        {/* Professional Summary */}
        <Card title="Candidate Summary" subtitle="Synthesized professional profile">
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {analysis.summary ? (
              <p style={{ margin: 0 }}>{analysis.summary}</p>
            ) : (
              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No summary extracted from document.</span>
            )}
          </div>
        </Card>
      </div>

      {/* SKILLS & TECHNICAL STACK */}
      <Card title="Technical & Domain Competencies" subtitle="Normalized skills and technology stack extracted from resume" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
          {/* Primary Extracted Skills */}
          {analysis.skills && analysis.skills.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code2 size={15} color="var(--primary)" />
                <span>Primary Skills & Keywords</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {analysis.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: 'var(--primary)',
                      fontSize: '0.825rem',
                      fontWeight: '600'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Stack Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            {analysis.languages && analysis.languages.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Cpu size={13} />
                  <span>Programming Languages</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {analysis.languages.map((l, i) => (
                    <span key={i} className="badge badge-secondary" style={{ fontSize: '0.775rem' }}>{l}</span>
                  ))}
                </div>
              </div>
            )}

            {analysis.frameworks && analysis.frameworks.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Layers size={13} />
                  <span>Frameworks & Libraries</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {analysis.frameworks.map((f, i) => (
                    <span key={i} className="badge badge-secondary" style={{ fontSize: '0.775rem' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {analysis.databases && analysis.databases.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Database size={13} />
                  <span>Databases & Storage</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {analysis.databases.map((d, i) => (
                    <span key={i} className="badge badge-secondary" style={{ fontSize: '0.775rem' }}>{d}</span>
                  ))}
                </div>
              </div>
            )}

            {analysis.tools && analysis.tools.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Wrench size={13} />
                  <span>Tools & DevOps</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {analysis.tools.map((t, i) => (
                    <span key={i} className="badge badge-secondary" style={{ fontSize: '0.775rem' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* EXPERIENCE & PROJECTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Experience */}
        <Card title="Work & Internship Experience" subtitle="Extracted employment and internship records">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {analysis.experience && analysis.experience.length > 0 ? (
              analysis.experience.map((exp, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {exp.role || 'Role'}
                    </div>
                    {exp.duration && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.duration}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginTop: '0.2rem' }}>
                    {exp.company || 'Company'}
                  </div>
                  {exp.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0, lineHeight: 1.5 }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No explicit corporate experience listed (Fresher profile).
              </div>
            )}
          </div>
        </Card>

        {/* Projects */}
        <Card title="Key Projects" subtitle="Technical and academic software projects">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {analysis.projects && analysis.projects.length > 0 ? (
              analysis.projects.map((proj, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {proj.name || 'Project Name'}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem', marginBottom: '0.5rem' }}>
                      {proj.technologies.map((t, i) => (
                        <span key={i} className="badge badge-secondary" style={{ fontSize: '0.725rem' }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {proj.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {proj.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No specific projects identified in resume text.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* EDUCATION & CERTIFICATIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Education */}
        <Card title="Academic Background" subtitle="Degrees and higher education institutions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
            {analysis.education && analysis.education.length > 0 ? (
              analysis.education.map((edu, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ padding: '0.4rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', marginTop: '0.2rem' }}>
                    <GraduationCap size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {edu.degree || 'Degree'} {edu.field ? `in ${edu.field}` : ''}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {edu.institution || 'University / Institution'}
                    </div>
                    {edu.graduationYear && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Graduation Year: {edu.graduationYear}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No specific academic history identified.
              </div>
            )}
          </div>
        </Card>

        {/* Certifications */}
        <Card title="Certifications & Credentials" subtitle="Professional and technical accreditations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
            {analysis.certifications && analysis.certifications.length > 0 ? (
              analysis.certifications.map((cert, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Award size={16} color="var(--primary)" />
                  <span>{cert}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No certifications found in resume.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* STRENGTHS & POTENTIAL GAPS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Strengths */}
        <Card title="Key Identified Strengths" subtitle="Noteworthy areas of candidate competence">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {analysis.strengths && analysis.strengths.length > 0 ? (
              analysis.strengths.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  <span>{s}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No specific strength highlights provided.
              </div>
            )}
          </div>
        </Card>

        {/* Potential Discovery Gaps */}
        <Card title="Potential Discovery Areas & Gaps" subtitle="Topics recommended for interview verification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {analysis.potentialGaps && analysis.potentialGaps.length > 0 ? (
              analysis.potentialGaps.map((g, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <AlertTriangle size={16} color="var(--warning)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  <span>{g}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No notable gaps flagged.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResumeAnalysis;
