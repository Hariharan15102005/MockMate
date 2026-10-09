import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const Breadcrumbs = () => {
  const location = useLocation();
  const { user, getRoleDashboardPath } = useAuth();

  const pathnames = location.pathname.split('/').filter((x) => x);
  const homePath = user ? getRoleDashboardPath(user.role) : '/';

  const formatSegment = (segment) => {
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
      <Link
        to={homePath}
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          transition: 'color 0.15s ease'
        }}
      >
        <Home size={14} />
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={to}>
            <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
            {isLast ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                {formatSegment(value)}
              </span>
            ) : (
              <Link
                to={to}
                style={{
                  color: 'var(--text-secondary)',
                  transition: 'color 0.15s ease'
                }}
              >
                {formatSegment(value)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
