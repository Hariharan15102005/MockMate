import { useAuth } from '../../auth/AuthContext';
import { Shield, Users, Server, Lock, CheckCircle, Database } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.82rem', fontWeight: '600', marginBottom: '12px' }}>
            <Shield size={16} /> ADMINISTRATOR PORTAL
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>System Administration Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Welcome back, <strong>{user?.fullName}</strong> ({user?.email})
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
              <Lock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Security Level</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>ROLE_ADMIN</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Full system control and staff account provisioning authority.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}>
              <Database size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Session State</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>JWT Stateless</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Authenticated via signed BCrypt token with 1-hour expiration.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>User ID</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', fontFamily: 'monospace' }}>{user?.id?.slice(0, 16)}...</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Authenticated principal extracted from SecurityContext.
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server size={20} color="#38bdf8" /> Phase 3 Verification & Admin Features
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
          You have successfully authenticated with administrative privileges. In accordance with Phase 3 specifications, full staff user management, role creation, and audit logging workflows will be activated in later phases.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: '600', marginBottom: '6px' }}>
              <CheckCircle size={16} /> Phase 1: Foundation
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Health probes & multi-tier connectivity verified.</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: '600', marginBottom: '6px' }}>
              <CheckCircle size={16} /> Phase 2: Database Schema
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>27 JPA entities & Flyway V1 schema active.</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: '600', marginBottom: '6px' }}>
              <CheckCircle size={16} /> Phase 3: Auth & RBAC
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stateless JWT, BCrypt & role-based routing enabled.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
