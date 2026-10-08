import React from 'react';
import { useAuth } from './AuthContext';
import { AccessDenied } from '../pages/common/AccessDenied';

export const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Checking role permissions...</div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <AccessDenied allowedRoles={allowedRoles} userRole={user?.role} />;
  }

  return children;
};

export default RoleRoute;

