import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import RoleBadge from '../../components/common/RoleBadge';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/AuthContext';

export const CandidateProfile = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Candidate Profile"
        subtitle="Manage your personal details and account settings."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Card title="Personal Information" subtitle="Your registered candidate profile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            <div>
              <span className="form-label">Full Name</span>
              <input type="text" className="form-input" value={user?.fullName || ''} readOnly />
            </div>

            <div>
              <span className="form-label">Email Address</span>
              <input type="text" className="form-input" value={user?.email || ''} readOnly />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Authority</div>
                <div style={{ marginTop: '0.25rem' }}><RoleBadge role={user?.role} /></div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account State</div>
                <div style={{ marginTop: '0.25rem' }}><StatusBadge status="ACTIVE" /></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Assessment Integrity & Policies" subtitle="Candidate guidelines">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>1. Device Readiness</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Ensure your webcam and microphone permissions are enabled prior to starting.
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>2. Assessment Integrity</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Sessions are analyzed by multi-agent AI with automated code execution checks.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateProfile;
