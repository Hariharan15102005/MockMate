import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  Cpu,
  BookOpen,
  UserCheck,
  Calendar,
  FileText,
  Activity,
  Settings,
  Shield,
  UserPlus,
  Clock,
  Send,
  PlayCircle,
  CheckCircle2,
  BarChart3,
  Bell,
  Sparkles,
  User
} from 'lucide-react';

export const navigationConfig = {
  ADMIN: [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Users', path: '/admin/users', icon: Users },
    { title: 'Interview Engineers', path: '/admin/engineers', icon: Cpu },
    { title: 'Instructors', path: '/admin/instructors', icon: BookOpen },
    { title: 'Candidates', path: '/admin/candidates', icon: UserCheck },
    { title: 'Interviews', path: '/admin/interviews', icon: Calendar },
    { title: 'Audit Logs', path: '/admin/audit-logs', icon: Activity },
    { title: 'Settings', path: '/admin/settings', icon: Settings }
  ],
  INTERVIEW_ENGINEER: [
    { title: 'Dashboard', path: '/engineer/dashboard', icon: LayoutDashboard },
    {
      title: 'Candidates',
      path: '/engineer/candidates',
      icon: Users,
      children: [
        { title: 'All Candidates', path: '/engineer/candidates' },
        { title: 'Candidate Intake', path: '/engineer/candidates/intake' },
        { title: 'Pending Verification', path: '/engineer/candidates/pending' }
      ]
    },
    {
      title: 'Assignments',
      path: '/engineer/assignments',
      icon: Send,
      children: [
        { title: 'All Assignments', path: '/engineer/assignments' },
        { title: 'Sent to Instructors', path: '/engineer/assignments/sent' },
        { title: 'Pending Response', path: '/engineer/assignments/pending' }
      ]
    },
    {
      title: 'Interviews',
      path: '/engineer/interviews',
      icon: Calendar,
      children: [
        { title: 'All Interviews', path: '/engineer/interviews' },
        { title: 'Scheduled', path: '/engineer/interviews/scheduled' },
        { title: 'In Progress', path: '/engineer/interviews/in-progress' },
        { title: 'Completed', path: '/engineer/interviews/completed' }
      ]
    },
    { title: 'Reports', path: '/engineer/reports', icon: FileText },
    { title: 'Notifications', path: '/engineer/notifications', icon: Bell },
    { title: 'Profile', path: '/engineer/profile', icon: User }
  ],
  INSTRUCTOR: [
    { title: 'Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
    {
      title: 'Candidates',
      path: '/instructor/candidates',
      icon: Users,
      children: [
        { title: 'Assigned Candidates', path: '/instructor/candidates' },
        { title: 'Pending Review', path: '/instructor/candidates/pending' }
      ]
    },
    {
      title: 'Interviews',
      path: '/instructor/interviews',
      icon: Calendar,
      children: [
        { title: 'All Interviews', path: '/instructor/interviews' },
        { title: 'Interview Builder', path: '/instructor/interviews/builder' },
        { title: 'Scheduled', path: '/instructor/interviews/scheduled' },
        { title: 'In Progress', path: '/instructor/interviews/in-progress' },
        { title: 'Completed', path: '/instructor/interviews/completed' }
      ]
    },
    { title: 'Reports', path: '/instructor/reports', icon: FileText },
    { title: 'Analytics', path: '/instructor/analytics', icon: BarChart3 },
    { title: 'Notifications', path: '/instructor/notifications', icon: Bell },
    { title: 'Profile', path: '/instructor/profile', icon: User }
  ],
  CANDIDATE: [
    { title: 'Dashboard', path: '/candidate/dashboard', icon: LayoutDashboard },
    {
      title: 'My Interviews',
      path: '/candidate/interviews',
      icon: Calendar,
      children: [
        { title: 'All Interviews', path: '/candidate/interviews' },
        { title: 'Upcoming', path: '/candidate/interviews/upcoming' },
        { title: 'Completed', path: '/candidate/interviews/completed' }
      ]
    },
    { title: 'Profile', path: '/candidate/profile', icon: User }
  ]
};

export const Sidebar = ({ onNavigate }) => {
  const { user } = useAuth();
  const location = useLocation();

  const roleNav = navigationConfig[user?.role] || [];

  const isItemActive = (item) => {
    if (location.pathname === item.path) return true;
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return location.pathname.startsWith(item.path + '/');
  };

  return (
    <aside className="sidebar-desktop">
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={18} />
        </div>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            AgentHire
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Enterprise AI
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ padding: '0.25rem 0.75rem 0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Navigation
        </div>

        {roleNav.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          return (
            <div key={item.path} style={{ display: 'flex', flexDirection: 'column' }}>
              <Link
                to={item.path}
                onClick={onNavigate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: active ? '600' : '500',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: active ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {Icon && (
                  <Icon
                    size={18}
                    style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}
                  />
                )}
                <span>{item.title}</span>
              </Link>

              {/* Nested Child Links if Parent is Active */}
              {item.children && active && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginLeft: '2rem', marginTop: '0.25rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-color)' }}>
                  {item.children.map((child) => {
                    const isChildActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={onNavigate}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          fontWeight: isChildActive ? '600' : '400',
                          color: isChildActive ? 'var(--primary)' : 'var(--text-secondary)',
                          backgroundColor: isChildActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Role Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'var(--success)',
          boxShadow: '0 0 8px var(--success)'
        }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Session: <strong style={{ color: 'var(--text-secondary)' }}>JWT Verified</strong>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
