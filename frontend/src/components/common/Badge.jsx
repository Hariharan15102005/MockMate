import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size = 'md',        // 'sm' | 'md'
  icon: Icon,
  className = '',
  style = {}
}) => {
  const variantStyles = {
    default: {
      bg: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.15)',
      color: '#e2e8f0'
    },
    primary: {
      bg: 'rgba(99, 102, 241, 0.15)',
      border: 'rgba(99, 102, 241, 0.35)',
      color: '#a5b4fc'
    },
    success: {
      bg: 'var(--success-bg)',
      border: 'var(--success-border)',
      color: '#34d399'
    },
    warning: {
      bg: 'var(--warning-bg)',
      border: 'var(--warning-border)',
      color: '#fbbf24'
    },
    danger: {
      bg: 'var(--danger-bg)',
      border: 'var(--danger-border)',
      color: '#f87171'
    },
    info: {
      bg: 'var(--info-bg)',
      border: 'var(--info-border)',
      color: '#38bdf8'
    },
    purple: {
      bg: 'var(--accent-purple-bg)',
      border: 'var(--accent-purple-border)',
      color: '#c084fc'
    }
  };

  const selected = variantStyles[variant] || variantStyles.default;
  const isSm = size === 'sm';

  return (
    <span
      className={`badge ${className}`}
      style={{
        backgroundColor: selected.bg,
        border: `1px solid ${selected.border}`,
        color: selected.color,
        padding: isSm ? '0.15rem 0.45rem' : '0.25rem 0.625rem',
        fontSize: isSm ? '0.7rem' : '0.75rem',
        ...style
      }}
    >
      {Icon && <Icon size={isSm ? 11 : 13} />}
      {children}
    </span>
  );
};

export default Badge;
