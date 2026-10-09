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
