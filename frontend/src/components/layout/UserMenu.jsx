import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import RoleBadge from '../common/RoleBadge';
import { User, LogOut, ChevronDown, Shield, Settings } from 'lucide-react';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const getProfilePath = () => {
    switch (user?.role) {
      case 'ADMIN':
        return '/admin/settings';
      case 'INTERVIEW_ENGINEER':
        return '/engineer/profile';
      case 'INSTRUCTOR':
        return '/instructor/profile';
      case 'CANDIDATE':
        return '/candidate/profile';
      default:
        return '/';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.375rem 0.625rem',
          borderRadius: 'var(--radius-md)',
          background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          transition: 'all 0.15s ease'
        }}
        aria-label="User menu"
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8125rem',
            fontWeight: '700'
          }}
        >
          {getInitials(user?.fullName)}
        </div>

        <div style={{ textAlign: 'left', display: 'none', flexDirection: 'column' }} className="user-text-container">
          <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {user?.fullName || 'User'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {user?.role}
          </span>
        </div>

        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '240px',
            padding: '0.5rem',
            boxShadow: 'var(--shadow-card)',
            zIndex: 50
          }}
        >
          {/* User Info Header */}
          <div style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
              {user?.email}
            </div>
            <RoleBadge role={user?.role} size="sm" />
          </div>

          {/* Links */}
          <div style={{ padding: '0.35rem 0', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <Link
              to={getProfilePath()}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <User size={15} />
              <span>My Profile</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/settings"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Settings size={15} />
                <span>System Settings</span>
              </Link>
            )}
          </div>

          {/* Logout Action */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: '#f87171',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
