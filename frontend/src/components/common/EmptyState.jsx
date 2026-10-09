import React from 'react';
import { Inbox, ArrowRight } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items in this view.',
  actionLabel,
  onAction,
  iconColor = 'indigo',
  className = '',
  style = {}
}) => {
  const colorMap = {
    indigo: { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
    cyan: { bg: 'rgba(6, 182, 212, 0.1)', color: '#38bdf8', border: 'rgba(6, 182, 212, 0.25)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' }
  };

  const currentTheme = colorMap[iconColor] || colorMap.indigo;

  return (
    <div
      className={`card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        ...style
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: currentTheme.bg,
          border: `1px solid ${currentTheme.border}`,
          color: currentTheme.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5, marginBottom: actionLabel ? '1.5rem' : 0 }}>
        {description}
      </p>

      {actionLabel && (
        <Button variant="primary" size="sm" onClick={onAction} icon={ArrowRight} iconPosition="right">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
