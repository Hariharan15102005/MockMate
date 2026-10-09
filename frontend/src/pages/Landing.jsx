import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  UserCheck, 
  Code2, 
  Layers, 
  CheckCircle, 
  GitPullRequest,
  Check
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';

export const Landing = () => {
  const { isAuthenticated, getRoleDashboardPath } = useAuth();

  return (
    <div className="main-content">
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '3rem 1rem 4rem 1rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-full)',
          color: '#a5b4fc',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={14} />
          <span>Production AI Recruitment & Assessment Platform</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1.5px',
          maxWidth: '900px',
          margin: '0 auto 1.5rem auto',
          background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Agentic AI Online Interview & Candidate Assessment
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          maxWidth: '700px',
          margin: '0 auto 2.5rem auto'
        }}>
          End-to-end multi-role recruitment engine featuring autonomous LangGraph evaluators, Monaco live coding sandbox, adaptive questioning, and human instructor decision workflows.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link to={getRoleDashboardPath()} className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <span>Go to My Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <span>Sign In to Platform</span>
              <ArrowRight size={18} />
            </Link>
          )}
          <Link to="/health-test" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            <span>System Health Monitor</span>
          </Link>
        </div>
      </div>


      {/* Business Workflow */}
      <div className="card mt-2 mb-4">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          The Four-Role Human-in-the-Loop Recruitment Workflow
        </h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>
          AgentHire enforces separation of concerns between Intake Engineers, Instructors, Candidates, and Admins.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#818cf8', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>STEP 1 • ADMIN</div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>User & System Setup</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configures Interview Engineers, Instructors, RBAC permissions, and global audit logs.</div>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>STEP 2 • ENGINEER</div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Candidate Intake & Routing</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ingests profile, verifies AI resume extraction, adds notes, and assigns to Instructor.</div>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>STEP 3 • INSTRUCTOR</div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Interview Customization</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Accepts candidate, selects interview rounds, weights, difficulty, and publishes session.</div>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#f472b6', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>STEP 4 • CANDIDATE</div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Live AI Assessment</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Undergoes device check, adaptive technical rounds, Monaco coding sandbox, and learning tasks.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
