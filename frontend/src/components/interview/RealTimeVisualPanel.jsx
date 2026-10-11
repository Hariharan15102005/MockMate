import React, { useState } from 'react';
import {
  Camera,
  Eye,
  Sun,
  Maximize,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

/**
 * RealTimeVisualPanel
 * Compact, accessible live visual analysis indicator and details panel.
 * Driven strictly by real measurements from the on-device computer-vision pipeline.
 */
export const RealTimeVisualPanel = ({ observation, cameraActive = true }) => {
  const [expanded, setExpanded] = useState(false);

  if (!cameraActive) {
    return (
      <div
        style={{
          padding: '0.45rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94a3b8',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem'
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
        Camera Paused • Visual Analysis Inactive
      </div>
    );
  }

  const {
    faceDetected,
    faceCount,
    headOrientation,
    upperBodyVisible,
    framingStatus,
    framingFeedback,
    lightingStatus,
    status
  } = observation || {};

  // Badge state
  let badgeColor = '#34d399';
  let badgeText = 'Face Detected • Live Analysis Active';

  if (status === 'INITIALIZING') {
    badgeColor = '#60a5fa';
    badgeText = 'Initializing On-Device Vision...';
  } else if (!faceDetected) {
    badgeColor = '#f59e0b';
    badgeText = 'No Face In Frame • Reposition Camera';
  } else if (faceCount > 1) {
    badgeColor = '#eab308';
    badgeText = `Multiple Faces Detected (${faceCount})`;
  } else if (headOrientation && headOrientation.startsWith('TURNED_')) {
    badgeColor = '#38bdf8';
    badgeText = 'Face Detected • Looking Aside';
  }

  // Format orientation label
  const formatOrientation = (ori) => {
    if (!ori || ori === 'UNAVAILABLE') return 'Unavailable';
    if (ori === 'FACING_CAMERA') return 'Facing Camera';
    if (ori === 'TURNED_TOWARD_RIGHT') return 'Turned Right';
    if (ori === 'TURNED_TOWARD_LEFT') return 'Turned Left';
    return ori;
  };

  // Format framing label
  const formatFraming = (fr) => {
    if (!fr || fr === 'UNABLE_TO_ASSESS') return 'Unable to assess';
    if (fr === 'SUITABLE') return 'Suitable Distance';
    if (fr === 'TOO_CLOSE') return 'Too Close to Lens';
    if (fr === 'TOO_FAR') return 'Too Far from Camera';
    if (fr === 'CROPPED_TOP') return 'Head Cropped at Top';
    if (fr === 'OFF_CENTER') return 'Shifted Off-Center';
    return fr;
  };

  // Format lighting label
  const formatLighting = (lt) => {
    if (!lt || lt === 'UNABLE_TO_ASSESS') return 'Unable to assess';
    if (lt === 'ADEQUATE') return 'Adequate Lighting';
    if (lt === 'LOW_LIGHT') return 'Low Lighting';
    if (lt === 'OVEREXPOSED') return 'Overexposed Light';
    return lt;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.4rem',
        maxWidth: '380px',
        zIndex: 10
      }}
    >
      {/* Primary Status Badge & Details Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        title="Click to view real-time camera visual analysis metrics"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#f8fafc',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: badgeColor,
            boxShadow: `0 0 8px ${badgeColor}`
          }}
        />
        <span>{badgeText}</span>
        {expanded ? <ChevronUp size={13} color="#94a3b8" /> : <ChevronDown size={13} color="#94a3b8" />}
      </button>

      {/* Expanded Metrics Card */}
      {expanded && (
        <div
          style={{
            width: '100%',
            padding: '0.85rem',
            borderRadius: '0.85rem',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.4rem' }}>
            <span style={{ fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Camera size={13} color="#60a5fa" /> Live Visual Presentation
            </span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>On-Device CV</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {/* Metric 1: Head Orientation */}
            <div style={{ padding: '0.4rem 0.5rem', borderRadius: '0.5rem', background: '#1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Eye size={11} /> Head Orientation
              </div>
              <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '0.15rem' }}>
                {formatOrientation(headOrientation)}
              </div>
            </div>

            {/* Metric 2: Camera Framing */}
            <div style={{ padding: '0.4rem 0.5rem', borderRadius: '0.5rem', background: '#1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Maximize size={11} /> Framing
              </div>
              <div style={{ fontWeight: 700, color: framingStatus === 'SUITABLE' ? '#34d399' : '#f59e0b', marginTop: '0.15rem' }}>
                {formatFraming(framingStatus)}
              </div>
            </div>

            {/* Metric 3: Lighting Quality */}
            <div style={{ padding: '0.4rem 0.5rem', borderRadius: '0.5rem', background: '#1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sun size={11} /> Lighting
              </div>
              <div style={{ fontWeight: 700, color: lightingStatus === 'ADEQUATE' ? '#34d399' : '#f59e0b', marginTop: '0.15rem' }}>
                {formatLighting(lightingStatus)}
              </div>
            </div>

            {/* Metric 4: Upper-Body Visibility */}
            <div style={{ padding: '0.4rem 0.5rem', borderRadius: '0.5rem', background: '#1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={11} /> Upper Body
              </div>
              <div style={{ fontWeight: 700, color: upperBodyVisible ? '#34d399' : '#94a3b8', marginTop: '0.15rem' }}>
                {upperBodyVisible ? 'Sufficient' : 'Limited'}
              </div>
            </div>
          </div>

          {framingFeedback && (
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem 0.5rem', borderRadius: '0.4rem' }}>
              💡 {framingFeedback}
            </div>
          )}

          <div style={{ fontSize: '0.625rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #1e293b', paddingTop: '0.35rem' }}>
            🔒 Privacy guarantee: Processed locally in browser. Zero emotion or psychological inferences.
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeVisualPanel;
