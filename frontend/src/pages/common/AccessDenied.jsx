import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '../../auth/AuthContext';

export const AccessDenied = ({ allowedRoles = [], userRole = 'ANONYMOUS' }) => {
  const { user } = useAuth();
  const myDashboard = user ? getRoleDashboardPath(user.role) : '/login';

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="card text-center" style={{ maxWidth: 520, width: '100%', padding: '2.5rem 2rem' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.12)',
          color: '#f43f5e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
          boxShadow: '0 0 20px rgba(244, 63, 94, 0.2)'
        }}>
          <ShieldAlert size={32} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
          403 — Access Forbidden
        </h2>

        <p className="text-secondary" style={{ fontSize: '0.925rem', marginBottom: '1.5rem' }}>
          You are authenticated as <strong style={{ color: '#a5b4fc' }}>{userRole}</strong>, but this zone requires authorization for: <span style={{ color: '#fbbf24' }}>{allowedRoles.join(', ')}</span>.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={myDashboard} className="btn btn-primary">
            <Home size={16} />
            <span>Go to My Dashboard</span>
          </Link>
          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;

