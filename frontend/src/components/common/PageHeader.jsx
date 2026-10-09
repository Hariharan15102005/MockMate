import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem',
        ...style
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
