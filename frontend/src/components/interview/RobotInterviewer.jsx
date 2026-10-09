import React from 'react';

/**
 * RobotInterviewer - A high-fidelity animated SVG & CSS Robot Interviewer
 * Supports dynamic emotional & operational states: IDLE, THINKING, SPEAKING, LISTENING, EVALUATING
 */
export default function RobotInterviewer({
  state = 'IDLE',
  message = '',
  isSpeaking = false
}) {
  // Normalize state if speech is active
  const activeState = isSpeaking ? 'SPEAKING' : state;

  const getStatusColor = () => {
    switch (activeState) {
      case 'SPEAKING':
        return 'from-blue-500 to-indigo-600 text-blue-300';
      case 'LISTENING':
        return 'from-emerald-500 to-teal-600 text-emerald-300';
      case 'THINKING':
        return 'from-cyan-500 to-blue-600 text-cyan-300';
      case 'EVALUATING':
        return 'from-purple-500 to-pink-600 text-purple-300';
      default:
        return 'from-indigo-600 to-purple-600 text-indigo-300';
    }
  };

  const getBadgeText = () => {
    switch (activeState) {
      case 'SPEAKING':
        return '🤖 AI Speaking...';
      case 'LISTENING':
        return '🎤 Listening to Candidate...';
      case 'THINKING':
        return '⚡ Formulating Question...';
      case 'EVALUATING':
        return '🔍 Analyzing Answer & Rubric...';
      default:
        return '🤖 AI Interviewer Ready';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-slate-700/60 shadow-2xl backdrop-blur-md relative overflow-hidden group">
      {/* Background glow orb */}
      <div
        className={`absolute w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
          activeState === 'SPEAKING'
            ? 'bg-blue-500 scale-125'
            : activeState === 'LISTENING'
            ? 'bg-emerald-500 scale-125'
            : activeState === 'THINKING'
            ? 'bg-cyan-500 animate-pulse'
            : activeState === 'EVALUATING'
            ? 'bg-purple-500 scale-125'
            : 'bg-indigo-500'
        }`}
      />

      {/* Status Badge */}
      <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-slate-800/90 border border-slate-700 shadow-inner">
        <span
          className={`w-2 h-2 rounded-full animate-ping ${
            activeState === 'LISTENING'
              ? 'bg-emerald-400'
              : activeState === 'SPEAKING'
              ? 'bg-blue-400'
              : activeState === 'EVALUATING'
              ? 'bg-purple-400'
              : 'bg-indigo-400'
          }`}
        />
        <span className={getStatusColor()}>{getBadgeText()}</span>
      </div>

      {/* Animated Robot SVG */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105"
        >
          <defs>
            <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="robotFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="eyeGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                stopColor={
                  activeState === 'LISTENING'
                    ? '#34d399'
                    : activeState === 'SPEAKING'
                    ? '#60a5fa'
                    : activeState === 'EVALUATING'
                    ? '#c084fc'
                    : '#818cf8'
                }
              />
              <stop
                offset="100%"
                stopColor={
                  activeState === 'LISTENING'
                    ? '#059669'
                    : activeState === 'SPEAKING'
                    ? '#2563eb'
                    : activeState === 'EVALUATING'
                    ? '#9333ea'
                    : '#4f46e5'
                }
              />
            </linearGradient>
          </defs>

          {/* Shoulders / Torso Base */}
          <path
            d="M 50 170 Q 100 155 150 170 L 165 200 L 35 200 Z"
            fill="url(#robotBodyGrad)"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {/* Chest Core Indicator */}
          <circle cx="100" cy="182" r="7" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle
            cx="100"
            cy="182"
            r="4"
            fill={
              activeState === 'LISTENING'
                ? '#10b981'
                : activeState === 'SPEAKING'
                ? '#3b82f6'
                : activeState === 'EVALUATING'
                ? '#a855f7'
                : '#6366f1'
            }
            className="animate-pulse"
          />

          {/* Neck */}
          <rect x="88" y="128" width="24" height="14" rx="4" fill="#334155" stroke="#475569" strokeWidth="1.5" />

          {/* Antenna */}
          <line x1="100" y1="40" x2="100" y2="20" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <circle
            cx="100"
            cy="16"
            r="6"
            fill="url(#eyeGlowGrad)"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            className={activeState === 'LISTENING' || activeState === 'SPEAKING' ? 'animate-bounce' : ''}
          />

          {/* Robot Ears / Headsets */}
          <rect x="36" y="65" width="8" height="28" rx="4" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <rect x="156" y="65" width="8" height="28" rx="4" fill="#475569" stroke="#64748b" strokeWidth="1.5" />

          {/* Head Outer Shell */}
          <rect
            x="44"
            y="40"
            width="112"
            height="90"
            rx="22"
            fill="url(#robotBodyGrad)"
            stroke="#475569"
            strokeWidth="2.5"
          />

          {/* Face Visor Screen */}
          <rect
            x="54"
            y="48"
            width="92"
            height="74"
            rx="16"
            fill="url(#robotFaceGrad)"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Eyes */}
          {activeState === 'THINKING' ? (
            // Thinking spinner eyes
            <g>
              <circle cx="80" cy="74" r="10" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="15 10" className="animate-spin origin-[80px_74px]" />
              <circle cx="120" cy="74" r="10" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="15 10" className="animate-spin origin-[120px_74px]" />
            </g>
          ) : (
            // Standard expressive eyes
            <g>
              {/* Left Eye */}
              <circle
                cx="80"
                cy="74"
                r="11"
                fill="url(#eyeGlowGrad)"
                className={`transition-all duration-300 ${activeState === 'LISTENING' ? 'scale-110' : ''}`}
              />
              <circle cx="77" cy="71" r="3.5" fill="#ffffff" opacity="0.9" />

              {/* Right Eye */}
              <circle
                cx="120"
                cy="74"
                r="11"
                fill="url(#eyeGlowGrad)"
                className={`transition-all duration-300 ${activeState === 'LISTENING' ? 'scale-110' : ''}`}
              />
              <circle cx="117" cy="71" r="3.5" fill="#ffffff" opacity="0.9" />
            </g>
          )}

          {/* Mouth / Voice Waveform */}
          {activeState === 'SPEAKING' ? (
            <g>
              <rect x="74" y="98" width="5" height="12" rx="2" fill="#60a5fa" className="animate-pulse" />
              <rect x="83" y="94" width="5" height="20" rx="2" fill="#60a5fa" className="animate-pulse delay-75" />
              <rect x="92" y="91" width="5" height="26" rx="2" fill="#93c5fd" className="animate-pulse delay-150" />
              <rect x="101" y="91" width="5" height="26" rx="2" fill="#93c5fd" className="animate-pulse delay-100" />
              <rect x="110" y="94" width="5" height="20" rx="2" fill="#60a5fa" className="animate-pulse delay-75" />
              <rect x="119" y="98" width="5" height="12" rx="2" fill="#60a5fa" className="animate-pulse" />
            </g>
          ) : activeState === 'LISTENING' ? (
            <g>
              {/* Sound wave receptive curve */}
              <path
                d="M 75 104 Q 100 114 125 104"
                fill="none"
                stroke="#34d399"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>
          ) : activeState === 'EVALUATING' ? (
            <g>
              <line x1="75" y1="104" x2="125" y2="104" stroke="#c084fc" strokeWidth="3" strokeDasharray="4 2" className="animate-pulse" />
            </g>
          ) : (
            // Idle friendly smile
            <path
              d="M 80 102 Q 100 112 120 102"
              fill="none"
              stroke="#64748b"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {/* Live Question / Dialog Speech Bubble */}
      {message && (
        <div className="mt-4 max-w-lg w-full text-center px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-sm md:text-base leading-relaxed shadow-lg backdrop-blur-sm transition-all duration-300">
          <p className="font-medium text-slate-100 italic">"{message}"</p>
        </div>
      )}
    </div>
  );
}
