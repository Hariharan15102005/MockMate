import React, { useState, useEffect } from 'react';
import { checkBackendHealth, checkAiServiceHealth } from '../api/client';
import { 
  Server, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity, 
  ShieldAlert, 
  Layers, 
  Zap 
} from 'lucide-react';

export const HealthTest = () => {
  const [backendStatus, setBackendStatus] = useState({ loading: true, status: 'CHECKING', data: null, latency: 0, url: '' });
  const [aiStatus, setAiStatus] = useState({ loading: true, status: 'CHECKING', data: null, latency: 0, url: '' });
  const [lastChecked, setLastChecked] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runHealthChecks = async () => {
    setIsRefreshing(true);
    
    // Check both services concurrently
    const [backendRes, aiRes] = await Promise.all([
      checkBackendHealth(),
      checkAiServiceHealth(),
    ]);

    setBackendStatus({ loading: false, ...backendRes });
    setAiStatus({ loading: false, ...aiRes });
    setLastChecked(new Date().toLocaleTimeString());
    setIsRefreshing(false);
  };

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 15000); // live polling every 15s
    return () => clearInterval(interval);
  }, []);

  const allOnline = backendStatus.status === 'ONLINE' && aiStatus.status === 'ONLINE';

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Phase 1 — System Health & Diagnostics</h1>
            <span className={`badge ${allOnline ? 'badge-online' : 'badge-pending'}`}>
              <span className={`pulse-dot ${allOnline ? 'online' : 'offline'}`}></span>
              {allOnline ? 'All Systems Operational' : 'Partial / Checking'}
            </span>
          </div>
          <p className="text-secondary">
            Continuous health telemetry and endpoint verification for Spring Boot Backend and FastAPI AI Service.
          </p>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={runHealthChecks} 
          disabled={isRefreshing}
          style={{ minWidth: 130 }}
        >
          <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} style={{
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }} />
          {isRefreshing ? 'Checking...' : 'Refresh All'}
        </button>
      </div>

      {lastChecked && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={14} />
          Last telemetry update at {lastChecked} (Auto-refreshes every 15s)
        </div>
      )}

      {/* Health Grid */}
      <div className="grid-2">
        {/* Backend Card */}
        <div className="card" style={{ borderColor: backendStatus.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8'
              }}>
                <Server size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Spring Boot Backend</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Port 8080 • Java 17+ • Spring Web & JPA</span>
              </div>
            </div>

            <span className={`badge ${backendStatus.status === 'ONLINE' ? 'badge-online' : 'badge-offline'}`}>
              <span className={`pulse-dot ${backendStatus.status === 'ONLINE' ? 'online' : 'offline'}`}></span>
              Backend: {backendStatus.status}
            </span>
          </div>

          <div style={{ margin: '1rem 0', display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
            <div>
              <span className="text-muted">Target Endpoint:</span>{' '}
              <code style={{ color: '#93c5fd' }}>GET /api/health</code>
            </div>
            <div>
              <span className="text-muted">Latency:</span>{' '}
              <span style={{ fontWeight: 600, color: backendStatus.latency < 200 ? '#34d399' : '#fbbf24' }}>
                {backendStatus.latency}ms
              </span>
            </div>
          </div>

          <div className="mt-2">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              API Response Payload
            </span>
            <pre className="mt-1">
              {backendStatus.data 
                ? JSON.stringify(backendStatus.data, null, 2) 
                : backendStatus.error 
                  ? JSON.stringify({ error: backendStatus.error, target: backendStatus.url }, null, 2) 
                  : '// Connecting to Spring Boot backend...'}
            </pre>
          </div>
        </div>

        {/* AI Service Card */}
        <div className="card" style={{ borderColor: aiStatus.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(6, 182, 212, 0.1)',
                color: '#22d3ee'
              }}>
                <Cpu size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>FastAPI AI Service</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Port 8000 • Python 3.11+ • LangGraph & Agents</span>
              </div>
            </div>

            <span className={`badge ${aiStatus.status === 'ONLINE' ? 'badge-online' : 'badge-offline'}`}>
              <span className={`pulse-dot ${aiStatus.status === 'ONLINE' ? 'online' : 'offline'}`}></span>
              AI Service: {aiStatus.status}
            </span>
          </div>

          <div style={{ margin: '1rem 0', display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
            <div>
              <span className="text-muted">Target Endpoint:</span>{' '}
              <code style={{ color: '#67e8f9' }}>GET /ai/health</code>
            </div>
            <div>
              <span className="text-muted">Latency:</span>{' '}
              <span style={{ fontWeight: 600, color: aiStatus.latency < 200 ? '#34d399' : '#fbbf24' }}>
                {aiStatus.latency}ms
              </span>
            </div>
          </div>

          <div className="mt-2">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              API Response Payload
            </span>
            <pre className="mt-1">
              {aiStatus.data 
                ? JSON.stringify(aiStatus.data, null, 2) 
                : aiStatus.error 
                  ? JSON.stringify({ error: aiStatus.error, target: aiStatus.url }, null, 2) 
                  : '// Connecting to FastAPI AI Service...'}
            </pre>
          </div>
        </div>
      </div>

      {/* Architectural Summary Section */}
      <div className="card mt-4">
        <h3 className="card-title">
          <Layers size={20} color="#818cf8" />
          <span>Platform Decoupling Architecture</span>
        </h3>
        <p className="text-secondary" style={{ fontSize: '0.925rem', marginBottom: '1.25rem' }}>
          AgentHire maintains a strict boundary between Spring Boot (the authoritative business and security source of truth) and FastAPI LangGraph (the specialized agentic reasoning engine).
        </p>

        <div className="grid-4">
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.25rem' }}>Admin Control</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Manages users, engineers, instructors, and audit logs.</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '0.25rem' }}>Interview Engineer</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Intake, resume verification, instructor routing, & report delivery.</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>Instructor</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Interview builder, live monitoring, human review & hiring decision.</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: '#f472b6', marginBottom: '0.25rem' }}>Candidate</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Device check, interactive coding & adaptive AI interview room.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
