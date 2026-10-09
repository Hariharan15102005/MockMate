import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../auth/AuthContext';
import { Shield, Key, Database, Bell } from 'lucide-react';

export const AdminSettings = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="System Settings & Profile"
        subtitle="Platform configuration, security policies, and administrator credentials."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Card title="Administrator Profile" subtitle="Active administrative account identity">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div>
              <span className="form-label">Full Name</span>
              <input type="text" className="form-input" value={user?.fullName || ''} readOnly />
            </div>
            <div>
              <span className="form-label">Email Address</span>
              <input type="text" className="form-input" value={user?.email || ''} readOnly />
            </div>
            <div>
              <span className="form-label">Authority Level</span>
              <input type="text" className="form-input" value="ROLE_ADMIN (Superuser)" readOnly />
            </div>
          </div>
        </Card>

        <Card title="Security & JWT Policy" subtitle="Session security parameters">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>JWT Expiration</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>1 hour (3600000 ms) stateless tokens</div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Password Hashing</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>BCrypt with salted rounds</div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Public Registration Mode</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Strict CANDIDATE only</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
