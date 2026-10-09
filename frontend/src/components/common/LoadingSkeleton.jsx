import React from 'react';

export const LoadingSkeleton = ({
  type = 'table', // 'table' | 'card' | 'stats' | 'text'
  rows = 5,
  columns = 4,
  className = '',
  style = {}
}) => {
  if (type === 'text') {
    return (
      <div className={`skeleton ${className}`} style={{ height: '18px', width: '100%', marginBottom: '8px', ...style }} />
    );
  }

  if (type === 'stats') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', ...style }}>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '60%', height: '32px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '80%', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`card ${className}`} style={{ padding: '1.5rem', ...style }}>
        <div className="skeleton" style={{ width: '30%', height: '20px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '10px' }} />
        <div className="skeleton" style={{ width: '85%', height: '14px', marginBottom: '10px' }} />
        <div className="skeleton" style={{ width: '60%', height: '14px' }} />
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div className={`table-container ${className}`} style={style}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="skeleton" style={{ flex: 1, height: '16px' }} />
        ))}
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', gap: '1rem' }}>
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div key={cIdx} className="skeleton" style={{ flex: 1, height: '14px' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
