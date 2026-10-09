import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ActivityTimeline from '../../components/common/ActivityTimeline';
import { getInstructorStats } from '../../api/dashboard';
import {
  BookOpen,
  Users,
  Calendar,
  Sliders,
  FileText,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const InstructorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedCandidates: 0,
    pendingReviews: 0,
    upcomingInterviews: 0,
    inProgress: 0,
    completed: 0,
    reportsReady: 0
  });

  useEffect(() => {
    getInstructorStats().then(setStats);
  }, []);

  const instructorStages = [
    { title: 'Assigned Portfolio', count: stats.assignedCandidates, icon: Users, color: 'var(--accent-purple)', link: '/instructor/candidates' },
    { title: 'Candidate Review', count: stats.pendingReviews, icon: Clock, color: 'var(--warning)', link: '/instructor/candidates/pending' },
    { title: 'Interview Builder', count: stats.upcomingInterviews, icon: Sliders, color: 'var(--primary)', link: '/instructor/interviews/builder' },
    { title: 'Completed Sessions', count: stats.completed, icon: CheckCircle2, color: 'var(--info)', link: '/instructor/interviews/completed' },
    { title: 'Evaluation & Decision', count: stats.reportsReady, icon: FileText, color: 'var(--success)', link: '/instructor/reports' }
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Instructor'}`}
        subtitle="Review candidates, configure AI interviews, and evaluate assessment results."
        badge={
          <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--accent-purple-bg)', border: '1px solid var(--accent-purple-border)', color: 'var(--accent-purple)' }}>
            ROLE_INSTRUCTOR
          </span>
        }
        actions={
          <Link to="/instructor/interviews/builder">
            <Button variant="primary" size="sm" icon={Sliders}>
              Configure Interview
            </Button>
          </Link>
        }
      />

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Assigned Candidates"
          value={stats.assignedCandidates}
          subtitle="Routed by Engineers"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          subtitle="Profile inspection"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Scheduled Interviews"
          value={stats.upcomingInterviews}
          subtitle="Upcoming sessions"
          icon={Calendar}
          color="cyan"
        />
        <StatCard
          title="Reports for Review"
          value={stats.reportsReady}
          subtitle="Awaiting final decision"
          icon={FileText}
          color="emerald"
        />
      </div>

      {/* Instructor Workflow Visualizer */}
      <Card
        title="Instructor Review & Assessment Workflow"
        subtitle="End-to-end evaluation pipeline from portfolio review to candidate decision"
        style={{ marginBottom: '2rem' }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {instructorStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <Link key={idx} to={stage.link} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-highlight)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: stage.color
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {stage.count}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.75rem' }}>
                      {stage.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.2rem' }}>
                      Stage {idx + 1} <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Quick Actions + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Card title="Instructor Actions" subtitle="Assessment setup and review tasks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Link to="/instructor/candidates/pending" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={18} color="var(--accent-purple)" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Review Assigned Candidates</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inspect candidate resumes and tech profiles.</div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            </Link>

            <Link to="/instructor/interviews/builder" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sliders size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Interview Builder</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customize AI interview rubrics, difficulty, and questions.</div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            </Link>

            <Link to="/instructor/reports" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={18} color="var(--success)" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Review Reports & Make Decisions</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inspect multi-agent rubric scores and submit human decision.</div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            </Link>
          </div>
        </Card>

        <Card title="Instructor Activity" subtitle="Real-time evaluation logs">
          <ActivityTimeline
            emptyMessage="No evaluation activity yet. Interview submissions will appear here."
            events={[]}
          />
        </Card>
      </div>
    </div>
  );
};

export default InstructorDashboard;
