import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { UploadCloud, FileText, CheckCircle2, User, Mail, Phone, Code } from 'lucide-react';

export const CandidateIntake = () => {
  return (
    <div>
      <PageHeader
        title="Candidate Intake & Resume Upload"
        subtitle="Collect candidate details, upload resumes, and prepare for automated AI extraction."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Candidate Information Form */}
        <Card title="Candidate Details" subtitle="Basic biographical and technical parameters">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="e.g. Alex Morgan" disabled />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="alex.morgan@example.com" disabled />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" placeholder="+1 (555) 019-2834" disabled />
            </div>

            <div>
              <label className="form-label">Target Role / Tech Stack</label>
              <input type="text" className="form-input" placeholder="e.g. Full-Stack Java / React" disabled />
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <Button variant="primary" disabled style={{ width: '100%' }}>
                Submit Candidate Information (Phase 5)
              </Button>
            </div>
          </form>
        </Card>

        {/* Resume Upload Box */}
        <Card title="Resume File (.PDF, .DOCX)" subtitle="Resume collection and AI analysis integration">
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.01)',
            marginTop: '0.5rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <UploadCloud size={28} />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Resume Upload Zone
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Drag and drop candidate resume files here. Secure multipart upload and AI parsing will activate in Phase 5.
            </p>
            <Button variant="outline" size="sm" disabled>
              Select File
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateIntake;
