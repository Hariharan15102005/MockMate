import { useAuth } from '../../auth/AuthContext';
import { UserCheck, Award, FileCode, CheckCircle } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.82rem', fontWeight: '600', marginBottom: '12px' }}>
          <UserCheck size={16} /> CANDIDATE PORTAL
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>Candidate Workspace</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Welcome, <strong>{user?.fullName}</strong> ({user?.email})
        </p>
      </div>

      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={20} color="#4ade80" /> Authenticated as Candidate
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          You are authenticated under the <code>ROLE_CANDIDATE</code> authority. In upcoming phases, you will be invited to participate in adaptive multi-agent AI mock interviews, live code execution, and receive instant feedback.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <FileCode size={24} color="#38bdf8" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>Live AI Interviews</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Multi-agent interview room & Monaco coding (Phase 6).</div>
          </div>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CheckCircle size={24} color="#4ade80" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>Authentication Status</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valid JWT session stored securely.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
