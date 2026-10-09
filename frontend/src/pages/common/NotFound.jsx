import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../components/common/Button';

export const NotFound = () => {
  const { user, getRoleDashboardPath } = useAuth();
  const returnPath = user ? getRoleDashboardPath(user.role) : '/';

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <div className="card text-center" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}
        >
          <HelpCircle size={32} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          404 — Page Not Found
        </h2>

        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          The requested page could not be located. It may have been moved or you may have entered an incorrect URL.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={returnPath}>
            <Button variant="primary" icon={Home}>
              Return to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" icon={ArrowLeft}>
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
