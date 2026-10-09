import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import RoleBadge from '../../components/common/RoleBadge';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/AuthContext';

export const InstructorProfile = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Instructor Profile"
        subtitle="Evaluator credentials, domain specialization, and platform permissions."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Card title="Account Details" subtitle="Primary user identity">
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
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Role</div>
                <div style={{ marginTop: '0.25rem' }}><RoleBadge role={user?.role} /></div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</div>
                <div style={{ marginTop: '0.25rem' }}><StatusBadge status="ACTIVE" /></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Instructor Authority & Scope" subtitle="Core assessment responsibilities">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>1. Candidate Portfolio Review</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Review candidate resumes and eligibility forwarded by Interview Engineers.
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>2. AI Interview Configuration</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Select questions, define scoring rubrics, and calibrate difficulty.
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>3. Final Evaluation & Hiring Decision</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Review multi-agent evaluations, inspect code diffs, and record final decision.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InstructorProfile;
