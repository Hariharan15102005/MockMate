import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Sliders, Code2, MessageSquare, BrainCircuit, Shield } from 'lucide-react';

export const InterviewBuilder = () => {
  return (
    <div>
      <PageHeader
        title="AI Interview Builder & Rubric Configurator"
        subtitle="Define round structure, difficulty, question bank rules, and evaluation weights."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Card title="Interview Parameters" subtitle="Basic session properties">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div>
              <label className="form-label">Interview Title</label>
              <input type="text" className="form-input" placeholder="e.g. Senior Backend Engineer Mock Assessment" disabled />
            </div>

            <div>
              <label className="form-label">Candidate Assignment</label>
              <input type="text" className="form-input" placeholder="Select candidate..." disabled />
            </div>

            <div>
              <label className="form-label">Difficulty Level</label>
              <input type="text" className="form-input" placeholder="Intermediate (Medium)" disabled />
            </div>

            <div>
              <label className="form-label">Target Duration</label>
              <input type="text" className="form-input" placeholder="45 minutes" disabled />
            </div>
          </div>
        </Card>

        <Card title="Multi-Agent Assessment Rounds" subtitle="Configure AI interview agents">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BrainCircuit size={20} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Round 1: Conceptual Technical Agent</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Core CS, system design, and algorithmic theory.</div>
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Code2 size={20} color="var(--info)" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Round 2: Live Monaco Coding Agent</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live code execution & automated test validation.</div>
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare size={20} color="var(--accent-purple)" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Round 3: Behavioral & STAR Agent</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Communication, adaptability, and leadership assessment.</div>
              </div>
            </div>

            <Button variant="primary" disabled style={{ marginTop: '0.5rem' }}>
              Save & Schedule Interview (Phase 5)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InterviewBuilder;
