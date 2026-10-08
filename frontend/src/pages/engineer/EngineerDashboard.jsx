import { useAuth } from '../../auth/AuthContext';
import { Cpu, UserCheck, FileText, CheckCircle } from 'lucide-react';

export default function EngineerDashboard() {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.82rem', fontWeight: '600', marginBottom: '12px' }}>
          <Cpu size={16} /> INTERVIEW ENGINEER PORTAL
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>Interview Engineer Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Welcome back, <strong>{user?.fullName}</strong> ({user?.email})
        </p>
      </div>

      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck size={20} color="#38bdf8" /> Authenticated as Interview Engineer
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          You are securely logged in under the <code>ROLE_INTERVIEW_ENGINEER</code> authority. In Phase 4, you will manage candidate intake, resume verification, and assign candidate portfolios to instructors for interview scheduling.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <FileText size={24} color="#38bdf8" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>Candidate Intake</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resume collection and profile verification (Phase 4).</div>
          </div>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CheckCircle size={24} color="#4ade80" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>Security Status</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role-Based Access Control verified and active.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
