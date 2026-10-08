import { useAuth } from '../../auth/AuthContext';
import { BookOpen, UserCheck, CheckCircle, Calendar } from 'lucide-react';

export default function InstructorDashboard() {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', fontSize: '0.82rem', fontWeight: '600', marginBottom: '12px' }}>
          <BookOpen size={16} /> INSTRUCTOR PORTAL
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>Instructor Review Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Welcome back, <strong>{user?.fullName}</strong> ({user?.email})
        </p>
      </div>

      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck size={20} color="#c084fc" /> Authenticated as Instructor
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          You are securely logged in under the <code>ROLE_INSTRUCTOR</code> authority. In upcoming phases, you will review candidate profiles, customize AI interview parameters, and inspect rubric evaluations.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Calendar size={24} color="#c084fc" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>Interview Configuration</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Build and configure mock interview sessions (Phase 5).</div>
          </div>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CheckCircle size={24} color="#4ade80" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>Authorization Status</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Protected routes and API authorization active.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
