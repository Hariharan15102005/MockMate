import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  interactive = false,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <div
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`}
      style={style}
      {...props}
    >
      {(title || subtitle || action) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          paddingBottom: subtitle ? '0.75rem' : '0.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div>
            {title && <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
