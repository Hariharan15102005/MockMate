import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { createCandidateApi } from '../../api/engineer';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Save
} from 'lucide-react';

export const CandidateIntake = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    college: '',
    degree: '',
    department: '',
    graduationYear: new Date().getFullYear(),
    cgpa: '',
    experienceLevel: 'FRESHER',
    appliedRole: '',
    applicationId: '',
    source: 'CAMPUS',
    engineerNotes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    setError(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.email.trim()) errors.email = 'Email Address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email address';

    if (!formData.phone.trim()) errors.phone = 'Phone Number is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!formData.college.trim()) errors.college = 'College / University is required';
    if (!formData.degree.trim()) errors.degree = 'Degree is required';
    if (!formData.department.trim()) errors.department = 'Department is required';

    const year = Number(formData.graduationYear);
    if (!year || year < 1950 || year > 2100) {
      errors.graduationYear = 'Graduation Year must be between 1950 and 2100';
    }

    if (formData.cgpa !== '' && formData.cgpa !== null) {
      const cgpaNum = Number(formData.cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0.0 || cgpaNum > 10.0) {
        errors.cgpa = 'CGPA must be between 0.0 and 10.0';
      }
    }

    if (!formData.appliedRole.trim()) errors.appliedRole = 'Applied Role is required';
    if (!formData.applicationId.trim()) errors.applicationId = 'Application ID is required';

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError('Please resolve the highlighted validation errors.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        graduationYear: Number(formData.graduationYear),
        cgpa: formData.cgpa !== '' ? Number(formData.cgpa) : null
      };

      const created = await createCandidateApi(payload);
      setSuccessMsg(`Candidate '${created.fullName}' created successfully with status PENDING_VERIFICATION.`);
      
      setTimeout(() => {
        navigate(`/engineer/candidates/${created.id}`);
      }, 1500);
    } catch (err) {
      console.error('Candidate creation error:', err);
      if (err.response?.status === 409) {
        setError(`Conflict: A candidate with Application ID '${formData.applicationId}' already exists.`);
      } else if (err.response?.data?.validationErrors) {
        setFieldErrors(err.response.data.validationErrors);
        setError('Server validation failed. Please check the form fields.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create candidate. Please check your network connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="New Candidate Intake"
        subtitle="Enter candidate personal, academic, and application parameters into the recruitment system."
        actions={
          <Link to="/engineer/candidates">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Back to Candidates
            </Button>
          </Link>
        }
      />

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          color: 'var(--success)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* SECTION 1: Personal Information */}
          <Card title="1. Personal Information" subtitle="Candidate contact & location details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div>
                <label className="form-label">
                  Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="fullName"
                    className="form-input"
                    placeholder="e.g. Alex Morgan"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                {fieldErrors.fullName && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.fullName}
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">
                  Email Address <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="alex.morgan@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.email && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">
                  Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  className="form-input"
                  placeholder="+91-9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.phone && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.phone}
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">
                  Location (City / State) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="e.g. Chennai, Tamil Nadu"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.location && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.location}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* SECTION 2: Academic Information */}
          <Card title="2. Academic Information" subtitle="Educational background and qualifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div>
                <label className="form-label">
                  College / University <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="college"
                  className="form-input"
                  placeholder="e.g. National Institute of Technology"
                  value={formData.college}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.college && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.college}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">
                    Degree <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="degree"
                    className="form-input"
                    placeholder="e.g. B.E. / B.Tech"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.degree && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                      {fieldErrors.degree}
                    </span>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Department <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    className="form-input"
                    placeholder="e.g. Computer Science"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.department && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                      {fieldErrors.department}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">
                    Graduation Year <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="graduationYear"
                    className="form-input"
                    placeholder="2026"
                    min="1950"
                    max="2100"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.graduationYear && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                      {fieldErrors.graduationYear}
                    </span>
                  )}
                </div>

                <div>
                  <label className="form-label">CGPA / Score (0.0 - 10.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgpa"
                    className="form-input"
                    placeholder="e.g. 8.5"
                    min="0.0"
                    max="10.0"
                    value={formData.cgpa}
                    onChange={handleChange}
                  />
                  {fieldErrors.cgpa && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                      {fieldErrors.cgpa}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 3: Application Information */}
          <Card title="3. Application Parameters" subtitle="Target role and intake tracking">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div>
                <label className="form-label">
                  Application ID <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="applicationId"
                  className="form-input"
                  placeholder="e.g. APP-2026-001"
                  value={formData.applicationId}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.applicationId && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.applicationId}
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">
                  Applied Role <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="appliedRole"
                  className="form-input"
                  placeholder="e.g. Java Backend Developer"
                  value={formData.appliedRole}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.appliedRole && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.appliedRole}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Experience Level</label>
                  <select
                    name="experienceLevel"
                    className="form-input"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                  >
                    <option value="FRESHER">FRESHER</option>
                    <option value="ENTRY_LEVEL">ENTRY LEVEL (0-2 Yrs)</option>
                    <option value="EXPERIENCED">EXPERIENCED (2+ Yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Intake Source</label>
                  <select
                    name="source"
                    className="form-input"
                    value={formData.source}
                    onChange={handleChange}
                  >
                    <option value="CAMPUS">CAMPUS</option>
                    <option value="COLLEGE">COLLEGE</option>
                    <option value="REFERRAL">REFERRAL</option>
                    <option value="JOB_PORTAL">JOB PORTAL</option>
                    <option value="COMPANY_WEBSITE">COMPANY WEBSITE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 4: Engineer Notes & Status Note */}
          <Card title="4. Engineer Notes" subtitle="Internal intake notes & initial observations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div>
                <label className="form-label">Intake Observations & Remarks</label>
                <textarea
                  name="engineerNotes"
                  className="form-input"
                  rows="5"
                  placeholder="Notes on candidate background, communication, primary strengths, or specific instructor routing recommendations..."
                  value={formData.engineerNotes}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Workflow Rule:</strong> All new candidates are automatically assigned the <code>PENDING_VERIFICATION</code> status upon intake creation.
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}>
          <Link to="/engineer/candidates">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            icon={Save}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Creating Candidate...' : 'Save Candidate Intake'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CandidateIntake;
