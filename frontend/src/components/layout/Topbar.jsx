import React from 'react';
import { Menu } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import RoleBadge from '../common/RoleBadge';
import { useAuth } from '../../auth/AuthContext';

export const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      {/* Left: Mobile Trigger & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMenuClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}
          className="mobile-menu-btn"
          aria-label="Toggle mobile menu"
        >
          <Menu size={18} />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right: Role Badge, Notifications, User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div className="desktop-role-badge">
          <RoleBadge role={user?.role} size="sm" />
        </div>

        <NotificationBell />

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }} />

        <UserMenu />
      </div>
    </header>
  );
};

export default Topbar;
