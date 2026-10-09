import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ActivityTimeline from '../../components/common/ActivityTimeline';
import { getAdminStats } from '../../api/dashboard';
import {
  Users,
  Cpu,
  BookOpen,
  UserCheck,
  Calendar,
  Activity,
  ShieldAlert,
  Settings,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    candidates: 0,
    interviewEngineers: 0,
    instructors: 0,
    activeInterviews: 0,
    completedInterviews: 0
  });

  useEffect(() => {
    getAdminStats().then(setStats);
  }, []);

  return (
    <div>
      <PageHeader
        title={`System Administration`}
        subtitle="Platform health, staff provisioning, and organizational audit monitoring."
        badge={
          <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
            ROLE_ADMIN
          </span>
        }
        actions={
          <Link to="/admin/users">
            <Button variant="primary" size="sm" icon={Users}>
              Manage Users
            </Button>
          </Link>
        }
      />

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Platform Users"
          value={stats.totalUsers}
          subtitle="All registered roles"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Interview Engineers"
          value={stats.interviewEngineers}
          subtitle="Active intake managers"
          icon={Cpu}
          color="cyan"
        />
        <StatCard
          title="Instructors"
          value={stats.instructors}
          subtitle="Evaluation experts"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Registered Candidates"
          value={stats.candidates}
          subtitle="Assessment participants"
          icon={UserCheck}
          color="emerald"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Quick Management Actions */}
        <Card title="Administrative Actions" subtitle="Staff provisioning and access delegation">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <Link to="/admin/users" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <Users size={16} /> User Directory
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inspect and provision platform accounts.</div>
              </div>
            </Link>

            <Link to="/admin/engineers" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--info)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <Cpu size={16} /> Interview Engineers
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manage intake staff credentials.</div>
              </div>
            </Link>

            <Link to="/admin/instructors" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--accent-purple)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <BookOpen size={16} /> Instructors
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Configure evaluator permissions.</div>
              </div>
            </Link>

            <Link to="/admin/audit-logs" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--warning)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <Activity size={16} /> Security Audit
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Monitor authentication and event logs.</div>
              </div>
            </Link>
          </div>
        </Card>

        {/* System Status & Architecture Overview */}
        <Card title="Security & Multi-Tier Status" subtitle="Runtime tier health and authorization">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <ShieldCheck size={16} color="var(--success)" />
                <span>Spring Boot Security</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--success)' }}>JWT STATELESS</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Activity size={16} color="var(--info)" />
                <span>FastAPI AI Service</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--info)' }}>CONNECTED</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <UserCheck size={16} color="var(--accent-purple)" />
                <span>Role Authorities</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-purple)' }}>4 ROLES ENFORCED</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Log Timeline */}
      <Card title="System Activity & Audit Timeline" subtitle="Recent authentication and infrastructure events">
        <ActivityTimeline
          emptyMessage="No security events recorded yet. Authentication events will stream here."
          events={[]}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
