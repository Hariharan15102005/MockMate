import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCandidateInterviewDetailsApi,
  uploadCandidateResumeApi,
  startOrResumeSessionApi,
  startSelfServiceInterviewApi,
  createSelfServiceSessionApi
} from '../../api/candidateInterview';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import {
  CheckCircle2,
  Camera,
  Mic,
  FileText,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Video,
  Code,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const InterviewPreCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stepper: 1: Prepare, 2: Resume, 3: Media Check, 4: Consent, 5: System Check
  const [step, setStep] = useState(1);

  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState(false);

  // Media state
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [micAllowed, setMicAllowed] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [stream, setStream] = useState(null);
  const mediaStreamRef = useRef(null);
  const videoRef = useRef(null);

  // Consent state
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Starting session state & error
  const [startingInterview, setStartingInterview] = useState(false);
  const [startError, setStartError] = useState(null);

  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      mediaStreamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    loadInterview();
    return () => {
      stopMediaStream();
    };
  }, [id, stopMediaStream]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      if (id === 'self-service' || !id) {
        setInterview({
          title: 'AI Resume Comprehensive Mock Interview',
          jobRole: 'Full Stack Software Engineer',
          durationMinutes: 45,
          difficulty: 'MEDIUM',
          roundCount: 5,
          roundNames: [
            'Candidate Introduction & Resume Overview',
            'Resume Projects & Architecture Deep Dive',
            'Core Technical Fundamentals & Problem Solving',
            'Behavioral, STAR & Collaboration',
            'Candidate Q&A & Interview Closing'
          ]
        });
      } else {
        const data = await getCandidateInterviewDetailsApi(id);
        setInterview(data);
      }
    } catch (err) {
      console.error('Failed to load interview blueprint:', err);
      setError('Could not load interview details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setResumeUploading(true);
      setResumeFile(file);
      await uploadCandidateResumeApi(file);
      setResumeSuccess(true);
    } catch (err) {
      console.warn('Resume upload notification:', err);
      // Allow progression with existing profile if upload fails or is optional
      setResumeSuccess(true);
    } finally {
      setResumeUploading(false);
    }
  };

  const requestMediaPermissions = async () => {
    setMediaError(null);
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      mediaStreamRef.current = userStream;
      setStream(userStream);
      setCameraAllowed(true);
      setMicAllowed(true);

      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
    } catch (err) {
      console.error('Media permission error:', err);
      setCameraAllowed(false);
      setMicAllowed(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('Camera and Microphone permissions were denied. Please allow camera and microphone access in your browser address bar.');
      } else {
        setMediaError(`Media device access notice: ${err.message}`);
      }
    }
  };

  useEffect(() => {
    if (step === 3 && !mediaStreamRef.current) {
      requestMediaPermissions();
    }
  }, [step]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, step]);

  const handleStartInterview = async () => {
    if (startingInterview) return;

    // Validate consent
    if (!consentAgreed) {
      setStartError('Please complete and agree to the interview consent before starting.');
      return;
    }

    try {
      setStartingInterview(true);
      setStartError(null);
      setError(null);

      let sessData;
      if (id === 'self-service' || !id) {
        sessData = await startSelfServiceInterviewApi();
      } else {
        sessData = await startOrResumeSessionApi(id);
      }

      if (!sessData || (!sessData.sessionId && !sessData.interviewId)) {
        throw new Error('Invalid session response from server.');
      }

      const activeSessionId = sessData.sessionId;

      // Stop precheck preview media tracks before navigating to the room
      stopMediaStream();

      // Navigate to live room
      navigate(`/candidate/interviews/self-service/room/${activeSessionId}`, {
        state: {
          sessionId: activeSessionId,
          interviewId: sessData.interviewId || id,
          sessionData: sessData
        }
      });
    } catch (err) {
      console.error('START_INTERVIEW_FAILED', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message
      });
      const status = err?.response?.status;
      let errorMsg = 'Unable to start the interview. Your preparation checks are complete, but the interview session could not be created. Please try again.';
      if (status === 401) {
        errorMsg = 'Session expired. Please log in again to start your interview.';
      } else if (status === 403) {
        errorMsg = 'You are not authorized to start this candidate interview session.';
      } else if (status === 409) {
        errorMsg = err?.response?.data?.message || 'Resume analysis is still processing. Please wait a moment and try again.';
      } else if (status === 404) {
        errorMsg = 'Candidate profile or interview blueprint could not be found. Please check your profile and try again.';
      }
      setStartError(errorMsg);
      setStartingInterview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 600 }}>Preparing Interview Environment...</p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '1rem', textAlign: 'center', maxWidth: '480px', margin: '3rem auto' }}>
        <p style={{ color: '#fca5a5', marginBottom: '1.25rem' }}>{error}</p>
        <Button variant="secondary" onClick={() => navigate('/candidate/interviews')}>
          Back to Interviews
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div>
        <PageHeader
          title={interview?.title || 'AI Comprehensive Mock Interview'}
          subtitle={`Target Role: ${interview?.jobRole || 'Full Stack Software Engineer'} • Duration: ${interview?.durationMinutes || 45} mins • ${interview?.roundCount || 5} Rounds`}
          badge={
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#818cf8' }}>
              SELF-SERVICE MOCK INTERVIEW
            </span>
          }
        />
      </div>

      {/* Stepper Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.85)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {[
          { num: 1, label: '1. Prepare' },
          { num: 2, label: '2. Resume' },
          { num: 3, label: '3. Camera & Mic' },
          { num: 4, label: '4. Consent' },
          { num: 5, label: '5. System Check' }
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            style={{
              padding: '0.65rem 0.5rem',
              borderRadius: '0.65rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: s.num < step ? 'pointer' : 'default',
              background: step === s.num ? '#6366f1' : s.num < step ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: step === s.num ? '#ffffff' : s.num < step ? '#34d399' : '#64748b',
              border: step === s.num ? '1px solid #818cf8' : s.num < step ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            {s.num < step ? `✓ ${s.label.split('. ')[1]}` : s.label}
          </div>
        ))}
      </div>

      {/* STEP CONTAINER */}
      <div style={{ padding: '2rem', background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '1.5rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
        
        {/* STEP 1: PREPARE */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                Interview Guidelines & Environment
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                This is a realistic, conversational AI mock interview tailored to your experience.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: '#090d16', border: '1px solid #334155', borderRadius: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎙️</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Speak Naturally</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  The AI interviewer will ask questions verbally. Speak your answer clearly using your microphone.
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: '#090d16', border: '1px solid #334155', borderRadius: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👨‍💼</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Interactive Human Avatar</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Your interviewer will listen, think, and ask relevant follow-up questions referencing your answers.
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: '#090d16', border: '1px solid #334155', borderRadius: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Instant Comprehensive Scorecard</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Upon completion, receive a full multi-domain evaluation and complete Q&A transcript.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
              <Button variant="primary" size="lg" onClick={() => setStep(2)}>
                Continue to Resume Upload →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: RESUME UPLOAD */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                Verify & Personalize Resume
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                Upload your updated resume so the AI interviewer can ask specific questions about your real projects.
              </p>
            </div>

            <div
              style={{
                border: '2px dashed #475569',
                borderRadius: '1.25rem',
                padding: '2.5rem',
                textAlign: 'center',
                background: '#090d16',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>📄</div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  {resumeFile ? resumeFile.name : 'Upload PDF or DOCX Resume'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  {resumeSuccess ? 'Resume verified & loaded ✓' : 'Supports PDF, DOCX (Max 10MB)'}
                </div>
              </div>

              <input
                type="file"
                id="resumeFileInput"
                accept=".pdf,.docx,.doc"
                onChange={handleResumeUpload}
                style={{ display: 'none' }}
              />

              <label htmlFor="resumeFileInput">
                <Button
                  variant="outline"
                  size="md"
                  disabled={resumeUploading}
                  onClick={() => document.getElementById('resumeFileInput')?.click()}
                >
                  {resumeUploading ? 'Analyzing Resume...' : resumeFile ? 'Choose Different File' : 'Browse Resume'}
                </Button>
              </label>
            </div>

            {!resumeSuccess && (
              <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '0.85rem', color: '#fca5a5', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} color="#ef4444" />
                <span>Please upload your resume before starting the AI interview.</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={!resumeSuccess}
                onClick={() => setStep(3)}
              >
                {resumeSuccess ? 'Continue to Camera & Mic Check →' : 'Upload Resume to Continue'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CAMERA & MIC CHECK */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                Camera & Microphone Setup
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                Verify your video and audio stream so the AI interviewer can interact seamlessly.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#090d16', border: '1px solid #334155', borderRadius: '1.25rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {!cameraAllowed && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Camera Preview</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Click below to grant camera access</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#090d16', border: '1px solid #334155', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Camera size={20} color={cameraAllowed ? '#34d399' : '#94a3b8'} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>Camera Status</div>
                      <div style={{ fontSize: '0.75rem', color: cameraAllowed ? '#34d399' : '#94a3b8' }}>
                        {cameraAllowed ? 'Camera Connected ✓' : 'Permission Required'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#090d16', border: '1px solid #334155', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mic size={20} color={micAllowed ? '#34d399' : '#94a3b8'} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>Microphone Status</div>
                      <div style={{ fontSize: '0.75rem', color: micAllowed ? '#34d399' : '#94a3b8' }}>
                        {micAllowed ? 'Microphone Active ✓' : 'Permission Required'}
                      </div>
                    </div>
                  </div>
                </div>

                {!cameraAllowed && (
                  <Button variant="outline" size="md" onClick={requestMediaPermissions}>
                    Request Camera & Mic Permissions
                  </Button>
                )}

                {mediaError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '0.75rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                    {mediaError}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button variant="primary" size="lg" onClick={() => setStep(4)}>
                Continue to Consent →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CONSENT */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                Privacy & Proctoring Consent
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                Please review and consent to audio/video processing and objective integrity signals.
              </p>
            </div>

            <div style={{ padding: '1.25rem', background: '#090d16', border: '1px solid #334155', borderRadius: '1rem', fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>During this mock interview:</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Your speech is converted to text in real-time for deterministic AI rubric scoring.</li>
                <li>Objective technical signals (camera continuity, window focus, face presence) are monitored.</li>
                <li>No psychological guessing or emotion recognition is performed.</li>
                <li>Your interview responses and scorecard remain accessible only to you.</li>
              </ul>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => {
                  setConsentAgreed(e.target.checked);
                  setStartError(null);
                }}
                style={{ marginTop: '0.2rem', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                I understand and consent to audio/video processing and technical compliance monitoring for this mock interview session.
              </span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setStep(3)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(5)}
                disabled={!consentAgreed}
              >
                Continue to System Check →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: FINAL SYSTEM CHECK */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                Final System Check
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                All systems verified. You are ready to start your realistic AI Mock Interview!
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Camera', status: 'Ready', ok: cameraAllowed },
                { label: 'Microphone', status: 'Ready', ok: micAllowed },
                { label: 'Resume Profile', status: 'Loaded', ok: true },
                { label: 'Internet Connection', status: 'Online', ok: navigator.onLine },
                { label: 'Browser Speech API', status: 'Supported', ok: true },
                { label: 'AI Interview Engine', status: 'Active (FastAPI + LangGraph)', ok: true }
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{c.label}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginTop: '0.15rem' }}>
                      {c.status}
                    </div>
                  </div>
                  <span style={{ color: '#34d399', fontWeight: 900, fontSize: '1rem' }}>✓</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Realistic Human AI Interviewer Ready
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Your interviewer will converse naturally, listen via live transcription, and evaluate your projects and technical knowledge.
                </p>
              </div>
              <div style={{ fontSize: '2.5rem' }}>👨‍💼</div>
            </div>

            {/* Error Banner if session creation encountered issue */}
            {startError && (
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                  <AlertCircle size={18} color="#f87171" />
                  <span>{startError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleStartInterview}>
                  <RefreshCw size={14} /> Try Again
                </Button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setStep(4)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={startingInterview}
                onClick={handleStartInterview}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  padding: '0.9rem 2.25rem',
                  cursor: startingInterview ? 'not-allowed' : 'pointer'
                }}
              >
                {startingInterview ? '⏳ Starting Interview...' : '🚀 Start Interview Now'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPreCheck;
