import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Sparkles, Terminal, Shield, LogOut, LogIn, UserPlus, User } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, getRoleDashboardPath } = useAuth();

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' };
      case 'INTERVIEW_ENGINEER':
        return { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8' };
      case 'INSTRUCTOR':
        return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' };
      default:
        return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ade80' };
    }
  };

  return (
    <nav className="navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(10, 15, 29, 0.75)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
        }}>
          <Sparkles size={18} />
        </div>
        <span>AgentHire</span>
        <span className="brand-badge" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc', fontWeight: '600' }}>
          Auth & RBAC
        </span>
      </Link>

      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link 
          to="/health-test" 
          className={`nav-link ${location.pathname === '/health-test' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: location.pathname === '/health-test' ? 'white' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}
        >
          <Activity size={16} />
          <span>Health Monitor</span>
        </Link>

        {isAuthenticated && (
          <Link 
            to={getRoleDashboardPath()} 
            className={`nav-link ${location.pathname.includes('/dashboard') ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: location.pathname.includes('/dashboard') ? 'white' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}
          >
            <Shield size={16} />
            <span>Dashboard</span>
          </Link>
        )}

        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user?.role && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                background: getRoleBadgeStyle(user.role).bg,
                border: `1px solid ${getRoleBadgeStyle(user.role).border}`,
                color: getRoleBadgeStyle(user.role).text
              }}>
                {user.role}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.88rem', fontWeight: '500' }}>
              <User size={16} color="var(--text-secondary)" />
              <span>{user?.fullName?.split(' ')[0]}</span>
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              title="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: '500'
              }}
            >
              <LogIn size={15} />
              <span>Login</span>
            </Link>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: '600'
              }}
            >
              <UserPlus size={15} />
              <span>Register</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
