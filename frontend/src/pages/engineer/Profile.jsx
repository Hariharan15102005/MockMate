import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import RoleBadge from '../../components/common/RoleBadge';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/AuthContext';
import { Cpu, Mail, User, ShieldCheck } from 'lucide-react';

export const EngineerProfile = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="My Engineer Profile"
        subtitle="Account identity, assigned role credentials, and platform security status."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Card title="Profile Details" subtitle="Primary user attributes">
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
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned System Role</div>
                <div style={{ marginTop: '0.25rem' }}><RoleBadge role={user?.role} /></div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account State</div>
                <div style={{ marginTop: '0.25rem' }}><StatusBadge status="ACTIVE" /></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Responsibilities & Scope" subtitle="Interview Engineer domain authority">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>1. Candidate Intake & Verification</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Collect resumes, verify contact data, and confirm initial candidate eligibility.
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>2. Instructor Portfolio Routing</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Match candidate profiles with domain-expert instructors for interview setup.
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>3. Report Delivery Follow-Up</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Deliver completed AI evaluation reports back to instructors for final evaluation.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EngineerProfile;
