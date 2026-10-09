import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { getCandidateStats } from '../../api/dashboard';
import {
  Calendar,
  CheckCircle2,
  PlayCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Video,
  Code,
  MessageSquare
} from 'lucide-react';

export const CandidateDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingInterviews: 0,
    completedInterviews: 0,
    pendingAssessments: 0
  });

  useEffect(() => {
    getCandidateStats().then(setStats);
  }, []);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0] || 'Candidate'}`}
        subtitle="Prepare for your upcoming interviews and review your AI assessment reports."
        badge={
          <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>
            CANDIDATE
          </span>
        }
      />

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Upcoming Interviews"
          value={stats.upcomingInterviews}
          subtitle="Scheduled mock sessions"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Completed Assessments"
          value={stats.completedInterviews}
          subtitle="Past evaluations"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Session Status"
          value="Ready"
          subtitle="Device check & audio"
          icon={ShieldCheck}
          color="cyan"
        />
      </div>

      {/* Prominent Self-Service AI Resume Interview Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '1.25rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 500px', maxWidth: '700px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              🤖 AI RESUME INTERVIEW
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Practice a realistic one-to-one interview with an AI interviewer using your own resume.
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              The interviewer will ask about your projects, skills, technical knowledge, and behavioral experience. No instructor required. Start whenever you are ready.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#34d399" /> No instructor required
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#34d399" /> Resume project deep dives
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#34d399" /> Live conversational audio
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '220px' }}>
            <Link to="/candidate/interviews/self-service/precheck" style={{ width: '100%', textDecoration: 'none' }}>
              <Button
                variant="primary"
                size="lg"
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)',
                  cursor: 'pointer'
                }}
              >
                🚀 START AI INTERVIEW
              </Button>
            </Link>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
              Instant Self-Service Session
            </span>
          </div>
        </div>
      </div>

      {/* Main Upcoming Interview Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card title="Upcoming Mock Interview" subtitle="Your next scheduled AI assessment session">
          <EmptyState
            icon={Calendar}
            title="No interviews assigned yet"
            description="Your assigned Instructor will configure and schedule your mock interview shortly. You will be notified when it is ready."
            iconColor="indigo"
          />
        </Card>

        {/* Preparation Guide */}
        <Card title="Interview Room Preparation" subtitle="What to expect in your multi-agent interview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                <Video size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>1. Device & Camera Check</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Ensure stable microphone, camera, and network connection.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--info)' }}>
                <Code size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>2. Live Monaco Coding</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Solve algorithmic challenges in a real-time browser IDE.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)' }}>
                <MessageSquare size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>3. Adaptive AI Conversations</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Answer conceptual and STAR behavioral questions naturally.</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;
