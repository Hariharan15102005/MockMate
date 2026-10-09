import React, { useState, useEffect } from 'react';

/**
 * HumanInterviewer - Professional Realistic AI Interviewer Avatar
 * Implements conversational state machine:
 * IDLE | GREETING | SPEAKING | LISTENING | PROCESSING | THINKING | FOLLOW_UP | EVALUATING | ENDING
 *
 * Features:
 * - Lifelike SVG-based human avatar with professional suit & styling
 * - Natural eye blinking (with probabilistic intervals)
 * - Synchronized lip/mouth movement when speaking
 * - Attentive listening posture & subtle head tilt when candidate answers
 * - Dynamic thinking halo & ambient aura in professional interview backdrop
 * - Audio visualizer wave bar animations during speech
 * - Persona switching (Male Tech Lead / Female Eng Director)
 */
export default function HumanInterviewer({
  state = 'IDLE',
  message = '',
  isSpeaking = false,
  isListening = false,
  interviewerName = 'David Reynolds',
  interviewerTitle = 'Senior Engineering Director',
  avatarPersona = 'male' // 'male' | 'female'
}) {
  // Normalize state
  const effectiveState = isSpeaking
    ? 'SPEAKING'
    : isListening
    ? 'LISTENING'
    : state;

  const [blink, setBlink] = useState(false);
  const [mouthOpenPhase, setMouthOpenPhase] = useState(0);

  // Natural blinking interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Synchronized mouth animation when speaking
  useEffect(() => {
    if (effectiveState !== 'SPEAKING') {
      setMouthOpenPhase(0);
      return;
    }

    const mouthInterval = setInterval(() => {
      setMouthOpenPhase((prev) => (prev + 1) % 4);
    }, 140);

    return () => clearInterval(mouthInterval);
  }, [effectiveState]);

  const getStatusBadge = () => {
    switch (effectiveState) {
      case 'SPEAKING':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.4)',
          text: '#60a5fa',
          dot: '#3b82f6',
          label: 'AI Interviewer Speaking...',
          ping: true
        };
      case 'LISTENING':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#34d399',
          dot: '#10b981',
          label: '● Listening to Candidate...',
          ping: true
        };
      case 'PROCESSING':
      case 'THINKING':
        return {
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.4)',
          text: '#22d3ee',
          dot: '#06b6d4',
          label: 'Thinking & Formulating Next Question...',
          ping: false
        };
      case 'FOLLOW_UP':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          text: '#fbbf24',
          dot: '#f59e0b',
          label: 'Asking In-Depth Follow-up...',
          ping: false
        };
      case 'EVALUATING':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          border: 'rgba(168, 85, 247, 0.4)',
          text: '#c084fc',
          dot: '#a855f7',
          label: 'Evaluating Response...',
          ping: false
        };
      case 'GREETING':
        return {
          bg: 'rgba(99, 102, 241, 0.15)',
          border: 'rgba(99, 102, 241, 0.4)',
          text: '#818cf8',
          dot: '#6366f1',
          label: 'Welcome & Introduction',
          ping: false
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          border: 'rgba(100, 116, 139, 0.3)',
          text: '#94a3b8',
          dot: '#64748b',
          label: 'Interviewer Ready',
          ping: false
        };
    }
  };

  const badge = getStatusBadge();

  // Head tilt based on state
  const headTransform =
    effectiveState === 'LISTENING'
      ? 'rotate(2deg) translateY(1px)'
      : effectiveState === 'SPEAKING'
      ? 'translateY(-2px)'
      : effectiveState === 'THINKING'
      ? 'rotate(-2.5deg) translateY(-1px)'
      : 'none';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.75rem 1.5rem',
        borderRadius: '1.25rem',
        background: 'linear-gradient(145deg, #0b1120 0%, #0f172a 50%, #1e293b 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        minHeight: '380px'
      }}
    >
      {/* Studio Lighting Background Aura */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background:
            effectiveState === 'SPEAKING'
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, transparent 70%)'
              : effectiveState === 'LISTENING'
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)'
              : effectiveState === 'THINKING'
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          transition: 'all 0.6s ease'
        }}
      />

      {/* Top Header & State Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '1rem',
          zIndex: 2
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: badge.dot,
              boxShadow: `0 0 8px ${badge.dot}`
            }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            AI INTERVIEWER PANEL
          </span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.text,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease'
          }}
        >
          {badge.ping && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: badge.dot,
                animation: 'pulse 1.5s infinite'
              }}
            />
          )}
          {badge.label}
        </div>
      </div>

      {/* Professional Human Avatar Canvas/SVG Container */}
      <div
        style={{
          position: 'relative',
          width: '210px',
          height: '230px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2
        }}
      >
        <svg
          viewBox="0 0 240 260"
          style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: headTransform
          }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f7c8a4" />
              <stop offset="100%" stopColor="#dca47e" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2c1e19" />
              <stop offset="100%" stopColor="#120c0a" />
            </linearGradient>
            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="tieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="lapelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Shoulders & Suit Jacket */}
          <path
            d="M 30 255 C 30 205, 75 195, 105 190 L 135 190 C 165 195, 210 205, 210 255 Z"
            fill="url(#suitGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Shirt Collar & V-Neck */}
          <polygon points="105,190 135,190 120,230" fill="url(#shirtGrad)" />
          <polygon points="105,190 120,215 95,200" fill="#ffffff" />
          <polygon points="135,190 120,215 145,200" fill="#f1f5f9" />

          {/* Professional Silk Tie */}
          <polygon points="116,210 124,210 126,255 120,260 114,255" fill="url(#tieGrad)" />
          <polygon points="115,207 125,207 123,215 117,215" fill="#1e40af" />

          {/* Suit Lapels */}
          <path d="M 75 195 L 105 240 L 90 245 L 60 210 Z" fill="url(#lapelGrad)" />
          <path d="M 165 195 L 135 240 L 150 245 L 180 210 Z" fill="url(#lapelGrad)" />

          {/* Neck */}
          <rect x="106" y="145" width="28" height="48" rx="6" fill="url(#skinGrad)" />
          <path d="M 106 160 C 114 172, 126 172, 134 160" stroke="#c28c68" strokeWidth="1.5" fill="none" />

          {/* Head & Face */}
          <ellipse cx="120" cy="120" rx="46" ry="52" fill="url(#skinGrad)" />

          {/* Professional Hairstyle */}
          {avatarPersona === 'male' ? (
            <path
              d="M 72 110 C 68 80, 85 55, 120 55 C 155 55, 172 80, 168 110 C 160 90, 150 78, 120 78 C 90 78, 80 90, 72 110 Z"
              fill="url(#hairGrad)"
            />
          ) : (
            <path
              d="M 68 120 C 65 75, 85 52, 120 52 C 155 52, 175 75, 172 120 C 178 145, 175 180, 170 195 C 160 140, 155 80, 120 80 C 85 80, 80 140, 70 195 C 65 180, 62 145, 68 120 Z"
              fill="url(#hairGrad)"
            />
          )}

          {/* Hair detail swoop */}
          <path
            d="M 75 95 C 95 65, 140 65, 165 90 C 145 74, 100 74, 75 95 Z"
            fill="#3a2a24"
            opacity="0.8"
          />

          {/* Ears */}
          <ellipse cx="72" cy="122" rx="6" ry="11" fill="url(#skinGrad)" />
          <ellipse cx="168" cy="122" rx="6" ry="11" fill="url(#skinGrad)" />

          {/* Eyebrows */}
          <path
            d={
              effectiveState === 'THINKING'
                ? 'M 88 97 Q 102 93 108 98'
                : 'M 88 99 Q 102 95 108 99'
            }
            stroke="#2c1e19"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={
              effectiveState === 'THINKING'
                ? 'M 132 98 Q 138 93 152 97'
                : 'M 132 99 Q 138 95 152 99'
            }
            stroke="#2c1e19"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Eyes (Open or Blinking) */}
          {blink ? (
            <>
              {/* Closed eyes during blink */}
              <path d="M 89 113 Q 100 117 107 113" stroke="#2c1e19" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 133 113 Q 140 117 151 113" stroke="#2c1e19" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Left Eye */}
              <ellipse cx="98" cy="112" rx="9" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
              <ellipse cx="98" cy="112" rx="4.5" ry="4.5" fill="#1e293b" />
              <circle cx="99.5" cy="110.5" r="1.5" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="142" cy="112" rx="9" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
              <ellipse cx="142" cy="112" rx="4.5" ry="4.5" fill="#1e293b" />
              <circle cx="143.5" cy="110.5" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Glasses Frame (Professional Look) */}
          <rect x="85" y="103" width="26" height="18" rx="4" fill="none" stroke="#475569" strokeWidth="1.8" opacity="0.85" />
          <rect x="129" y="103" width="26" height="18" rx="4" fill="none" stroke="#475569" strokeWidth="1.8" opacity="0.85" />
          <path d="M 111 110 L 129 110" stroke="#475569" strokeWidth="1.8" />
          <path d="M 85 108 L 74 105" stroke="#475569" strokeWidth="1.5" />
          <path d="M 155 108 L 166 105" stroke="#475569" strokeWidth="1.5" />

          {/* Nose */}
          <path d="M 119 115 L 123 130 L 116 132" stroke="#c28c68" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Mouth (Dynamic Lip Movement) */}
          {effectiveState === 'SPEAKING' ? (
            mouthOpenPhase === 0 ? (
              // Slightly open
              <ellipse cx="120" cy="148" rx="8" ry="4" fill="#641e16" stroke="#b03a2e" strokeWidth="1" />
            ) : mouthOpenPhase === 1 ? (
              // Open speaking (vowel)
              <ellipse cx="120" cy="148" rx="10" ry="7" fill="#641e16" stroke="#b03a2e" strokeWidth="1">
                <rect x="114" y="143" width="12" height="3" rx="1" fill="#ffffff" />
              </ellipse>
            ) : mouthOpenPhase === 2 ? (
              // Wide open (articulation)
              <path d="M 110 146 Q 120 156 130 146 Q 120 152 110 146" fill="#641e16" stroke="#b03a2e" strokeWidth="1.2" />
            ) : (
              // Rest/closed momentarily
              <path d="M 111 148 Q 120 151 129 148" stroke="#943126" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )
          ) : effectiveState === 'LISTENING' ? (
            // Subtle attentive smile
            <path d="M 110 147 Q 120 152 130 147" stroke="#943126" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : effectiveState === 'THINKING' ? (
            // Thoughtful slight straight line
            <path d="M 113 148 L 127 148" stroke="#943126" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            // Neutral friendly
            <path d="M 112 147 Q 120 150 128 147" stroke="#943126" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </svg>

        {/* Floating Thinking Halo when AI is formulating */}
        {(effectiveState === 'THINKING' || effectiveState === 'PROCESSING') && (
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px dashed #06b6d4',
              animation: 'spin 4s linear infinite',
              opacity: 0.8
            }}
          />
        )}
      </div>

      {/* Audio Wave Visualizer Bars when AI is speaking */}
      {effectiveState === 'SPEAKING' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '24px',
            marginTop: '0.75rem',
            zIndex: 2
          }}
        >
          {[14, 22, 10, 24, 18, 28, 16, 20, 12, 26, 15].map((height, idx) => (
            <div
              key={idx}
              style={{
                width: '3.5px',
                height: `${height}px`,
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                animation: `audioWave 0.8s ease-in-out infinite alternate ${idx * 0.08}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Candidate Audio Listening Wave when Candidate is Speaking */}
      {effectiveState === 'LISTENING' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '24px',
            marginTop: '0.75rem',
            zIndex: 2
          }}
        >
          {[10, 18, 24, 16, 28, 20, 14, 22, 12].map((height, idx) => (
            <div
              key={idx}
              style={{
                width: '3.5px',
                height: `${height}px`,
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)',
                animation: `audioWave 0.9s ease-in-out infinite alternate ${idx * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Interviewer Persona Info & Subtitle */}
      <div
        style={{
          marginTop: effectiveState === 'SPEAKING' || effectiveState === 'LISTENING' ? '0.5rem' : '1rem',
          textAlign: 'center',
          zIndex: 2
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
          {interviewerName}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
          {interviewerTitle} • MockMate AI
        </div>
      </div>

      {/* Embedded CSS for animations */}
      <style>{`
        @keyframes audioWave {
          0% { transform: scaleY(0.3); opacity: 0.5; }
          100% { transform: scaleY(1.1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
